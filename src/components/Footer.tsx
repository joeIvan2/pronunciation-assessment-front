import React, { useState } from 'react';
import PrivacyPolicy from './PrivacyPolicy';
import './Footer.css';

const Footer: React.FC = () => {
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const handlePrivacyClick = () => {
    setShowPrivacyPolicy(true);
  };

  const handleClosePrivacy = () => {
    setShowPrivacyPolicy(false);
  };

  return (
    <>
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
          
          <div className="footer-divider">|</div>
          
          <button 
            onClick={handlePrivacyClick}
            className="footer-privacy-link"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--ios-text-secondary)',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            隱私政策
          </button>
        </div>
      </footer>

      {/* 隱私政策 Modal */}
      {showPrivacyPolicy && (
        <div 
          className="privacy-modal-overlay" 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={handleClosePrivacy}
        >
          <div 
            className="privacy-modal-content"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              border: '1px solid #e0e0e0',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClosePrivacy}
              style={{
                position: 'sticky',
                top: '10px',
                right: '10px',
                float: 'right',
                background: 'var(--ios-primary)',
                color: 'white',
                border: 'none',
                borderRadius: '20px',
                width: '30px',
                height: '30px',
                cursor: 'pointer',
                fontSize: '16px',
                zIndex: 1001
              }}
            >
              ×
            </button>
            <PrivacyPolicy />
          </div>
        </div>
      )}
    </>
  );
};

export default Footer; 