'use client';

import styles from '@/styles/board.module.css';

interface GameControlsProps {
  canSubmit: boolean;
  canRecall: boolean;
  isHumanTurn: boolean;
  isAIThinking: boolean;
  canExchange: boolean;
  onSubmit: () => void;
  onPass: () => void;
  onRecall: () => void;
  onShuffle: () => void;
  onExchange: () => void;
}

export default function GameControls({
  canSubmit,
  canRecall,
  isHumanTurn,
  isAIThinking,
  canExchange,
  onSubmit,
  onPass,
  onRecall,
  onShuffle,
  onExchange,
}: GameControlsProps) {
  const disabled = !isHumanTurn || isAIThinking;

  return (
    <div className={styles.controls}>
      <button
        className={`${styles.btn} ${styles.btnPrimary}`}
        onClick={onSubmit}
        disabled={disabled || !canSubmit}
      >
        ✓ Play
      </button>
      <button
        className={`${styles.btn} ${styles.btnSecondary}`}
        onClick={onRecall}
        disabled={disabled || !canRecall}
      >
        ↩ Recall
      </button>
      <button
        className={`${styles.btn} ${styles.btnSecondary}`}
        onClick={onShuffle}
        disabled={disabled}
      >
        🔀 Shuffle
      </button>
      <button
        className={`${styles.btn} ${styles.btnSecondary}`}
        onClick={onExchange}
        disabled={disabled || !canExchange}
      >
        🔁 Exchange
      </button>
      <button
        className={`${styles.btn} ${styles.btnDanger}`}
        onClick={onPass}
        disabled={disabled}
      >
        ⏭ Pass
      </button>
    </div>
  );
}
