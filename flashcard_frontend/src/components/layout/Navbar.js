import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * Navigation bar component with branding and action buttons
 */
function Navbar({ theme, onToggleTheme }) {
  const { user, userType, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  return (
    <nav className="nav">
      <div className="nav-inner container">
        <Link to="/" className="brand">
          <span className="brand-icon">📘</span>
          <span className="brand-text">Digital Flash Card Manager</span>
        </Link>
        <div className="nav-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user ? (
            <>
              <div style={{ display: 'flex', gap: '16px' }}>
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
              
              {/* Profile Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '20px',
                    border: '2px solid var(--primary)',
                    padding: '0',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    background: 'var(--surface)'
                  }}
                >
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt="Profile" 
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div 
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'var(--primary)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      {user?.email?.[0].toUpperCase() || '?'}
                    </div>
                  )}
                </button>
                
                {showProfileMenu && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '8px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius)',
                      boxShadow: 'var(--shadow-lg)',
                      minWidth: '240px',
                      zIndex: 100
                    }}
                  >
                    <div 
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-color)'
                      }}
                    >
                      <div style={{ 
                        fontWeight: '600',
                        marginBottom: '4px'
                      }}>
                        {user?.displayName || user?.email}
                      </div>
                      <div style={{ 
                        fontSize: '14px',
                        color: 'var(--muted)'
                      }}>
                        {user?.email}
                      </div>
                      <div style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        background: userType === 'premium' 
                          ? 'color-mix(in srgb, var(--primary) 10%, transparent)'
                          : 'color-mix(in srgb, var(--secondary) 10%, transparent)',
                        color: userType === 'premium' 
                          ? 'var(--primary)'
                          : 'var(--secondary)',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'inline-block'
                      }}>
                        {userType === 'premium' ? 'Premium User' : 'Free User'}
                      </div>
                    </div>
                    <div style={{ padding: '8px 0' }}>
                      {userType === 'free' && (
                        <button 
                          className="btn-ghost"
                          style={{
                            width: '100%',
                            justifyContent: 'flex-start',
                            padding: '8px 16px',
                            color: 'var(--primary)',
                            fontWeight: '600'
                          }}
                        >
                          Upgrade to Premium
                        </button>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="btn-ghost"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '8px 16px',
                          color: 'var(--error)',
                          fontWeight: '600'
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="btn-primary">Sign In</Link>
          )}
          <button
            className="btn-ghost"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
