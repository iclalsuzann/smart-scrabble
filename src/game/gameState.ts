// ============================================
// Smart Scrabble - Game State Management
// ============================================

import { GameState, GameAction } from './types';
import { createBoard, applyPlacements } from './board';
import { createTileBag, drawTiles, refillRack, shuffleArray } from './tileBag';
import { RACK_SIZE } from './constants';

/** Create initial game state */
export function createInitialState(): GameState {
  return {
    board: createBoard(),
    players: [
      { type: 'human', name: 'You', rack: [], score: 0 },
      { type: 'ai', name: 'Computer', rack: [], score: 0 },
    ],
    currentPlayerIndex: 0,
    tileBag: [],
    moveHistory: [],
    phase: 'setup',
    aiStrategy: 'greedy',
    consecutivePasses: 0,
    turnPlacements: [],
    message: 'Choose AI difficulty and start the game!',
    isAIThinking: false,
  };
}

/** Game state reducer */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START_GAME': {
      const bag = createTileBag();
      const { drawn: hand1, remaining: bag1 } = drawTiles(bag, RACK_SIZE);
      const { drawn: hand2, remaining: bag2 } = drawTiles(bag1, RACK_SIZE);

      return {
        ...state,
        board: createBoard(),
        players: [
          { ...state.players[0], rack: hand1, score: 0 },
          { ...state.players[1], rack: hand2, score: 0 },
        ],
        currentPlayerIndex: 0,
        tileBag: bag2,
        moveHistory: [],
        phase: 'playing',
        aiStrategy: action.strategy,
        consecutivePasses: 0,
        turnPlacements: [],
        message: 'Your turn! Place tiles on the board.',
        isAIThinking: false,
      };
    }

    case 'PLACE_TILE': {
      const { placement } = action;
      // Remove tile from rack
      const player = state.players[state.currentPlayerIndex];
      const tileIndex = player.rack.findIndex(t => t.id === placement.tile.id);
      if (tileIndex === -1) return state;

      const newRack = [...player.rack];
      newRack.splice(tileIndex, 1);

      const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
      newPlayers[state.currentPlayerIndex] = {
        ...player,
        rack: newRack,
      };

      return {
        ...state,
        players: newPlayers,
        turnPlacements: [...state.turnPlacements, placement],
      };
    }

    case 'REMOVE_PLACEMENT': {
      const { row, col } = action;
      const placementIndex = state.turnPlacements.findIndex(
        p => p.row === row && p.col === col
      );
      if (placementIndex === -1) return state;

      const removed = state.turnPlacements[placementIndex];
      const newPlacements = [...state.turnPlacements];
      newPlacements.splice(placementIndex, 1);

      // Return tile to rack
      const player = state.players[state.currentPlayerIndex];
      const newRack = [...player.rack, removed.tile];

      const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
      newPlayers[state.currentPlayerIndex] = {
        ...player,
        rack: newRack,
      };

      return {
        ...state,
        players: newPlayers,
        turnPlacements: newPlacements,
      };
    }

    case 'SUBMIT_MOVE': {
      const { move } = action;
      const playerIndex = state.currentPlayerIndex;
      const player = state.players[playerIndex];

      // Apply placements to board
      const newBoard = applyPlacements(state.board, move.placements);

      // Refill rack
      const { newRack, newBag } = refillRack(player.rack, state.tileBag, RACK_SIZE);

      const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
      newPlayers[playerIndex] = {
        ...player,
        rack: newRack,
        score: player.score + move.score,
      };

      const nextPlayer = 1 - playerIndex;
      const newState: GameState = {
        ...state,
        board: newBoard,
        players: newPlayers,
        currentPlayerIndex: nextPlayer,
        tileBag: newBag,
        moveHistory: [
          ...state.moveHistory,
          { playerIndex, move, timestamp: Date.now() },
        ],
        consecutivePasses: 0,
        turnPlacements: [],
        message: nextPlayer === 0
          ? 'Your turn! Place tiles on the board.'
          : "Computer's turn...",
      };

      // Check end conditions
      if (shouldEndGame(newState)) {
        return endGame(newState);
      }

      return newState;
    }

    case 'PASS_TURN': {
      const playerIndex = state.currentPlayerIndex;

      // Return any placed tiles to rack
      let currentState = state;
      if (state.turnPlacements.length > 0) {
        const player = state.players[playerIndex];
        const returnedTiles = state.turnPlacements.map(p => p.tile);
        const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
        newPlayers[playerIndex] = {
          ...player,
          rack: [...player.rack, ...returnedTiles],
        };
        currentState = { ...state, players: newPlayers, turnPlacements: [] };
      }

      const newConsecutivePasses = currentState.consecutivePasses + 1;
      const nextPlayer = 1 - playerIndex;

      const newState: GameState = {
        ...currentState,
        currentPlayerIndex: nextPlayer,
        moveHistory: [
          ...currentState.moveHistory,
          { playerIndex, move: null, timestamp: Date.now() },
        ],
        consecutivePasses: newConsecutivePasses,
        turnPlacements: [],
        message: nextPlayer === 0
          ? 'Your turn! Place tiles on the board.'
          : "Computer's turn...",
      };

      if (newConsecutivePasses >= 4) {
        return endGame(newState);
      }

      return newState;
    }

    case 'EXCHANGE_RACK': {
      const playerIndex = state.currentPlayerIndex;
      const player = state.players[playerIndex];

      // Cannot exchange if bag is empty or no tiles in rack
      if (player.rack.length === 0 || state.tileBag.length === 0) {
        return state;
      }

      // Put current rack back into bag and draw new tiles
      const combinedBag = shuffleArray([...state.tileBag, ...player.rack]);
      const { drawn: newRack, remaining: newBag } = drawTiles(
        combinedBag,
        Math.min(RACK_SIZE, combinedBag.length)
      );

      const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
      newPlayers[playerIndex] = {
        ...player,
        rack: newRack,
      };

      const nextPlayer = 1 - playerIndex;

      const newState: GameState = {
        ...state,
        players: newPlayers,
        tileBag: newBag,
        currentPlayerIndex: nextPlayer,
        moveHistory: [
          ...state.moveHistory,
          { playerIndex, move: null, timestamp: Date.now() },
        ],
        consecutivePasses: state.consecutivePasses + 1,
        turnPlacements: [],
        message:
          nextPlayer === 0
            ? 'Your turn! Place tiles on the board.'
            : "Computer's turn...",
      };

      if (newState.consecutivePasses >= 4) {
        return endGame(newState);
      }

      return newState;
    }

    case 'AI_MOVE': {
      if (action.move === null) {
        // AI passes
        return gameReducer(state, { type: 'PASS_TURN' });
      }

      // AI places tiles and submits
      const aiPlayer = state.players[state.currentPlayerIndex];

      // Remove used tiles from AI rack
      const usedTileIds = new Set(action.move.placements.map(p => p.tile.id));
      const remainingRack = aiPlayer.rack.filter(t => !usedTileIds.has(t.id));

      const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
      newPlayers[state.currentPlayerIndex] = {
        ...aiPlayer,
        rack: remainingRack,
      };

      const stateWithRack = { ...state, players: newPlayers };

      return gameReducer(stateWithRack, {
        type: 'SUBMIT_MOVE',
        move: action.move,
      });
    }

    case 'SHUFFLE_RACK': {
      const player = state.players[state.currentPlayerIndex];
      const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
      newPlayers[state.currentPlayerIndex] = {
        ...player,
        rack: shuffleArray(player.rack),
      };
      return { ...state, players: newPlayers };
    }

    case 'RECALL_TILES': {
      if (state.turnPlacements.length === 0) return state;

      const player = state.players[state.currentPlayerIndex];
      const returnedTiles = state.turnPlacements.map(p => p.tile);
      const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];
      newPlayers[state.currentPlayerIndex] = {
        ...player,
        rack: [...player.rack, ...returnedTiles],
      };

      return {
        ...state,
        players: newPlayers,
        turnPlacements: [],
        message: 'Tiles recalled. Place tiles on the board.',
      };
    }

    case 'SET_MESSAGE':
      return { ...state, message: action.message };

    case 'SET_AI_THINKING':
      return { ...state, isAIThinking: action.thinking };

    case 'END_GAME':
      return endGame(state);

    default:
      return state;
  }
}

/** Check if the game should end */
function shouldEndGame(state: GameState): boolean {
  // A player has no tiles and bag is empty
  if (state.tileBag.length === 0) {
    if (state.players.some(p => p.rack.length === 0)) {
      return true;
    }
  }
  return false;
}

/** End the game and calculate final scores */
function endGame(state: GameState): GameState {
  const newPlayers = [...state.players] as [typeof state.players[0], typeof state.players[1]];

  // Subtract remaining tile values from each player
  // Add those values to the player who went out (if any)
  let bonusPoints = 0;
  let finisherIndex = -1;

  for (let i = 0; i < 2; i++) {
    const rackValue = newPlayers[i].rack.reduce((sum, t) => sum + t.points, 0);
    if (newPlayers[i].rack.length === 0) {
      finisherIndex = i;
    } else {
      newPlayers[i] = {
        ...newPlayers[i],
        score: Math.max(0, newPlayers[i].score - rackValue),
      };
      bonusPoints += rackValue;
    }
  }

  if (finisherIndex >= 0) {
    newPlayers[finisherIndex] = {
      ...newPlayers[finisherIndex],
      score: newPlayers[finisherIndex].score + bonusPoints,
    };
  }

  const winner = newPlayers[0].score > newPlayers[1].score ? 0 :
                 newPlayers[1].score > newPlayers[0].score ? 1 : -1;

  const message = winner === -1
    ? "It's a tie!"
    : `${newPlayers[winner].name} wins with ${newPlayers[winner].score} points!`;

  return {
    ...state,
    players: newPlayers,
    phase: 'finished',
    message,
    isAIThinking: false,
  };
}
