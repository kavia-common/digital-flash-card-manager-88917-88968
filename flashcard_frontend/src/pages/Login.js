import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * PUBLIC_INTERFACE
 * Login page component that handles user authentication
 * with Ocean Professional theme styling and Google Sign-in
 */
function Login() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError('Failed to sign in with Google');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
              {error && (
                <div style={{ 
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--error)',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}>
                  {error}
                </div>
              )}
              <button 
                onClick={handleGoogleSignIn}
                type="button" 
                className="btn-primary btn-lg"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in with Google'}
              </button>
              <p style={{ textAlign: 'center', color: 'var(--muted)', margin: '16px 0' }}>
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
