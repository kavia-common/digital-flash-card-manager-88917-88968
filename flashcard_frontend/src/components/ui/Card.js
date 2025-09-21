import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Card component with Ocean Professional theme styling
 */
function Card({
  header,
  footer,
  children,
  className = '',
  ...props
}) {
  return (
    <div className={`card ${className}`} {...props}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

export default Card;
