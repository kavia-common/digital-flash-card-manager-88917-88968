import React from 'react';
import PropTypes from 'prop-types';

/**
 * PUBLIC_INTERFACE
 * ProgressBar visually represents progress towards a goal.
 * - Accepts value and maxValue to compute percentage.
 * - Optionally shows a label, secondary label, and an action button.
 * - Adheres to the Ocean Professional theme and is accessible with role="progressbar".
 */
function ProgressBar({
  value = 0,
  maxValue = 100,
  label,
  secondaryLabel,
  error = false,
  size = 'md',
  showPercent = true,
  rounded = true,
  className = '',
  button, // { text: string, onClick: func }
}) {
  // Ensure valid bounds
  const safeMax = Math.max(1, Number(maxValue) || 1);
  const safeValue = Math.min(Math.max(0, Number(value) || 0), safeMax);
  const percent = Math.round((safeValue / safeMax) * 100);

  const height = size === 'sm' ? 6 : size === 'lg' ? 14 : 10;
  const radius = rounded ? '999px' : '6px';

  // Colors according to theme state
  const barColor = error
    ? 'var(--error)'
    : 'var(--primary)';

  const trackColor = 'color-mix(in srgb, var(--text) 10%, transparent)';
  const subtleBg = error
    ? 'color-mix(in srgb, var(--error) 8%, transparent)'
    : 'color-mix(in srgb, var(--primary) 8%, transparent)';
  const borderColor = error
    ? 'color-mix(in srgb, var(--error) 20%, transparent)'
    : 'color-mix(in srgb, var(--primary) 20%, transparent)';

  return (
    <div
      className={className}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${borderColor}`,
        borderRadius: 'var(--radius-sm)',
        boxShadow: 'var(--shadow-sm)',
        padding: '12px',
        margin: '10px 0',
      }}
    >
      {/* Header row with label and optional action */}
      {(label || button || secondaryLabel) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'grid' }}>
            {label && (
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                {label}
              </div>
            )}
            {secondaryLabel && (
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                {secondaryLabel}
              </div>
            )}
          </div>

          {button?.text && typeof button.onClick === 'function' && (
            <button
              onClick={button.onClick}
              className="btn-inverse"
              style={{
                padding: '6px 10px',
                fontSize: 12,
                borderRadius: 10,
                whiteSpace: 'nowrap',
              }}
            >
              {button.text}
            </button>
          )}
        </div>
      )}

      {/* Progress track */}
      <div
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-label={label || 'Progress'}
        style={{
          position: 'relative',
          height: `${height}px`,
          borderRadius: radius,
          overflow: 'hidden',
          background: trackColor,
        }}
      >
        {/* Subtle background tint */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: subtleBg,
          }}
        />
        {/* Filled progress */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${percent}%`,
            background: barColor,
            transition: 'width 240ms ease',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.15)',
          }}
        />
      </div>

      {/* Footer with percentage */}
      {showPercent && (
        <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {safeValue}/{safeMax}
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 12,
              color: error ? 'var(--error)' : 'var(--primary)',
            }}
          >
            {percent}%
          </span>
        </div>
      )}
    </div>
  );
}

ProgressBar.propTypes = {
  value: PropTypes.number,
  maxValue: PropTypes.number,
  label: PropTypes.string,
  secondaryLabel: PropTypes.string,
  error: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showPercent: PropTypes.bool,
  rounded: PropTypes.bool,
  className: PropTypes.string,
  button: PropTypes.shape({
    text: PropTypes.string,
    onClick: PropTypes.func,
  }),
};

export default ProgressBar;
