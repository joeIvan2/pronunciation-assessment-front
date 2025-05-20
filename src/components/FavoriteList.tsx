import React, { useState, useEffect, useRef } from 'react';
import { Favorite, Tag } from '../types/speech';
import '../styles/PronunciationAssessment.css';
import * as storage from '../utils/storage';

interface FavoriteListProps {
  favorites: Favorite[];
  tags: Tag[];
  selectedTags: string[];
  onLoadFavorite: (id: string) => void;
  onRemoveFavorite: (id: string) => void;
  onToggleTag: (favoriteId: string, tagId: string) => void;
  onToggleTagSelection: (tagId: string) => void;
  onClearTagSelection: () => void;
  onAddFavorite: (text: string, tagIds?: string[]) => void;
  onManageTags: () => void;
  currentText: string;
}

const FavoriteList: React.FC<FavoriteListProps> = ({
  favorites,
  tags,
  selectedTags,
  onLoadFavorite,
  onRemoveFavorite,
  onToggleTag,
  onToggleTagSelection,
  onClearTagSelection,
  onAddFavorite,
  onManageTags,
  currentText
}) => {
  // 數據規範化 - 確保每個收藏項目都有正確的數據結構
  const normalizedFavorites: Favorite[] = favorites.map((fav: any) => {
    // 檢查是否存在 tagIds
    if (!fav.tagIds) {
      // 如果有 tags 字段且是數組，將其用作 tagIds
      if (Array.isArray(fav.tags)) {
        return {
          ...fav,
          tagIds: fav.tags
        };
      }
      // 兩個字段都不存在或格式不正確，使用空數組
      return {
        ...fav,
        tagIds: []
      };
    }
    
    // 確保 tagIds 是數組
    if (!Array.isArray(fav.tagIds)) {
      return {
        ...fav,
        tagIds: []
      };
    }
    
    // 已經符合要求，直接返回
    return fav;
  });
  
  // 添加列表展開/收起狀態
  const [isExpanded, setIsExpanded] = useState<boolean>(() => storage.getCardExpandStates().favoriteList);
  
  // 追踪當前正在編輯標籤的收藏項目
  const [editingTagsFavoriteId, setEditingTagsFavoriteId] = useState<string | null>(null);
  
  // 控制標籤選擇模態框的顯示
  const [showTagSelector, setShowTagSelector] = useState<boolean>(false);
  
  // 控制數據表格展開/收起狀態
  const [isDataTableExpanded, setIsDataTableExpanded] = useState<boolean>(false);
  
  // 編輯中的數據項
  const [editingData, setEditingData] = useState<{id: string; field: string; value: any} | null>(null);
  
  // 文件上傳引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 對標籤按創建日期排序，最新的放在最前面
  const sortedTags = [...tags].sort((a, b) => {
    const createdAtA = typeof a.createdAt === 'number' ? a.createdAt : 0;
    const createdAtB = typeof b.createdAt === 'number' ? b.createdAt : 0;
    return createdAtB - createdAtA; // 降序排列，最新的在前
  });
  
  // 獲取帶標籤篩選的收藏列表
  const getFilteredFavorites = () => {
    if (selectedTags.length === 0) {
      return normalizedFavorites;
    }
    
    return normalizedFavorites.filter(fav => 
      selectedTags.some(tagId => fav.tagIds.includes(tagId))
    );
  };
  
  const filteredFavorites = getFilteredFavorites();
  
  // 保存展開狀態
  const handleExpandToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    storage.saveCardExpandState('favoriteList', newState);
  };
  
  // 切換數據表格展開/收起狀態
  const toggleDataTableExpanded = () => {
    setIsDataTableExpanded(!isDataTableExpanded);
  };
  
  // 開啟標籤選擇器
  const openTagSelector = (favoriteId: string) => {
    setEditingTagsFavoriteId(favoriteId);
    setShowTagSelector(true);
  };
  
  // 關閉標籤選擇器
  const closeTagSelector = () => {
    setShowTagSelector(false);
    setEditingTagsFavoriteId(null);
  };
  
  // 獲取當前正在編輯的收藏項目
  const getCurrentFavorite = () => {
    if (!editingTagsFavoriteId) return null;
    return normalizedFavorites.find(fav => fav.id === editingTagsFavoriteId);
  };
  
  // 處理標籤點擊
  const handleTagClick = (tagId: string) => {
    if (editingTagsFavoriteId) {
      onToggleTag(editingTagsFavoriteId, tagId);
    }
  };
  
  // 格式化時間戳為可讀字符串
  const formatTimestamp = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      return "無效日期";
    }
  };
  
  // 獲取標籤名稱
  const getTagName = (tagId: string) => {
    const tag = tags.find(t => t.tagId === tagId);
    return tag ? tag.name : tagId;
  };
  
  // 處理單元格編輯開始
  const handleEditStart = (id: string, field: string, value: any) => {
    setEditingData({ id, field, value });
  };
  
  // 處理單元格編輯變更
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingData) return;
    
    setEditingData({
      ...editingData,
      value: e.target.value
    });
  };
  
  // 處理單元格編輯完成
  const handleEditComplete = () => {
    if (!editingData) return;
    
    // 找到要編輯的收藏項
    const updatedFavorites = normalizedFavorites.map(fav => {
      if (fav.id === editingData.id) {
        // 根據不同欄位進行更新
        if (editingData.field === 'text') {
          return { ...fav, text: editingData.value };
        }
        // 其他欄位可以根據需要添加
      }
      return fav;
    });
    
    // 更新收藏夾
    storage.saveFavorites(updatedFavorites);
    
    // 清除編輯狀態
    setEditingData(null);
  };
  
  // 複製表格數據到剪貼板
  const copyTableToClipboard = () => {
    const headers = ['ID', '文本內容', '標籤IDs', '創建時間'];
    const rows = filteredFavorites.map(fav => [
      fav.id,
      fav.text,
      fav.tagIds.join(','),
      formatTimestamp(fav.createdAt)
    ]);
    
    // 組合成表格格式
    const tableData = [headers, ...rows].map(row => row.join('\t')).join('\n');
    
    // 複製到剪貼板
    navigator.clipboard.writeText(tableData)
      .then(() => {
        alert('表格數據已複製到剪貼板');
      })
      .catch(err => {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動選擇並複製');
      });
  };
  
  // 準備CSV數據
  const prepareCSVData = () => {
    // 創建包含所有數據的對象
    const exportData = {
      favorites: normalizedFavorites,
      tags: tags
    };
    
    // 轉換為JSON字符串
    return JSON.stringify(exportData, null, 2);
  };
  
  // 匯出CSV文件
  const exportToCSV = () => {
    try {
      // 準備JSON數據
      const jsonData = prepareCSVData();
      
      // 創建Blob對象
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // 創建下載鏈接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      a.href = url;
      a.download = `pronunciation-data-${timestamp}.json`;
      
      // 觸發下載
      document.body.appendChild(a);
      a.click();
      
      // 清理
      window.setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
      
      alert('數據已成功匯出');
    } catch (err) {
      console.error('匯出失敗:', err);
      alert(`匯出失敗: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // 觸發文件選擇器
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // 處理文件上傳
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonData = JSON.parse(event.target?.result as string);
        
        // 驗證數據格式
        if (!jsonData.favorites || !Array.isArray(jsonData.favorites) ||
            !jsonData.tags || !Array.isArray(jsonData.tags)) {
          throw new Error('無效的數據格式，請使用正確匯出的JSON文件');
        }
        
        // 確認導入
        if (window.confirm(`確定要導入數據嗎？這將會覆蓋當前的${jsonData.favorites.length}個收藏和${jsonData.tags.length}個標籤。`)) {
          // 處理標籤數據
          const importedTags = jsonData.tags.map((tag: any) => ({
            tagId: tag.tagId || String(tag.id) || String(Date.now()),
            name: tag.name || '未命名標籤',
            color: tag.color || '#' + Math.floor(Math.random()*16777215).toString(16),
            createdAt: tag.createdAt || Date.now()
          }));
          
          // 處理收藏數據
          const importedFavorites = jsonData.favorites.map((fav: any) => ({
            id: fav.id || String(Date.now()),
            text: fav.text || '',
            tagIds: Array.isArray(fav.tagIds) ? fav.tagIds : (Array.isArray(fav.tags) ? fav.tags : []),
            createdAt: fav.createdAt || Date.now()
          }));
          
          // 更新數據
          storage.saveTags(importedTags);
          storage.saveFavorites(importedFavorites);
          
          // 重新加載頁面以應用更改
          alert('數據已成功匯入，頁面將重新加載以應用更改');
          window.location.reload();
        }
      } catch (err) {
        console.error('匯入失敗:', err);
        alert(`匯入失敗: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    reader.readAsText(file);
    
    // 重置文件輸入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div>
      {!isExpanded && (
        <h3 
          className="section-header special-title" 
          onClick={handleExpandToggle}
          style={{ cursor: 'pointer' }}
        >
          我的最愛
        </h3>
      )}
      
      {isExpanded && (
        <>
          {/* 標籤篩選區 */}
          <div className="tag-controls">
            <button
              onClick={onClearTagSelection}
              className={`tag-button ${selectedTags.length === 0 ? 'active' : ''}`}
            >
              全部
            </button>
            
            {sortedTags.map(tag => (
              <button
                key={tag.tagId}
                onClick={() => onToggleTagSelection(tag.tagId)}
                className={`tag-button ${selectedTags.includes(tag.tagId) ? 'active' : ''}`}
                style={{
                  background: selectedTags.includes(tag.tagId) ? tag.color : '',
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
          
          {/* 收藏列表 */}
          {normalizedFavorites.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {filteredFavorites.map((fav) => (
                <li 
                  key={fav.id} 
                  style={{
                    background: "rgba(44, 44, 48, 0.5)", 
                    padding: "12px", 
                    borderRadius: "12px", 
                    marginBottom: "10px", 
                    display: "flex", 
                    flexDirection: "column",
                    border: "1px solid var(--ios-border)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span 
                      onClick={() => onLoadFavorite(fav.id)} 
                      style={{ cursor: "pointer", flexGrow: 1, marginRight: 8, color: "#eee", fontSize: 16 }}
                    >
                      {fav.text}
                    </span>
                    <button 
                      onClick={() => onRemoveFavorite(fav.id)} 
                      className="btn-delete"
                      title="刪除"
                    >
                      <span>×</span>
                    </button>
                  </div>
                  
                  {/* 標籤展示 */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {sortedTags
                      .filter(tag => fav.tagIds.includes(tag.tagId))
                      .map(tag => (
                        <span
                          key={tag.tagId}
                          onClick={() => onToggleTag(fav.id, tag.tagId)}
                          style={{
                            padding: "2px 6px",
                            background: tag.color,
                            color: "#fff",
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: "pointer"
                          }}
                        >
                          {tag.name} ✓
                        </span>
                      ))}
                    
                    {/* 添加標籤按鈕 */}
                    {sortedTags
                      .filter(tag => !fav.tagIds.includes(tag.tagId))
                      .slice(0, 3) // 只顯示前3個未添加的標籤
                      .map(tag => (
                        <span
                          key={tag.tagId}
                          onClick={() => onToggleTag(fav.id, tag.tagId)}
                          style={{
                            padding: "2px 6px",
                            background: "#444",
                            color: "#ccc",
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: "pointer"
                          }}
                        >
                          + {tag.name}
                        </span>
                      ))}
                    
                    {/* 更多標籤選項 */}
                    {sortedTags.filter(tag => !fav.tagIds.includes(tag.tagId)).length > 3 && (
                      <span
                        style={{
                          padding: "2px 6px",
                          background: "#333",
                          color: "#aaa",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer"
                        }}
                        onClick={() => openTagSelector(fav.id)}
                      >
                        +{sortedTags.filter(tag => !fav.tagIds.includes(tag.tagId)).length - 3} 更多...
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            // 收藏列表為空時顯示提示
            <div style={{ 
              padding: "16px", 
              background: "rgba(44, 44, 48, 0.5)", 
              borderRadius: "12px", 
              color: "var(--ios-text-secondary)",
              textAlign: "center",
              border: "1px solid var(--ios-border)"
            }}>
              還沒有收藏的句子，請使用文本輸入框右下方的星號按鈕(★)添加
            </div>
          )}
          
          {/* 數據表格區域 */}
          <div style={{ marginTop: "20px" }}>
            <h4 
              onClick={toggleDataTableExpanded} 
              style={{ 
                cursor: "pointer", 
                display: "flex", 
                alignItems: "center",
                fontSize: "16px",
                color: "var(--ios-primary)",
                marginBottom: "8px",
                userSelect: "none"
              }}
            >
              <span style={{ 
                display: "inline-block", 
                width: "18px", 
                height: "18px", 
                textAlign: "center", 
                lineHeight: "16px", 
                marginRight: "6px",
                borderRadius: "50%",
                background: "var(--ios-primary)",
                color: "#fff"
              }}>
                {isDataTableExpanded ? "-" : "+"}
              </span>
              匯出數據表
            </h4>
            
            {isDataTableExpanded && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{ 
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px"
                }}>
                  <span style={{ color: "var(--ios-text-secondary)", fontSize: "14px" }}>
                    顯示 {filteredFavorites.length} 條記錄
                  </span>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={copyTableToClipboard}
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
                      onClick={exportToCSV}
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
                      onClick={triggerFileInput}
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
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
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
                      {filteredFavorites.map(fav => (
                        <tr key={fav.id} style={{ 
                          borderBottom: "1px solid rgba(100, 100, 110, 0.2)"
                        }}>
                          <td style={{ padding: "8px", whiteSpace: "nowrap", color: "var(--ios-text-secondary)" }}>
                            {fav.id}
                          </td>
                          <td style={{ padding: "8px" }}>
                            {editingData && editingData.id === fav.id && editingData.field === 'text' ? (
                              <input
                                type="text"
                                value={editingData.value}
                                onChange={handleEditChange}
                                onBlur={handleEditComplete}
                                autoFocus
                                style={{
                                  width: "100%",
                                  background: "rgba(60, 60, 70, 0.8)",
                                  border: "1px solid var(--ios-primary)",
                                  color: "#fff",
                                  padding: "4px"
                                }}
                              />
                            ) : (
                              <span 
                                onDoubleClick={() => handleEditStart(fav.id, 'text', fav.text)}
                                style={{ cursor: "pointer" }}
                              >
                                {fav.text}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: "8px", color: "var(--ios-text-secondary)" }}>
                            {fav.tagIds.join(', ')}
                          </td>
                          <td style={{ padding: "8px" }}>
                            {fav.tagIds.map(tagId => getTagName(tagId)).join(', ')}
                          </td>
                          <td style={{ padding: "8px", whiteSpace: "nowrap", color: "var(--ios-text-secondary)" }}>
                            {formatTimestamp(fav.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
      
      {/* 標籤選擇模態框 */}
      {showTagSelector && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000
          }}
          onClick={closeTagSelector}
        >
          <div 
            style={{
              backgroundColor: "var(--ios-card)",
              borderRadius: "12px",
              padding: "16px",
              width: "90%",
              maxWidth: "400px",
              maxHeight: "80vh",
              overflow: "auto"
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 style={{ 
              margin: "0 0 16px 0", 
              color: "var(--ios-text)",
              fontSize: "18px",
              borderBottom: "1px solid var(--ios-border)",
              paddingBottom: "8px"
            }}>
              選擇標籤
            </h3>
            
            <div style={{ 
              display: "flex", 
              flexWrap: "wrap", 
              gap: "8px",
              marginBottom: "16px"
            }}>
              {sortedTags
                .filter(tag => {
                  const currentFav = getCurrentFavorite();
                  return currentFav && !currentFav.tagIds.includes(tag.tagId);
                })
                .map(tag => (
                  <button
                    key={tag.tagId}
                    onClick={() => handleTagClick(tag.tagId)}
                    style={{
                      padding: "6px 12px",
                      background: tag.color,
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px"
                    }}
                  >
                    + {tag.name}
                  </button>
                ))}
            </div>
            
            <div style={{
              display: "flex",
              justifyContent: "flex-end"
            }}>
              <button
                onClick={closeTagSelector}
                style={{
                  padding: "8px 16px",
                  background: "var(--ios-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                完成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteList; 