// ============================================
// Smart Scrabble - Score Calculation
// ============================================

import { Board, Placement, Direction } from './types';
import { BINGO_BONUS } from './constants';
import { applyPlacements, getFormedWords } from './board';

/** Calculate score for a set of placements */
export function calculateMoveScore(
  board: Board,
  placements: Placement[]
): number {
  if (placements.length === 0) return 0;

  const tempBoard = applyPlacements(board, placements);
  const words = getFormedWords(board, placements);

  // Set of newly placed positions for bonus calculation
  const newPositions = new Set(
    placements.map(p => `${p.row},${p.col}`)
  );

  let totalScore = 0;

  for (const wordInfo of words) {
    totalScore += calculateWordScore(
      tempBoard,
      board,
      wordInfo.startRow,
      wordInfo.startCol,
      wordInfo.direction,
      newPositions
    );
  }

  // Bingo bonus: using all 7 tiles
  if (placements.length === 7) {
    totalScore += BINGO_BONUS;
  }

  return totalScore;
}

/** Calculate score for a single word */
function calculateWordScore(
  boardWithTiles: Board,
  originalBoard: Board,
  startRow: number,
  startCol: number,
  direction: Direction,
  newPositions: Set<string>
): number {
  const dr = direction === 'V' ? 1 : 0;
  const dc = direction === 'H' ? 1 : 0;

  let wordScore = 0;
  let wordMultiplier = 1;

  let r = startRow;
  let c = startCol;

  while (
    r >= 0 && r < 15 && c >= 0 && c < 15 &&
    boardWithTiles[r][c].tile !== null
  ) {
    const cell = boardWithTiles[r][c];
    const tile = cell.tile!;
    let letterScore = tile.points;

    // Only apply bonus if this is a newly placed tile
    const posKey = `${r},${c}`;
    if (newPositions.has(posKey)) {
      const bonus = originalBoard[r][c].bonus;
      if (bonus && !originalBoard[r][c].bonusUsed) {
        switch (bonus) {
          case 'DL':
            letterScore *= 2;
            break;
          case 'TL':
            letterScore *= 3;
            break;
          case 'DW':
          case 'STAR':
            wordMultiplier *= 2;
            break;
          case 'TW':
            wordMultiplier *= 3;
            break;
        }
      }
    }

    wordScore += letterScore;
    r += dr;
    c += dc;
  }

  return wordScore * wordMultiplier;
}
