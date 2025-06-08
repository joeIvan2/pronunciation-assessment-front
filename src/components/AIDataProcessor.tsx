import React, { useState, useEffect } from 'react';
import * as storage from '../utils/storage';
import { Tag, Favorite, Word } from '../types/speech';
import ResizableTextarea from './ResizableTextarea';
import { AI_SERVER_URL } from '../utils/api'; // 從api.ts導入常量

// 後端API URL
const API_URL = AI_SERVER_URL;

// 圖片壓縮函數
const compressImage = (file: File, maxSizeKB: number = 300): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 計算壓縮後的尺寸
      let { width, height } = img;
      const maxDimension = 1200; // 最大邊長
      
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 繪製圖片到canvas
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 嘗試不同的質量設置來達到目標大小
      const tryCompress = (quality: number): void => {
        canvas.toBlob((blob) => {
          if (blob) {
            const sizeKB = blob.size / 1024;
            console.log(`壓縮質量: ${quality}, 大小: ${sizeKB.toFixed(1)}KB`);
            
            if (sizeKB <= maxSizeKB || quality <= 0.1) {
              // 達到目標大小或質量已經很低，創建新的File對象
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              // 繼續降低質量
              tryCompress(Math.max(0.1, quality - 0.1));
            }
          } else {
            resolve(file); // 如果壓縮失敗，返回原文件
          }
        }, 'image/jpeg', quality);
      };
      
      tryCompress(0.8); // 從80%質量開始
    };
    
    img.onerror = () => {
      console.error('圖片載入失敗');
      resolve(file); // 如果載入失敗，返回原文件
    };
    
    img.src = URL.createObjectURL(file);
  });
};

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
  addToFavorites: (text: string | string[]) => void;
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
  onAIResponseReceived,
  addToFavorites
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(() => {
    const savedPrompt = storage.getAIPrompt();
    return typeof savedPrompt === 'string' ? savedPrompt : '';
  });
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  
  // 定義範例提示句
  const examplePrompts = [
    
    "客製化發音糾正：分析我的發音歷史記錄，幫我用這些字做一個短文",
    "虛實轉換，圖生文情境：產生3個跟圖片內容有關的句子",
    "指定英語能力：幫我產生1個IELTS等級8分的人會寫出的短文(不要只有一句話)",
    "指定生活情境：幫我創造在百貨公司腳踏車專櫃，例如購買捷安特登山車情境時會講到的句子，以對話的形式，可以忽略人名，一個情境，5個來回對話句子"
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
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setIsCompressing(true);
      try {
        const newImages = Array.from(e.target.files);
        const compressedImages: File[] = [];
        const newPreviewUrls: string[] = [];

        // 逐一壓縮圖片
        for (const file of newImages) {
          if (file.type.startsWith('image/')) {
            console.log(`開始壓縮圖片: ${file.name}, 原始大小: ${(file.size / 1024).toFixed(1)}KB`);
            const compressedFile = await compressImage(file, 300);
            console.log(`壓縮完成: ${compressedFile.name}, 壓縮後大小: ${(compressedFile.size / 1024).toFixed(1)}KB`);
            
            compressedImages.push(compressedFile);
            newPreviewUrls.push(URL.createObjectURL(compressedFile));
          }
        }

        setImages(prev => [...prev, ...compressedImages]);
        setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      } catch (error) {
        console.error('圖片壓縮失敗:', error);
        setError('圖片壓縮失敗，請重試');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setIsCompressing(true);
      try {
        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        
        if (files.length > 0) {
          const compressedImages: File[] = [];
          const newPreviewUrls: string[] = [];

          // 逐一壓縮圖片
          for (const file of files) {
            console.log(`開始壓縮拖拽圖片: ${file.name}, 原始大小: ${(file.size / 1024).toFixed(1)}KB`);
            const compressedFile = await compressImage(file, 300);
            console.log(`壓縮完成: ${compressedFile.name}, 壓縮後大小: ${(compressedFile.size / 1024).toFixed(1)}KB`);
            
            compressedImages.push(compressedFile);
            newPreviewUrls.push(URL.createObjectURL(compressedFile));
          }

          setImages(prev => [...prev, ...compressedImages]);
          setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
        }
      } catch (error) {
        console.error('拖拽圖片壓縮失敗:', error);
        setError('圖片壓縮失敗，請重試');
      } finally {
        setIsCompressing(false);
      }
      
      e.dataTransfer.clearData();
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

  // 新增一個簡單的 CSS 樣式到 head
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
      .drop-zone {
        border: 2px dashed var(--ios-border);
        border-radius: 8px;
        padding: 12px;
        text-align: center;
        margin-top: 8px;
        margin-bottom: 16px;
      }
      .drop-zone.dragging {
        background-color: rgba(0,0,0,0.05);
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
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
      
      // 只使用最新的10條發音記錄
      const latestHistoryRecords = [...historyRecords].sort((a, b) => 
        (b.timestamp || 0) - (a.timestamp || 0)
      ).slice(0, 10);
      
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
        historyRecords: filteredHistoryRecords,
        prompt: currentPrompt
      });
      formData.append('data', jsonData);
      
      // 新增圖片（如果有）
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
      
      try {
        // 確保只序列化真正需要序列化的數據
        // 檢查數據類型，避免將整個對象序列化後再反序列化 
        if (typeof data === 'object' && data !== null) {
          // 如果是對象，以字符串形式保存
          setAiResponse(JSON.stringify(data, null, 2));
          
          // 處理返回的 favorites 數據，將其新增到用戶的收藏中
          if (data.favorites && Array.isArray(data.favorites)) {
            // 收集所有要新增的文本
            const textsToAdd = data.favorites
              .filter(fav => fav && typeof fav.text === 'string')
              .map(fav => fav.text);
            
            // 如果有文本要新增，將順序反轉後一次性調用 addToFavorites 函數（從最後往前加）
            if (textsToAdd.length > 0) {
              addToFavorites(textsToAdd.reverse());
              // 記錄新增了多少條收藏
              console.log(`已新增 ${textsToAdd.length} 條新收藏（從後往前）`);
            }
          }
        } else {
          // 其他類型直接設置
          setAiResponse(String(data));
        }
        
        // 通知父组件收到了AI响应
        onAIResponseReceived();
      } catch (serializeError) {
        console.error('序列化AI響應失敗:', serializeError);
        setError(`序列化AI響應失敗: ${serializeError instanceof Error ? serializeError.message : String(serializeError)}`);
        // 仍然嘗試通知父組件
        onAIResponseReceived();
      }

      // 驗證收到的數據結構
      let isValid = true;
      
      // 不再驗證 favorites 和 tags，因為我們不再發送和接收這些數據
      
      // API 返回中不會包含 historyRecords，不再進行驗證
      
      // 處理AI返回的數據，只有在資料驗證通過的情況下才更新
      if (isValid) {
        // 由於不再發送favorites和tags，也不再處理它們的回應
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
    <div>
      {/* 將textarea移到最前面 */}
      <div className="input-container">
        <ResizableTextarea
          value={prompt || ''}
          onChange={handlePromptChange}
          onPaste={(e) => {}}
          className="textarea-input"
          placeholder="請描述你希望AI幫你創造的句子，或參考下方例句'"
          storageKey="aiPromptTextareaHeight"
          defaultHeight={100}
          onBlur={handlePromptBlur}
        />
      
        {/* 工具栏控制按钮 */}
        <div className="textarea-toolbar">
          {/* 图片上传按钮 */}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{ display: "none" }}
          id="image-upload"
        />

          <label htmlFor="image-upload" className="control-button" title="新增圖片">
            <i className="fas fa-image"></i>
        </label>
        </div>
      </div>

      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isCompressing && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "8px",
            padding: "8px",
            backgroundColor: "rgba(0, 122, 255, 0.1)",
            borderRadius: "8px"
          }}>
            <div style={{
              width: "16px",
              height: "16px",
              border: "2px solid var(--ios-primary)",
              borderTop: "2px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite"
            }}></div>
            <span style={{ fontSize: "14px", color: "var(--ios-primary)" }}>
              正在壓縮圖片...
            </span>
          </div>
        )}
        
        {previewUrls.length > 0 && (
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "8px"
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
        <span style={{ fontSize: "14px", color: "var(--ios-text-secondary)" }}>
          將圖片拖曳到此或點擊上方按鈕上傳
        </span>
      </div>
      
      {/* 將發送按鈕移到第二位 */}
      <div className="button-controls" style={{ marginBottom: "16px" }}>
        <button
          onClick={processDataWithAI}
          disabled={isLoading || !prompt.trim() || isCompressing}
          className="btn btn-primary"
          style={{ opacity: isLoading || !prompt.trim() || isCompressing ? 0.55 : 1, cursor: isLoading || !prompt.trim() || isCompressing ? "not-allowed" : "pointer" }}
        >
          {isLoading ? "處理中..." : isCompressing ? "圖片壓縮中..." : "發送給AI助理"}
        </button>
      </div>
      
      {error && (
        <div className="error-message" style={{ marginBottom: "16px" }}>
          <p>{error}</p>
        </div>
      )}
      
      {/* 解釋文本區域移到後面 */}
      <div style={{ 
        background: "var(--ios-card)", 
        padding: "12px", 
        borderRadius: "12px",
        marginBottom: "16px",
        fontSize: "14px",
        color: "var(--ios-text-secondary)"
      }}>
        我們除了會將您的指令發送給AI之外，您也可以上傳相關圖片供AI分析，同時我們也會自動將您的發音紀錄發送給AI。
        <p>注意：發音歷史為最新十次發音紀錄。</p>
      </div>
      
      {/* 範例提示區域放到最後 */}
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
              // 安全渲染函數，處理可能的對象
              const renderContent = (content: any): string => {
                if (content === null || content === undefined) {
                  return "無回應訊息";
                }
                if (typeof content === 'string') {
                  return content;
                }
                return JSON.stringify(content, null, 2);
              };
              
              try {
                // 先檢查aiResponse是否已經是對象
                const response = typeof aiResponse === 'string' 
                  ? JSON.parse(aiResponse) 
                  : aiResponse;
                
                return (
                  <>
                    <div style={{ marginBottom: "8px" }}>
                      {renderContent(response.message)}
                    </div>
                    {response.processedAt && (
                      <div style={{ 
                        fontSize: "12px", 
                        color: "var(--ios-text-secondary)",
                        textAlign: "right" 
                      }}>
                        {new Date(response.processedAt).toLocaleString()}
                      </div>
                    )}
                  </>
                );
              } catch (e) {
                // 如果解析失敗或處理過程中出錯，顯示安全處理後的原始回應
                console.error("處理AI回應時出錯:", e);
                return renderContent(aiResponse);
              }
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIDataProcessor; 