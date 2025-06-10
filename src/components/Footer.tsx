import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-contact">
          <span>合作聯絡：</span>
          <a href="mailto:info@nicetone.ai" className="footer-email">
            info@nicetone.ai
          </a>
        </div>
        
        <div className="footer-divider">|</div>
        
        <div className="footer-copyright">
          © 2025 All Rights Reserved
        </div>
        
        <div className="footer-divider">|</div>
        
        <div className="footer-beta">
          Beta版測試中，不保證資料穩定儲存
        </div>
      </div>
    </footer>
  );
};

export default Footer; 