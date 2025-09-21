import React, { useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

/**
 * PUBLIC_INTERFACE
 * Modal for confirming subject deletion
 */
function DeleteSubjectModal({
  isOpen,
  onClose,
  onConfirm,
  subject
}) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to delete subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Delete Subject"
    >
      <p style={{
        marginBottom: '24px',
        color: 'var(--muted)'
      }}>
        Are you sure you want to delete "{subject?.title}"? This action cannot be undone.
      </p>
      
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
          {isSubmitting ? 'Deleting...' : 'Delete Subject'}
        </Button>
      </div>
    </Modal>
  );
}

export default DeleteSubjectModal;
