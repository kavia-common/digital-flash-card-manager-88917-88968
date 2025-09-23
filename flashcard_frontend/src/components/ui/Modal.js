import React from 'react';
import ReactModal from 'react-modal';

// Custom styles for Modal following Ocean Professional theme
const modalStyles = {
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    maxWidth: '400px',
    width: '90%',
    padding: '24px',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border-color)',
    background: 'var(--surface)',
    boxShadow: 'var(--shadow-lg)',
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    zIndex: 1000,
  },
};

/**
 * PUBLIC_INTERFACE
 * Modal component with Ocean Professional theme styling
 */
function Modal({
  isOpen,
  onRequestClose,
  title,
  children,
  style = {},
  ...props
}) {
  const customStyles = {
    content: {
      ...modalStyles.content,
      ...(style.content || {})
    },
    overlay: {
      ...modalStyles.overlay,
      ...(style.overlay || {})
    }
  };

  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      style={customStyles}
      {...props}
    >
      {title && (
        <h2 style={{ 
          margin: '0 0 16px',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          {title}
        </h2>
      )}
      {children}
    </ReactModal>
  );
}

export default Modal;
