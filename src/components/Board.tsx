'use client';

import { Board as BoardType, Placement, Tile, Move } from '@/game/types';
import { BONUS_LABELS } from '@/game/constants';
import styles from '@/styles/board.module.css';

interface BoardProps {
  board: BoardType;
  turnPlacements: Placement[];
  selectedTile: Tile | null;
  lastMove: Move | null;
  onCellClick: (row: number, col: number) => void;
  onRemovePlacement: (row: number, col: number) => void;
}

export default function Board({
  board,
  turnPlacements,
  selectedTile,
  lastMove,
  onCellClick,
  onRemovePlacement,
}: BoardProps) {
  const placementSet = new Set(
    turnPlacements.map(p => `${p.row},${p.col}`)
  );

  const lastMoveSet = new Set(
    lastMove ? lastMove.placements.map(p => `${p.row},${p.col}`) : []
  );

  return (
    <div className={styles.boardContainer}>
      <div className={styles.board}>
        {board.map((row, rowIdx) =>
          row.map((cell, colIdx) => {
            const isPlaced = placementSet.has(`${rowIdx},${colIdx}`);
            const isLastMoveCell = lastMoveSet.has(`${rowIdx},${colIdx}`);
            const hasTile = cell.tile !== null || isPlaced;
            const placement = turnPlacements.find(
              p => p.row === rowIdx && p.col === colIdx
            );

            // Determine cell class
            let cellClass = styles.cell;
            if (hasTile) {
              cellClass += ` ${styles.cellWithTile}`;
            } else if (cell.bonus) {
              const bonusClass = {
                TW: styles.cellTW,
                DW: styles.cellDW,
                TL: styles.cellTL,
                DL: styles.cellDL,
                STAR: styles.cellStar,
              }[cell.bonus];
              cellClass += ` ${bonusClass || styles.cellEmpty}`;
            } else {
              cellClass += ` ${styles.cellEmpty}`;
            }

            if (selectedTile && !hasTile) {
              cellClass += ' ring-2 ring-yellow-400';
            }

            return (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={cellClass}
                onClick={() => {
                  if (isPlaced) {
                    onRemovePlacement(rowIdx, colIdx);
                  } else if (!cell.tile && selectedTile) {
                    onCellClick(rowIdx, colIdx);
                  }
                }}
              >
                {/* Show tile */}
                {(cell.tile || placement) && (
                  <div
                    className={`${styles.tile} ${
                      isPlaced ? styles.tileTurnPlacement : ''
                    } ${isPlaced ? styles.cellPlaced : ''} ${
                      !isPlaced && isLastMoveCell ? styles.tileLastMove : ''
                    }`}
                  >
                    <span className={styles.tileLetter}>
                      {(placement?.tile || cell.tile)?.letter}
                    </span>
                    <span className={styles.tilePoints}>
                      {(placement?.tile || cell.tile)?.points}
                    </span>
                  </div>
                )}

                {/* Show bonus label if no tile */}
                {!hasTile && cell.bonus && (
                  <span className={styles.bonusLabel}>
                    {BONUS_LABELS[cell.bonus] || ''}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
