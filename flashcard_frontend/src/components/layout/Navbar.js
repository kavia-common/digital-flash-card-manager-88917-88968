import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Navigation bar component with branding and action buttons
 */
function Navbar({ user, onLogout, theme, onToggleTheme }) {
  return (
    <nav className="nav">
      <div className="nav-inner container">
        <Link to="/" className="brand">
          <span className="brand-icon">📘</span>
          <span className="brand-text">Digital Flash Card Manager</span>
        </Link>
        <div className="nav-actions" style={{ display: 'flex', gap: '12px' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', gap: '16px' }}>
                <Link 
                  to="/practice" 
                  className="btn-ghost"
                  style={{
                    color: 'var(--muted)',
                    fontWeight: '600'
                  }}
                >
                  Practice
                </Link>
                <Link 
                  to="/home" 
                  className="btn-ghost"
                  style={{
                    color: 'var(--primary)',
                    fontWeight: '600'
                  }}
                >
                  My Cards
                </Link>
              </div>
              <button className="btn-primary" onClick={onLogout}>Sign Out</button>
            </>
          ) : (
            <Link to="/login" className="btn-primary">Sign In</Link>
          )}
          <button
            className="btn-ghost"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
