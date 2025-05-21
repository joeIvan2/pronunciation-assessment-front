import React, { useState, useEffect } from 'react';
import * as storage from '../utils/storage';
import { Tag, Favorite, Word } from '../types/speech';

// 後端API URL，從環境變量獲取或使用默認值
const API_URL = process.env.REACT_APP_AI_PROXY_URL || 'https://pronunciation-ai-server.onrender.com';

interface AIDataProcessorProps {
  favorites: Favorite[];
  tags: Tag[];
  historyRecords: storage.HistoryItem[];
  onUpdateFavorites: (newFavorites: Favorite[]) => void;
  onUpdateTags: (newTags: Tag[]) => void;
  onUpdateHistoryRecords: (newHistoryRecords: storage.HistoryItem[]) => void;
  aiResponse: string | null;
  setAiResponse: (response: string | null) => void;
  onAIResponseReceived: () => void;
}

const AIDataProcessor: React.FC<AIDataProcessorProps> = ({
  favorites,
  tags,
  historyRecords,
  onUpdateFavorites,
  onUpdateTags,
  onUpdateHistoryRecords,
  aiResponse,
  setAiResponse,
  onAIResponseReceived
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(() => {
    const savedPrompt = storage.getAIPrompt();
    return typeof savedPrompt === 'string' ? savedPrompt : '';
  });
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // 定義範例提示句
  const examplePrompts = [
    "請幫我為收藏的句子分類或者創建新的標籤",
    "分析我的發音歷史記錄，幫我用這些字做一個短文",
    "生成3個跟圖片內容句子並添加到我的收藏中",
    "幫我產生1個IELTS等級8分的人會讀到的新科技短文(不要只有一句話)，同時幫我創立一個標籤叫做IELTS8分"
  ];
  
  // 處理範例提示點擊
  const handleExamplePromptClick = (exampleText: string) => {
    setPrompt(exampleText);
    storage.saveAIPrompt(exampleText);
  };
  
  // 自動保存計時器引用
  const autoSaveTimerRef = React.useRef<number | null>(null);

  // 當組件卸載時清理計時器
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearInterval(autoSaveTimerRef.current);
      }
    };
  }, []);

  // 設置定時自動保存 (每3秒)
  useEffect(() => {
    // 清除舊的計時器
    if (autoSaveTimerRef.current !== null) {
      window.clearInterval(autoSaveTimerRef.current);
    }
    
    // 設置新的計時器，定期保存
    autoSaveTimerRef.current = window.setInterval(() => {
      if (typeof prompt === 'string') {
        storage.saveAIPrompt(prompt);
        console.log('自動保存AI提示: ', prompt.substring(0, 20) + (prompt.length > 20 ? '...' : ''));
      }
    }, 3000);
    
    return () => {
      if (autoSaveTimerRef.current !== null) {
        window.clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [prompt]);

  // 當prompt改變時，保存到localStorage
  useEffect(() => {
    if (typeof prompt === 'string') {
      storage.saveAIPrompt(prompt);
    }
  }, [prompt]);

  // 處理提示文字變更，確保始終是字符串
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setPrompt(typeof newValue === 'string' ? newValue : '');
  };
  
  // 處理失去焦點事件，立即保存當前內容
  const handlePromptBlur = () => {
    if (typeof prompt === 'string') {
      storage.saveAIPrompt(prompt);
      console.log('保存AI提示 (失去焦點): ', prompt.substring(0, 20) + (prompt.length > 20 ? '...' : ''));
    }
  };

  // 處理圖片上傳
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files);
      setImages(prev => [...prev, ...newImages]);
      
      // 生成預覽URL
      const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  // 移除上傳的圖片
  const removeImage = (index: number) => {
    // 釋放預覽URL
    URL.revokeObjectURL(previewUrls[index]);
    
    // 從狀態中移除圖片和URL
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 添加一個簡單的 CSS 樣式到 head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      .prompt-example {
        padding: 8px 12px;
        background: var(--ios-card);
        border: 1px solid var(--ios-border);
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        color: var(--ios-primary);
        transition: background-color 0.2s;
      }
      .prompt-example:hover {
        background-color: rgba(0, 122, 255, 0.1);
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // 將數據發送給AI進行處理
  const processDataWithAI = async () => {
    // 確保 prompt 是字符串並且不為空
    const currentPrompt = typeof prompt === 'string' ? prompt : '';
    
    if (!currentPrompt.trim()) {
      setError('請輸入指導AI的提示文字');
      return;
    }

    setIsLoading(true);
    setError(null);
    // 不要清空之前的 aiResponse，只有在收到新響應時才會更新
    // setAiResponse(null);

    try {
      // 準備發送給AI的數據
      const formData = new FormData();
      
      // 只使用最新的3條發音記錄
      const latestHistoryRecords = [...historyRecords].sort((a, b) => 
        (b.timestamp || 0) - (a.timestamp || 0)
      ).slice(0, 3);
      
      // 過濾 historyRecords，將 words 只保留單字層級（去除 Phonemes）
      const filteredHistoryRecords = latestHistoryRecords.map(item => {
        if (!item.words || !Array.isArray(item.words)) return item;
        return {
          ...item,
          words: item.words.map((w: any) => {
            // 僅保留 Word 和 PronunciationAssessment
            const { Word, PronunciationAssessment } = w;
            return { Word, PronunciationAssessment };
          })
        };
      });
      const jsonData = JSON.stringify({
        favorites: favorites,
        tags: tags,
        historyRecords: filteredHistoryRecords,
        prompt: currentPrompt
      });
      formData.append('data', jsonData);
      
      // 添加圖片（如果有）
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });

      // 發送請求到後端
      const response = await fetch(`${API_URL}/process-data`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`AI服務請求失敗: ${response.statusText}`);
      }

      const data = await response.json();
      setAiResponse(JSON.stringify(data, null, 2));
      
      // 通知父组件收到了AI响应
      onAIResponseReceived();

      // 驗證收到的數據結構
      let isValid = true;
      
      // 驗證 favorites
      if (data.favorites) {
        if (!Array.isArray(data.favorites)) {
          console.error('解析錯誤-favorites不是陣列');
          isValid = false;
        } else {
          // 檢查每個favorite項目
          for (let i = 0; i < data.favorites.length; i++) {
            const fav = data.favorites[i];
            if (!fav.id || typeof fav.id !== 'string') {
              console.error(`解析錯誤-favorites[${i}]缺少有效id`);
              isValid = false;
              break;
            }
            if (!fav.text || typeof fav.text !== 'string') {
              console.error(`解析錯誤-favorites[${i}]缺少有效text`);
              isValid = false;
              break;
            }
            // 支持 tagIds 或 tags 欄位
            if (!fav.tagIds && !fav.tags) {
              console.warn(`警告-favorites[${i}]缺少tagIds或tags，設置為空數組`);
              fav.tagIds = [];
            } else if (fav.tags && !fav.tagIds) {
              // 將 tags 轉換為 tagIds
              console.log(`修正-favorites[${i}]使用tags欄位，轉換為tagIds`);
              fav.tagIds = Array.isArray(fav.tags) ? fav.tags : [];
            }
            
            // 確保 tagIds 是陣列
            if (fav.tagIds && !Array.isArray(fav.tagIds)) {
              console.error(`解析錯誤-favorites[${i}].tagIds不是陣列，設置為空數組`);
              fav.tagIds = [];
            }
            
            if (!fav.createdAt || typeof fav.createdAt !== 'number') {
              console.error(`解析錯誤-favorites[${i}]缺少有效createdAt`);
              isValid = false;
              break;
            }
          }
        }
      }
      
      // 驗證 tags
      if (data.tags) {
        if (!Array.isArray(data.tags)) {
          console.error('解析錯誤-tags不是陣列');
          isValid = false;
        } else {
          // 檢查每個tag項目
          for (let i = 0; i < data.tags.length; i++) {
            const tag = data.tags[i];
            if (!tag.tagId || typeof tag.tagId !== 'string') {
              console.error(`解析錯誤-tags[${i}]缺少有效tagId`);
              isValid = false;
              break;
            }
            if (!tag.name || typeof tag.name !== 'string') {
              console.error(`解析錯誤-tags[${i}]缺少有效name`);
              isValid = false;
              break;
            }
            if (!tag.color || typeof tag.color !== 'string') {
              console.error(`解析錯誤-tags[${i}]缺少有效color`);
              isValid = false;
              break;
            }
            if (!tag.createdAt || typeof tag.createdAt !== 'number') {
              console.error(`解析錯誤-tags[${i}]缺少有效createdAt`);
              isValid = false;
              break;
            }
          }
        }
      }
      
      // API 返回中不會包含 historyRecords，不再進行驗證
      
      // 處理AI返回的數據，只有在資料驗證通過的情況下才更新
      if (isValid) {
        if (data.favorites) {
          // 兼容後端可能返回的 tags 欄位 (陣列) 而非 tagIds
          const normalizedFavorites = (data.favorites as any[]).map((fav) => {
            if (!fav.tagIds && fav.tags) {
              // 將 tags 改名為 tagIds
              return {
                ...fav,
                tagIds: Array.isArray(fav.tags) ? fav.tags : [],
              };
            }
            return fav;
          });
          
          // 根據創建時間排序，最新的排在前面
          const sortedFavorites = [...normalizedFavorites].sort((a, b) => {
            // 確保 createdAt 是數字類型，如果不是則使用默認值
            const createdAtA = typeof a.createdAt === 'number' ? a.createdAt : 0;
            const createdAtB = typeof b.createdAt === 'number' ? b.createdAt : 0;
            return createdAtB - createdAtA; // 降序排列，最新的在前
          });
          
          onUpdateFavorites(sortedFavorites);
          storage.saveFavorites(sortedFavorites);
        }

        if (data.tags) {
          onUpdateTags(data.tags);
          storage.saveTags(data.tags);
        }

        // API 返回中不會包含 historyRecords，不再進行更新
      } else {
        console.error('資料驗證失敗，保留原始數據');
      }

    } catch (err) {
      console.error('AI處理數據失敗:', err);
      setError(`AI處理數據失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
      // 不清空 prompt，保留原始指令
      // setPrompt('');
    }
  };

  return (
    <div className="card-section">
      
      
      <div style={{ 
        background: "var(--ios-card)", 
        padding: "12px", 
        borderRadius: "12px",
        marginBottom: "16px",
        fontSize: "14px",
        color: "var(--ios-text-secondary)"
      }}>
        將你的收藏、標籤和歷史紀錄發送給AI，獲取智能建議和整理。還可以上傳相關圖片供AI分析。
        <p>注意：如果想依照發音準確度產生句子，資料來源僅為最新三條發音紀錄。</p>
      </div>
      
      {/* 範例提示區域 */}
      <div style={{ marginBottom: "16px" }}>
        <p style={{ 
          marginBottom: "8px", 
          color: "var(--ios-text-secondary)",
          fontSize: "14px"
        }}>
          範例提示：
        </p>
        <div style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "8px"
        }}>
          {examplePrompts.map((text, index) => (
            <div 
              key={index}
              onClick={() => handleExamplePromptClick(text)}
              className="prompt-example"
            >
              {text}
            </div>
          ))}
        </div>
      </div>
      
      <div className="input-container">
        <textarea
          value={prompt || ''}
          onChange={handlePromptChange}
          onBlur={handlePromptBlur}
          className="textarea-input"
          placeholder="請輸入指導AI的提示，例如: '幫我整理我的最愛，將相似的內容分組，並創建新的標籤'"
          style={{ height: "100px", marginBottom: "16px" }}
        />
      </div>
      
      {/* 圖片上傳區域 */}
      <div style={{ marginBottom: "16px" }}>
        <p style={{ marginBottom: "8px", color: "var(--ios-text-secondary)" }}>
          添加圖片（可選）:
        </p>
        
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{ display: "none" }}
          id="image-upload"
        />
        
        <label htmlFor="image-upload" style={{
          display: "inline-block",
          padding: "8px 16px",
          background: "var(--ios-card)",
          color: "var(--ios-primary)",
          border: "1px solid var(--ios-primary)",
          borderRadius: "12px",
          cursor: "pointer",
          marginBottom: "8px"
        }}>
          選擇圖片
        </label>
        
        {/* 圖片預覽區域 */}
        {previewUrls.length > 0 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "8px"
          }}>
            {previewUrls.map((url, index) => (
              <div key={index} style={{
                position: "relative",
                width: "100px",
                height: "100px"
              }}>
                <img
                  src={url}
                  alt={`上傳圖片 ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: "8px"
                  }}
                />
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "rgba(0, 0, 0, 0.5)",
                    color: "white",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px"
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="button-controls">
        <button
          onClick={processDataWithAI}
          disabled={isLoading || !prompt.trim()}
          className="btn btn-primary"
          style={{ opacity: isLoading || !prompt.trim() ? 0.55 : 1, cursor: isLoading || !prompt.trim() ? "not-allowed" : "pointer" }}
        >
          {isLoading ? "處理中..." : "發送給AI助手"}
        </button>
      </div>
      
      {error && (
        <div className="error-message" style={{ marginTop: "16px" }}>
          <p>{error}</p>
        </div>
      )}
      
      {aiResponse && (
        <div style={{ marginTop: "16px" }}>
          <h4 className="section-header">AI 回應</h4>
          <div style={{
            background: "var(--ios-card)",
            padding: "12px",
            borderRadius: "12px",
            fontSize: "14px",
            maxHeight: "300px",
            overflow: "auto",
            whiteSpace: "pre-wrap",
            color: "var(--ios-text)"
          }}>
            {(() => {
              try {
                const parsedResponse = JSON.parse(aiResponse);
                return (
                  <>
                    <div style={{ marginBottom: "8px" }}>
                      {parsedResponse.message || "無回應訊息"}
                    </div>
                    {parsedResponse.processedAt && (
                      <div style={{ 
                        fontSize: "12px", 
                        color: "var(--ios-text-secondary)",
                        textAlign: "right" 
                      }}>
                        {new Date(parsedResponse.processedAt).toLocaleString()}
                      </div>
                    )}
                  </>
                );
              } catch (e) {
                // 如果解析失敗，顯示原始回應
                return aiResponse;
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDataProcessor; 