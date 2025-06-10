import React, { useState, useEffect } from 'react';
import { Tag, Favorite } from '../types/speech';
import * as storage from '../utils/storage';
import '../styles/PronunciationAssessment.css';

interface ShareDataProps {
  tags: Tag[];
  favorites: Favorite[];
  user?: any;
  onLoginRequired?: (actionName: string, message?: string) => void;
  onDataImported?: (newTags: Tag[], newFavorites: Favorite[]) => void;
}

const ShareData: React.FC<ShareDataProps> = ({ tags, favorites, user, onLoginRequired, onDataImported }) => {
  // 分享狀態（移除展開/收起功能）
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareResult, setShareResult] = useState<{success: boolean; url?: string; editPassword?: string; error?: string; directLink?: string} | null>(null);
  const [customShareId, setCustomShareId] = useState<string>(''); // 自訂分享ID
  
  // 句子選擇狀態
  const [selectedFavorites, setSelectedFavorites] = useState<string[]>([]); // 存儲選中的favorite ID
  const [isSelectionExpanded, setIsSelectionExpanded] = useState<boolean>(false); // 句子選擇器是否展開
  
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
  
  // 初始加載分享歷史記錄
  useEffect(() => {
    setShareHistory(storage.getSavedShareInfo());
  }, []);
  
  // 當favorites變化時，預設全選
  useEffect(() => {
    setSelectedFavorites(favorites.map(fav => fav.id));
  }, [favorites]);
  
  // 移除展開/收起處理函數
  
  // 處理句子選擇器展開/收起
  const handleSelectionToggle = () => {
    setIsSelectionExpanded(!isSelectionExpanded);
  };
  
  // 處理全選/取消全選
  const handleSelectAll = () => {
    if (selectedFavorites.length === favorites.length) {
      setSelectedFavorites([]); // 全部取消選擇
    } else {
      setSelectedFavorites(favorites.map(fav => fav.id)); // 全部選擇
    }
  };
  
  // 處理單個句子選擇
  const handleFavoriteToggle = (favoriteId: string) => {
    setSelectedFavorites(prev => {
      if (prev.includes(favoriteId)) {
        return prev.filter(id => id !== favoriteId);
      } else {
        return [...prev, favoriteId];
      }
    });
  };
  
  // 格式化分享鏈接，新增hash參數以支持直接導入
  const formatShareLink = (hash: string): string => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?hash=${hash}`;
  };
  
  // 分享數據（只分享選中的句子，不分享標籤）
  const shareData = async () => {
    // 檢查登入狀態
    if (!user && onLoginRequired) {
      onLoginRequired(
        '數據分享',
        '分享您的收藏需要登入，這樣可以記錄您的分享歷史並提供編輯功能。'
      );
      return;
    }

    // 檢查是否有選中的句子
    if (selectedFavorites.length === 0) {
      alert('請至少選擇一個句子進行分享！');
      return;
    }

    try {
      setIsSharing(true);
      setShareResult(null);
      
      // 過濾出選中的收藏句子
      const selectedFavoritesData = favorites.filter(fav => selectedFavorites.includes(fav.id));
      
      // 清理自訂分享ID（移除特殊字符，只保留字母數字和中文）
      const cleanedCustomId = customShareId.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fff-_]/g, '');
      
      // 只分享選中的句子，不分享標籤
      const result = await storage.shareTagsAndFavorites([], selectedFavoritesData, user?.uid, cleanedCustomId || undefined);
      
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
        
        // 清空自訂分享ID輸入框
        setCustomShareId('');
        
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
      {/* 移除標題 */}
      
      <div>
          <div className="card-section">
            <h4>分享我的句子</h4>
            <p>選擇您想要分享的句子並生成分享鏈接，與他人共享或備份。</p>
            
            {/* 句子選擇器 */}
            <div className="sentence-selector" style={{marginBottom: '15px'}}>
              <div className="selector-header" onClick={handleSelectionToggle} style={{
                cursor: 'pointer', 
                padding: '10px', 
                backgroundColor: 'var(--ios-background-secondary)', 
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>
                  📝 已選擇 {selectedFavorites.length} / {favorites.length} 個句子
                  {selectedFavorites.length > 0 && (
                    <span style={{color: 'var(--ios-text-secondary)', fontSize: '14px', marginLeft: '10px'}}>
                      (點擊展開查看詳情)
                    </span>
                  )}
                </span>
                <span className={`expand-arrow ${isSelectionExpanded ? 'expanded' : ''}`}>
                  {isSelectionExpanded ? '▲' : '▼'}
                </span>
              </div>
              
              {isSelectionExpanded && (
                <div className="selector-content" style={{
                  border: '1px solid var(--ios-border)',
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                  padding: '15px',
                  backgroundColor: 'var(--ios-background)'
                }}>
                  <div style={{marginBottom: '10px'}}>
                    <button 
                      className="secondary-button"
                      onClick={handleSelectAll}
                      style={{fontSize: '14px', padding: '5px 10px'}}
                    >
                      {selectedFavorites.length === favorites.length ? '取消全選' : '全選'}
                    </button>
                  </div>
                  
                  <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                    {favorites.map((favorite) => (
                      <div key={favorite.id} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: selectedFavorites.includes(favorite.id) ? 'var(--ios-background-secondary)' : 'transparent',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }} onClick={() => handleFavoriteToggle(favorite.id)}>
                        <input 
                          type="checkbox"
                          checked={selectedFavorites.includes(favorite.id)}
                          onChange={() => handleFavoriteToggle(favorite.id)}
                          style={{marginRight: '10px', marginTop: '2px'}}
                        />
                        <span style={{
                          flex: 1,
                          fontSize: '14px',
                          lineHeight: '1.4'
                        }}>
                          {favorite.text.length > 100 ? `${favorite.text.substring(0, 100)}...` : favorite.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="input-group" style={{marginBottom: '15px'}}>
              <input 
                type="text" 
                placeholder="自訂分享名稱（可選）- 留空將自動生成" 
                value={customShareId}
                onChange={(e) => setCustomShareId(e.target.value)}
                style={{flex: 1, marginRight: '10px'}}
              />
              <button 
                className="primary-button" 
                onClick={shareData}
                disabled={isSharing || selectedFavorites.length === 0}
              >
                {isSharing ? '處理中...' : '生成分享鏈接'}
              </button>
            </div>
            
            <div style={{fontSize: '12px', color: 'var(--ios-text-secondary)', marginBottom: '10px'}}>
              提示：您可以輸入有意義的名稱作為分享連結，例如：「我的英文學習」或「小明的收藏」
            </div>
            
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
                              <input type="text" value={formatShareLink(item.hash)} readOnly onClick={() => copyToClipboard(formatShareLink(item.hash))} />
                              <button onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: '發音評估分享',
                                    text: '查看我的發音評估數據',
                                    url: formatShareLink(item.hash)
                                  })
                                  .catch(err => {
                                    console.error('分享失敗:', err);
                                    copyToClipboard(formatShareLink(item.hash));
                                  });
                                } else {
                                  copyToClipboard(formatShareLink(item.hash));
                                }
                              }}>分享</button>
                            </div>
                          </td>
                          <td>
                            <div className="copy-container">
                              <input type="text" value={item.editPassword} readOnly onClick={() => copyToClipboard(item.editPassword)} />
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
                              編輯
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
          
          {/* 更新數據區塊 */}
          <div className="card-section">
            {/* 移除標題 */}
            
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
          
          {/* 匯出數據表區塊 */}
          <div className="card-section">
            <h4>匯出數據表</h4>
            <p>導出完整數據，包含所有收藏和標籤信息，可用於備份或遷移。</p>
            
            <div style={{ 
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px"
            }}>
              <span style={{ color: "var(--ios-text-secondary)", fontSize: "14px" }}>
                顯示 {favorites.length} 條記錄
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    // 複製表格到剪貼板
                    const headers = ['ID', '文本內容', '標籤IDs', '標籤名稱', '創建時間'];
                    const rows = favorites.map(fav => [
                      fav.id,
                      fav.text,
                      fav.tagIds.join(', '),
                      fav.tagIds.map(tagId => tags.find(tag => tag.tagId === tagId)?.name || tagId).join(', '),
                      new Date(fav.createdAt).toLocaleString()
                    ]);
                    
                    const tableText = [headers, ...rows]
                      .map(row => row.join('\t'))
                      .join('\n');
                    
                    navigator.clipboard.writeText(tableText).then(() => {
                      alert('表格已複製到剪貼板');
                    }).catch(err => {
                      console.error('複製失敗:', err);
                      alert('複製失敗');
                    });
                  }}
                  style={{
                    padding: "4px 8px",
                    background: "var(--ios-primary)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  複製表格
                </button>
                <button
                  onClick={() => {
                    // 匯出JSON
                    const exportData = {
                      favorites: favorites,
                      tags: tags,
                      exportTime: new Date().toISOString(),
                      version: '1.0'
                    };
                    
                    const dataStr = JSON.stringify(exportData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `pronunciation-data-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    padding: "4px 8px",
                    background: "var(--ios-success)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  匯出JSON
                </button>
                <button
                  onClick={() => {
                    // 觸發文件選擇
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const data = JSON.parse(e.target?.result as string);
                            if (data.favorites && data.tags) {
                              if (window.confirm('匯入將覆蓋當前數據，確定要繼續嗎？')) {
                                try {
                                  // 處理標籤數據
                                  const importedTags = Array.isArray(data.tags) ? data.tags : [];
                                  
                                  // 處理收藏數據，直接使用原本的ID（因為是整個替換操作）
                                  const importedFavorites = Array.isArray(data.favorites) ? data.favorites.map((fav: any, index: number) => {
                                    return {
                                      id: fav.id || String(index), // 使用原本的ID，如果沒有則用索引
                                      text: fav.text || '',
                                      tagIds: Array.isArray(fav.tagIds) ? fav.tagIds : (Array.isArray(fav.tags) ? fav.tags : []),
                                      createdAt: fav.createdAt || Date.now()
                                    };
                                  }) : [];
                                  
                                  // 保存數據到本地存儲
                                  storage.saveTags(importedTags);
                                  storage.saveFavorites(importedFavorites);
                                  
                                  // 如果有回調函數，更新父組件狀態
                                  if (onDataImported) {
                                    onDataImported(importedTags, importedFavorites);
                                  }
                                  
                                  alert(`成功匯入 ${importedFavorites.length} 個收藏和 ${importedTags.length} 個標籤！`);
                                } catch (error) {
                                  console.error('匯入失敗:', error);
                                  alert(`匯入失敗: ${error instanceof Error ? error.message : String(error)}`);
                                }
                              }
                            } else {
                              alert('無效的JSON格式，請確保文件包含 favorites 和 tags 字段');
                            }
                          } catch (err) {
                            console.error('解析JSON失敗:', err);
                            alert('解析JSON失敗');
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  style={{
                    padding: "4px 8px",
                    background: "var(--ios-warning)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  匯入JSON
                </button>
              </div>
            </div>
            
            {/* 匯出說明 */}
            <div style={{
              padding: "8px",
              backgroundColor: "rgba(40, 40, 50, 0.7)",
              borderRadius: "4px",
              marginBottom: "8px",
              fontSize: "12px",
              color: "var(--ios-text-secondary)"
            }}>
              <p>匯出JSON: 導出完整數據，包含所有收藏和標籤信息，可用於備份或遷移</p>
              <p>匯入JSON: 從之前匯出的JSON恢復數據，將覆蓋當前數據</p>
            </div>
            
            <div style={{ 
              overflowX: "auto", 
              background: "rgba(30, 30, 34, 0.7)",
              borderRadius: "8px",
              border: "1px solid var(--ios-border)"
            }}>
              <table style={{ 
                width: "100%", 
                borderCollapse: "collapse",
                fontSize: "14px"
              }}>
                <thead>
                  <tr style={{ 
                    borderBottom: "1px solid var(--ios-border)",
                    textAlign: "left"
                  }}>
                    <th style={{ padding: "8px", whiteSpace: "nowrap" }}>ID</th>
                    <th style={{ padding: "8px", whiteSpace: "nowrap" }}>文本內容</th>
                    <th style={{ padding: "8px", whiteSpace: "nowrap" }}>標籤IDs</th>
                    <th style={{ padding: "8px", whiteSpace: "nowrap" }}>標籤名稱</th>
                    <th style={{ padding: "8px", whiteSpace: "nowrap" }}>創建時間</th>
                  </tr>
                </thead>
                <tbody>
                  {favorites.map(fav => (
                    <tr key={fav.id} style={{ 
                      borderBottom: "1px solid rgba(100, 100, 110, 0.2)"
                    }}>
                      <td style={{ padding: "8px", whiteSpace: "nowrap", color: "var(--ios-text-secondary)" }}>
                        {fav.id}
                      </td>
                      <td style={{ padding: "8px" }}>
                        {fav.text}
                      </td>
                      <td style={{ padding: "8px", color: "var(--ios-text-secondary)" }}>
                        {fav.tagIds.join(', ')}
                      </td>
                      <td style={{ padding: "8px" }}>
                        {fav.tagIds.map(tagId => tags.find(tag => tag.tagId === tagId)?.name || tagId).join(', ')}
                      </td>
                      <td style={{ padding: "8px", whiteSpace: "nowrap", color: "var(--ios-text-secondary)" }}>
                        {new Date(fav.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ShareData; 