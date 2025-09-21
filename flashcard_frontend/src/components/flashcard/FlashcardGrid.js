import React from 'react';
import FlashcardCard from './FlashcardCard';

/**
 * PUBLIC_INTERFACE
 * Grid component for displaying multiple flashcards
 */
function FlashcardGrid({ 
  flashcards = [],
  topics = [],
  onCardClick,
  onCardEdit
}) {
  if (flashcards.length === 0) {
    return (
      <div style={{
        gridColumn: '1 / -1',
        textAlign: 'center',
        padding: '60px 20px',
        color: 'var(--muted)',
        background: 'var(--surface)',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ fontSize: '40px', marginBottom: '16px' }}>
          📝
        </div>
        <h3 style={{ 
          margin: '0 0 8px',
          color: 'var(--text)',
          fontSize: '18px'
        }}>
          No flashcards yet
        </h3>
        <p style={{ margin: '0 0 24px' }}>
          Create your first flashcard to start learning
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '24px'
    }}>
      {flashcards.map(card => (
        <FlashcardCard
          key={card.id}
          frontText={card.frontText}
          topic={topics.find(t => t.id === card.topicId)?.title}
          onClick={() => onCardClick?.(card)}
          onEdit={() => onCardEdit?.(card)}
        />
      ))}
    </div>
  );
}

export default FlashcardGrid;
