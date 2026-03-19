'use client';

import { useReducer, useState, useCallback, useEffect, useRef } from 'react';
import { AIStrategy, Tile, Move } from '@/game/types';
import { createInitialState, gameReducer } from '@/game/gameState';
import { loadDictionary, getTrie } from '@/game/trie';
import {
  validatePlacementPositions,
  getFormedWords,
} from '@/game/board';
import { calculateMoveScore } from '@/game/scoring';
import { greedySelectMove } from '@/game/aiGreedy';
import { heuristicSelectMove } from '@/game/aiHeuristic';

import StartScreen from '@/components/StartScreen';
import Board from '@/components/Board';
import Rack from '@/components/Rack';
import ScoreBoard from '@/components/ScoreBoard';
import GameControls from '@/components/GameControls';
import MoveHistory from '@/components/MoveHistory';
import GameOverModal from '@/components/GameOverModal';

export default function Home() {
  const [state, dispatch] = useReducer(gameReducer, createInitialState());
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const aiThinkingIndicatorRef = useRef<NodeJS.Timeout | null>(null);

  const isHumanTurn = state.currentPlayerIndex === 0;

  useEffect(() => {
    if (
      state.phase !== 'playing' ||
      state.currentPlayerIndex !== 1 ||
      state.isAIThinking
    ) {
      return;
    }

    // Only show the "thinking" UI if AI computation takes noticeable time.
    if (aiThinkingIndicatorRef.current) {
      clearTimeout(aiThinkingIndicatorRef.current);
    }
    aiThinkingIndicatorRef.current = setTimeout(() => {
      dispatch({ type: 'SET_AI_THINKING', thinking: true });
    }, 100);

    aiTimeoutRef.current = setTimeout(() => {
      const trie = getTrie();
      if (!trie) {
        if (aiThinkingIndicatorRef.current) {
          clearTimeout(aiThinkingIndicatorRef.current);
          aiThinkingIndicatorRef.current = null;
        }
        dispatch({ type: 'SET_AI_THINKING', thinking: false });
        return;
      }

      const aiRack = state.players[1].rack;
      let move: Move | null = null;

      if (state.aiStrategy === 'greedy') {
        move = greedySelectMove(state.board, aiRack, trie);
      } else {
        move = heuristicSelectMove(state.board, aiRack, trie);
      }

      dispatch({ type: 'AI_MOVE', move });
      if (aiThinkingIndicatorRef.current) {
        clearTimeout(aiThinkingIndicatorRef.current);
        aiThinkingIndicatorRef.current = null;
      }
      dispatch({ type: 'SET_AI_THINKING', thinking: false });
    }, 0);

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
      if (aiThinkingIndicatorRef.current) {
        clearTimeout(aiThinkingIndicatorRef.current);
      }
    };
  }, [state.currentPlayerIndex, state.phase, state.isAIThinking, state.board, state.players, state.aiStrategy]);

  const handleStartGame = useCallback(async (strategy: AIStrategy) => {
    setIsLoading(true);
    try {
      await loadDictionary();
      dispatch({ type: 'START_GAME', strategy });
    } catch (error) {
      console.error('Failed to load dictionary:', error);
    }
    setIsLoading(false);
  }, []);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!selectedTile || !isHumanTurn || state.isAIThinking) return;
      dispatch({
        type: 'PLACE_TILE',
        placement: { row, col, tile: selectedTile },
      });
      setSelectedTile(null);
    },
    [selectedTile, isHumanTurn, state.isAIThinking]
  );

  const handleRemovePlacement = useCallback(
    (row: number, col: number) => {
      if (!isHumanTurn || state.isAIThinking) return;
      dispatch({ type: 'REMOVE_PLACEMENT', row, col });
    },
    [isHumanTurn, state.isAIThinking]
  );

  const handleSubmit = useCallback(() => {
    if (state.turnPlacements.length === 0) return;

    const trie = getTrie();
    if (!trie) return;

    const validation = validatePlacementPositions(state.board, state.turnPlacements);
    if (!validation.valid) {
      dispatch({ type: 'SET_MESSAGE', message: validation.error || 'Invalid placement' });
      return;
    }

    const formedWords = getFormedWords(state.board, state.turnPlacements);
    if (formedWords.length === 0) {
      dispatch({ type: 'SET_MESSAGE', message: 'No valid words formed' });
      return;
    }

    const invalidWords = formedWords.filter(w => !trie.search(w.word));
    if (invalidWords.length > 0) {
      dispatch({
        type: 'SET_MESSAGE',
        message: 'Invalid word: ' + invalidWords[0].word,
      });
      return;
    }

    const score = calculateMoveScore(state.board, state.turnPlacements);
    const direction =
      state.turnPlacements.length > 1 &&
      state.turnPlacements[0].row !== state.turnPlacements[1].row
        ? 'V' as const
        : 'H' as const;

    const move: Move = {
      placements: state.turnPlacements,
      word: formedWords[0].word,
      direction,
      startRow: formedWords[0].startRow,
      startCol: formedWords[0].startCol,
      score,
      wordsFormed: formedWords.map(w => w.word),
    };

    dispatch({ type: 'SUBMIT_MOVE', move });
    setSelectedTile(null);
  }, [state.board, state.turnPlacements]);

  const handlePass = useCallback(() => {
    dispatch({ type: 'PASS_TURN' });
    setSelectedTile(null);
  }, []);

  const handleRecall = useCallback(() => {
    dispatch({ type: 'RECALL_TILES' });
    setSelectedTile(null);
  }, []);

  const handleShuffle = useCallback(() => {
    dispatch({ type: 'SHUFFLE_RACK' });
  }, []);

  const handleExchange = useCallback(() => {
    dispatch({ type: 'EXCHANGE_RACK' });
    setSelectedTile(null);
  }, []);

  const handleNewGame = useCallback(() => {
    dispatch({ type: 'START_GAME', strategy: state.aiStrategy });
  }, [state.aiStrategy]);

  if (state.phase === 'setup') {
    return <StartScreen onStartGame={handleStartGame} isLoading={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-950 to-gray-900 flex flex-col items-center px-4 py-4 gap-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 font-serif">
          SCRABBLE
        </h1>
        <p className="text-xs text-green-400/60 tracking-widest">
          {state.aiStrategy === 'greedy' ? 'GREEDY' : 'HEURISTIC'} AI
        </p>
      </div>

      <ScoreBoard
        players={state.players}
        currentPlayerIndex={state.currentPlayerIndex}
        tilesRemaining={state.tileBag.length}
      />

      <div
        className={'text-sm font-medium px-4 py-2 rounded-lg text-center max-w-md ' + (
          state.message.includes('Invalid') || state.message.includes('must')
            ? 'bg-red-900/50 text-red-300'
            : state.isAIThinking
            ? 'bg-blue-900/50 text-blue-300'
            : 'bg-gray-800/80 text-gray-300'
        )}
      >
        {state.isAIThinking && (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Computer is thinking...
          </span>
        )}
        {!state.isAIThinking && state.message}
      </div>

      <Board
        board={state.board}
        turnPlacements={state.turnPlacements}
        selectedTile={selectedTile}
        lastMove={
          state.moveHistory.length > 0
            ? state.moveHistory[state.moveHistory.length - 1].move
            : null
        }
        onCellClick={handleCellClick}
        onRemovePlacement={handleRemovePlacement}
      />

      <Rack
        tiles={state.players[0].rack}
        selectedTile={selectedTile}
        onTileSelect={setSelectedTile}
        disabled={!isHumanTurn || state.isAIThinking}
      />

      <GameControls
        canSubmit={state.turnPlacements.length > 0}
        canRecall={state.turnPlacements.length > 0}
        canExchange={
          state.turnPlacements.length === 0 &&
          state.players[0].rack.length > 0 &&
          state.tileBag.length > 0
        }
        isHumanTurn={isHumanTurn}
        isAIThinking={state.isAIThinking}
        onSubmit={handleSubmit}
        onPass={handlePass}
        onRecall={handleRecall}
        onShuffle={handleShuffle}
        onExchange={handleExchange}
      />

      <div className="w-full max-w-md">
        <MoveHistory history={state.moveHistory} players={state.players} />
      </div>

      {state.phase === 'finished' && (
        <GameOverModal players={state.players} onNewGame={handleNewGame} />
      )}
    </div>
  );
}
