import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Component for displaying flashcard statistics
 */
function FlashcardStats({ correct = 0, incorrect = 0 }) {
  const total = correct + incorrect;
  const correctPercentage = total > 0 ? (correct / total) * 100 : 0;
  const incorrectPercentage = total > 0 ? (incorrect / total) * 100 : 0;

  return (
    <div style={{
      position: 'absolute',
      bottom: '12px',
      left: '16px',
      right: '16px',
      height: '6px',
      background: '#eee',
      borderRadius: '3px',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: `${correctPercentage}%`,
        background: 'var(--success)',
        transition: 'width 0.3s ease-in-out',
      }} />
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: `${incorrectPercentage}%`,
        background: 'var(--error)',
        transition: 'width 0.3s ease-in-out',
      }} />
    </div>
  );
}

export default FlashcardStats;
