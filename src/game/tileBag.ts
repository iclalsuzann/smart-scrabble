// ============================================
// Smart Scrabble - Tile Bag Management
// ============================================

import { Tile } from './types';
import { TILE_DISTRIBUTION, LETTER_POINTS } from './constants';

let tileIdCounter = 0;

/** Create a unique tile ID */
function createTileId(): string {
  return `tile_${++tileIdCounter}`;
}

/** Create a single tile */
export function createTile(letter: string): Tile {
  const normalized = letter.toLocaleUpperCase('tr-TR');
  return {
    letter: normalized,
    points: LETTER_POINTS[normalized] || 0,
    id: createTileId(),
  };
}

/** Create a full tile bag with standard distribution */
export function createTileBag(): Tile[] {
  tileIdCounter = 0;
  const bag: Tile[] = [];

  for (const [letter, count] of Object.entries(TILE_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
      bag.push(createTile(letter));
    }
  }

  return shuffleArray(bag);
}

/** Fisher-Yates shuffle */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/** Draw tiles from the bag */
export function drawTiles(bag: Tile[], count: number): { drawn: Tile[]; remaining: Tile[] } {
  const drawn = bag.slice(0, count);
  const remaining = bag.slice(count);
  return { drawn, remaining };
}

/** Refill a player's rack from the bag */
export function refillRack(
  rack: Tile[],
  bag: Tile[],
  maxSize: number = 7
): { newRack: Tile[]; newBag: Tile[] } {
  const needed = maxSize - rack.length;
  if (needed <= 0 || bag.length === 0) {
    return { newRack: rack, newBag: bag };
  }

  const { drawn, remaining } = drawTiles(bag, Math.min(needed, bag.length));
  return {
    newRack: [...rack, ...drawn],
    newBag: remaining,
  };
}
