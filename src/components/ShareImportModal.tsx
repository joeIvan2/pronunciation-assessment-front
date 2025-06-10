import React, { useState } from 'react';
import '../styles/ShareImportModal.css';

interface ShareImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDirectImport: () => void;
  onLoginAndImport: () => void;
  isLoading?: boolean;
  shareId: string;
  previewData?: {
    favorites: Array<{ text: string }>;
    tags: Array<{ name: string; color: string }>;
  };
}

const ShareImportModal: React.FC<ShareImportModalProps> = ({
  isOpen,
  onClose,
  onDirectImport,
  onLoginAndImport,
  isLoading = false,
  shareId,
  previewData
}) => {
  const [selectedOption, setSelectedOption] = useState<'direct' | 'login' | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedOption === 'direct') {
      onDirectImport();
    } else if (selectedOption === 'login') {
      onLoginAndImport();
    }
  };

  return (
    <div className="share-import-modal-overlay" onClick={onClose}>
      <div className="share-import-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📚 發現分享內容</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="share-info">
            <p className="share-description">
              有人分享了一些學習內容給您！分享ID: <code>{shareId}</code>
            </p>
            
            {previewData && (
              <div className="content-preview">
                <div className="preview-section">
                  <h4>📝 收藏句子 ({previewData.favorites.length} 個)</h4>
                  <div className="preview-items">
                    {previewData.favorites.slice(0, 3).map((fav, index) => (
                      <div key={index} className="preview-item">
                        {fav.text.length > 60 ? `${fav.text.substring(0, 60)}...` : fav.text}
                      </div>
                    ))}
                    {previewData.favorites.length > 3 && (
                      <div className="preview-more">還有 {previewData.favorites.length - 3} 個句子...</div>
                    )}
                  </div>
                </div>

                {previewData.tags.length > 0 && (
                  <div className="preview-section">
                    <h4>🏷️ 標籤 ({previewData.tags.length} 個)</h4>
                    <div className="preview-tags">
                      {previewData.tags.map((tag, index) => (
                        <span key={index} className="preview-tag" style={{backgroundColor: tag.color}}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="import-options">
            <div 
              className={`import-option ${selectedOption === 'direct' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('direct')}
            >
              <div className="option-header">
                <input 
                  type="radio" 
                  name="importOption" 
                  checked={selectedOption === 'direct'}
                  onChange={() => setSelectedOption('direct')}
                />
                <h3>🚀 直接使用</h3>
              </div>
              <p className="option-description">
                立即導入內容到本地瀏覽器，無需註冊
              </p>
              <ul className="option-features">
                <li>✅ 立即可用</li>
                <li>✅ 本地儲存</li>
                <li>❌ 無法跨裝置同步</li>
                <li>❌ 清除瀏覽器資料會遺失</li>
              </ul>
            </div>

            <div 
              className={`import-option ${selectedOption === 'login' ? 'selected' : ''}`}
              onClick={() => setSelectedOption('login')}
            >
              <div className="option-header">
                <input 
                  type="radio" 
                  name="importOption" 
                  checked={selectedOption === 'login'}
                  onChange={() => setSelectedOption('login')}
                />
                <h3>⭐ 雲端導入（推薦）</h3>
              </div>
              <p className="option-description">
                導入到雲端帳號（如已登入則直接導入，未登入則先進行登入）
              </p>
              <ul className="option-features">
                <li>✅ 雲端同步，永不遺失</li>
                <li>✅ 跨裝置存取</li>
                <li>✅ 個人學習記錄</li>
                <li>✅ 可以分享自己的內容</li>
                <li>✅ 更多進階功能</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>
            取消
          </button>
          <button 
            className="btn-primary" 
            onClick={handleConfirm}
            disabled={!selectedOption || isLoading}
          >
            {isLoading ? '導入中...' : '確認導入'}
          </button>
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareImportModal; 