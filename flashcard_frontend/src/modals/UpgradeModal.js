import React from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

/**
 * PUBLIC_INTERFACE
 * Modal component for displaying premium upgrade prompts
 */
function UpgradeModal({ 
  isOpen, 
  onClose, 
  message,
  featureList = [
    'Create unlimited subjects',
    'Create unlimited topics per subject',
    'Create unlimited flashcards per topic',
    'Advanced analytics and insights',
    'Priority support'
  ]
}) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      title="Upgrade to Premium"
    >
      <div style={{ textAlign: 'center' }}>
        {message && (
          <p style={{ 
            marginBottom: '24px',
            color: 'var(--muted)',
            fontSize: '16px'
          }}>
            {message}
          </p>
        )}
        
        <div style={{
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 12%, transparent), transparent)',
          padding: '24px',
          borderRadius: 'var(--radius)',
          marginBottom: '24px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✨</div>
          <h3 style={{ 
            margin: '0 0 16px',
            fontSize: '20px',
            fontWeight: '700'
          }}>
            Premium Features
          </h3>
          <ul style={{
            listStyle: 'none',
            padding: 0,
            margin: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {featureList.map((feature, index) => (
              <li 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--text)',
                  fontWeight: '500'
                }}
              >
                <span style={{ color: 'var(--primary)' }}>✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          <Button
            variant="ghost"
            onClick={onClose}
          >
            Maybe Later
          </Button>
          <Button
            onClick={() => {
              // TODO: Implement upgrade flow
              alert('Upgrade flow will be implemented here');
              onClose();
            }}
          >
            Upgrade Now
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default UpgradeModal;
