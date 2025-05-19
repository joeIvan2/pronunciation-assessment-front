import React, { useState, useEffect } from 'react';
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
  // 添加列表展开/收起状态
  const [isExpanded, setIsExpanded] = useState<boolean>(() => storage.getCardExpandStates().favoriteList);
  
  // 获取带标签筛选的收藏列表
  const getFilteredFavorites = () => {
    if (selectedTags.length === 0) {
      return favorites;
    }
    
    return favorites.filter(fav => 
      selectedTags.some(tagId => fav.tagIds.includes(tagId))
    );
  };
  
  const filteredFavorites = getFilteredFavorites();
  
  // 保存展开状态
  const handleExpandToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    storage.saveCardExpandState('favoriteList', newState);
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
          {/* 标签筛选区 */}
          <div className="tag-controls">
            <button
              onClick={onClearTagSelection}
              className={`tag-button ${selectedTags.length === 0 ? 'active' : ''}`}
            >
              全部
            </button>
            
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => onToggleTagSelection(tag.id)}
                className={`tag-button ${selectedTags.includes(tag.id) ? 'active' : ''}`}
                style={{
                  background: selectedTags.includes(tag.id) ? tag.color : '',
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
          
          {/* 收藏列表 */}
          {favorites.length > 0 ? (
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
                      title="删除"
                    >
                      <span>×</span>
                    </button>
                  </div>
                  
                  {/* 标签展示 */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {tags
                      .filter(tag => fav.tagIds.includes(tag.id))
                      .map(tag => (
                        <span
                          key={tag.id}
                          onClick={() => onToggleTag(fav.id, tag.id)}
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
                    
                    {/* 添加标签按钮 */}
                    {tags
                      .filter(tag => !fav.tagIds.includes(tag.id))
                      .slice(0, 3) // 只显示前3个未添加的标签
                      .map(tag => (
                        <span
                          key={tag.id}
                          onClick={() => onToggleTag(fav.id, tag.id)}
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
                    
                    {/* 更多标签选项 */}
                    {tags.filter(tag => !fav.tagIds.includes(tag.id)).length > 3 && (
                      <span
                        style={{
                          padding: "2px 6px",
                          background: "#333",
                          color: "#aaa",
                          borderRadius: 4,
                          fontSize: 12,
                          cursor: "pointer"
                        }}
                        onClick={() => {
                          // 在这里可以实现一个弹出选择更多标签的功能
                          alert("此功能將在未來版本實現！");
                        }}
                      >
                        +{tags.filter(tag => !fav.tagIds.includes(tag.id)).length - 3} 更多...
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
        </>
      )}
    </div>
  );
};

export default FavoriteList; 