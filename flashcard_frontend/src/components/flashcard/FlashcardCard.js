import React from 'react';

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
      onClick={onClick}
      {...props}
    >
      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
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
          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              className="btn-ghost"
              style={{
                padding: '6px',
                minWidth: 'unset',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              aria-label="Edit flashcard"
            >
              ✏️
            </button>
            <button 
              className="btn-ghost"
              style={{
                padding: '6px',
                minWidth: 'unset',
                color: 'var(--error)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              aria-label="Delete flashcard"
            >
              🗑️
            </button>
          </div>
        </div>
        
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {frontText ? (
            <h3 className="feature-title" style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center'
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
        </div>
      </div>
    </div>
  );
}

export default FlashcardCard;
