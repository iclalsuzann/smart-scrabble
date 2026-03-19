'use client';

import { MoveHistoryEntry, Player } from '@/game/types';

interface MoveHistoryProps {
  history: MoveHistoryEntry[];
  players: [Player, Player];
}

export default function MoveHistory({ history, players }: MoveHistoryProps) {
  if (history.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-3 text-center text-gray-500 text-sm">
        No moves yet
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3 max-h-48 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">
        Move History
      </h3>
      <div className="space-y-1">
        {history.map((entry, idx) => {
          const player = players[entry.playerIndex];
          const icon = player.type === 'human' ? '👤' : '🤖';

          if (!entry.move) {
            return (
              <div key={idx} className="text-xs text-gray-500 flex gap-2">
                <span>{icon}</span>
                <span className="italic">passed</span>
              </div>
            );
          }

          return (
            <div key={idx} className="text-xs text-gray-300 flex gap-2 items-baseline">
              <span>{icon}</span>
              <span className="font-mono font-bold text-yellow-400">
                {entry.move.word}
              </span>
              <span className="text-green-400">+{entry.move.score}</span>
              {entry.move.wordsFormed.length > 1 && (
                <span className="text-gray-500">
                  (+{entry.move.wordsFormed.slice(1).join(', ')})
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
