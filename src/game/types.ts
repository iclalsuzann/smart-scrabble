// ============================================
// Smart Scrabble - Type Definitions
// ============================================

export type BonusType = 'TW' | 'DW' | 'TL' | 'DL' | 'STAR' | null;

export interface Cell {
  row: number;
  col: number;
  tile: Tile | null;
  bonus: BonusType;
  // Whether the bonus has been used (tiles placed on it previously)
  bonusUsed: boolean;
}

export interface Tile {
  letter: string;
  points: number;
  id: string; // unique identifier
}

export type Board = Cell[][];

export type Direction = 'H' | 'V'; // Horizontal or Vertical

export interface Placement {
  row: number;
  col: number;
  tile: Tile;
}

export interface Move {
  placements: Placement[];
  word: string;
  direction: Direction;
  startRow: number;
  startCol: number;
  score: number;
  wordsFormed: string[];
}

export type AIStrategy = 'greedy' | 'heuristic';

export type GamePhase = 'setup' | 'playing' | 'finished';
export type PlayerType = 'human' | 'ai';

export interface Player {
  type: PlayerType;
  name: string;
  rack: Tile[];
  score: number;
}

export interface GameState {
  board: Board;
  players: [Player, Player]; // [human, ai]
  currentPlayerIndex: number;
  tileBag: Tile[];
  moveHistory: MoveHistoryEntry[];
  phase: GamePhase;
  aiStrategy: AIStrategy;
  consecutivePasses: number;
  turnPlacements: Placement[]; // Current turn's temporary placements
  message: string;
  isAIThinking: boolean;
}

export interface MoveHistoryEntry {
  playerIndex: number;
  move: Move | null; // null = pass
  timestamp: number;
}

export type GameAction =
  | { type: 'START_GAME'; strategy: AIStrategy }
  | { type: 'PLACE_TILE'; placement: Placement }
  | { type: 'REMOVE_PLACEMENT'; row: number; col: number }
  | { type: 'SUBMIT_MOVE'; move: Move }
  | { type: 'PASS_TURN' }
  | { type: 'EXCHANGE_RACK' }
  | { type: 'AI_MOVE'; move: Move | null }
  | { type: 'SHUFFLE_RACK' }
  | { type: 'RECALL_TILES' }
  | { type: 'SET_MESSAGE'; message: string }
  | { type: 'SET_AI_THINKING'; thinking: boolean }
  | { type: 'END_GAME' };
