import React from 'react';

/**
 * PUBLIC_INTERFACE
 * Footer component with links and branding
 */
function Footer() {
  return (
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
  );
}

export default Footer;
