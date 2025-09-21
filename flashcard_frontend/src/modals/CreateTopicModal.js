import React, { useState } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

/**
 * PUBLIC_INTERFACE
 * Modal for creating a new topic
 */
function CreateTopicModal({
  isOpen,
  onClose,
  onSubmit
}) {
  const [topicName, setTopicName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!topicName.trim()) {
      setError('Please enter a topic name');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(topicName.trim());
      setTopicName('');
      onClose();
    } catch (error) {
      setError(error.message || 'Failed to create topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Create New Topic"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label 
            htmlFor="topicName" 
            style={{ 
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600'
            }}
          >
            Topic Name
          </label>
          <input
            id="topicName"
            type="text"
            value={topicName}
            onChange={(e) => setTopicName(e.target.value)}
            placeholder="Enter topic name"
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
            {isSubmitting ? 'Creating...' : 'Create Topic'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default CreateTopicModal;
