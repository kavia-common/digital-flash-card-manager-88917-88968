import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

/**
 * PUBLIC_INTERFACE
 * Login page component that handles user authentication
 * with Ocean Professional theme styling, email/password auth, and Google Sign-in
 */
function Login() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setError('');
      setLoading(true);
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/home');
    } catch (err) {
      setError(
        err.code === 'auth/weak-password'
          ? 'Password should be at least 6 characters'
          : err.code === 'auth/email-already-in-use'
          ? 'Email already registered'
          : err.code === 'auth/invalid-email'
          ? 'Invalid email address'
          : 'Failed to sign in'
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
              {isSignUp ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <form className="grid" style={{ gap: '16px' }} onSubmit={handleEmailAuth}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--muted)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                  placeholder="your@email.com"
                  required
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid var(--muted)',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                  }}
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && (
                <div style={{ 
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--error)',
                  textAlign: 'center',
                }}
                >
                  {error}
                </div>
              )}
              <button 
                type="submit" 
                className="btn-primary btn-lg"
                style={{ width: '100%', marginTop: '8px' }}
                disabled={loading}
              >
                {loading 
                  ? 'Please wait...' 
                  : isSignUp 
                    ? 'Create Account' 
                    : 'Sign In'}
              </button>
              
              {/* Divider */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                margin: '8px 0',
                color: 'var(--muted)'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--muted)', opacity: 0.2 }} />
                <span style={{ fontSize: '14px' }}>or</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--muted)', opacity: 0.2 }} />
              </div>

              <button 
                onClick={handleGoogleSignIn}
                type="button" 
                className="btn-ghost btn-lg"
                style={{ 
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                disabled={loading}
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google"
                  style={{ width: '18px', height: '18px' }}
                />
                Sign in with Google
              </button>
              
              <p style={{ textAlign: 'center', color: 'var(--muted)', margin: '16px 0' }}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  style={{ 
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontWeight: '600',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0
                  }}
                >
                  {isSignUp ? 'Sign in' : 'Create one'}
                </button>
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
