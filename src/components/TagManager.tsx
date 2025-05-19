import React, { useState } from 'react';
import { Tag } from '../types/speech';
import '../styles/PronunciationAssessment.css';

interface TagManagerProps {
  tags: Tag[];
  onAddTag: (name: string, color?: string) => string;
  onEditTag: (id: string, newName: string, newColor?: string) => void;
  onDeleteTag: (id: string) => void;
  onClose: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ 
  tags, 
  onAddTag, 
  onEditTag, 
  onDeleteTag, 
  onClose 
}) => {
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState<string>('');

  return (
    <div className="card-section">
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 className="section-header"><span className="icon">⚙️</span> 管理標籤</h3>
        <button 
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "#999", cursor: "pointer", fontSize: "16px" }}
        >
          X
        </button>
      </div>
      
      {/* 添加新标签 */}
      <div style={{ marginBottom: 16, background: "#23272f", padding: 12, borderRadius: 4 }}>
        <h4 style={{ color: "#4cafef", margin: "0 0 8px 0" }}>{editingTagId ? "編輯標籤" : "添加新標籤"}</h4>
        <div style={{ display: "flex", gap: 8 }}>
          <input 
            type="text" 
            placeholder="標籤名稱..." 
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            style={{ 
              padding: 8, 
              borderRadius: 4, 
              border: "1px solid #444", 
              background: "#1a1e25", 
              color: "#fff", 
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
              background: "#4caf50", 
              color: "#fff", 
              border: "none", 
              borderRadius: 4, 
              cursor: "pointer" 
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
                background: "#e53935", 
                color: "#fff", 
                border: "none", 
                borderRadius: 4, 
                cursor: "pointer" 
              }}
            >
              取消
            </button>
          )}
        </div>
      </div>
      
      {/* 标签列表 */}
      <div>
        <h4 style={{ color: "#4cafef", margin: "0 0 8px 0" }}>現有標籤</h4>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {tags.map(tag => (
            <li 
              key={tag.id} 
              style={{
                padding: 8,
                background: "#23272f",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 4,
                borderRadius: 4,
                border: "1px solid #333"
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
                <span>{tag.name}</span>
                <span style={{ color: "#777", marginLeft: 8, fontSize: 12 }}>ID: {tag.id}</span>
              </div>
              <div>
                <button
                  onClick={() => {
                    setEditingTagId(tag.id);
                    setNewTagName(tag.name);
                  }}
                  style={{ 
                    background: "#2196f3", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 4, 
                    padding: "4px 8px",
                    marginRight: 4,
                    cursor: "pointer"
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
                    background: "#e53935", 
                    color: "#fff", 
                    border: "none", 
                    borderRadius: 4, 
                    padding: "4px 8px",
                    cursor: "pointer"
                  }}
                >
                  刪除
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TagManager; 