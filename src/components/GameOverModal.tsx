'use client';

import { Player } from '@/game/types';
import styles from '@/styles/board.module.css';

interface GameOverModalProps {
  players: [Player, Player];
  onNewGame: () => void;
}

export default function GameOverModal({ players, onNewGame }: GameOverModalProps) {
  const winner =
    players[0].score > players[1].score
      ? 0
      : players[1].score > players[0].score
      ? 1
      : -1;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-700">
        {/* Trophy */}
        <div className="text-6xl mb-4">
          {winner === -1 ? '🤝' : winner === 0 ? '🏆' : '🤖'}
        </div>

        {/* Result */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {winner === -1
            ? "It's a Tie!"
            : winner === 0
            ? 'You Win!'
            : 'Computer Wins!'}
        </h2>

        {/* Scores */}
        <div className="flex justify-center gap-8 my-6">
          {players.map((player, idx) => (
            <div
              key={idx}
              className={`text-center ${
                idx === winner ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              <div className="text-sm mb-1">
                {player.type === 'human' ? '👤' : '🤖'} {player.name}
              </div>
              <div className="text-3xl font-bold">{player.score}</div>
            </div>
          ))}
        </div>

        {/* Play again */}
        <button
          className={`${styles.btn} ${styles.btnPrimary} w-full text-lg py-3`}
          onClick={onNewGame}
        >
          🔄 Play Again
        </button>
      </div>
    </div>
  );
}
