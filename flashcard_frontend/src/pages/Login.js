import React from 'react';
import { Link } from 'react-router-dom';

/**
 * PUBLIC_INTERFACE
 * Login page component that handles user authentication
 * with Ocean Professional theme styling
 */
function Login() {
  return (
    <div className="App">
      <nav className="nav">
        <div className="nav-inner container">
          <Link to="/" className="brand">
            <span className="brand-icon">📘</span>
            <span className="brand-text">Digital Flash Card Manager</span>
          </Link>
        </div>
      </nav>

      <div className="hero" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="container" style={{ maxWidth: '480px', padding: '60px 0' }}>
          <div className="feature" style={{ width: '100%' }}>
            <h1 className="section-title" style={{ textAlign: 'center', marginBottom: '24px' }}>
              Create Your Account
            </h1>
            <form className="grid" style={{ gap: '16px' }}>
              <div>
                <label 
                  htmlFor="email" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '600' 
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--muted)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label 
                  htmlFor="password" 
                  style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '600'
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--muted)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                  placeholder="••••••••"
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary btn-lg"
                style={{ width: '100%', marginTop: '8px' }}
              >
                Create Account
              </button>
              <p style={{ textAlign: 'center', color: 'var(--muted)', margin: '8px 0' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: '600' }}>
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
        <div className="gradient-ring"></div>
      </div>
    </div>
  );
}

export default Login;
