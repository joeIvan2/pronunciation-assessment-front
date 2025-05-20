import React, { useState, useEffect } from 'react';
import { Tag, Favorite } from '../types/speech';
import * as storage from '../utils/storage';
import '../styles/PronunciationAssessment.css';

interface ShareDataProps {
  tags: Tag[];
  favorites: Favorite[];
}

const ShareData: React.FC<ShareDataProps> = ({ tags, favorites }) => {
  // 分享狀態
  const [isExpanded, setIsExpanded] = useState<boolean>(true); // 默認展開
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareResult, setShareResult] = useState<{success: boolean; url?: string; editPassword?: string; error?: string; directLink?: string} | null>(null);
  
  // 導入狀態
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importHash, setImportHash] = useState<string>('');
  const [importResult, setImportResult] = useState<{success: boolean; message: string} | null>(null);
  
  // 更新狀態
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateHash, setUpdateHash] = useState<string>('');
  const [updatePassword, setUpdatePassword] = useState<string>('');
  const [updateResult, setUpdateResult] = useState<{success: boolean; message: string} | null>(null);
  
  // 分享歷史記錄
  const [shareHistory, setShareHistory] = useState<storage.ShareInfo[]>([]);
  
  // 分享歷史動畫效果
  const [showHistoryAnimation, setShowHistoryAnimation] = useState<boolean>(false);
  
  // 初始加載分享歷史記錄和展開狀態
  useEffect(() => {
    setShareHistory(storage.getSavedShareInfo());
    
    // 獲取展開狀態，如果沒有則默認為true
    const cardStates = storage.getCardExpandStates();
    if ('shareData' in cardStates) {
      setIsExpanded(cardStates.shareData);
    }
  }, []);
  
  // 處理展開/收起
  const handleExpandToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    
    // 保存展開狀態
    const cardStates = storage.getCardExpandStates();
    storage.saveCardExpandState('shareData', newState);
  };
  
  // 格式化分享鏈接，添加hash參數以支持直接導入
  const formatShareLink = (hash: string): string => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?hash=${hash}`;
  };
  
  // 分享數據
  const shareData = async () => {
    try {
      setIsSharing(true);
      setShareResult(null);
      
      const result = await storage.shareTagsAndFavorites();
      
      if (result.success && result.hash && result.editPassword && result.url) {
        // 創建直接導入鏈接但不再顯示
        const directLink = formatShareLink(result.hash);
        
        // 保存分享信息到本地
        storage.saveShareInfo({
          hash: result.hash,
          editPassword: result.editPassword,
          url: result.url
        });
        
        // 刷新分享歷史
        setShareHistory(storage.getSavedShareInfo());
        
        // 觸發歷史記錄動畫效果
        setShowHistoryAnimation(true);
        setTimeout(() => {
          setShowHistoryAnimation(false);
        }, 1500);
        
        // 只設置結果狀態，但不顯示success-message
        setShareResult({
          success: true,
          url: result.url,
          editPassword: result.editPassword,
          directLink: directLink
        });
      } else {
        setShareResult({
          success: false,
          error: result.error || '分享失敗，請稍後再試'
        });
      }
    } catch (error) {
      setShareResult({
        success: false,
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  // 導入數據
  const importData = async () => {
    if (!importHash.trim()) {
      setImportResult({
        success: false,
        message: '請輸入有效的哈希值'
      });
      return;
    }
    
    try {
      setIsImporting(true);
      setImportResult(null);
      
      const result = await storage.loadFromHash(importHash.trim());
      
      if (result.success && result.data) {
        // 應用加載的數據
        storage.applyLoadedData(result.data);
        
        setImportResult({
          success: true,
          message: '數據導入成功！頁面將在3秒後刷新...'
        });
        
        // 3秒後刷新頁面以加載新數據
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setImportResult({
          success: false,
          message: result.error || '導入失敗，請檢查哈希值是否正確'
        });
      }
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : '未知錯誤'
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // 更新數據
  const updateData = async () => {
    if (!updateHash.trim()) {
      setUpdateResult({
        success: false,
        message: '請輸入哈希值'
      });
      return;
    }
    
    if (!updatePassword.trim()) {
      setUpdateResult({
        success: false,
        message: '請輸入編輯密碼'
      });
      return;
    }
    
    try {
      setIsUpdating(true);
      setUpdateResult(null);
      
      // 記錄原始輸入用於診斷
      console.log('更新數據請求:', { hashInput: updateHash.trim() });
      
      const result = await storage.updateSharedData(updateHash.trim(), updatePassword.trim());
      
      if (result.success) {
        setUpdateResult({
          success: true,
          message: '數據更新成功！'
        });
        // 清空輸入欄位
        setUpdateHash('');
        setUpdatePassword('');
      } else {
        setUpdateResult({
          success: false,
          message: result.error || '更新失敗，請檢查哈希值和密碼是否正確'
        });
      }
    } catch (error) {
      setUpdateResult({
        success: false,
        message: error instanceof Error ? error.message : '未知錯誤'
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  // 刪除分享歷史記錄
  const deleteShareHistoryItem = (hash: string) => {
    storage.deleteShareInfo(hash);
    setShareHistory(storage.getSavedShareInfo());
  };
  
  // 複製文本到剪貼板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('已複製到剪貼板！');
      })
      .catch(err => {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動選擇並複製');
      });
  };
  
  return (
    <div>
      <div className="section-header" onClick={handleExpandToggle} style={{cursor: 'pointer'}}>
        <h3 className="special-title">數據分享</h3>
        <span style={{marginLeft: 'auto', color: 'var(--ios-text-secondary)', fontSize: '14px'}}>
          {isExpanded ? '收起 ▲' : '展開 ▼'}
        </span>
      </div>
      
      {isExpanded && (
        <div>
          <div className="card-section">
            <h4>分享我的數據</h4>
            <p>將您當前的標籤和收藏數據生成一個分享鏈接，可以與他人共享或備份。</p>
            <button 
              className="primary-button" 
              onClick={shareData}
              disabled={isSharing}
            >
              {isSharing ? '處理中...' : '生成分享鏈接'}
            </button>
            
            {/* 刪除success-message區塊，只保留錯誤提示 */}
            {shareResult && !shareResult.success && (
              <div className="error-message">
                分享失敗: {shareResult.error}
              </div>
            )}
            
            {shareHistory.length > 0 && (
              <div className={`share-history-section ${showHistoryAnimation ? 'history-highlight' : ''}`} style={{marginTop: '20px'}}>
                <h4>分享歷史記錄</h4>
                <div className="share-history">
                  <table>
                    <thead>
                      <tr>
                        <th>分享時間</th>
                        <th style={{display: 'none'}}>哈希值</th>
                        <th>分享網址</th>
                        <th>用於編輯的密碼(請妥善保存)</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shareHistory.map((item) => (
                        <tr key={item.hash}>
                          <td>{new Date(item.timestamp).toLocaleString()}</td>
                          <td style={{display: 'none'}}>
                            <div className="copy-container">
                              <input type="text" value={item.hash} readOnly />
                              <button onClick={() => copyToClipboard(item.hash)}>複製</button>
                            </div>
                          </td>
                          <td>
                            <div className="copy-container">
                              <input type="text" value={formatShareLink(item.hash)} readOnly />
                              <button onClick={() => copyToClipboard(formatShareLink(item.hash))}>複製</button>
                            </div>
                          </td>
                          <td>
                            <div className="copy-container">
                              <input type="password" value={item.editPassword} readOnly />
                              <button onClick={() => copyToClipboard(item.editPassword)}>複製</button>
                            </div>
                          </td>
                          <td>
                            <button 
                              className="delete-button"
                              onClick={() => deleteShareHistoryItem(item.hash)}
                            >
                              刪除
                            </button>
                            <button 
                              className="update-button"
                              style={{ marginLeft: '4px' }}
                              onClick={() => {
                                setUpdateHash(item.hash);
                                setUpdatePassword(item.editPassword);
                                // 滾動到更新表單
                                const updateForm = document.querySelector('.card-section:nth-child(2)');
                                if (updateForm) {
                                  updateForm.scrollIntoView({ behavior: 'smooth' });
                                }
                              }}
                            >
                              更新
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          
          <div className="card-section">
            <h4>修改並更新你的網址</h4>
            
            
            <div className="input-group">
              <input 
                type="text" 
                placeholder="例如：https://pronunciation-assessment-front.vercel.app/?hash=ooxx" 
                value={updateHash}
                onChange={(e) => setUpdateHash(e.target.value)}
              />
              <input 
                type="password" 
                placeholder="您保留的編輯密碼" 
                value={updatePassword}
                onChange={(e) => setUpdatePassword(e.target.value)}
              />
              <button 
                className="secondary-button" 
                onClick={updateData}
                disabled={isUpdating}
              >
                {isUpdating ? '更新中...' : '更新數據'}
              </button>
            </div>
            <div style={{marginTop: '4px', fontSize: '12px', color: 'var(--ios-text-secondary)'}}>
              注意：請輸入哈希值而非完整URL。如需從歷史記錄中更新，請點擊"複製"按鈕獲取編輯密碼。
            </div>
            
            {updateResult && (
              <div className={`message ${updateResult.success ? 'success-message' : 'error-message'}`}>
                {updateResult.message}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareData; 