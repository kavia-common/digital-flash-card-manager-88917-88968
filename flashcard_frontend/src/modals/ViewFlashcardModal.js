import React, { useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

/**
 * PUBLIC_INTERFACE
 * Modal for viewing a flashcard with flip animation
 */
function ViewFlashcardModal({
  isOpen,
  onClose,
  card,
  onEdit,
  onDelete,
  onNext,
  onPrev
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!card) return;
    setIsSubmitting(true);
    try {
      await onDelete();
    } catch (error) {
      setError(error.message || 'Failed to delete flashcard');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!card) return null;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        content: {
          maxWidth: '600px',
          maxHeight: '80vh',
          padding: '24px',
          overflow: 'hidden',
        }
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        perspective: '1000px',
      }}>
        {/* Card Container */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '400px',
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
              transition: 'transform 0.6s',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
            }}
            onClick={() => setIsFlipped(!isFlipped)}
          >
            {/* Front Side */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px',
            }}>
              <h2 style={{
                margin: 0,
                fontSize: '24px',
                textAlign: 'center',
              }}>
                {card.frontText}
              </h2>
            </div>

            {/* Back Side */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '24px',
            }}>
              <p style={{
                margin: 0,
                fontSize: '18px',
                textAlign: 'center',
              }}>
                {card.backText}
              </p>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div style={{
            position: 'absolute',
            top: '200px',
            left: '0',
            transform: 'translateY(-50%)',
            zIndex: 2,
          }}>
            <Button
              variant="ghost"
              onClick={onPrev}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                fontSize: '24px',
              }}
              aria-label="Previous card"
            >
              ←
            </Button>
          </div>
          <div style={{
            position: 'absolute',
            top: '200px',
            right: '0',
            transform: 'translateY(-50%)',
            zIndex: 2,
          }}>
            <Button
              variant="ghost"
              onClick={onNext}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '20px',
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                fontSize: '24px',
              }}
              aria-label="Next card"
            >
              →
            </Button>
          </div>
        </div>
        
        {error && (
          <div style={{ 
            padding: '12px',
            marginTop: '16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
          }}>
            {error}
          </div>
        )}
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginTop: '24px'
        }}>
          <Button
            variant="ghost"
            onClick={onEdit}
            style={{
              color: 'var(--primary)',
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            onClick={handleDelete}
            style={{
              color: 'var(--error)',
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ViewFlashcardModal;
