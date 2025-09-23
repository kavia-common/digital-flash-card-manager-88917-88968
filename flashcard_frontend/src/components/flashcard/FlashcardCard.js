import React from 'react';
import FlashcardStats from './FlashcardStats'

/**
 * PUBLIC_INTERFACE
 * Component for displaying a single flashcard in the grid
 */
function FlashcardCard({ 
  frontText,
  topic,
  onEdit,
  onDelete,
  onClick,
  correct,
  incorrect,
  className = '',
  ...props
}) {
  return (
    <div
      className={`feature ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        minHeight: '200px',
        cursor: 'pointer',
      }}
      {...props}
    >
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'start',
        justifyContent: 'space-between',
        width: '100%',
      }}>

        {topic && (
          <div className="pill" style={{
            background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
            color: 'var(--primary)',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {topic}
          </div>
        )}

        <button 
            className="btn-ghost"
            style={{
              padding: '6px',
              minWidth: 'unset',
              color: 'var(--error)',
              borderColor: 'var(--error)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
            aria-label="Delete flashcard"
          >
            Delete
        </button>
      </div>
        {frontText ? (
          <h3 className="feature-title" style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            textAlign: 'center',
            padding: '20px',
            fontSize: '1.5rem'
          }}>
            {frontText}
          </h3>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--muted)',
          }}>
            <div className="feature-icon">📝</div>
            <span>Empty Card</span>
          </div>
        )}
      <FlashcardStats correct={correct} incorrect={incorrect}/>
    </div>
  );
}

export default FlashcardCard;
