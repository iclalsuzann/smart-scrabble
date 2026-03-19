// ============================================
// Smart Scrabble - Heuristic AI Strategy
// ============================================
// Uses weighted evaluation considering multiple factors
// beyond just the raw score of a move.

import { Board, Tile, Move } from './types';
import { Trie } from './trie';
import { CENTER } from './constants';
import { generateAllMoves } from './moveGenerator';
import { applyPlacements, isInBounds, hasTile, isBoardEmpty } from './board';

// Heuristic weights
const WEIGHTS = {
  SCORE: 1.0,           // Raw move score
  BONUS_EXPOSURE: -8.0, // Penalty for opening premium squares to opponent
  TILE_USAGE: 3.0,      // Reward for using more tiles
  VOWEL_CONSONANT: 2.0, // Reward for maintaining balanced rack
  CENTER_PROXIMITY: 1.5, // Reward for playing near center
  BOARD_OPENNESS: -2.0, // Penalty for opening too many anchor points
};

/**
 * Heuristic AI: Evaluates moves using a weighted combination
 * of factors including score, board control, and rack management.
 */
export function heuristicSelectMove(
  board: Board,
  rack: Tile[],
  trie: Trie
): Move | null {
  const allMoves = generateAllMoves(board, rack, trie, { timeLimitMs: 400, maxMoves: 3500 });
  const moves = allMoves.filter(m => {
    if (isBoardEmpty(board)) {
      return m.placements.some(p => p.row === CENTER && p.col === CENTER);
    }
    for (const p of m.placements) {
      const { row, col } = p;
      if (
        hasTile(board, row - 1, col) ||
        hasTile(board, row + 1, col) ||
        hasTile(board, row, col - 1) ||
        hasTile(board, row, col + 1)
      ) {
        return true;
      }
    }
    return false;
  });

  if (moves.length === 0) return null;

  // Evaluate each move with heuristic function
  let bestMove: Move | null = null;
  let bestEval = -Infinity;

  for (const move of moves) {
    const evalScore = evaluateMove(board, rack, move);
    if (evalScore > bestEval) {
      bestEval = evalScore;
      bestMove = move;
    }
  }

  return bestMove;
}

/** Evaluate a move using multiple heuristic factors */
function evaluateMove(board: Board, rack: Tile[], move: Move): number {
  let evaluation = 0;

  // 1. Raw score component
  evaluation += WEIGHTS.SCORE * move.score;

  // 2. Bonus exposure penalty
  evaluation += WEIGHTS.BONUS_EXPOSURE * calculateBonusExposure(board, move);

  // 3. Tile usage reward (using more tiles is generally better)
  evaluation += WEIGHTS.TILE_USAGE * move.placements.length;

  // 4. Rack balance (vowel/consonant ratio after move)
  evaluation += WEIGHTS.VOWEL_CONSONANT * calculateRackBalance(rack, move);

  // 5. Center proximity reward
  evaluation += WEIGHTS.CENTER_PROXIMITY * calculateCenterProximity(move);

  // 6. Board openness penalty
  evaluation += WEIGHTS.BOARD_OPENNESS * calculateNewAnchors(board, move);

  return evaluation;
}

/**
 * Calculate how many premium squares are exposed to the opponent.
 * Returns a count of premium squares that become accessible.
 */
function calculateBonusExposure(board: Board, move: Move): number {
  const newBoard = applyPlacements(board, move.placements);
  let exposure = 0;

  for (const p of move.placements) {
    // Check all 4 adjacent cells
    const neighbors = [
      [p.row - 1, p.col], [p.row + 1, p.col],
      [p.row, p.col - 1], [p.row, p.col + 1],
    ];

    for (const [nr, nc] of neighbors) {
      if (!isInBounds(nr, nc)) continue;
      if (hasTile(newBoard, nr, nc)) continue;

      const bonus = newBoard[nr][nc].bonus;
      if (!bonus || newBoard[nr][nc].bonusUsed) continue;

      switch (bonus) {
        case 'TW': exposure += 3; break;
        case 'DW': exposure += 2; break;
        case 'TL': exposure += 1.5; break;
        case 'DL': exposure += 0.5; break;
      }
    }
  }

  return exposure;
}

/**
 * Calculate rack balance after the move.
 * A balanced rack has a mix of vowels and consonants.
 * Returns a score where higher is better.
 */
function calculateRackBalance(rack: Tile[], move: Move): number {
  const vowels = new Set(['A', 'E', 'I', 'İ', 'O', 'Ö', 'U', 'Ü']);
  const usedLetters = new Set(move.placements.map(p => p.tile.id));

  const remaining = rack.filter(t => !usedLetters.has(t.id));

  if (remaining.length === 0) return 2; // Used all tiles - great!

  const vowelCount = remaining.filter(t => vowels.has(t.letter)).length;

  // Ideal ratio is roughly 40% vowels
  const ratio = vowelCount / remaining.length;
  const idealRatio = 0.4;
  const deviation = Math.abs(ratio - idealRatio);

  // Less deviation = better score
  return Math.max(0, 1 - deviation * 2);
}

/**
 * Calculate average distance of placements from center.
 * Closer to center = higher score.
 */
function calculateCenterProximity(move: Move): number {
  if (move.placements.length === 0) return 0;

  let totalDist = 0;
  for (const p of move.placements) {
    const dist = Math.abs(p.row - CENTER) + Math.abs(p.col - CENTER);
    totalDist += dist;
  }

  const avgDist = totalDist / move.placements.length;
  // Max possible distance is 14, normalize to 0-1 range
  return Math.max(0, 1 - avgDist / 14);
}

/**
 * Calculate how many new anchor points (empty cells adjacent to tiles)
 * are created by this move. More anchors = more options for opponent.
 */
function calculateNewAnchors(board: Board, move: Move): number {
  const newBoard = applyPlacements(board, move.placements);
  let newAnchors = 0;

  for (const p of move.placements) {
    const neighbors = [
      [p.row - 1, p.col], [p.row + 1, p.col],
      [p.row, p.col - 1], [p.row, p.col + 1],
    ];

    for (const [nr, nc] of neighbors) {
      if (!isInBounds(nr, nc)) continue;
      if (hasTile(newBoard, nr, nc)) continue;

      // Check if this was already an anchor before the move
      const wasAnchor =
        hasTile(board, nr - 1, nc) || hasTile(board, nr + 1, nc) ||
        hasTile(board, nr, nc - 1) || hasTile(board, nr, nc + 1);

      if (!wasAnchor) newAnchors++;
    }
  }

  return newAnchors;
}
