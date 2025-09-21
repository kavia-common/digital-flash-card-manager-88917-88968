import React, { useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

/**
 * PUBLIC_INTERFACE
 * Modal for creating a new subject
 */
function CreateSubjectModal({
  isOpen,
  onClose,
  onSubmit,
  initialValue = ''
}) {
  const [subjectName, setSubjectName] = useState(initialValue);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!subjectName.trim()) {
      setError('Please enter a subject name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(subjectName.trim());
      setSubjectName('');
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to create subject');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Create New Subject"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label 
            htmlFor="subjectName" 
            style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600'
            }}
          >
            Subject Name
          </label>
          <input
            id="subjectName"
            type="text"
            value={subjectName}
            onChange={(e) => setSubjectName(e.target.value)}
            placeholder="Enter subject name"
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
            {isSubmitting ? 'Creating...' : 'Create Subject'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateSubjectModal;
