// ============================================
// Smart Scrabble - Board Operations
// ============================================

import { Board, Cell, Tile, Placement, Direction } from './types';
import { ALPHABET, BOARD_SIZE, BONUS_MAP, CENTER } from './constants';

/** Create an empty 15x15 board */
export function createBoard(): Board {
  const board: Board = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    const boardRow: Cell[] = [];
    for (let col = 0; col < BOARD_SIZE; col++) {
      boardRow.push({
        row,
        col,
        tile: null,
        bonus: BONUS_MAP[row][col],
        bonusUsed: false,
      });
    }
    board.push(boardRow);
  }
  return board;
}

/** Clone the board (deep copy) */
export function cloneBoard(board: Board): Board {
  return board.map(row =>
    row.map(cell => ({
      ...cell,
      tile: cell.tile ? { ...cell.tile } : null,
    }))
  );
}

/** Check if position is within board bounds */
export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

/** Check if a cell has a tile */
export function hasTile(board: Board, row: number, col: number): boolean {
  return isInBounds(row, col) && board[row][col].tile !== null;
}

/** Check if the board is empty (first move) */
export function isBoardEmpty(board: Board): boolean {
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].tile !== null) return false;
    }
  }
  return true;
}

/** Place a tile on the board */
export function placeTileOnBoard(board: Board, row: number, col: number, tile: Tile): Board {
  const newBoard = cloneBoard(board);
  newBoard[row][col] = {
    ...newBoard[row][col],
    tile: { ...tile },
    bonusUsed: true,
  };
  return newBoard;
}

/** Apply multiple placements to the board */
export function applyPlacements(board: Board, placements: Placement[]): Board {
  const newBoard = cloneBoard(board);
  for (const p of placements) {
    newBoard[p.row][p.col] = {
      ...newBoard[p.row][p.col],
      tile: { ...p.tile },
      bonusUsed: true,
    };
  }
  return newBoard;
}

/** Get the word formed at a position in a direction */
export function getWordAt(
  board: Board,
  row: number,
  col: number,
  direction: Direction
): { word: string; startRow: number; startCol: number } | null {
  const dr = direction === 'V' ? 1 : 0;
  const dc = direction === 'H' ? 1 : 0;

  // Find the start of the word
  let startRow = row;
  let startCol = col;
  while (
    isInBounds(startRow - dr, startCol - dc) &&
    hasTile(board, startRow - dr, startCol - dc)
  ) {
    startRow -= dr;
    startCol -= dc;
  }

  // Build the word
  let word = '';
  let r = startRow;
  let c = startCol;
  while (isInBounds(r, c) && hasTile(board, r, c)) {
    word += board[r][c].tile!.letter;
    r += dr;
    c += dc;
  }

  if (word.length < 2) return null;
  return { word, startRow, startCol };
}

/** Get all words formed by a set of placements */
export function getFormedWords(
  board: Board,
  placements: Placement[]
): { word: string; startRow: number; startCol: number; direction: Direction }[] {
  if (placements.length === 0) return [];

  const tempBoard = applyPlacements(board, placements);
  const words: { word: string; startRow: number; startCol: number; direction: Direction }[] = [];
  const wordSet = new Set<string>();

  // Determine direction of placement
  const direction = getPlacementDirection(placements);

  // Get the main word
  const mainWord = getWordAt(tempBoard, placements[0].row, placements[0].col, direction);
  if (mainWord) {
    const key = `${mainWord.word}-${mainWord.startRow}-${mainWord.startCol}-${direction}`;
    if (!wordSet.has(key)) {
      wordSet.add(key);
      words.push({ ...mainWord, direction });
    }
  }

  // Get cross words for each placed tile
  const crossDir: Direction = direction === 'H' ? 'V' : 'H';
  for (const p of placements) {
    const crossWord = getWordAt(tempBoard, p.row, p.col, crossDir);
    if (crossWord) {
      const key = `${crossWord.word}-${crossWord.startRow}-${crossWord.startCol}-${crossDir}`;
      if (!wordSet.has(key)) {
        wordSet.add(key);
        words.push({ ...crossWord, direction: crossDir });
      }
    }
  }

  return words;
}

/** Determine direction from placements */
export function getPlacementDirection(placements: Placement[]): Direction {
  if (placements.length <= 1) return 'H';
  if (placements[0].row !== placements[1].row) return 'V';
  return 'H';
}

/** Validate placement positions (all in same row/col, no gaps, connected) */
export function validatePlacementPositions(
  board: Board,
  placements: Placement[]
): { valid: boolean; error?: string } {
  if (placements.length === 0) {
    return { valid: false, error: 'No tiles placed' };
  }

  // Check all cells are empty
  for (const p of placements) {
    if (!isInBounds(p.row, p.col)) {
      return { valid: false, error: 'Placement out of bounds' };
    }
    if (board[p.row][p.col].tile !== null) {
      return { valid: false, error: 'Cell already occupied' };
    }
  }

  // Single tile placement is valid if position checks pass
  if (placements.length === 1) {
    // First move must cover center
    if (isBoardEmpty(board)) {
      if (placements[0].row !== CENTER || placements[0].col !== CENTER) {
        return { valid: false, error: 'First move must cover the center star' };
      }
      // Single tile on first move isn't enough - need at least 2
      return { valid: false, error: 'Must place at least 2 tiles on the first move' };
    }

    // Must be adjacent to existing tile
    const { row, col } = placements[0];
    const adjacent =
      hasTile(board, row - 1, col) ||
      hasTile(board, row + 1, col) ||
      hasTile(board, row, col - 1) ||
      hasTile(board, row, col + 1);
    if (!adjacent) {
      return { valid: false, error: 'Tile must be adjacent to an existing tile' };
    }

    return { valid: true };
  }

  // Check all in same row or column
  const allSameRow = placements.every(p => p.row === placements[0].row);
  const allSameCol = placements.every(p => p.col === placements[0].col);

  if (!allSameRow && !allSameCol) {
    return { valid: false, error: 'All tiles must be in the same row or column' };
  }

  // Sort placements
  const sorted = [...placements].sort((a, b) =>
    allSameRow ? a.col - b.col : a.row - b.row
  );

  // Check for gaps (all positions between first and last must be filled)
  const tempBoard = applyPlacements(board, placements);
  if (allSameRow) {
    const row = sorted[0].row;
    for (let col = sorted[0].col; col <= sorted[sorted.length - 1].col; col++) {
      if (!tempBoard[row][col].tile) {
        return { valid: false, error: 'Tiles must be contiguous (no gaps)' };
      }
    }
  } else {
    const col = sorted[0].col;
    for (let row = sorted[0].row; row <= sorted[sorted.length - 1].row; row++) {
      if (!tempBoard[row][col].tile) {
        return { valid: false, error: 'Tiles must be contiguous (no gaps)' };
      }
    }
  }

  // First move must cover center
  if (isBoardEmpty(board)) {
    const coversCenter = placements.some(
      p => p.row === CENTER && p.col === CENTER
    );
    if (!coversCenter) {
      return { valid: false, error: 'First move must cover the center star' };
    }
    return { valid: true };
  }

  // Must connect to existing tiles
  let connected = false;
  for (const p of placements) {
    const { row, col } = p;
    if (
      (isInBounds(row - 1, col) && board[row - 1][col].tile !== null) ||
      (isInBounds(row + 1, col) && board[row + 1][col].tile !== null) ||
      (isInBounds(row, col - 1) && board[row][col - 1].tile !== null) ||
      (isInBounds(row, col + 1) && board[row][col + 1].tile !== null)
    ) {
      connected = true;
      break;
    }
  }

  if (!connected) {
    return { valid: false, error: 'Move must connect to existing tiles on the board' };
  }

  return { valid: true };
}

/** Get all anchor points (empty cells adjacent to existing tiles) */
export function getAnchors(board: Board): { row: number; col: number }[] {
  const anchors: { row: number; col: number }[] = [];

  if (isBoardEmpty(board)) {
    return [{ row: CENTER, col: CENTER }];
  }

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col].tile !== null) continue;

      // Check if adjacent to a tile
      if (
        hasTile(board, row - 1, col) ||
        hasTile(board, row + 1, col) ||
        hasTile(board, row, col - 1) ||
        hasTile(board, row, col + 1)
      ) {
        anchors.push({ row, col });
      }
    }
  }

  return anchors;
}

/** Get cross-check set: valid letters for a position considering cross words */
export function getCrossChecks(
  board: Board,
  row: number,
  col: number,
  direction: Direction,
  isValidWord: (word: string) => boolean
): Set<string> | null {
  // Cross direction
  const crossDir: Direction = direction === 'H' ? 'V' : 'H';
  const dr = crossDir === 'V' ? 1 : 0;
  const dc = crossDir === 'H' ? 1 : 0;

  // Find prefix (letters before this position in cross direction)
  let prefix = '';
  let r = row - dr;
  let c = col - dc;
  while (isInBounds(r, c) && hasTile(board, r, c)) {
    prefix = board[r][c].tile!.letter + prefix;
    r -= dr;
    c -= dc;
  }

  // Find suffix (letters after this position in cross direction)
  let suffix = '';
  r = row + dr;
  c = col + dc;
  while (isInBounds(r, c) && hasTile(board, r, c)) {
    suffix += board[r][c].tile!.letter;
    r += dr;
    c += dc;
  }

  // If no adjacent tiles in cross direction, all letters are valid.
  if (prefix === '' && suffix === '') return null;

  // Only letters that form valid cross words are allowed
  const validLetters = new Set<string>();
  for (const letter of ALPHABET) {
    const crossWord = prefix + letter + suffix;
    if (isValidWord(crossWord)) {
      validLetters.add(letter);
    }
  }

  return validLetters;
}
