import React, { useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

/**
 * PUBLIC_INTERFACE
 * Modal for confirming topic deletion with cascading flashcard delete warning
 */
function DeleteTopicModal({
  isOpen,
  onClose,
  onConfirm,
  topic
}) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to delete topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Delete Topic"
    >
      <div style={{ marginBottom: '24px' }}>
        <p style={{
          marginBottom: '12px',
          color: 'var(--text)'
        }}>
          Are you sure you want to delete "{topic?.title}"?
        </p>
        <p style={{
          color: 'var(--error)',
          fontWeight: '500',
          background: 'color-mix(in srgb, var(--error) 8%, transparent)',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid color-mix(in srgb, var(--error) 20%, transparent)'
        }}>
          Warning: This will permanently delete all flashcards within this topic. This action cannot be undone.
        </p>
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
          variant="ghost"
          style={{
            color: 'var(--error)',
            borderColor: 'var(--error)'
          }}
          onClick={handleDelete}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Deleting...' : 'Delete Topic'}
        </Button>
      </div>
    </Modal>
  );
}

export default DeleteTopicModal;
