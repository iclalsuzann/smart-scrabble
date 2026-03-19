'use client';

import { Tile } from '@/game/types';
import styles from '@/styles/board.module.css';

interface RackProps {
  tiles: Tile[];
  selectedTile: Tile | null;
  onTileSelect: (tile: Tile | null) => void;
  disabled?: boolean;
}

export default function Rack({
  tiles,
  selectedTile,
  onTileSelect,
  disabled = false,
}: RackProps) {
  return (
    <div className={styles.rack}>
      {tiles.length === 0 && (
        <span className="text-amber-200 text-sm opacity-70">No tiles</span>
      )}
      {tiles.map(tile => {
        const isSelected = selectedTile?.id === tile.id;
        return (
          <div
            key={tile.id}
            className={`${styles.rackTile} ${
              isSelected ? styles.rackTileSelected : ''
            } ${disabled ? 'opacity-50 !cursor-not-allowed' : ''}`}
            onClick={() => {
              if (disabled) return;
              onTileSelect(isSelected ? null : tile);
            }}
          >
            <span className={styles.rackTileLetter}>{tile.letter}</span>
            <span className={styles.rackTilePoints}>{tile.points}</span>
          </div>
        );
      })}
    </div>
  );
}
