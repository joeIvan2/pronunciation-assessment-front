import React from 'react';
import './IOSLINEModal.css';

interface IOSLINEModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const IOSLINEModal: React.FC<IOSLINEModalProps> = ({ isOpen, onClose }) => {
  // 自動跳轉邏輯 - 只在LINE環境下執行跳轉
  React.useEffect(() => {
    // 檢查是否在LINE環境中
    const isLineInApp = /line/i.test(navigator.userAgent.toLowerCase());
    
    if (isLineInApp) {
      // 延遲100毫秒後自動跳轉
      const timer = setTimeout(() => {
        let currentUrl = window.location.href;

        // 避免重複加參數
        if (!currentUrl.includes('openExternalBrowser=1')) {
          const separator = currentUrl.includes('?') ? '&' : '?';
          currentUrl = `${currentUrl}${separator}openExternalBrowser=1`;
        }

        // 執行跳轉
        window.location.replace(currentUrl);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, []); // 空依賴陣列，只在組件掛載時執行一次

  if (!isOpen) return null;

  const handleOpenExternalBrowser = () => {
    let currentUrl = window.location.href;

    // 避免重複加參數
    if (!currentUrl.includes('openExternalBrowser=1')) {
      const separator = currentUrl.includes('?') ? '&' : '?';
      currentUrl = `${currentUrl}${separator}openExternalBrowser=1`;
    }

    // 執行跳轉
    window.location.href = currentUrl;
  };

  return (
    <div className="ios-line-modal-overlay" >
      <div className="ios-line-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ios-line-modal-header">
          <h2>🔍 為了達到最好的瀏覽效果</h2>
        </div>

        <div className="ios-line-modal-actions">
          <button className="btn-primary" onClick={handleOpenExternalBrowser}>
            點此為您開啟標準瀏覽器
          </button>
        </div>
      </div>
    </div>
  );
};

export default IOSLINEModal; 