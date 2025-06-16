import React, { useState, useEffect } from 'react';
import { Favorite, Tag } from '../types/speech';
import '../styles/PronunciationAssessment.css';
import * as storage from '../utils/storage';
import ShareData from './ShareData';

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
  lastAddedFavoriteId?: string | null;
  highlightedFavoriteId?: string | null;
  user?: any;
  onLoginRequired?: (actionName: string, message?: string) => void;
  onAddTag: (name: string, color?: string) => string;
  onEditTag: (tagId: string, newName: string, newColor?: string) => void;
  onDeleteTag: (tagId: string) => void;
  onDataImported?: (newTags: Tag[], newFavorites: Favorite[]) => void;
  onClearAllFavorites?: () => void;
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
  currentText,
  lastAddedFavoriteId,
  highlightedFavoriteId,
  user,
  onLoginRequired,
  onAddTag,
  onEditTag,
  onDeleteTag,
  onDataImported,
  onClearAllFavorites
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
  
  // 移除展開/收起狀態，直接展開
  
  // 子TAB狀態
  const [activeSubTab, setActiveSubTab] = useState<'sentences' | 'tags' | 'share'>('sentences');
  
  // 標籤管理狀態
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState<string>('');
  
  // 追踪當前正在編輯標籤的收藏項目
  const [editingTagsFavoriteId, setEditingTagsFavoriteId] = useState<string | null>(null);
  
  // 控制標籤選擇模態框的顯示
  const [showTagSelector, setShowTagSelector] = useState<boolean>(false);
  
  // 控制數據表格展開/收起狀態
  // 移除 isDataTableExpanded 狀態 - 匯出功能已移動到分享與備份標籤
  
  // 編輯中的數據項
  const [editingData, setEditingData] = useState<{id: string; field: string; value: any} | null>(null);
  
  // 搜尋狀態
  const [searchText, setSearchText] = useState<string>('');
  const [searchHighlightId, setSearchHighlightId] = useState<string | null>(null);
  
  // 移除匯出相關引用 - 匯出功能已移動到分享與備份標籤
  
  // 對標籤按創建日期排序，最新的放在最前面
  const sortedTags = [...tags].sort((a, b) => {
    const createdAtA = typeof a.createdAt === 'number' ? a.createdAt : 0;
    const createdAtB = typeof b.createdAt === 'number' ? b.createdAt : 0;
    return createdAtB - createdAtA; // 降序排列，最新的在前
  });
  
  // 排序用 collator（模組頂層）
  const collator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: 'base',
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

  // 搜尋功能
  const handleSearch = (searchValue: string) => {
    setSearchText(searchValue);
    
    if (!searchValue.trim()) {
      setSearchHighlightId(null);
      return;
    }
    
    // 先切換到全部標籤
    onClearTagSelection();
    
    // 搜尋匹配的句子
    const foundFavorite = normalizedFavorites.find(fav => 
      fav.text.toLowerCase().includes(searchValue.toLowerCase())
    );
    
    if (foundFavorite) {
      setSearchHighlightId(foundFavorite.id);
      
      // 滾動到找到的句子並高亮
      setTimeout(() => {
        const itemElement = document.getElementById(`favorite-item-${foundFavorite.id}`);
        if (itemElement) {
          itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 添加搜尋高亮效果
          itemElement.style.animation = 'searchHighlight 2s';
          
          // 動畫結束後移除動畫屬性
          setTimeout(() => {
            if (itemElement) {
              itemElement.style.animation = '';
              setSearchHighlightId(null);
            }
          }, 2000);
        }
      }, 100);
    } else {
      setSearchHighlightId(null);
      alert('未找到匹配的句子');
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
        // 其他欄位可以根據需要新增
      }
      return fav;
    });
    
    // 更新收藏夾
    storage.saveFavorites(updatedFavorites);
    
    // 清除編輯狀態
    setEditingData(null);
    
    // 重新加載頁面以應用更改
    window.location.reload();
  };
  
  // 移除所有匯出相關函數 - 匯出功能已移動到分享與備份標籤
  
  // 用於跟踪已經滾動過的項目ID
  const [scrolledItemId, setScrolledItemId] = useState<string | null>(null);
  
  // 處理自動滾動到新新增的收藏項目
  useEffect(() => {
    if (lastAddedFavoriteId && lastAddedFavoriteId !== scrolledItemId) {
      const itemElement = document.getElementById(`favorite-item-${lastAddedFavoriteId}`);
      if (itemElement) {
        // 使用setTimeout確保在DOM更新後滾動
        setTimeout(() => {
          itemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 新增高亮效果
          itemElement.style.animation = 'highlightFavorite 2s';
          setScrolledItemId(lastAddedFavoriteId);
          
          // 動畫結束後移除動畫屬性
          setTimeout(() => {
            if (itemElement) {
              itemElement.style.animation = '';
            }
          }, 2000);
        }, 100);
      }
    }
  }, [lastAddedFavoriteId, scrolledItemId]);
  
  // 清空所有收藏
  const handleClearAllFavorites = async () => {
    if (!user || !user.uid) {
      alert('請先登入才能清空收藏');
      return;
    }
    if (!window.confirm('確定要清空所有收藏句子嗎？此操作無法復原。')) return;
    try {
      if (onClearAllFavorites) {
        await onClearAllFavorites();
      }
      alert('已清空所有收藏！');
    } catch (e) {
      alert('清空失敗，請檢查網路或稍後再試。');
    }
  };
  
  return (
    <div>
      {/* 移除標題 */}
      
      <div>
        {/* 子TAB導航 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ 
              display: "flex", 
              background: "var(--ios-card)", 
              borderRadius: 12,
              border: "1px solid var(--ios-border)",
              overflow: "hidden"
            }}>
              <button
                onClick={() => setActiveSubTab('sentences')}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: activeSubTab === 'sentences' ? 'var(--ios-primary)' : 'transparent',
                  color: activeSubTab === 'sentences' ? '#fff' : 'var(--ios-text)',
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeSubTab === 'sentences' ? 600 : 400,
                  borderRight: "1px solid var(--ios-border)"
                }}
              >
                📝 句子
              </button>
              <button
                onClick={() => setActiveSubTab('tags')}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: activeSubTab === 'tags' ? 'var(--ios-primary)' : 'transparent',
                  color: activeSubTab === 'tags' ? '#fff' : 'var(--ios-text)',
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeSubTab === 'tags' ? 600 : 400,
                  borderRight: "1px solid var(--ios-border)"
                }}
              >
                🏷️ 標籤
              </button>
              <button
                onClick={() => setActiveSubTab('share')}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: activeSubTab === 'share' ? 'var(--ios-primary)' : 'transparent',
                  color: activeSubTab === 'share' ? '#fff' : 'var(--ios-text)',
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: activeSubTab === 'share' ? 600 : 400
                }}
              >
                🔗 分享與備份
              </button>
            </div>
          </div>
          
          {/* 句子TAB內容 */}
          {activeSubTab === 'sentences' && (
            <>
    
              {/* 新增收藏 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  display: "flex", 
                  gap: 8, 
                  background: "var(--ios-card)", 
                  padding: 12, 
                  borderRadius: 12,
                  border: "1px solid var(--ios-border)"
                }}>
                  <input 
                    type="text" 
                    placeholder="搜尋收藏的句子..." 
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch(searchText);
                      }
                    }}
                    style={{ 
                      padding: 8, 
                      borderRadius: 12, 
                      border: "1px solid var(--ios-border)", 
                      background: "rgba(20, 20, 24, 0.7)", 
                      color: "var(--ios-text)", 
                      flexGrow: 1 
                    }} 
                  />
                  <button 
                    onClick={() => handleSearch(searchText)} 
                    style={{ 
                      padding: "0 12px", 
                      background: "var(--ios-primary)", 
                      color: "var(--ios-text)", 
                      border: "none", 
                      borderRadius: 12, 
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 500
                    }}
                    disabled={!searchText.trim()}
                  >
                    🔍
                  </button>
                  <button 
                    onClick={() => {
                      setSearchText('');
                      setSearchHighlightId(null);
                    }} 
                    style={{ 
                      padding: "0 12px", 
                      background: "var(--ios-secondary)", 
                      color: "var(--ios-text)", 
                      border: "none", 
                      borderRadius: 12, 
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: 500
                    }}
                  >
                    清除
                  </button>
                </div>
              </div>
              
              {/* 標籤篩選 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 8, 
                  marginBottom: 8 
                }}>
                  <button
                    onClick={onClearTagSelection}
                    className={`tag-button ${selectedTags.length === 0 ? 'active' : ''}`}
                    style={{
                      background: selectedTags.length === 0 ? 'var(--ios-primary)' : '',
                    }}
                  >
                    全部
                  </button>
                  <button
                    onClick={handleClearAllFavorites}
                    className={`tag-button`}
                    style={{
                      background: '#d9534f',
                      color: '#fff',
                      marginLeft: 0
                    }}
                    disabled={normalizedFavorites.length === 0}
                  >
                    清空所有句子
                  </button>
                </div>
            
                <div style={{ 
                  display: "flex", 
                  flexWrap: "wrap", 
                  gap: 8 
                }}>
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
          </div>
          
          {/* 收藏列表 */}
          {normalizedFavorites.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {filteredFavorites
                .slice() // 複製一份避免破壞原資料
                .sort((a, b) => collator.compare(String(a.id), String(b.id)))
                .map((fav) => (
                  <li
                    key={fav.id}
                    id={`favorite-item-${fav.id}`}
                    className={`favorite-item ${
                      fav.id === highlightedFavoriteId ? 'favorite-selected' : ''
                    } ${
                      fav.id === searchHighlightId ? 'search-highlighted' : ''
                    }`}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span 
                        onClick={() => onLoadFavorite(fav.id)} 
                        style={{ cursor: "pointer", flexGrow: 1, marginRight: 8, color: "#eee", fontSize: 16 }}
                      >
                        <span style={{ color: '#aaa', marginRight: 4 }}>{fav.id}.</span>{fav.text}
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
                      
                      {/* 新增標籤按鈕 */}
                      {sortedTags
                        .filter(tag => !fav.tagIds.includes(tag.tagId))
                        .slice(0, 3) // 只顯示前3個未新增的標籤
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
              還沒有收藏的句子，請使用文本輸入框右下方的星號按鈕(★)新增
            </div>
          )}
          
              {/* 移除數據表格區域 - 已移動到分享與備份標籤 */}
            </>
          )}
          
          {/* 標籤TAB內容 */}
          {activeSubTab === 'tags' && (
            <>
              {/* 新增新標籤 */}
              <div style={{ 
                marginBottom: 16, 
                background: "var(--ios-card)", 
                padding: 12, 
                borderRadius: 12,
                border: "1px solid var(--ios-border)"
              }}>
                <h4 style={{ 
                  color: "var(--ios-primary)", 
                  margin: "0 0 8px 0",
                  fontSize: 15,
                  fontWeight: 600
                }}>{editingTagId ? "編輯標籤" : "新增新標籤"}</h4>
                <div style={{ display: "flex", gap: 8 }}>
                  <input 
                    type="text" 
                    placeholder="標籤名稱..." 
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    style={{ 
                      padding: 8, 
                      borderRadius: 12, 
                      border: "1px solid var(--ios-border)", 
                      background: "rgba(20, 20, 24, 0.7)", 
                      color: "var(--ios-text)", 
                      flexGrow: 1 
                    }} 
                  />
                  
                  <button 
                    onClick={() => {
                      if (!newTagName.trim()) {
                        alert("請輸入標籤名稱");
                        return;
                      }
                      
                      if (editingTagId) {
                        onEditTag(editingTagId, newTagName);
                        setEditingTagId(null);
                      } else {
                        onAddTag(newTagName);
                      }
                      
                      setNewTagName('');
                    }} 
              style={{ 
                      padding: "0 12px", 
                      background: "var(--ios-success)", 
                      color: "var(--ios-text)", 
                      border: "none", 
                      borderRadius: 12, 
                cursor: "pointer", 
                      fontSize: "13px",
                      fontWeight: 500
                    }}
                  >
                    {editingTagId ? "更新" : "新增"}
                  </button>
                  
                  {editingTagId && (
                    <button
                      onClick={() => {
                        setEditingTagId(null);
                        setNewTagName('');
                      }} 
                      style={{
                        padding: "0 12px", 
                        background: "var(--ios-danger)", 
                        color: "var(--ios-text)", 
                        border: "none",
                        borderRadius: 12, 
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500
                      }}
                    >
                      取消
                    </button>
                  )}
                </div>
              </div>
              
              {/* 標籤列表 */}
              <div>
                <h4 style={{ 
                  color: "var(--ios-primary)", 
                  margin: "0 0 8px 0",
                  fontSize: 15,
                  fontWeight: 600
                }}>現有標籤</h4>
                <ul style={{ listStyle: "none", padding: 0 }}>
                  {tags.map(tag => (
                    <li 
                      key={tag.tagId} 
                      style={{
                        padding: 12,
                        background: "var(--ios-card)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 8,
                        borderRadius: 12,
                        border: "1px solid var(--ios-border)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span style={{ 
                          width: 16, 
                          height: 16, 
                          borderRadius: 16, 
                          background: tag.color,
                          marginRight: 8
                        }}></span>
                        <span style={{ color: "var(--ios-text)" }}>{tag.name}</span>
                        <span style={{ color: "var(--ios-text-secondary)", marginLeft: 8, fontSize: 12 }}>ID: {tag.tagId}</span>
                      </div>
                      <div>
                        <button
                          onClick={() => {
                            setEditingTagId(tag.tagId);
                            setNewTagName(tag.name);
                          }}
                          style={{ 
                            background: "var(--ios-primary)", 
                            color: "var(--ios-text)", 
                            border: "none", 
                            borderRadius: 12, 
                            padding: "4px 8px",
                            marginRight: 4,
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500
                          }}
                        >
                          編輯
                    </button>
                    <button
                          onClick={() => {
                            if (window.confirm(`確定要刪除標籤 "${tag.name}" 嗎？`)) {
                              onDeleteTag(tag.tagId);
                            }
                          }}
                      style={{
                            background: "var(--ios-danger)", 
                            color: "var(--ios-text)", 
                            border: "none", 
                            borderRadius: 12, 
                        padding: "4px 8px",
                            cursor: "pointer",
                            fontSize: "13px",
                            fontWeight: 500
                          }}
                        >
                          刪除
                    </button>
                  </div>
                    </li>
                  ))}
                </ul>
          </div>
        </>
      )}
          
                    {/* 分享與備份TAB內容 */}
          {activeSubTab === 'share' && (
            <ShareData 
              tags={tags} 
              favorites={favorites} 
              user={user}
              onLoginRequired={onLoginRequired}
              onDataImported={onDataImported}
            />
          )}
        </div>
      
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