// ============================================
// Smart Scrabble - Greedy AI Strategy
// ============================================
// Selects the highest-scoring valid move each turn

import { Board, Tile, Move } from './types';
import { Trie } from './trie';
import { generateAllMoves } from './moveGenerator';
import { CENTER } from './constants';
import { hasTile, isBoardEmpty } from './board';

function moveIsConnected(board: Board, move: Move): boolean {
  if (isBoardEmpty(board)) {
    return move.placements.some(p => p.row === CENTER && p.col === CENTER);
  }
  for (const p of move.placements) {
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
}

/**
 * Greedy AI: Simply picks the move with the highest score.
 * This is a baseline strategy - it maximizes immediate score
 * but does not consider long-term board position.
 */
export function greedySelectMove(
  board: Board,
  rack: Tile[],
  trie: Trie
): Move | null {
  const allMoves = generateAllMoves(board, rack, trie, { timeLimitMs: 250, maxMoves: 2500 });
  const moves = allMoves.filter(m => moveIsConnected(board, m));

  if (moves.length === 0) return null;

  let best = moves[0];
  for (let i = 1; i < moves.length; i++) {
    if (moves[i].score > best.score) best = moves[i];
  }
  return best;
}
