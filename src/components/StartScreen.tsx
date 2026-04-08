'use client';

import { AIStrategy } from '@/game/types';
import { useState } from 'react';

interface StartScreenProps {
  onStartGame: (strategy: AIStrategy) => void;
  isLoading: boolean;
}

export default function StartScreen({ onStartGame, isLoading }: StartScreenProps) {
  const [strategy, setStrategy] = useState<AIStrategy>('heuristic');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-950 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-2 font-serif">
            SCRABBLE
          </h1>
          <p className="text-green-400 text-lg font-light tracking-widest">
            SMART AI EDITION
          </p>
        </div>

        <div className="flex justify-center gap-2 mb-8">
          {['S', 'C', 'R', 'A', 'B', 'B', 'L', 'E'].map((letter, i) => (
            <div
              key={i}
              className="w-10 h-10 flex items-center justify-center rounded-md font-bold text-lg font-serif"
              style={{
                background: 'linear-gradient(145deg, #f5deb3, #deb887)',
                color: '#2c1810',
                boxShadow: '2px 2px 4px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.4)',
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {letter}
            </div>
          ))}
        </div>

        <div className="bg-gray-800/80 rounded-xl p-6 mb-6 backdrop-blur">
          <h2 className="text-white text-lg font-semibold mb-4">
            Choose AI Difficulty
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setStrategy('greedy')}
              className={`p-4 rounded-lg border-2 transition-all ${
                strategy === 'greedy'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-bold text-white text-sm">Greedy</div>
              <div className="text-xs text-gray-400 mt-1">
                Picks the highest scoring move each turn
              </div>
            </button>

            <button
              onClick={() => setStrategy('heuristic')}
              className={`p-4 rounded-lg border-2 transition-all ${
                strategy === 'heuristic'
                  ? 'border-yellow-400 bg-yellow-400/10'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <div className="text-2xl mb-2">🧠</div>
              <div className="font-bold text-white text-sm">Heuristic</div>
              <div className="text-xs text-gray-400 mt-1">
                Strategic play with board control and rack management
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={() => onStartGame(strategy)}
          disabled={isLoading}
          className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all
            bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600
            shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading Dictionary...
            </span>
          ) : (
            'Start Game'
          )}
        </button>

        <div className="mt-6 text-xs text-gray-500 space-y-1">
          <p>Human vs AI - Standard Scrabble Rules - Turkish Dictionary</p>
          <p>YAP 441 - Smart Scrabble Project - TOBB ETU 2026 - Iclal Suzan</p>
        </div>
      </div>
    </div>
  );
}
