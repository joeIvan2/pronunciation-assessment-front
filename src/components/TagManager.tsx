import React, { useState } from 'react';
import { Tag } from '../types/speech';
import '../styles/PronunciationAssessment.css';

interface TagManagerProps {
  tags: Tag[];
  onAddTag: (name: string, color?: string) => string;
  onEditTag: (id: string, newName: string, newColor?: string) => void;
  onDeleteTag: (id: string) => void;
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
          className="section-header special-title"
          onClick={onToggleExpand}
          style={{ cursor: 'pointer' }}
        >
          管理標籤
        </h3>
      )}
      
      {isExpanded && (
        <>
          {/* 添加新標籤 */}
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
            }}>{editingTagId ? "編輯標籤" : "添加新標籤"}</h4>
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
                {editingTagId ? "更新" : "添加"}
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
                  key={tag.id} 
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
                    <span style={{ color: "var(--ios-text-secondary)", marginLeft: 8, fontSize: 12 }}>ID: {tag.id}</span>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        setEditingTagId(tag.id);
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
                          onDeleteTag(tag.id);
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
    </div>
  );
};

export default TagManager; 