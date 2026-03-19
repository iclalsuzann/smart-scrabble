// ============================================
// Smart Scrabble - Game Constants
// ============================================

import { BonusType } from './types';

// Turkish Scrabble (no blanks)
// Source: https://www.gtoal.com/scrabble/details/turkish/
export const LETTER_POINTS: Record<string, number> = {
  A: 1,
  B: 3,
  C: 4,
  Ç: 4,
  D: 3,
  E: 1,
  F: 7,
  G: 5,
  Ğ: 8,
  H: 5,
  I: 2,
  İ: 1,
  J: 10,
  K: 1,
  L: 1,
  M: 2,
  N: 1,
  O: 2,
  Ö: 7,
  P: 5,
  R: 1,
  S: 2,
  Ş: 4,
  T: 1,
  U: 2,
  Ü: 3,
  V: 7,
  Y: 3,
  Z: 4,
};

export const TILE_DISTRIBUTION: Record<string, number> = {
  A: 12,
  B: 2,
  C: 2,
  Ç: 2,
  D: 2,
  E: 8,
  F: 1,
  G: 1,
  Ğ: 1,
  H: 1,
  I: 4,
  İ: 7,
  J: 1,
  K: 7,
  L: 7,
  M: 4,
  N: 5,
  O: 3,
  Ö: 1,
  P: 1,
  R: 6,
  S: 3,
  Ş: 2,
  T: 5,
  U: 3,
  Ü: 2,
  V: 1,
  Y: 2,
  Z: 2,
};

export const ALPHABET: string[] = [
  'A', 'B', 'C', 'Ç', 'D', 'E', 'F', 'G', 'Ğ', 'H',
  'I', 'İ', 'J', 'K', 'L', 'M', 'N', 'O', 'Ö', 'P',
  'R', 'S', 'Ş', 'T', 'U', 'Ü', 'V', 'Y', 'Z',
];

export const BOARD_SIZE = 15;
export const RACK_SIZE = 7;
export const BINGO_BONUS = 50; // Bonus for using all 7 tiles
export const CENTER = 7; // Center square (0-indexed)

// 15x15 Bonus square map - Standard Scrabble board layout
// null = normal, TW = Triple Word, DW = Double Word, TL = Triple Letter, DL = Double Letter
const B = null; // blank/normal
const TW = 'TW' as BonusType;
const DW = 'DW' as BonusType;
const TL = 'TL' as BonusType;
const DL = 'DL' as BonusType;
const ST = 'STAR' as BonusType; // Center star (acts as DW)

export const BONUS_MAP: BonusType[][] = [
  [TW, B,  B,  DL, B,  B,  B,  TW, B,  B,  B,  DL, B,  B,  TW],
  [B,  DW, B,  B,  B,  TL, B,  B,  B,  TL, B,  B,  B,  DW, B ],
  [B,  B,  DW, B,  B,  B,  DL, B,  DL, B,  B,  B,  DW, B,  B ],
  [DL, B,  B,  DW, B,  B,  B,  DL, B,  B,  B,  DW, B,  B,  DL],
  [B,  B,  B,  B,  DW, B,  B,  B,  B,  B,  DW, B,  B,  B,  B ],
  [B,  TL, B,  B,  B,  TL, B,  B,  B,  TL, B,  B,  B,  TL, B ],
  [B,  B,  DL, B,  B,  B,  DL, B,  DL, B,  B,  B,  DL, B,  B ],
  [TW, B,  B,  DL, B,  B,  B,  ST, B,  B,  B,  DL, B,  B,  TW],
  [B,  B,  DL, B,  B,  B,  DL, B,  DL, B,  B,  B,  DL, B,  B ],
  [B,  TL, B,  B,  B,  TL, B,  B,  B,  TL, B,  B,  B,  TL, B ],
  [B,  B,  B,  B,  DW, B,  B,  B,  B,  B,  DW, B,  B,  B,  B ],
  [DL, B,  B,  DW, B,  B,  B,  DL, B,  B,  B,  DW, B,  B,  DL],
  [B,  B,  DW, B,  B,  B,  DL, B,  DL, B,  B,  B,  DW, B,  B ],
  [B,  DW, B,  B,  B,  TL, B,  B,  B,  TL, B,  B,  B,  DW, B ],
  [TW, B,  B,  DL, B,  B,  B,  TW, B,  B,  B,  DL, B,  B,  TW],
];

// Bonus square display labels
export const BONUS_LABELS: Record<string, string> = {
  TW: 'TW',
  DW: 'DW',
  TL: 'TL',
  DL: 'DL',
  STAR: '★',
};

// Bonus square colors (for CSS)
export const BONUS_COLORS: Record<string, { bg: string; text: string }> = {
  TW: { bg: '#e74c3c', text: '#fff' },      // Red
  DW: { bg: '#e8a0bf', text: '#333' },       // Pink
  TL: { bg: '#3498db', text: '#fff' },       // Blue
  DL: { bg: '#85c1e9', text: '#333' },       // Light blue
  STAR: { bg: '#e8a0bf', text: '#333' },     // Pink (acts as DW)
};
