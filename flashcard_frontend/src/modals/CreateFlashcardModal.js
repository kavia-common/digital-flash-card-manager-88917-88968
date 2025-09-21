import React, { useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

/**
 * PUBLIC_INTERFACE
 * Modal for creating or editing a flashcard
 */
function CreateFlashcardModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  userRole,
  cardCount = 0,
  onUpgradeClick
}) {
  const [frontText, setFrontText] = useState(initialData?.frontText || '');
  const [backText, setBackText] = useState(initialData?.backText || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!frontText.trim()) {
      setError('Please provide text for the front side');
      return;
    }
    if (!backText.trim()) {
      setError('Please provide text for the back side');
      return;
    }

    if (userRole === 'free' && cardCount >= 5 && !initialData) {
      onUpgradeClick?.();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        frontText: frontText.trim(),
        backText: backText.trim()
      });
      setFrontText('');
      setBackText('');
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to save flashcard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      title={initialData ? 'Edit Flashcard' : 'Create New Flashcard'}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label 
            style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600'
            }}
          >
            Front Side
          </label>
          <input
            type="text"
            value={frontText}
            onChange={(e) => setFrontText(e.target.value)}
            placeholder="Enter front side text"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--muted)',
              background: 'var(--surface)',
              color: 'var(--text)',
            }}
            required
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label 
            style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600'
            }}
          >
            Back Side
          </label>
          <textarea
            value={backText}
            onChange={(e) => setBackText(e.target.value)}
            placeholder="Enter back side text"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '12px',
              border: '1px solid var(--muted)',
              background: 'var(--surface)',
              color: 'var(--text)',
              minHeight: '100px',
              resize: 'vertical'
            }}
            required
          />
        </div>
        
        {error && (
          <div style={{ 
            padding: '12px',
            marginBottom: '16px',
            borderRadius: '12px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: 'var(--error)',
          }}>
            {error}
          </div>
        )}
        
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Flashcard'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateFlashcardModal;
