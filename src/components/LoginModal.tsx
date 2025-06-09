import React from 'react';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  message?: string;
  actionName?: string;
}

const LoginModal: React.FC<LoginModalProps> = ({ 
  isOpen, 
  onClose, 
  onLogin, 
  message,
  actionName = "此功能"
}) => {
  if (!isOpen) return null;

  const defaultMessage = `${actionName}需要登入才能將您的設定儲存到雲端，確保在不同裝置間同步。`;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-header">
          <h3>需要登入</h3>
          <button className="login-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="login-modal-body">
          <div className="login-modal-icon">
            <i className="fas fa-cloud-upload-alt"></i>
          </div>
          <p className="login-modal-message">
            {message || defaultMessage}
          </p>
          <p className="login-modal-sub-message">
            登入後您可以：
          </p>
          <ul className="login-modal-benefits">
            <li>
              <i className="fas fa-heart"></i>
              在雲端儲存您的收藏
            </li>
            <li>
              <i className="fas fa-tags"></i>
              同步自訂標籤
            </li>
            <li>
              <i className="fas fa-share-alt"></i>
              儲存分享記錄
            </li>
            <li>
              <i className="fas fa-sync-alt"></i>
              在不同裝置間同步資料
            </li>
          </ul>
        </div>
        
        <div className="login-modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            暫不登入
          </button>
          <button className="btn btn-primary login-modal-login-btn" onClick={onLogin}>
            <i className="fab fa-google"></i>
            使用 Google 登入
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 