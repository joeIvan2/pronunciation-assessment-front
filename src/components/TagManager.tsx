import React, { useState } from 'react';
import { Tag } from '../types/speech';
import '../styles/PronunciationAssessment.css';

interface TagManagerProps {
  tags: Tag[];
  onAddTag: (name: string, color?: string) => string;
  onEditTag: (tagId: string, newName: string, newColor?: string) => void;
  onDeleteTag: (tagId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ 
  tags, 
  onAddTag, 
  onEditTag, 
  onDeleteTag, 
  isExpanded,
  onToggleExpand
}) => {
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState<string>('');

  return (
    <div>
      {!isExpanded && (
        <h3 
          className="section-header special-title tag-manager-header"
          onClick={onToggleExpand}
        >
          管理標籤
        </h3>
      )}
      
      {isExpanded && (
        <>
          {/* 新增新標籤 */}
          <div className="tag-manager-container">
            <h4 className="tag-manager-title">
              {editingTagId ? "編輯標籤" : "新增新標籤"}
            </h4>
            <div className="tag-manager-input-row">
              <input 
                type="text" 
                placeholder="標籤名稱..." 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="tag-manager-input"
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
                className="tag-manager-button"
              >
                {editingTagId ? "更新" : "新增"}
              </button>
              
              {editingTagId && (
                <button 
                  onClick={() => {
                    setEditingTagId(null);
                    setNewTagName('');
                  }} 
                  className="tag-manager-button tag-manager-cancel"
                >
                  取消
                </button>
              )}
            </div>
          </div>
          
          {/* 標籤列表 */}
          <div>
            <h4 className="tag-manager-title">現有標籤</h4>
            <ul className="tag-manager-list">
              {tags.map(tag => (
                <li 
                  key={tag.tagId} 
                  className="tag-manager-list-item"
                >
                  <div className="tag-manager-item-info">
                    <span 
                      className="tag-manager-color-dot"
                      style={{ backgroundColor: tag.color }}
                    ></span>
                    <span className="tag-manager-item-name">{tag.name}</span>
                    <span className="tag-manager-item-id">ID: {tag.tagId}</span>
                  </div>
                  <div className="tag-manager-item-actions">
                    <button
                      onClick={() => {
                        setEditingTagId(tag.tagId);
                        setNewTagName(tag.name);
                      }}
                      className="tag-manager-action-button"
                    >
                      編輯
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`確定要刪除標籤 "${tag.name}" 嗎？`)) {
                          onDeleteTag(tag.tagId);
                        }
                      }}
                      className="tag-manager-action-button tag-manager-delete"
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
    </div>
  );
};

export default TagManager; 