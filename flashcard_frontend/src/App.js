import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * PUBLIC_INTERFACE
 * App is the entry component rendering a modern landing page for the
 * Digital Flash Card Manager. It applies the Ocean Professional theme,
 * introduces features, and includes a primary CTA.
 */
function App() {
  const [theme, setTheme] = useState('light');

  // Apply theme to the html element for CSS var switching
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="App">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-inner container">
          <div className="brand">
            <span className="brand-icon">📘</span>
            <span className="brand-text">Digital Flash Card Manager</span>
          </div>
          <div className="nav-actions">
            <button
              className="btn-ghost"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
            <a href="#get-started" className="btn-primary">Get Started</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <div className="badge">Ocean Professional</div>
            <h1 className="hero-title">
              Study smarter with beautiful, fast flash cards
            </h1>
            <p className="hero-subtitle">
              Create, manage, and review decks with a clean, modern interface. Build your knowledge with spaced repetition and effortless organization.
            </p>
            <div className="hero-cta">
              <a id="get-started" href="#features" className="btn-primary btn-lg">Create Your First Deck</a>
              <a href="#learn-more" className="btn-ghost btn-lg">Learn More</a>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">∞</span>
                <span className="stat-label">Cards & Decks</span>
              </div>
              <div className="stat">
                <span className="stat-value">⚡</span>
                <span className="stat-label">Fast & Minimal</span>
              </div>
              <div className="stat">
                <span className="stat-value">🔁</span>
                <span className="stat-label">Smart Review</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="card-demo">
              <div className="card card-front">
                <div className="card-header">Front</div>
                <div className="card-body">
                  What is the capital of Japan?
                </div>
                <div className="card-footer">
                  <button className="pill">Geography</button>
                  <button className="pill pill-amber">Beginner</button>
                </div>
              </div>
              <div className="card card-back">
                <div className="card-header">Back</div>
                <div className="card-body">
                  Tokyo
                </div>
                <div className="card-footer">
                  <button className="pill">Show Hint</button>
                  <button className="pill pill-amber">Mark Known</button>
                </div>
              </div>
              <div className="card-shadow"></div>
            </div>
          </div>
        </div>
        <div className="gradient-ring"></div>
      </header>

      {/* Features */}
      <section id="features" className="section">
        <div className="container">
          <h2 className="section-title">Everything you need to master any topic</h2>
          <p className="section-subtitle">
            Designed with focus and simplicity. No clutter, just the essentials to help you learn better.
          </p>
          <div className="grid features-grid">
            <div className="feature">
              <div className="feature-icon">🧩</div>
              <h3 className="feature-title">Create</h3>
              <p className="feature-desc">
                Build cards quickly with clean inputs, tags, and instant previews.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">🗂️</div>
              <h3 className="feature-title">Manage</h3>
              <p className="feature-desc">
                Organize by decks and tags, filter by difficulty, and keep your learning tidy.
              </p>
            </div>
            <div className="feature">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Review</h3>
              <p className="feature-desc">
                Smart review sessions with smooth interactions and progress indicators.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="section cta">
        <div className="container cta-box">
          <div className="cta-content">
            <h2 className="cta-title">Ready to level up your learning?</h2>
            <p className="cta-subtitle">Start building your first deck in seconds.</p>
          </div>
          <a href="#get-started" className="btn-inverse btn-lg">Get Started</a>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-inner">
          <span className="footer-text">Made with focus • Ocean Professional theme</span>
          <div className="footer-links">
            <a href="#features">Features</a>
            <a href="#learn-more">Docs</a>
            <a href="#privacy">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
