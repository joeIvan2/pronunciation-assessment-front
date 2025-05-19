import React from 'react';
import { Favorite, Tag } from '../types/speech';

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
  
  return (
    <div style={{ marginTop: 24, marginBottom: 16 }}>
      <h3 style={{ color: "#4cafef", marginBottom: 8 }}>我的最愛</h3>
      
      {/* 标签筛选区 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
        <button
          onClick={onClearTagSelection}
          style={{
            padding: "4px 8px",
            background: selectedTags.length === 0 ? "#4caf50" : "#333",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: 12,
            cursor: "pointer"
          }}
        >
          全部
        </button>
        
        {tags.map(tag => (
          <button
            key={tag.id}
            onClick={() => onToggleTagSelection(tag.id)}
            style={{
              padding: "4px 8px",
              background: selectedTags.includes(tag.id) ? tag.color : "#333",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              fontSize: 12,
              cursor: "pointer"
            }}
          >
            {tag.name}
          </button>
        ))}
        
        <button
          onClick={onManageTags}
          style={{
            padding: "4px 8px",
            background: "#666",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            fontSize: 12,
            cursor: "pointer"
          }}
        >
          管理標籤
        </button>
      </div>
      
      {/* 添加按钮 */}
      <div style={{ display: "flex", marginBottom: 12 }}>
        <button
          onClick={() => onAddFavorite(currentText)}
          style={{
            padding: "8px 12px",
            background: "#ff9800",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            display: "flex",
            alignItems: "center"
          }}
        >
          <span style={{ marginRight: 4 }}>+</span> 添加當前句子
        </button>
        
        {selectedTags.length > 0 && (
          <div style={{ marginLeft: 12, display: "flex", alignItems: "center" }}>
            <span style={{ color: "#bbb", fontSize: 14 }}>已選標籤:</span>
            {tags
              .filter(tag => selectedTags.includes(tag.id))
              .map(tag => (
                <span
                  key={tag.id}
                  style={{
                    padding: "2px 6px",
                    background: tag.color,
                    color: "#fff",
                    borderRadius: 4,
                    marginLeft: 4,
                    fontSize: 12
                  }}
                >
                  {tag.name}
                </span>
              ))}
          </div>
        )}
      </div>
      
      {/* 收藏列表 */}
      {favorites.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredFavorites.map((fav) => (
            <li 
              key={fav.id} 
              style={{
                background: "#23272f", 
                padding: "12px", 
                borderRadius: 4, 
                marginBottom: 8, 
                display: "flex", 
                flexDirection: "column"
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
                  style={{ 
                    background: "#e53935", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: "50%", 
                    width: 24, 
                    height: 24, 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: 14, 
                    padding: 0 
                  }}
                >
                  X
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
          padding: "12px", 
          background: "#23272f", 
          borderRadius: 4, 
          color: "#bbb",
          textAlign: "center"
        }}>
          還沒有收藏的句子，請使用上方的「添加當前句子」按鈕添加
        </div>
      )}
    </div>
  );
};

export default FavoriteList; 