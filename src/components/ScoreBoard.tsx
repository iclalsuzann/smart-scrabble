'use client';

import { Player } from '@/game/types';

interface ScoreBoardProps {
  players: [Player, Player];
  currentPlayerIndex: number;
  tilesRemaining: number;
}

export default function ScoreBoard({
  players,
  currentPlayerIndex,
  tilesRemaining,
}: ScoreBoardProps) {
  return (
    <div className="flex flex-col gap-3 w-full max-w-md">
      {/* Players */}
      <div className="flex justify-between gap-4">
        {players.map((player, idx) => (
          <div
            key={idx}
            className={`flex-1 rounded-lg p-3 text-center transition-all ${
              currentPlayerIndex === idx
                ? 'bg-green-700 ring-2 ring-yellow-400 shadow-lg'
                : 'bg-gray-800'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-sm">
                {player.type === 'human' ? '👤' : '🤖'}
              </span>
              <span className="font-semibold text-white text-sm">
                {player.name}
              </span>
              {currentPlayerIndex === idx && (
                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              )}
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {player.score}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {player.rack.length} tiles in hand
            </div>
          </div>
        ))}
      </div>

      {/* Tiles remaining */}
      <div className="text-center text-sm text-gray-400">
        🎒 {tilesRemaining} tiles remaining in bag
      </div>
    </div>
  );
}
