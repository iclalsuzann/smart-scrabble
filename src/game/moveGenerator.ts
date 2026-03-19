// ============================================
// Smart Scrabble - Anchor-Based Move Generation
// ============================================
// Generates all valid moves using anchor points and DFS

import { Board, Tile, Move, Placement, Direction } from './types';
import { Trie } from './trie';
import {
  BOARD_SIZE,
  CENTER,
} from './constants';
import {
  isInBounds,
  hasTile,
  isBoardEmpty,
  getAnchors,
  getCrossChecks,
  getFormedWords,
  getPlacementDirection,
} from './board';
import { calculateMoveScore } from './scoring';

export type MoveGenOptions = {
  timeLimitMs?: number;
  maxMoves?: number;
};

type MoveGenContext = {
  deadlineMs: number | null;
  maxMoves: number | null;
  aborted: boolean;
};

function createContext(options?: MoveGenOptions): MoveGenContext {
  const timeLimitMs = options?.timeLimitMs ?? null;
  return {
    deadlineMs: timeLimitMs === null ? null : Date.now() + Math.max(0, timeLimitMs),
    maxMoves: options?.maxMoves ?? null,
    aborted: false,
  };
}

function shouldAbort(ctx: MoveGenContext, moves: Move[]): boolean {
  if (ctx.aborted) return true;
  if (ctx.maxMoves !== null && moves.length >= ctx.maxMoves) {
    ctx.aborted = true;
    return true;
  }
  if (ctx.deadlineMs !== null && Date.now() >= ctx.deadlineMs) {
    ctx.aborted = true;
    return true;
  }
  return false;
}

/** Generate all valid moves for a given rack and board state */
export function generateAllMoves(
  board: Board,
  rack: Tile[],
  trie: Trie,
  options?: MoveGenOptions
): Move[] {
  const moves: Move[] = [];
  const isValidWord = (w: string) => trie.search(w);
  const ctx = createContext(options);

  if (isBoardEmpty(board)) {
    // First move: must go through center
    generateFirstMoves(board, rack, trie, moves, ctx);
    return moves;
  }

  const anchors = getAnchors(board);

  for (const anchor of anchors) {
    if (shouldAbort(ctx, moves)) break;
    // Try horizontal moves through this anchor
    generateMovesFromAnchor(board, rack, trie, anchor.row, anchor.col, 'H', isValidWord, moves, ctx);
    // Try vertical moves through this anchor
    generateMovesFromAnchor(board, rack, trie, anchor.row, anchor.col, 'V', isValidWord, moves, ctx);
  }

  // Deduplicate moves
  return deduplicateMoves(moves);
}

/** Generate first moves (must cover center) */
function generateFirstMoves(
  board: Board,
  rack: Tile[],
  trie: Trie,
  moves: Move[],
  ctx: MoveGenContext
): void {
  // Try horizontal words through center
  for (let startCol = Math.max(0, CENTER - 6); startCol <= CENTER; startCol++) {
    if (shouldAbort(ctx, moves)) return;
    const maxLen = Math.min(rack.length, BOARD_SIZE - startCol);
    for (let len = 2; len <= maxLen; len++) {
      if (shouldAbort(ctx, moves)) return;
      if (startCol + len - 1 < CENTER) continue; // Must reach center

      tryPlaceWord(board, rack, trie, CENTER, startCol, len, 'H', moves, ctx);
    }
  }

  // Try vertical words through center
  for (let startRow = Math.max(0, CENTER - 6); startRow <= CENTER; startRow++) {
    if (shouldAbort(ctx, moves)) return;
    const maxLen = Math.min(rack.length, BOARD_SIZE - startRow);
    for (let len = 2; len <= maxLen; len++) {
      if (shouldAbort(ctx, moves)) return;
      if (startRow + len - 1 < CENTER) continue;

      tryPlaceWord(board, rack, trie, startRow, CENTER, len, 'V', moves, ctx);
    }
  }
}

/** Try to place a word of given length at a position */
function tryPlaceWord(
  board: Board,
  rack: Tile[],
  trie: Trie,
  startRow: number,
  startCol: number,
  length: number,
  direction: Direction,
  moves: Move[],
  ctx: MoveGenContext
): void {
  const dr = direction === 'V' ? 1 : 0;
  const dc = direction === 'H' ? 1 : 0;

  // Check if all positions are in bounds and empty
  for (let i = 0; i < length; i++) {
    const r = startRow + i * dr;
    const c = startCol + i * dc;
    if (!isInBounds(r, c)) return;
  }

  // Try all permutations of rack tiles
  const usedIndices = new Set<number>();
  const placements: Placement[] = [];

  function backtrack(pos: number) {
    if (shouldAbort(ctx, moves)) return;
    if (pos === length) {
      // Check if it forms a valid word
      const word = placements.map(p => p.tile.letter).join('');
      if (trie.search(word)) {
        // Check cross words
        const allWords = getFormedWords(board, placements);
        const allValid = allWords.every(w => trie.search(w.word));
        if (allValid) {
          const score = calculateMoveScore(board, placements);
          moves.push({
            placements: [...placements],
            word,
            direction,
            startRow,
            startCol,
            score,
            wordsFormed: allWords.map(w => w.word),
          });
        }
      }
      return;
    }

    const r = startRow + pos * dr;
    const c = startCol + pos * dc;

    // If this cell already has a tile, use it
    if (hasTile(board, r, c)) {
      placements.push({
        row: r,
        col: c,
        tile: board[r][c].tile!,
      });
      backtrack(pos + 1);
      placements.pop();
      return;
    }

    // Try each rack tile
    const tried = new Set<string>();
    for (let i = 0; i < rack.length; i++) {
      if (shouldAbort(ctx, moves)) return;
      if (usedIndices.has(i)) continue;
      if (tried.has(rack[i].letter)) continue;
      tried.add(rack[i].letter);

      usedIndices.add(i);
      placements.push({ row: r, col: c, tile: rack[i] });
      backtrack(pos + 1);
      placements.pop();
      usedIndices.delete(i);
    }
  }

  backtrack(0);
}

/** Generate moves from an anchor point in a given direction */
function generateMovesFromAnchor(
  board: Board,
  rack: Tile[],
  trie: Trie,
  anchorRow: number,
  anchorCol: number,
  direction: Direction,
  isValidWord: (word: string) => boolean,
  moves: Move[],
  ctx: MoveGenContext
): void {
  const dr = direction === 'V' ? 1 : 0;
  const dc = direction === 'H' ? 1 : 0;

  // Find how far back we can go (prefix length)
  let maxPrefix = 0;
  let r = anchorRow - dr;
  let c = anchorCol - dc;

  // Count existing tiles before anchor (these form a mandatory prefix)
  let existingPrefix = '';
  const existingPrefixTiles: { row: number; col: number }[] = [];
  while (isInBounds(r, c) && hasTile(board, r, c)) {
    if (shouldAbort(ctx, moves)) return;
    existingPrefix = board[r][c].tile!.letter + existingPrefix;
    existingPrefixTiles.unshift({ row: r, col: c });
    r -= dr;
    c -= dc;
  }

  if (existingPrefix.length > 0) {
    // There's already a prefix on the board, extend it through the anchor
    extendRight(
      board, rack, trie, anchorRow, anchorCol, direction,
      existingPrefix, [], new Set<number>(), isValidWord, moves, ctx,
      existingPrefixTiles
    );
  } else {
    // No existing prefix, try building from scratch
    // Count how many empty cells are available before the anchor
    while (isInBounds(r, c) && !hasTile(board, r, c)) {
      if (shouldAbort(ctx, moves)) return;
      maxPrefix++;
      r -= dr;
      c -= dc;
    }
    maxPrefix = Math.min(maxPrefix, rack.length - 1);

    // Try with no prefix (place directly at anchor)
    extendRight(
      board, rack, trie, anchorRow, anchorCol, direction,
      '', [], new Set<number>(), isValidWord, moves, ctx, []
    );

    // Try with prefixes of various lengths
    for (let prefixLen = 1; prefixLen <= maxPrefix; prefixLen++) {
      if (shouldAbort(ctx, moves)) return;
      const prefixStartRow = anchorRow - prefixLen * dr;
      const prefixStartCol = anchorCol - prefixLen * dc;

      buildPrefix(
        board, rack, trie,
        prefixStartRow, prefixStartCol,
        anchorRow, anchorCol,
        direction, prefixLen,
        '', [], new Set<number>(), isValidWord, moves, ctx
      );
    }
  }
}

/** Build prefix before anchor, then extend right */
function buildPrefix(
  board: Board,
  rack: Tile[],
  trie: Trie,
  currentRow: number,
  currentCol: number,
  anchorRow: number,
  anchorCol: number,
  direction: Direction,
  remainingLen: number,
  prefix: string,
  placements: Placement[],
  usedIndices: Set<number>,
  isValidWord: (word: string) => boolean,
  moves: Move[],
  ctx: MoveGenContext
): void {
  if (shouldAbort(ctx, moves)) return;
  if (remainingLen === 0) {
    // Prefix complete, now extend right from anchor
    extendRight(
      board, rack, trie, anchorRow, anchorCol, direction,
      prefix, [...placements], new Set(usedIndices), isValidWord, moves, ctx, []
    );
    return;
  }

  if (!trie.startsWith(prefix)) return;

  const tried = new Set<string>();
  for (let i = 0; i < rack.length; i++) {
    if (shouldAbort(ctx, moves)) return;
    if (usedIndices.has(i)) continue;
    const letter = rack[i].letter;
    if (tried.has(letter)) continue;
    tried.add(letter);

    const newPrefix = prefix + letter;
    if (!trie.startsWith(newPrefix)) continue;

    // Check cross word validity
    const crossCheck = getCrossChecks(board, currentRow, currentCol, direction, isValidWord);
    if (crossCheck !== null && !crossCheck.has(letter)) continue;

    const dr = direction === 'V' ? 1 : 0;
    const dc = direction === 'H' ? 1 : 0;

    usedIndices.add(i);
    placements.push({ row: currentRow, col: currentCol, tile: rack[i] });

    buildPrefix(
      board, rack, trie,
      currentRow + dr, currentCol + dc,
      anchorRow, anchorCol,
      direction, remainingLen - 1,
      newPrefix, placements, usedIndices, isValidWord, moves, ctx
    );

    placements.pop();
    usedIndices.delete(i);
  }
}

/** Extend right from anchor position */
function extendRight(
  board: Board,
  rack: Tile[],
  trie: Trie,
  row: number,
  col: number,
  direction: Direction,
  currentWord: string,
  placements: Placement[],
  usedIndices: Set<number>,
  isValidWord: (word: string) => boolean,
  moves: Move[],
  ctx: MoveGenContext,
  existingPrefixPositions: { row: number; col: number }[]
): void {
  if (shouldAbort(ctx, moves)) return;
  if (!isInBounds(row, col)) {
    // End of board - check if current word is valid
    if (currentWord.length >= 2 && trie.search(currentWord) && placements.length > 0) {
      addMoveIfValid(board, placements, currentWord, direction, isValidWord, moves, ctx);
    }
    return;
  }

  if (hasTile(board, row, col)) {
    // Existing tile - must use it
    const letter = board[row][col].tile!.letter;
    const newWord = currentWord + letter;

    if (!trie.startsWith(newWord)) return;

    const dr = direction === 'V' ? 1 : 0;
    const dc = direction === 'H' ? 1 : 0;

    extendRight(
      board, rack, trie,
      row + dr, col + dc, direction,
      newWord, placements, usedIndices, isValidWord, moves,
      ctx, existingPrefixPositions
    );
  } else {
    // Empty cell - try placing a tile from rack
    // First check if current word is already valid
    if (currentWord.length >= 2 && trie.search(currentWord) && placements.length > 0) {
      addMoveIfValid(board, placements, currentWord, direction, isValidWord, moves, ctx);
    }

    if (usedIndices.size >= rack.length) return;
    if (!trie.startsWith(currentWord)) return;

    const crossCheck = getCrossChecks(board, row, col, direction, isValidWord);

    const tried = new Set<string>();
    for (let i = 0; i < rack.length; i++) {
      if (shouldAbort(ctx, moves)) return;
      if (usedIndices.has(i)) continue;
      const letter = rack[i].letter;
      if (tried.has(letter)) continue;
      tried.add(letter);

      if (crossCheck !== null && !crossCheck.has(letter)) continue;

      const newWord = currentWord + letter;
      if (!trie.startsWith(newWord)) continue;

      const dr = direction === 'V' ? 1 : 0;
      const dc = direction === 'H' ? 1 : 0;

      usedIndices.add(i);
      placements.push({ row, col, tile: rack[i] });

      extendRight(
        board, rack, trie,
        row + dr, col + dc, direction,
        newWord, placements, usedIndices, isValidWord, moves,
        ctx, existingPrefixPositions
      );

      placements.pop();
      usedIndices.delete(i);
    }
  }
}

/** Validate and add a move */
function addMoveIfValid(
  board: Board,
  placements: Placement[],
  word: string,
  direction: Direction,
  isValidWord: (word: string) => boolean,
  moves: Move[],
  ctx: MoveGenContext
): void {
  if (shouldAbort(ctx, moves)) return;
  // Only include placements on empty cells
  const newPlacements = placements.filter(
    p => board[p.row][p.col].tile === null
  );

  if (newPlacements.length === 0) return;

  // Check all formed words are valid
  const formedWords = getFormedWords(board, newPlacements);
  if (formedWords.length === 0) return;

  const allValid = formedWords.every(w => isValidWord(w.word));
  if (!allValid) return;

  const score = calculateMoveScore(board, newPlacements);
  const dir = getPlacementDirection(newPlacements);

  const sorted = [...newPlacements].sort((a, b) =>
    dir === 'H' ? a.col - b.col : a.row - b.row
  );

  moves.push({
    placements: sorted,
    word: formedWords[0].word,
    direction: dir,
    startRow: formedWords[0].startRow,
    startCol: formedWords[0].startCol,
    score,
    wordsFormed: formedWords.map(w => w.word),
  });
}

/** Remove duplicate moves */
function deduplicateMoves(moves: Move[]): Move[] {
  const seen = new Set<string>();
  const unique: Move[] = [];

  for (const move of moves) {
    const key = move.placements
      .map(p => `${p.row},${p.col},${p.tile.letter}`)
      .sort()
      .join('|');

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(move);
    }
  }

  return unique;
}
