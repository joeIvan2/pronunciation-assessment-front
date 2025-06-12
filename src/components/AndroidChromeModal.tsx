import React from 'react';
import './AndroidChromeModal.css';

interface AndroidChromeModalProps {
  isOpen: boolean;
  onConfirm: () => void;
}

const AndroidChromeModal: React.FC<AndroidChromeModalProps> = ({ isOpen, onConfirm }) => {
  // 自動跳轉邏輯 - 只在Android + LINE環境下執行跳轉
  React.useEffect(() => {
    // 檢查是否在Android + LINE環境中
    const isAndroid = /android/i.test(navigator.userAgent);
    const isLineInApp = /line/i.test(navigator.userAgent.toLowerCase());
    
    if (isAndroid && isLineInApp) {
      // 延遲一秒後自動跳轉
      const timer = setTimeout(() => {
        window.location.replace('https://nicetone.ai/?openExternalBrowser=1');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []); // 空依賴陣列，只在組件掛載時執行一次

  if (!isOpen) return null;

  return (
    <div className="android-modal-overlay">
      <div className="android-modal" onClick={(e) => e.stopPropagation()}>
        <div className="android-modal-header">
          <h2>切換至 Chrome 瀏覽器</h2>
        </div>
        <div className="android-modal-body">
          <p>為了更佳的使用體驗，將為您切換到 Chrome 瀏覽器。</p>
        </div>
        <div className="android-modal-actions">
          <button className="btn-primary" onClick={onConfirm}>前往 Chrome</button>
        </div>
      </div>
    </div>
  );
};

export default AndroidChromeModal;
