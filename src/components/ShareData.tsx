import React, { useState, useEffect, useRef } from 'react';
import { Tag, Favorite } from '../types/speech';
import * as storage from '../utils/storage';
import '../styles/PronunciationAssessment.css';
import { Tooltip } from 'react-tooltip';


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
  
  // 標籤篩選狀態
  const [selectedTagsForFilter, setSelectedTagsForFilter] = useState<string[]>([]); // 用於篩選句子的標籤ID
  const [showAllSentences, setShowAllSentences] = useState<boolean>(true); // 是否顯示全部句子
  
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
  
  // 添加更新數據區塊的 ref
  const updateDataRef = useRef<HTMLDivElement>(null);
  
  // 添加第一個輸入框的 ref  
  const updateHashInputRef = useRef<HTMLInputElement>(null);
  
  // 初始加載分享歷史記錄
  useEffect(() => {
    setShareHistory(storage.getSavedShareInfo());
  }, []);
  
  // 當favorites變化時，預設全選
  useEffect(() => {
    setSelectedFavorites(favorites.map(fav => fav.id));
  }, [favorites]);
  
  // 當tags變化時，預設全選篩選標籤
  useEffect(() => {
    setSelectedTagsForFilter(tags.map(tag => tag.tagId));
  }, [tags]);
  
  // 根據標籤篩選更新顯示的句子
  useEffect(() => {
    if (showAllSentences) {
      // 顯示全部句子
      setSelectedFavorites(favorites.map(fav => fav.id));
    } else {
      // 根據選中的標籤篩選句子
      const filteredFavorites = favorites.filter(fav => 
        fav.tagIds.some(tagId => selectedTagsForFilter.includes(tagId))
      );
      setSelectedFavorites(filteredFavorites.map(fav => fav.id));
    }
  }, [favorites, selectedTagsForFilter, showAllSentences]);
  
  // 處理"全選"標籤的切換
  const handleShowAllToggle = () => {
    setShowAllSentences(!showAllSentences);
    if (!showAllSentences) {
      // 如果切換到顯示全部，清空標籤選擇
      setSelectedTagsForFilter([]);
    } else {
      // 如果切換到標籤篩選，預設選中所有標籤
      setSelectedTagsForFilter(tags.map(tag => tag.tagId));
    }
  };
  
  // 處理單個標籤的切換
  const handleTagForFilterToggle = (tagId: string) => {
    setShowAllSentences(false); // 選擇具體標籤時，取消"全選"
    setSelectedTagsForFilter(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
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
  
  // 格式化分享鏈接，使用新的路徑格式
  const formatShareLink = (hash: string): string => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/practice/${hash}`;
  };
  
  // 分享數據
  const shareData = async () => {
    // 檢查登入狀態
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired('分享數據', '分享功能需要登入，這樣您就可以管理和更新您的分享。');
      } else {
        alert('分享功能需要登入，請先登入您的帳戶');
      }
      return;
    }
    
    if (selectedFavorites.length === 0) {
      alert('請至少選擇一個句子進行分享');
      return;
    }

    try {
      setIsSharing(true);
      setShareResult(null);
      
      // 獲取選中的收藏項目數據
      const selectedFavoritesData = favorites.filter(fav => selectedFavorites.includes(fav.id));
      
      // 清理自訂分享ID（移除特殊字符，只保留字母數字和中文）
      const cleanedCustomId = customShareId.trim().replace(/[^a-zA-Z0-9\u4e00-\u9fff-_]/g, '');
      
      // 分享選中的句子（不分享標籤）
      const result = await storage.shareTagsAndFavorites([], selectedFavoritesData, user.uid, cleanedCustomId || undefined);
      
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
    // 檢查登入狀態
    if (!user) {
      if (onLoginRequired) {
        onLoginRequired('更新分享數據', '更新分享數據需要登入，請先登入您的帳戶。');
      } else {
        alert('更新分享數據需要登入，請先登入您的帳戶');
      }
      return;
    }
    
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
      
      const result = await storage.updateSharedData(updateHash.trim(), updatePassword.trim(), user.uid);
      
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
  const deleteShareHistoryItem = async (hash: string) => {
    try {
      if (user) {
        // 使用支援Firebase同步的刪除函數
        await storage.deleteShareInfoWithSync(hash, user.uid);
      } else {
        // 未登入用戶只更新本地存儲
        storage.deleteShareInfo(hash);
      }
      setShareHistory(storage.getSavedShareInfo());
    } catch (error) {
      console.error('刪除分享歷史失敗:', error);
      // 即使同步失敗，仍更新本地顯示
      setShareHistory(storage.getSavedShareInfo());
    }
  };
  
  // 複製文本到剪貼板
  const copyToClipboard = (text: string) => {
    // 檢查是否支援 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          alert('已複製到剪貼板！');
        })
        .catch(err => {
          console.error('Clipboard API 失敗:', err);
          fallbackCopyToClipboard(text);
        });
    } else {
      // 使用備用方案
      fallbackCopyToClipboard(text);
    }
  };

  // 備用複製方案
  const fallbackCopyToClipboard = (text: string) => {
    try {
      // 創建一個臨時的 textarea 元素
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // 嘗試使用 execCommand
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        alert('已複製到剪貼板！');
      } else {
        throw new Error('execCommand 複製失敗');
      }
    } catch (err) {
      console.error('備用複製方案失敗:', err);
      // 最後的備用方案：顯示文本讓用戶手動複製
      const userAgent = navigator.userAgent.toLowerCase();
      if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
        // 手機版：使用 prompt 顯示文本
        prompt('請手動複製以下內容：', text);
      } else {
        // 桌面版：顯示警告
        alert('無法自動複製，請手動選擇並複製文本：\n\n' + text);
      }
    }
  };
  
  return (
    <div>
      {/* 移除標題 */}
      
      <div>
          <div className="card-section">
            <h4>分享我的學習內容</h4>
            <p>選擇標籤來篩選要分享的句子，或選擇"全部"來分享所有句子。</p>
            
            {/* 標籤選擇器 - 水平排列 */}
            <div style={{marginBottom: '20px'}}>
              <h5 style={{marginBottom: '10px', color: 'var(--ios-text-primary)'}}>選擇標籤篩選：</h5>
              
              {/* 標籤水平排列 */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '15px',
                padding: '10px',
                backgroundColor: 'var(--ios-background-secondary)',
                borderRadius: '8px'
              }}>
                {/* 全部選項 */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: showAllSentences ? '#007AFF' : 'var(--ios-background)',
                  color: showAllSentences ? 'white' : 'var(--ios-text-primary)',
                  border: '1px solid ' + (showAllSentences ? '#007AFF' : 'var(--ios-border)'),
                  fontSize: '14px',
                  fontWeight: showAllSentences ? 'bold' : 'normal',
                  transition: 'all 0.2s ease'
                }} onClick={handleShowAllToggle}>
                  <input 
                    type="checkbox"
                    checked={showAllSentences}
                    onChange={() => {}}
                    style={{marginRight: '6px', pointerEvents: 'none'}}
                  />
                  全部 ({favorites.length} 個句子)
                </div>
                
                {/* 標籤列表 */}
                {tags.map((tag) => {
                  const tagSentenceCount = favorites.filter(fav => fav.tagIds.includes(tag.tagId)).length;
                  const isSelected = !showAllSentences && selectedTagsForFilter.includes(tag.tagId);
                  
                  return (
                    <div key={tag.tagId} style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      backgroundColor: isSelected ? tag.color : 'var(--ios-background)',
                      color: isSelected ? 'white' : 'var(--ios-text-primary)',
                      border: '1px solid ' + (isSelected ? tag.color : 'var(--ios-border)'),
                      fontSize: '14px',
                      fontWeight: isSelected ? 'bold' : 'normal',
                      opacity: showAllSentences ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }} onClick={() => handleTagForFilterToggle(tag.tagId)}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        disabled={showAllSentences}
                        style={{marginRight: '6px', pointerEvents: 'none'}}
                      />
                      {tag.name} ({tagSentenceCount} 個句子)
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* 符合條件的句子列表 */}
            <div style={{marginBottom: '20px'}}>
              <h5 style={{marginBottom: '10px', color: 'var(--ios-text-primary)'}}>
                符合條件的句子 ({
                  showAllSentences 
                    ? favorites.length 
                    : favorites.filter(fav => fav.tagIds.some(tagId => selectedTagsForFilter.includes(tagId))).length
                } 個)：
              </h5>
              
              <div style={{
                maxHeight: '300px',
                overflowY: 'auto',
                border: '1px solid var(--ios-border)',
                borderRadius: '8px',
                backgroundColor: 'var(--ios-background)'
              }}>
                {/* 全選/取消全選按鈕 */}
                <div style={{
                  padding: '10px',
                  borderBottom: '1px solid var(--ios-border)',
                  backgroundColor: 'var(--ios-background-secondary)'
                }}>
                  <button 
                    className="secondary-button"
                    onClick={() => {
                      const filteredFavorites = showAllSentences 
                        ? favorites 
                        : favorites.filter(fav => fav.tagIds.some(tagId => selectedTagsForFilter.includes(tagId)));
                      
                      if (selectedFavorites.length === filteredFavorites.length) {
                        setSelectedFavorites([]);
                      } else {
                        setSelectedFavorites(filteredFavorites.map(fav => fav.id));
                      }
                    }}
                    style={{fontSize: '14px', padding: '5px 10px'}}
                  >
                    {(() => {
                      const filteredFavorites = showAllSentences 
                        ? favorites 
                        : favorites.filter(fav => fav.tagIds.some(tagId => selectedTagsForFilter.includes(tagId)));
                      return selectedFavorites.length === filteredFavorites.length ? '取消全選' : '全選';
                    })()}
                  </button>
                  <span style={{marginLeft: '10px', fontSize: '14px', color: 'var(--ios-text-secondary)'}}>
                    已選擇 {selectedFavorites.length} 個句子
                  </span>
                </div>
                
                {/* 句子列表 */}
                <div style={{padding: '10px'}}>
                  {(() => {
                    const filteredFavorites = showAllSentences 
                      ? favorites 
                      : favorites.filter(fav => fav.tagIds.some(tagId => selectedTagsForFilter.includes(tagId)));
                    
                    if (filteredFavorites.length === 0) {
                      return (
                        <div style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: 'var(--ios-text-secondary)',
                          fontSize: '14px'
                        }}>
                          沒有符合條件的句子
                        </div>
                      );
                    }
                    
                    return filteredFavorites.map((favorite) => (
                      <div key={favorite.id} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: selectedFavorites.includes(favorite.id) ? 'var(--ios-background-secondary)' : 'transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        transition: 'all 0.2s ease'
                      }} onClick={() => handleFavoriteToggle(favorite.id)}>
                        <input 
                          type="checkbox"
                          checked={selectedFavorites.includes(favorite.id)}
                          onChange={() => {}}
                          style={{marginRight: '10px', marginTop: '2px', pointerEvents: 'none'}}
                        />
                        <div style={{flex: 1}}>
                          <div style={{
                            fontSize: '14px',
                            lineHeight: '1.4',
                            marginBottom: '4px'
                          }}>
                            {favorite.text}
                          </div>
                          {/* 顯示句子的標籤 */}
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                            {favorite.tagIds.map(tagId => {
                              const tag = tags.find(t => t.tagId === tagId);
                              if (!tag) return null;
                              return (
                                <span key={tagId} style={{
                                  padding: '2px 6px',
                                  borderRadius: '8px',
                                  backgroundColor: tag.color,
                                  color: 'white',
                                  fontSize: '10px'
                                }}>
                                  {tag.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
            
            {/* 顯示將要分享的句子數量 */}
            <div style={{
              padding: '10px',
              backgroundColor: 'var(--ios-background-secondary)',
              borderRadius: '8px',
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              <span style={{fontSize: '14px', color: 'var(--ios-text-primary)'}}>
                將分享 <strong>{selectedFavorites.length}</strong> 個句子
              </span>
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
              <span 
                data-tooltip-id="share-name-tooltip"
                data-tooltip-content="您可以輸入有意義的名稱作為分享連結，例如：「我的英文學習」或「小明的收藏」"
                style={{
                  color: 'var(--ios-text-secondary)',
                  marginLeft: '4px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-question-circle" />
              </span>
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
                <div className="share-history" style={{ 
                  overflowX: 'auto',
                  maxWidth: '100%'
                }}>
                  <table style={{ 
                    width: '100%',
                    minWidth: '600px', // 設定最小寬度確保內容可讀
                    fontSize: '12px'
                  }}>
                    <thead>
                      <tr>
                        <th style={{ minWidth: '120px' }}>分享時間</th>
                        <th style={{display: 'none'}}>哈希值</th>
                        <th style={{ minWidth: '200px' }}>分享網址</th>
                        <th style={{ minWidth: '120px' }}>用於編輯的密碼(請妥善保存)</th>
                        <th style={{ minWidth: '100px' }}>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shareHistory.map((item) => (
                        <tr key={item.hash}>
                          <td style={{ fontSize: '11px' }}>
                            {new Date(item.timestamp).toLocaleString()}
                          </td>
                          <td style={{display: 'none'}}>
                            <div className="copy-container">
                              <input type="text" value={item.hash} readOnly />
                              <button onClick={() => copyToClipboard(item.hash)}>複製</button>
                            </div>
                          </td>
                          <td>
                            <div className="copy-container" style={{ 
                              display: 'flex', 
                              gap: '4px',
                              alignItems: 'center'
                            }}>
                              <input 
                                type="text" 
                                value={formatShareLink(item.hash)} 
                                readOnly 
                                onClick={() => copyToClipboard(formatShareLink(item.hash))} 
                                style={{ 
                                  fontSize: '11px',
                                  minWidth: '150px',
                                  flex: '1'
                                }}
                              />
                              <button 
                                onClick={async () => {
                                  try {
                                    if (navigator.share && navigator.canShare) {
                                      const shareData = {
                                        title: '發音評估分享',
                                        text: '查看我的發音評估數據',
                                        url: formatShareLink(item.hash)
                                      };
                                      
                                      if (navigator.canShare(shareData)) {
                                        await navigator.share(shareData);
                                        return;
                                      }
                                    }
                                    
                                    // 備用方案：複製到剪貼板
                                    copyToClipboard(formatShareLink(item.hash));
                                    alert('分享鏈接已複製到剪貼板');
                                  } catch (err) {
                                    console.error('分享失敗:', err);
                                    // 如果分享失敗，複製到剪貼板
                                    copyToClipboard(formatShareLink(item.hash));
                                    alert('分享鏈接已複製到剪貼板');
                                  }
                                }}
                                style={{ 
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                分享
                              </button>
                            </div>
                          </td>
                          <td>
                            <div className="copy-container">
                              <input 
                                type="text" 
                                value={item.editPassword} 
                                readOnly 
                                onClick={() => copyToClipboard(item.editPassword)} 
                                style={{ 
                                  fontSize: '11px',
                                  width: '100%'
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <div style={{ 
                              display: 'flex', 
                              gap: '4px',
                              flexDirection: 'column'
                            }}>
                              <button 
                                className="delete-button"
                                onClick={() => deleteShareHistoryItem(item.hash)}
                                style={{ 
                                  fontSize: '10px',
                                  padding: '2px 6px'
                                }}
                              >
                                刪除
                              </button>
                              <button 
                                className="update-button"
                                onClick={() => {
                                  setUpdateHash(item.hash);
                                  setUpdatePassword(item.editPassword);
                                  // 滾動到更新表單並給予焦點
                                  if (updateDataRef.current) {
                                    updateDataRef.current.scrollIntoView({ behavior: 'smooth' });
                                    // 延遲一下再 focus，確保滾動完成
                                    setTimeout(() => {
                                      if (updateHashInputRef.current) {
                                        updateHashInputRef.current.focus();
                                      }
                                    }, 500);
                                  }
                                }}
                                style={{ 
                                  fontSize: '10px',
                                  padding: '2px 6px'
                                }}
                              >
                                編輯
                              </button>
                            </div>
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
          <div className="card-section" ref={updateDataRef}>
            {/* 移除標題 */}
            
            <div className="input-group">
              <input 
                type="text" 
                placeholder="例如：https://nicetone.ai/practice/ooxx" 
                value={updateHash}
                onChange={(e) => setUpdateHash(e.target.value)}
                ref={updateHashInputRef}
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
              <span 
                data-tooltip-id="update-data-tooltip"
                data-tooltip-content="如果你擁有分享網址也有修改密碼則可以把它們填入這裡，就能修改分享內容。或者點選上方的修改，就會自動帶入相關資訊。"
                style={{
                  color: 'var(--ios-text-secondary)',
                  marginLeft: '4px',
                  cursor: 'pointer'
                }}
              >
                <i className="fas fa-question-circle" />
              </span>
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
                <span 
                  data-tooltip-id="export-import-tooltip"
                  data-tooltip-content="匯出JSON: 導出完整數據，包含所有收藏和標籤信息，可用於備份或遷移。&#10;匯入JSON: 從之前匯出的JSON恢復數據，將覆蓋當前數據。"
                  style={{
                    color: 'var(--ios-text-secondary)',
                    marginLeft: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <i className="fas fa-question-circle" />
                </span>
              </div>
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
        
              {/* Tooltip 組件 */}
      <Tooltip 
        id="share-name-tooltip"
        openOnClick
        clickable
        style={{
          backgroundColor: 'var(--ios-background-secondary, #f2f2f7)',
          color: 'var(--ios-text-primary, #000000)',
          border: '1px solid var(--ios-border-color, #c6c6c8)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          lineHeight: '1.5',
          maxWidth: '300px',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}
      />
      <Tooltip 
        id="update-data-tooltip"
        openOnClick
        clickable
        style={{
          backgroundColor: 'var(--ios-background-secondary, #f2f2f7)',
          color: 'var(--ios-text-primary, #000000)',
          border: '1px solid var(--ios-border-color, #c6c6c8)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          lineHeight: '1.5',
          maxWidth: '300px',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}
      />
      <Tooltip 
        id="export-import-tooltip"
        openOnClick
        clickable
        style={{
          backgroundColor: 'var(--ios-background-secondary, #f2f2f7)',
          color: 'var(--ios-text-primary, #000000)',
          border: '1px solid var(--ios-border-color, #c6c6c8)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '14px',
          lineHeight: '1.5',
          maxWidth: '300px',
          whiteSpace: 'normal',
          wordWrap: 'break-word',
          zIndex: 9999,
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}
      />
    </div>
  );
};

export default ShareData; 