import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "../styles/PronunciationAssessment.css";

// 組件導入
import ScoreBar from "../components/ScoreBar";
import WordsDisplay from "../components/WordsDisplay";
import TagManager from "../components/TagManager";
import VoicePicker from "../components/VoicePicker";
import FavoriteList from "../components/FavoriteList";
import HistoryRecord from "../components/HistoryRecord";
import AIDataProcessor from "../components/AIDataProcessor";
import ShareData from "../components/ShareData";
import ResizableTextarea from "../components/ResizableTextarea";

// 鉤子導入
import { useRecorder } from "../hooks/useRecorder";
import { useBackendSpeech } from "../hooks/useBackendSpeech";
import { useAzureSpeech } from "../hooks/useAzureSpeech";

// 工具導入
import * as storage from "../utils/storage";

// 類型導入
import { SpeechAssessmentResult, Favorite, Tag } from "../types/speech";

// 我們在storage.ts中已經更新了TabName類型，所以這裡不需要再定義

const PronunciationAssessment: React.FC = () => {
  // 狀態定義
  const [result, setResult] = useState<SpeechAssessmentResult | null>(null);
  const [strictMode, setStrictMode] = useState<boolean>(() => storage.getStrictMode());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [useBackend, setUseBackend] = useState<boolean>(() => storage.getUseBackend());
  const [error, setError] = useState<string | null>(null);
  
  // Azure設置
  const [azureSettings, setAzureSettings] = useState(() => storage.getAzureSettings());
  const [showAzureSettings, setShowAzureSettings] = useState<boolean>(false);
  
  // 語音設置
  const [isVoiceExpanded, setIsVoiceExpanded] = useState<boolean>(() => storage.getCardExpandStates().voicePicker);
  const [voiceSettings, setVoiceSettings] = useState(() => storage.getVoiceSettings());
  // 新增AI語音設置
  const [selectedAIVoice, setSelectedAIVoice] = useState<string>(() => storage.getAIVoice());
  
  // 標籤系統
  const [isTagExpanded, setIsTagExpanded] = useState<boolean>(() => storage.getCardExpandStates().tagManager);
  const [tags, setTags] = useState<Tag[]>(() => storage.getTags());
  const [nextTagId, setNextTagId] = useState<number>(() => storage.getNextTagId());
  
  // 收藏系統
  const [favorites, setFavorites] = useState<Favorite[]>(() => storage.getFavorites());
  const [nextFavoriteId, setNextFavoriteId] = useState<number>(() => storage.getNextFavoriteId(favorites));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 根据当前選擇的標籤過濾收藏列表
  const filteredFavorites = useMemo(() => {
    if (selectedTags.length === 0) {
      return favorites;
    }
    return favorites.filter(fav =>
      selectedTags.some(tagId => fav.tagIds?.includes(tagId))
    );
  }, [favorites, selectedTags]);
  
  // 文本和界面設置
  const [referenceText, setReferenceText] = useState<string>(() => storage.getReferenceText());
  const [fontSize, setFontSize] = useState<number>(() => storage.getFontSize());
  
  // 歷史記錄狀態
  const [historyRecords, setHistoryRecords] = useState<storage.HistoryItem[]>(() => storage.getHistoryRecords());
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(() => storage.getCardExpandStates().historyRecord);
  
  // 標籤頁狀態
  const [topActiveTab, setTopActiveTab] = useState<storage.TopTabName>(() => storage.getTopActiveTab());
  const [bottomActiveTab, setBottomActiveTab] = useState<storage.BottomTabName>(() => storage.getBottomActiveTab());
  
  // AI助理相关状态
  const [aiResponse, setAiResponse] = useState<string | null>(() => {
    try {
      return storage.getAIResponse();
    } catch (e) {
      console.error('加載AI響應失敗，重置為空:', e);
      return null;
    }
  });
  const [fadeEffect, setFadeEffect] = useState<boolean>(false);
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const processingRef = useRef(false);
  
  // 使用自定義鉤子
  const recorder = useRecorder();
  const backendSpeech = useBackendSpeech();
  const azureSpeech = useAzureSpeech();

  // 用於跟踪最新新增的收藏項目ID
  const [lastAddedFavoriteId, setLastAddedFavoriteId] = useState<string | null>(null);
  const [highlightedFavoriteId, setHighlightedFavoriteId] = useState<string | null>(null);
  
  // TTS相關狀態 (只在Azure直連模式下使用流式TTS)
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [cacheTipVisible, setCacheTipVisible] = useState<boolean>(false);
  
  // 控制評分按鈕CSS延遲變化的狀態
  const [buttonStyleDelayed, setButtonStyleDelayed] = useState<boolean>(false);
  
  // 新增streaming相關狀態和refs
  const streamingCallbackRef = useRef<((chunk: Blob) => void) | null>(null);
  
  // 處理streaming錄音評估
  const handleStreamingAssessment = useCallback(async () => {
    if (!useBackend) {
      console.log('非後端模式，不支持streaming');
      return;
    }

    try {
      setError(null);
      setResult(null);
      
      console.log('開始streaming評估...');
      
      // 啟動streaming評估
      const chunkHandler = await backendSpeech.startStreamingAssessment(
        referenceText,
        strictMode,
        (progress) => {
          console.log(`Streaming進度: ${progress}%`);
          // 可以在這裡更新UI進度條
        },
        (partialResult) => {
          console.log('收到部分結果:', partialResult);
          // 可以在這裡顯示實時結果
        }
      );
      
      streamingCallbackRef.current = chunkHandler;
      
      // 開始streaming錄音
      await recorder.startStreamingRecording(chunkHandler);
      
    } catch (err) {
      console.error('Streaming評估失敗:', err);
      setError(`Streaming評估失敗: ${err instanceof Error ? err.message : String(err)}`);
      setIsAssessing(false);
      setButtonStyleDelayed(false);
    }
  }, [backendSpeech, referenceText, strictMode, useBackend, recorder]);

  // 停止streaming評估並獲取結果
  const stopStreamingAssessment = useCallback(async () => {
    try {
      console.log('停止streaming評估...');
      
      // 停止錄音
      recorder.stopStreamingRecording();
      
      // 獲取最終評估結果
      if (backendSpeech.isStreaming) {
        const finalResult = await backendSpeech.stopStreamingAssessment();
        
        if (finalResult) {
          setResult(finalResult);
          console.log('獲取到最終streaming評估結果:', finalResult);
        }
      }
      
      streamingCallbackRef.current = null;
      
    } catch (err) {
      console.error('停止streaming評估失敗:', err);
      setError(`停止streaming評估失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsAssessing(false);
      setButtonStyleDelayed(false);
    }
  }, [recorder, backendSpeech]);

  // 處理錄音狀態變化 - 更新以支持streaming
  useEffect(() => {
    // 後端模式下不再需要處理傳統錄音完成事件，直接使用streaming
    if (recorder.error) {
      setError(recorder.error);
    }
  }, [recorder.error]);

  // 收藏夾相關函數
  const addToFavorites = (text: string | string[], tagIds: string[] = []) => {
    // 處理空輸入
    if (!text || (Array.isArray(text) && text.length === 0)) {
      alert("請先輸入句子再加入我的最愛！");
        return;
      }

    // 確保 text 為數組形式以統一處理
    const textsToAdd = Array.isArray(text) ? text : [text];
    const newFavorites: Favorite[] = [];
    let currentNextId = storage.getNextFavoriteId(favorites);
    let firstNewFavoriteId: string | null = null;

    // 處理每個文本
    for (let i = 0; i < textsToAdd.length; i++) {
      const currentText = textsToAdd[i];
      
      // 確保currentText是字符串並且不為空
      if (typeof currentText !== 'string' || !currentText) {
        console.warn('跳過非字符串或空值:', currentText);
        continue;
    }
      
      // 跳過空字符串
      const trimmedText = currentText.trim();
      if (!trimmedText) continue;
      
      // 檢查是否已存在相同文本
      const existingFavorite = favorites.find(fav => fav.text === trimmedText);
      if (existingFavorite) {
        // 如果存在且不是批次新增，更新標籤並提示
        if (!Array.isArray(text)) {
          updateFavoriteTags(existingFavorite.id, tagIds.length ? tagIds : selectedTags);
          alert("此句子已在我的最愛！已更新標籤。");
          
          // 切換到我的最愛標籤頁
          handleTabChange('favorites');
          // 設置最後新增的ID為此已存在項目
          setLastAddedFavoriteId(existingFavorite.id);
          }
        continue; // 跳過已存在的文本
      }
      
      // 創建新收藏項目
      const newId = currentNextId.toString();
      // 記錄第一個新新增的ID
      if (firstNewFavoriteId === null) {
        firstNewFavoriteId = newId;
    }
      
      const newFavorite = {
        id: newId,
        text: trimmedText,
        tagIds: tagIds.length ? tagIds : selectedTags, // 使用當前選中的標籤或指定的標籤
        createdAt: Date.now() + i // 新增索引偏移確保順序正確
      };
      
      newFavorites.push(newFavorite);
      currentNextId++;
    }
    
    // 如果沒有新增項目則直接返回
    if (newFavorites.length === 0) return;
    
    // 合併所有收藏項目
    const allFavorites = [...favorites, ...newFavorites];
    
    // 手動按 ID 數字大小排序，ID 數字大的排在前面
    const sortedFavorites = allFavorites.sort((a, b) => {
      // 將 ID 轉換為數字進行比較
      const idA = parseInt(a.id, 10);
      const idB = parseInt(b.id, 10);
      
      // 如果都是有效數字，按數字大小排序（降序）
      if (!isNaN(idA) && !isNaN(idB)) {
        return idB - idA; // 降序排列，數字大的在前
      }
      
      // 如果一個是數字一個不是，數字的排在前面
      if (!isNaN(idA) && isNaN(idB)) return -1;
      if (isNaN(idA) && !isNaN(idB)) return 1;
      
      // 如果都不是數字，按字符串排序
      return b.id.localeCompare(a.id);
    });
    
    // 設置狀態和保存
    setFavorites(sortedFavorites);
    storage.saveFavorites(sortedFavorites);
    
    // 更新 nextFavoriteId
    setNextFavoriteId(currentNextId);
    storage.saveNextFavoriteId(currentNextId);
    
    // 如果是批次新增，顯示新增成功的提示
    if (Array.isArray(text) && newFavorites.length > 0) {
      console.log(`成功新增 ${newFavorites.length} 個句子到收藏`);
    }
    
    // 切換到我的最愛標籤頁
    handleTabChange('favorites');
    
    // 設置最後新增的收藏項目ID，用於聚焦
    if (firstNewFavoriteId) {
      setLastAddedFavoriteId(firstNewFavoriteId);
      // 同時設置高亮，使新增的句子保持選中狀態
      setHighlightedFavoriteId(firstNewFavoriteId);
    }
  };
  
  const removeFromFavorite = (id: string) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== id);
    setFavorites(updatedFavorites);
    storage.saveFavorites(updatedFavorites);
  };
  
  const loadFavorite = (id: string) => {
    const favorite = favorites.find(fav => fav.id === id);
    if (favorite) {
      setReferenceText(favorite.text);
      // 不再更新选中的标签
      // setSelectedTags(favorite.tagIds);
      storage.saveReferenceText(favorite.text);

      // 設定當前高亮的收藏項目
      setHighlightedFavoriteId(id);
      
      // 切換到發音評分標籤頁
      handleTabChange('input');
      
      // 聚焦到textarea的父容器(避免手機端跳出鍵盤)
      if (inputContainerRef.current) {
        inputContainerRef.current.focus();
      }
    }
  };
  
  const updateFavoriteTags = (id: string, tagIds: string[]) => {
    const updatedFavorites = favorites.map(fav => 
      fav.id === id 
        ? { ...fav, tagIds: tagIds } 
        : fav
    );
    
    setFavorites(updatedFavorites);
    storage.saveFavorites(updatedFavorites);
  };
  
  const toggleTagOnFavorite = (favoriteId: string, tagId: string) => {
    const updatedFavorites = favorites.map(fav => {
      if (fav.id === favoriteId) {
        // 如果標籤已存在，則移除；否則新增
        const hasTag = fav.tagIds.includes(tagId);
        return {
          ...fav,
          tagIds: hasTag 
            ? fav.tagIds.filter(id => id !== tagId) 
            : [...fav.tagIds, tagId]
        };
      }
      return fav;
    });
    
    setFavorites(updatedFavorites);
    storage.saveFavorites(updatedFavorites);
  };
  
  // 標籤選擇相關
  const toggleTagSelection = (tagId: string) => {
    const updatedSelection = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(updatedSelection);
  };
  
  const clearTagSelection = () => {
    setSelectedTags([]);
  };
  
  // 處理參考文本變更
  const handleReferenceTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setReferenceText(newText);
    storage.saveReferenceText(newText);
  };
  
  // 字體大小調整
  const decreaseFontSize = () => {
    const newSize = Math.max(fontSize - 2, 12);
    setFontSize(newSize);
    storage.saveFontSize(newSize);
  };
  
  const increaseFontSize = () => {
    const newSize = fontSize + 1;
      setFontSize(newSize);
      storage.saveFontSize(newSize);
  };
  
  // 語音設置相關
  const handleSpeechRateChange = (rate: number) => {
    const updatedSettings = { ...voiceSettings, rate: rate };
    setVoiceSettings(updatedSettings);
    storage.saveVoiceSettings(updatedSettings);
  };
  
  // 前一條和下一條句子功能
  const goToPreviousSentence = () => {
    // 尋找當前顯示文本在過濾後列表中的位置
    const currentIndex = filteredFavorites.findIndex(
      fav => fav.text === referenceText
    );

    if (filteredFavorites.length === 0) {
      return; // 沒有可用的收藏項目
    }

    let newIndex;
    if (currentIndex === -1) {
      // 如果當前文本不在列表中，載入最後一個
      newIndex = filteredFavorites.length - 1;
    } else {
      // 循環到上一個
      newIndex =
        (currentIndex - 1 + filteredFavorites.length) % filteredFavorites.length;
    }

    // 加載選中的句子
    const target = filteredFavorites[newIndex];
    if (target) {
      setReferenceText(target.text);
      storage.saveReferenceText(target.text);
      setHighlightedFavoriteId(target.id);
    }
  };
  
  const goToNextSentence = () => {
    // 尋找當前顯示文本在過濾後列表中的位置
    const currentIndex = filteredFavorites.findIndex(
      fav => fav.text === referenceText
    );

    if (filteredFavorites.length === 0) {
      return; // 沒有可用的收藏項目
    }

    let newIndex;
    if (currentIndex === -1) {
      // 如果當前文本不在列表中，載入第一個
      newIndex = 0;
    } else {
      // 循環到下一個
      newIndex = (currentIndex + 1) % filteredFavorites.length;
    }

    // 加載選中的句子
    const target = filteredFavorites[newIndex];
    if (target) {
      setReferenceText(target.text);
      storage.saveReferenceText(target.text);

      setHighlightedFavoriteId(target.id);

    }
  };
  
  // 保存 Azure key/region
  const saveAzureSettings = () => {
    storage.saveAzureSettings(azureSettings.key, azureSettings.region);
    setShowAzureSettings(false);
    if (!useBackend) {
      alert("Azure 設定已保存！");
    } else {
      // 如果原本在後端模式，保存完直接切到直連模式
      setUseBackend(false);
      storage.saveUseBackend(false);
      alert("已切換至直連 Azure 模式");
    }
  };

  // 保存卡片展開狀態
  const handleTagExpandToggle = () => {
    const newState = !isTagExpanded;
    setIsTagExpanded(newState);
    storage.saveCardExpandState('tagManager', newState);
  };
  
  const handleVoiceExpandToggle = () => {
    const newState = !isVoiceExpanded;
    setIsVoiceExpanded(newState);
    storage.saveCardExpandState('voicePicker', newState);
  };

  // 歷史記錄相關函數
  const handleDeleteHistoryRecord = (id: string) => {
    storage.deleteHistoryRecord(id);
    setHistoryRecords(storage.getHistoryRecords());
  };
  
  const handleClearHistoryRecords = () => {
    storage.clearHistoryRecords();
    setHistoryRecords([]);
  };
  
  const handleHistoryExpandToggle = () => {
    const newState = !isHistoryExpanded;
    setIsHistoryExpanded(newState);
    storage.saveCardExpandState('historyRecord', newState);
  };
  
  const handleLoadHistoryText = (text: string) => {
    setReferenceText(text);
    storage.saveReferenceText(text);
  };

  // 將評估結果新增到歷史記錄
  useEffect(() => {
    if (result) {
      // 提取單詞評分數據
      let words: any[] = [];
      let recognizedText = '';
      try {
        const nbestArray = result.NBest || result.nBest || result.nbest;
        if (Array.isArray(nbestArray) && nbestArray.length > 0) {
          const nbest = nbestArray[0];
          words = nbest.Words || (nbest as any).words || [];
          // 优先获取识别文本
          recognizedText = nbest.Display || nbest.display || result.DisplayText || result.text || '';
        } else {
          // 後端扁平化結果
          recognizedText = result.DisplayText || result.text || '';
        }
      } catch (err) {
        console.error('提取單詞評分數據失敗:', err);
        recognizedText = result.DisplayText || result.text || '';
      }

      // 生成一個唯一ID，使用時間戳加隨機數
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 檢查當前記錄是否已經存在相似記錄（同一文本和相近時間）
      const existingRecords = storage.getHistoryRecords();
      const last5Seconds = Date.now() - 5000; // 5秒內
      
      const hasSimilarRecord = existingRecords.some(record => 
        (record.recognizedText === recognizedText || record.text === referenceText) && 
        record.timestamp > last5Seconds
      );
      
      // 只有不存在相似記錄時才新增
      if (!hasSimilarRecord) {
        storage.addHistoryRecord({
          text: referenceText,
          scoreAccuracy: result.accuracyScore || 0,
          scoreFluency: result.fluencyScore || 0,
          scoreCompleteness: result.completenessScore || 0,
          scorePronunciation: result.pronunciationScore || 0,
          recognizedText: recognizedText,
          words: words // 保存單詞評分數據
        });
        setHistoryRecords(storage.getHistoryRecords());
      } else {
        console.log('檢測到重複的歷史記錄，已忽略');
      }
    }
  }, [result, referenceText]);

  // 處理標籤頁切換
  const handleTabChange = (tab: storage.TabName) => {
    // 處理頂部輸入區域的切換
    if (tab === 'input' || tab === 'ai') {
      setTopActiveTab(tab as storage.TopTabName);
      try {
        storage.saveTopActiveTab(tab as storage.TopTabName);
      } catch (e) {
        console.log('保存頂部標籤頁狀態失敗，可能處於無痕模式');
      }
      
      // 在切換到頂部標籤頁時重置lastAddedFavoriteId
      setLastAddedFavoriteId(null);
    } 
    // 處理底部標籤頁區域的切換
    else {
      setBottomActiveTab(tab as storage.BottomTabName);
      try {
        storage.saveBottomActiveTab(tab as storage.BottomTabName);
      } catch (e) {
        console.log('保存底部標籤頁狀態失敗，可能處於無痕模式');
      }
      
      // 如果不是切換到收藏標籤頁，則重置lastAddedFavoriteId
      if (tab !== 'favorites') {
        setLastAddedFavoriteId(null);
      }
    }
  };

  // 處理AI回應
  const handleAIResponseReceived = () => {
    // 设置渐变效果
    setFadeEffect(true);
    
    // 500毫秒后取消渐变效果
    setTimeout(() => {
      setFadeEffect(false);
    }, 500);
  };

  // 当 aiResponse 变化时保存到本地存储
  useEffect(() => {
    try {
      storage.saveAIResponse(aiResponse);
    } catch (e) {
      console.error('保存AI響應失敗:', e);
    }
  }, [aiResponse]);

  // 檢查URL參數並自動加載分享數據
  useEffect(() => {
    // 檢查URL中是否有hash參數
    const urlParams = new URLSearchParams(window.location.search);
    const hash = urlParams.get('hash');
    
    if (hash) {
      // 顯示正在加載的提示
      setIsLoading(true);
      setError(null);
      
      // 嘗試加載分享數據
      const loadSharedData = async () => {
        try {
          // 加載數據
          const result = await storage.loadFromHash(hash);
          
          if (result.success && result.data) {
            // 應用加載的數據
            storage.applyLoadedData(result.data);
            
            // 更新本地狀態
            setTags(result.data.tags);
            setFavorites(result.data.favorites);
            
            // 切換到favorites標籤
            setBottomActiveTab('favorites');
            
            // 顯示成功消息
            alert('分享數據已成功導入！');
            
            // 從URL中移除hash參數
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          } else {
            setError(`無法加載分享數據: ${result.error || '未知錯誤'}`);
          }
        } catch (err) {
          console.error('加載分享數據出錯:', err);
          setError(`加載分享數據失敗: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setIsLoading(false);
        }
      };
      
      loadSharedData();
    }
  }, []); // 只在組件首次載入時執行

  // 統一的開始評估入口 - 更新以支持streaming
  const startAssessment = async () => {
    try {
      setError(null);
      setResult(null);
      setIsAssessing(true);
      
      // 延遲0.5秒後改變按鈕CSS樣式
      setTimeout(() => {
        setButtonStyleDelayed(true);
      }, 500);
      
      if (useBackend) {
        // 使用後端API - 直接使用streaming模式
        await handleStreamingAssessment();
      } else {
        // 直接使用Azure
        if (!azureSettings.key || !azureSettings.region) {
          setError('請先設置Azure API key和區域');
          setIsAssessing(false);
          return;
        }
        
        setIsLoading(true);
        
        const result = await azureSpeech.assessWithAzure(
          referenceText, 
          strictMode,
          azureSettings
        );
        
        if (result) {
          setResult(result);
        }
      }
    } catch (err) {
      console.error('啟動評估失敗:', err);
      setError(`啟動評估失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (!useBackend) {
        setIsAssessing(false);
        setIsLoading(false);
        setButtonStyleDelayed(false);
      }
    }
  };
  
  // 停止評估 - 更新以支持streaming
  const stopAssessment = () => {
    if (useBackend && (recorder.streamingActive || backendSpeech.isStreaming)) {
      // Streaming模式
      stopStreamingAssessment();
    } else if (recorder.recording) {
      // 傳統錄音模式 (僅用於Azure直連)
      recorder.stopRecording();
    }
    
    azureSpeech.cancelAzureSpeech();
    setIsAssessing(false);
    setButtonStyleDelayed(false);
  };
  
  // 統一的文本轉語音入口 - 只使用流式TTS
  const speakText = async () => {
    try {
      if (!referenceText) {
        alert("請先輸入要發音的文字！");
        return;
      }
      
      setIsLoading(true);
      setStreamLoading(true);
      setError(null);
      
      // 統一使用流式TTS
      const result = await azureSpeech.speakWithAIServerStream(referenceText, selectedAIVoice, voiceSettings.rate);
      console.log("流式TTS已完成", result);
        
    } catch (err) {
      console.error('流式語音合成失敗:', err);
      setError(`流式語音合成失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
      setStreamLoading(false);
    }
  };
  
  // 處理粘貼事件，支持文本和圖片
  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // 檢查是否有圖片
      if (e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        
        if (file.type.startsWith('image/')) {
          // 動態導入Tesseract.js
          try {
            const Tesseract = await import('tesseract.js');
            // 處理圖片OCR
            setIsLoading(true);
            setError(null);
            const result = await Tesseract.default.recognize(file, 'eng+chi_sim');
            const text = result.data.text.trim();
            setReferenceText(text);
          } catch (ocrError) {
            console.error("OCR庫加載失敗:", ocrError);
            setError(`OCR庫加載失敗: ${ocrError instanceof Error ? ocrError.message : String(ocrError)}`);
          }
          setIsLoading(false);
          return;
        }
      }
      
      // 處理純文本
      let text = e.clipboardData.getData('text').trim();
      setReferenceText(text);
    } catch (error) {
      console.error("粘貼處理出錯:", error);
      setError(`粘貼內容處理失敗: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 標籤相關函數
  const addTag = (name: string, color = '#' + Math.floor(Math.random()*16777215).toString(16)) => {
    // 檢查ID是否存在，如果存在則遞增直到找到未使用的ID
    let currentNextId = nextTagId;
    let idStr = currentNextId.toString();
    
    // 檢查tagId是否已存在
    while (tags.some(tag => tag.tagId === idStr)) {
      currentNextId++;
      idStr = currentNextId.toString();
      console.log(`標籤ID "${(currentNextId-1)}" 已存在，嘗試使用新ID "${idStr}"`);
    }
    
    const newTag: Tag = {
      tagId: idStr,
      name: name,
      color: color,
      createdAt: Date.now()
    };
    
    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    storage.saveTags(updatedTags);
    
    // 保存遞增後的ID
    const newNextId = currentNextId + 1;
    setNextTagId(newNextId);
    storage.saveNextTagId(newNextId);
    
    return newTag.tagId; // 返回新創建的標籤ID
  };
  
  const editTag = (tagId: string, newName: string, newColor?: string) => {
    const updatedTags = tags.map(tag => 
      tag.tagId === tagId 
        ? { ...tag, name: newName || tag.name, color: newColor || tag.color } 
        : tag
    );
    
    setTags(updatedTags);
    storage.saveTags(updatedTags);
  };
  
  const deleteTag = (tagId: string) => {
    // 刪除標籤
    const updatedTags = tags.filter(tag => tag.tagId !== tagId);
    setTags(updatedTags);
    storage.saveTags(updatedTags);
    
    // 從所有收藏中移除該標籤
    const updatedFavorites = favorites.map(favorite => ({
      ...favorite,
      tagIds: favorite.tagIds.filter(tid => tid !== tagId)
    }));
    
    setFavorites(updatedFavorites);
    storage.saveFavorites(updatedFavorites);
  };

  // 處理AI語音選擇
  const handleSelectAIVoice = (voice: string) => {
    setSelectedAIVoice(voice);
    // 可以考慮存儲到localStorage
    storage.saveAIVoice(voice);
  };

  // JSX 渲染部分
  return (
    <div className="pa-container">
      <div className="pa-title">
        <img 
          src="/nicetone.webp" 
          alt="NiceTone" 
          className="pa-title-logo" 
          onClick={() => setShowAzureSettings(true)}
          style={{ cursor: 'pointer' }}
        />
      </div>
      
      {/* 錯誤提示 */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* 主要功能區域 */}
      <div className="pa-main-content">
        {/* 整合输入区域和控制按钮 */}
        <div className="card-section">
          {/* 新增选项卡导航 */}
          <div className="tabs-nav input-tabs">
            <button 
              className={`tab-button ${topActiveTab === 'input' ? 'active' : ''}`}
              onClick={() => handleTabChange('input')}
            >
              發音評分
            </button>
            <button 
              className={`tab-button ${topActiveTab === 'ai' ? 'active' : ''}`}
              onClick={() => handleTabChange('ai')}
            >
              AI助理
            </button>
          </div>
          
          {/* 發音評分 TAB */}
          {topActiveTab === 'input' && (
            <>
              <h3 
            onClick={() => {
              textareaRef.current?.focus();
            }}
            className="clickable-header"
          >
          </h3>
              
              <div className="integrated-input-container" ref={inputContainerRef} tabIndex={0}>
                {/* 文本输入区 */}
                <ResizableTextarea
              ref={textareaRef}
              value={referenceText}
              onChange={handleReferenceTextChange}
              onPaste={handlePaste}
              className="textarea-input"
                  fontSize={fontSize}
              placeholder="輸入或粘貼要練習的文本..."
                  storageKey="mainTextareaHeight"
                  defaultHeight={140}
            />
                
                {/* 工具栏控制按钮 */}
                <div className="textarea-toolbar">
                  {/* 字体调整按钮 */}
                  <button 
                    onClick={decreaseFontSize} 
                    className="control-button"
                    title="減小字體"
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  
                  <span className="font-size-display">{fontSize}</span>
                  
                  <button 
                    onClick={increaseFontSize} 
                    className="control-button"
                    title="增大字體"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                  
                  {/* 收藏按钮 */}
            <button
              onClick={() => addToFavorites(referenceText)}
              disabled={!referenceText}
              title="新增到收藏"
              className={!referenceText ? "control-button favorite-button-disabled" : "control-button favorite-button-dynamic"}
                  >
                    <i className="fas fa-star"></i>
              </button>
        </div>
        
                {/* 操作按钮区 */}
                <div className="textarea-action-bar">
                  {/* 評分按鈕 */}
            <button
              onClick={isAssessing || recorder.recording ? stopAssessment : startAssessment}
              disabled={(isLoading && !isAssessing && !recorder.recording) || (!isAssessing && !recorder.recording && !referenceText)}
                    className={`btn ${(isAssessing || recorder.recording) && buttonStyleDelayed ? "btn-danger" : "btn-primary"} btn-flex-1-5`}
            >
                    <i className="fas fa-microphone mic-icon-margin"></i>
              {(isAssessing || recorder.recording) && buttonStyleDelayed
                ? "停止錄音"
                : isLoading
                ? "處理中..."
                      : `評分${useBackend ? ' ' : ''}`}
            </button>
            
            {/* 發音按鈕 */}
            <button
              onClick={() => {
                speakText();
              }}
              disabled={isLoading || streamLoading || !referenceText}
                    className={`btn btn-success btn-flex-0-5 ${(isLoading || streamLoading || !referenceText) ? 'btn-disabled' : ''}`}
                    title="使用AI語音播放"
                  >
                    <i className={`fas ${!useBackend ? 'fa-broadcast-tower' : 'fa-volume-up'}`}></i>
                  </button>
                  
                  {/* 前一句按鈕 - 使用統一的按鈕寬度 */}
                  <button
                    onClick={goToPreviousSentence}
                    disabled={filteredFavorites.length === 0}
                    className={`btn btn-nav btn-flex-0-75 ${filteredFavorites.length === 0 ? 'btn-disabled' : ''}`}
                    title="上一個收藏句子"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {/* 下一句按鈕 - 使用統一的按鈕寬度 */}
                  <button
                    onClick={goToNextSentence}
                    disabled={filteredFavorites.length === 0}
                    className={`btn btn-nav btn-flex-0-75 ${filteredFavorites.length === 0 ? 'btn-disabled' : ''}`}
                    title="下一個收藏句子"
                  >
                    <i className="fas fa-chevron-right"></i>
            </button>
                </div>
            
            {isAssessing && <div className="recording-indicator">錄音中... (最長30秒)</div>}
            
            {isLoading && <div className="loading-indicator">處理中...</div>}
            
            {/* 新增streaming進度指示器 */}
            {useBackend && backendSpeech.isStreaming && (
              <div className="streaming-indicator">
                流式處理中... ({backendSpeech.streamProgress}%)
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${backendSpeech.streamProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {streamLoading && <div className="loading-indicator stream-loading">流式處理中...</div>}
            
            {cacheTipVisible && <div className="cache-tip">使用已緩存的語音</div>}
          </div>
            </>
          )}
          
          {/* AI助理 TAB */}
          {topActiveTab === 'ai' && (
            <AIDataProcessor
              favorites={favorites}
              tags={tags}
              historyRecords={historyRecords}
              onUpdateFavorites={setFavorites}
              onUpdateTags={setTags}
              onUpdateHistoryRecords={setHistoryRecords}
              aiResponse={aiResponse}
              setAiResponse={setAiResponse}
              onAIResponseReceived={handleAIResponseReceived}
              addToFavorites={addToFavorites}
            />
          )}
        </div>
        
        {/* 結果顯示區域 */}
        {result && (() => {
          try {
            // Azure 直連或後端含 NBest
            const nbestArray = result.NBest || result.nBest || result.nbest;
            if (Array.isArray(nbestArray) && nbestArray.length > 0) {
              const nbest = nbestArray[0];
              const pa = (nbest as any).pronunciationAssessment || nbest.PronunciationAssessment || {};
              const words = nbest.Words || (nbest as any).words || [];
              return (
                <div className="card-section">
                  <h3 className="section-header special-title">總分</h3>
                  <ScoreBar label="準確度" value={pa.AccuracyScore ?? pa.accuracyScore ?? 0} />
                  <ScoreBar label="流暢度" value={pa.FluencyScore ?? pa.fluencyScore ?? 0} />
                  <ScoreBar label="完整度" value={pa.CompletenessScore ?? pa.completenessScore ?? 0} />
                  <ScoreBar label="發音" value={pa.PronScore ?? pa.pronScore ?? result.pronunciationScore ?? 0} />
                  <h3 className="section-header special-title">句子分析</h3>
                  {words.length > 0 ? (
                    <WordsDisplay words={words} />
                  ) : (
                    <p>無法獲取詳細單詞評分數據</p>
                  )}
                  <h4 className="section-header special-title">識別文本</h4>
                  <p className="recognized-text">
                    {nbest.Display || nbest.display || result.DisplayText || result.text || "--"}
                  </p>
                </div>
              );
            }

            // 後端扁平化結果 (無 NBest)
            return (
              <div className="card-section">
                <h3 className="section-header special-title">評分結果</h3>
                <ScoreBar label="準確度" value={result.accuracyScore || 0} />
                <ScoreBar label="流暢度" value={result.fluencyScore || 0} />
                <ScoreBar label="完整度" value={result.completenessScore || 0} />
                <ScoreBar label="發音" value={result.pronunciationScore || 0} />
              </div>
            );
          } catch (err) {
            console.error('解析評分資料失敗', err);
            return null;
          }
        })()}
        <div className="card-section" id="gameCenter">



          
        </div>
        
        {/* 標籤頁導航區域 */}
        <div className="card-section">
          <div className="tabs-container">
            <div className="tabs-nav">
              <button 
                className={`tab-button ${bottomActiveTab === 'favorites' ? 'active' : ''}`}
                onClick={() => handleTabChange('favorites')}
              >
                我的最愛
              </button>
              <button 
                className={`tab-button ${bottomActiveTab === 'history' ? 'active' : ''}`}
                onClick={() => handleTabChange('history')}
              >
                發音歷史
              </button>
              <button 
                className={`tab-button ${bottomActiveTab === 'tags' ? 'active' : ''}`}
                onClick={() => handleTabChange('tags')}
              >
                管理標籤
              </button>
              <button 
                className={`tab-button ${bottomActiveTab === 'voices' ? 'active' : ''}`}
                onClick={() => handleTabChange('voices')}
              >
                選擇語音
              </button>
              <button 
                className={`tab-button ${bottomActiveTab === 'share' ? 'active' : ''}`}
                onClick={() => handleTabChange('share')}
              >
                數據分享
              </button>
            </div>
            
            <div className="tab-content">
              {/* 收藏列表標籤頁 */}
              {bottomActiveTab === 'favorites' && (
                <FavoriteList
                  favorites={favorites}
                  tags={tags}
                  selectedTags={selectedTags}
                  onLoadFavorite={loadFavorite}
                  onRemoveFavorite={removeFromFavorite}
                  onToggleTag={toggleTagOnFavorite}
                  onToggleTagSelection={toggleTagSelection}
                  onClearTagSelection={clearTagSelection}
                  onAddFavorite={addToFavorites}
                  onManageTags={() => handleTabChange('tags')}
                  currentText={referenceText}
                  lastAddedFavoriteId={lastAddedFavoriteId}
                  highlightedFavoriteId={highlightedFavoriteId}
                />
              )}
              
              {/* 歷史記錄標籤頁 */}
              {bottomActiveTab === 'history' && (
                <HistoryRecord
                  historyRecords={historyRecords}
                  onDeleteRecord={handleDeleteHistoryRecord}
                  onClearRecords={handleClearHistoryRecords}
                  onLoadText={handleLoadHistoryText}
                  isExpanded={true} // 標籤頁模式下始終展開
                  onToggleExpand={() => {}} // 標籤頁模式下不需要切換展開狀態
                />
              )}
              
              {/* 標籤管理標籤頁 */}
              {bottomActiveTab === 'tags' && (
                <TagManager
                  tags={tags}
                  onAddTag={addTag}
                  onEditTag={editTag}
                  onDeleteTag={deleteTag}
                  isExpanded={true} // 標籤頁模式下始終展開
                  onToggleExpand={() => {}} // 標籤頁模式下不需要切換展開狀態
                />
              )}
              
              {/* 語音選擇標籤頁 */}
              {bottomActiveTab === 'voices' && (
                <VoicePicker 
                  isExpanded={isVoiceExpanded}
                  onToggleExpand={handleVoiceExpandToggle}
                  rate={voiceSettings.rate}
                  onRateChange={handleSpeechRateChange}
                  selectedAIVoice={selectedAIVoice}
                  onSelectAIVoice={handleSelectAIVoice}
                />
              )}
              
              {/* 數據分享標籤頁 */}
              {bottomActiveTab === 'share' && (
                <ShareData 
                  tags={tags} 
                  favorites={favorites} 
                />
              )}
            </div>
          </div>
        </div>
        
        {/* 渐变动画效果 */}
        {fadeEffect && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.5)',
            zIndex: 1000,
            animation: 'fadeInOut 0.5s ease-in-out',
            pointerEvents: 'none'
          }} />
        )}
        
        {/* 新增动画样式 */}
        <style>
          {`
            @keyframes fadeInOut {
              0% { opacity: 0; }
              50% { opacity: 0.5; }
              100% { opacity: 0; }
            }
            
            @keyframes highlightFavorite {
              0% { background: rgba(255, 159, 10, 0.3); }
              70% { background: rgba(255, 159, 10, 0.15); }
              100% { background: rgba(44, 44, 48, 0.5); }
            }
            
            .stream-loading {
              background-color: rgba(0, 122, 255, 0.2);
              color: rgba(0, 122, 255, 1);
            }
            
            .streaming-indicator {
              background-color: rgba(52, 199, 89, 0.1);
              color: rgba(52, 199, 89, 1);
              padding: 8px 12px;
              border-radius: 8px;
              margin: 8px 0;
              font-size: 14px;
              border: 1px solid rgba(52, 199, 89, 0.3);
            }
            
            .progress-bar {
              width: 100%;
              height: 6px;
              background-color: rgba(52, 199, 89, 0.2);
              border-radius: 3px;
              margin-top: 4px;
              overflow: hidden;
            }
            
            .progress-fill {
              height: 100%;
              background-color: rgba(52, 199, 89, 0.8);
              border-radius: 3px;
              transition: width 0.3s ease;
            }
            
            .cache-tip {
              position: fixed;
              bottom: 30px;
              left: 50%;
              transform: translateX(-50%);
              background-color: rgba(52, 199, 89, 0.9);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              z-index: 1000;
              animation: fadeIn 0.3s, fadeOut 0.5s 1s forwards;
            }
            
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
            }
          `}
        </style>
        
        {/* Azure 設定面板 */}
        {showAzureSettings && (
          <div className="azure-settings-container">
            <div className="azure-settings-content">
              <h3 className="azure-settings-title">Azure 設定</h3>
              <div className="azure-settings-form">
                <div className="form-group">
                  <label className="form-label">Speech Key：</label>
                  <input
                    type="text"
                    value={azureSettings.key}
                    onChange={e => setAzureSettings({ ...azureSettings, key: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Region：</label>
                  <input
                    type="text"
                    value={azureSettings.region}
                    onChange={e => setAzureSettings({ ...azureSettings, region: e.target.value })}
                    placeholder="e.g. japaneast"
                    className="form-input"
                  />
                </div>
                <div className="form-actions">
                  <button
                    onClick={() => setShowAzureSettings(false)}
                    className="form-button"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveAzureSettings}
                    className="form-button form-button-primary"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationAssessment; 