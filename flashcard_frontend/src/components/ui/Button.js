import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Button component with Ocean Professional theme styling
 */
function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}) {
  const baseClass = `btn-${variant}`;
  const sizeClass = size === 'lg' ? 'btn-lg' : '';
  const combinedClassName = `${baseClass} ${sizeClass} ${className}`.trim();

  return (
    <button
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
