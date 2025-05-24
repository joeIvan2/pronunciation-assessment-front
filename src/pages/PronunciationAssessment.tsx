import React, { useState, useRef, useEffect, useCallback } from "react";
import "../styles/PronunciationAssessment.css";

// 組件導入
import ScoreBar from "../components/ScoreBar";
import ErrorTypeTag from "../components/ErrorTypeTag";
import Word from "../components/Word";
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
import { SpeechAssessmentResult, Favorite, Tag, VoiceOption } from "../types/speech";

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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [isVoiceExpanded, setIsVoiceExpanded] = useState<boolean>(() => storage.getCardExpandStates().voicePicker);
  const [voiceSettings, setVoiceSettings] = useState(() => storage.getVoiceSettings());
  // 新增AI語音設置
  const [selectedAIVoice, setSelectedAIVoice] = useState<string>("Puck");
  
  // 標籤系統
  const [isTagExpanded, setIsTagExpanded] = useState<boolean>(() => storage.getCardExpandStates().tagManager);
  const [tags, setTags] = useState<Tag[]>(() => storage.getTags());
  const [nextTagId, setNextTagId] = useState<number>(() => storage.getNextTagId());
  
  // 收藏系統
  const [favorites, setFavorites] = useState<Favorite[]>(() => storage.getFavorites());
  const [nextFavoriteId, setNextFavoriteId] = useState<number>(() => storage.getNextFavoriteId(favorites));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 文本和界面設置
  const [referenceText, setReferenceText] = useState<string>(() => storage.getReferenceText());
  const [fontSize, setFontSize] = useState<number>(() => storage.getFontSize());
  
  // 歷史記錄狀態
  const [historyRecords, setHistoryRecords] = useState<storage.HistoryItem[]>(() => storage.getHistoryRecords());
  const [isHistoryExpanded, setIsHistoryExpanded] = useState<boolean>(() => storage.getCardExpandStates().historyRecord);
  
  // 標籤頁狀態
  const [topActiveTab, setTopActiveTab] = useState<storage.TopTabName>(() => storage.getTopActiveTab());
  const [bottomActiveTab, setBottomActiveTab] = useState<storage.BottomTabName>(() => storage.getBottomActiveTab());
  
  // AI助手相关状态
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
  const processingRef = useRef(false);
  
  // 使用自定義鉤子
  const recorder = useRecorder();
  const backendSpeech = useBackendSpeech();
  const azureSpeech = useAzureSpeech();

  // 用於跟踪最新添加的收藏項目ID
  const [lastAddedFavoriteId, setLastAddedFavoriteId] = useState<string | null>(null);
  
  // TTS相關狀態 (只在Azure直連模式下使用流式TTS)
  const [streamLoading, setStreamLoading] = useState<boolean>(false);
  const [cacheTipVisible, setCacheTipVisible] = useState<boolean>(false);
  
  // 處理錄音評估
  const processPronunciationAssessment = useCallback(async () => {
    if (!recorder.audioData || processingRef.current) return;
    processingRef.current = true;
    
    try {
      setIsLoading(true); // 在處理錄音結果時設置isLoading為true
      
      if (useBackend) {
        // 使用後端API
        const result = await backendSpeech.assessWithBackend(
          recorder.audioData,
          referenceText,
          strictMode
        );
        
        if (result) {
          setResult(result);
        }
      }
    } catch (err) {
      console.error('評估處理失敗:', err);
      setError(`評估處理失敗: ${err instanceof Error ? err.message : String(err)}`);
      
      // 如果後端失敗，嘗試回退到Azure
      if (useBackend) {
        setUseBackend(false);
        storage.saveUseBackend(false);
        alert('後端連接失敗，將使用直接連接Azure模式');
      }
    } finally {
      setIsLoading(false);
      processingRef.current = false;
      recorder.resetRecording();
    }
  }, [recorder, backendSpeech, referenceText, strictMode, useBackend, setIsLoading, setResult, setError, setUseBackend]);
  
  // 使用瀏覽器Web Speech API朗讀文本
  const speakTextWithBrowserAPI = useCallback(() => {
    if (!window.speechSynthesis) return;
    
    // 取消之前的語音
    window.speechSynthesis.cancel();
    
    // 創建語音合成utterance
    const utterance = new SpeechSynthesisUtterance(referenceText);
      
    // 設置語音
      if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // 設置語速
    utterance.rate = voiceSettings.rate;
    
    // 播放語音
    window.speechSynthesis.speak(utterance);
  }, [referenceText, selectedVoice, voiceSettings.rate]);

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
        // 如果存在且不是批次添加，更新標籤並提示
        if (!Array.isArray(text)) {
          updateFavoriteTags(existingFavorite.id, tagIds.length ? tagIds : selectedTags);
          alert("此句子已在我的最愛！已更新標籤。");
          
          // 切換到我的最愛標籤頁
          handleTabChange('favorites');
          // 設置最後添加的ID為此已存在項目
          setLastAddedFavoriteId(existingFavorite.id);
          }
        continue; // 跳過已存在的文本
      }
      
      // 創建新收藏項目
      const newId = currentNextId.toString();
      // 記錄第一個新添加的ID
      if (firstNewFavoriteId === null) {
        firstNewFavoriteId = newId;
    }
      
      const newFavorite = {
        id: newId,
        text: trimmedText,
        tagIds: tagIds.length ? tagIds : selectedTags, // 使用當前選中的標籤或指定的標籤
        createdAt: Date.now() + i // 添加索引偏移確保順序正確
      };
      
      newFavorites.push(newFavorite);
      currentNextId++;
    }
    
    // 如果沒有新增項目則直接返回
    if (newFavorites.length === 0) return;
    
    // 一次性更新所有收藏，新項目放在最前面
    const updatedFavorites = [...newFavorites, ...favorites].slice(0, 20);
    setFavorites(updatedFavorites);
    storage.saveFavorites(updatedFavorites);
    
    // 更新 nextFavoriteId
    setNextFavoriteId(currentNextId);
    storage.saveNextFavoriteId(currentNextId);
    
    // 如果是批次添加，顯示添加成功的提示
    if (Array.isArray(text) && newFavorites.length > 0) {
      console.log(`成功添加 ${newFavorites.length} 個句子到收藏`);
    }
    
    // 切換到我的最愛標籤頁
    handleTabChange('favorites');
    
    // 設置最後添加的收藏項目ID，用於聚焦
    if (firstNewFavoriteId) {
      setLastAddedFavoriteId(firstNewFavoriteId);
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
      
      // 切換到發音評分標籤頁
      handleTabChange('input');
      
      // 聚焦到textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
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
        // 如果標籤已存在，則移除；否則添加
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
  const increaseFontSize = () => {
    const newSize = fontSize + 1;
    setFontSize(newSize);
    storage.saveFontSize(newSize);
  };
  
  const decreaseFontSize = () => {
    if (fontSize > 12) { // 避免字體太小
      const newSize = fontSize - 1;
      setFontSize(newSize);
      storage.saveFontSize(newSize);
    }
  };
  
  // 前一條和下一條句子功能
  const goToPreviousSentence = () => {
    // 尋找當前顯示文本在收藏夾中的位置
    const currentIndex = favorites.findIndex(fav => fav.text === referenceText);
    
    if (favorites.length === 0) {
      return; // 沒有收藏項目
    }
    
    let newIndex;
    if (currentIndex === -1) {
      // 如果當前文本不在收藏夾中，加載最後一個
      newIndex = favorites.length - 1;
    } else {
      // 循環到上一個
      newIndex = (currentIndex - 1 + favorites.length) % favorites.length;
    }
    
    // 加載選中的句子
    if (favorites[newIndex]) {
      setReferenceText(favorites[newIndex].text);
      storage.saveReferenceText(favorites[newIndex].text);
    }
  };
  
  const goToNextSentence = () => {
    // 尋找當前顯示文本在收藏夾中的位置
    const currentIndex = favorites.findIndex(fav => fav.text === referenceText);
    
    if (favorites.length === 0) {
      return; // 沒有收藏項目
    }
    
    let newIndex;
    if (currentIndex === -1) {
      // 如果當前文本不在收藏夾中，加載第一個
      newIndex = 0;
    } else {
      // 循環到下一個
      newIndex = (currentIndex + 1) % favorites.length;
    }
    
    // 加載選中的句子
    if (favorites[newIndex]) {
      setReferenceText(favorites[newIndex].text);
      storage.saveReferenceText(favorites[newIndex].text);
    }
  };
  
  // 語音設置相關
  const handleVoiceSearchChange = (term: string) => {
    const updatedSettings = { ...voiceSettings, searchTerm: term };
    setVoiceSettings(updatedSettings);
    storage.saveVoiceSettings(updatedSettings);
  };
  
  const handleSpeechRateChange = (rate: number) => {
    const updatedSettings = { ...voiceSettings, rate };
    setVoiceSettings(updatedSettings);
    storage.saveVoiceSettings(updatedSettings);
  };
  
  const handleSelectVoice = (voice: SpeechSynthesisVoice) => {
    console.log(`選擇語音: ${voice.name}, ${voice.lang}`);
    
    // 立即更新當前語音
    setSelectedVoice(voice);
    
    // 保存語音設置到本地存儲，保留現有設置（如語速）
    const updatedSettings = {
      ...voiceSettings,
      voiceName: voice.name,
      voiceLang: voice.lang
    };
    setVoiceSettings(updatedSettings);
    storage.saveVoiceSettings(updatedSettings);
    
    // 預先測試一下選擇的語音
    const testUtterance = new SpeechSynthesisUtterance('Test');
    testUtterance.voice = voice;
    testUtterance.lang = "en-US";
    testUtterance.volume = 30; // 靜音測試
    window.speechSynthesis.speak(testUtterance);
  };
  
  // 確保在組件加載時預加載語音
  useEffect(() => {
    // 在某些瀏覽器中，voices列表可能需要時間加載
    if ('speechSynthesis' in window) {
      // 獲取當前可用的語音
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          console.log('語音列表為空，稍後將重試');
          return;
        }

        // 過濾所有包含 en 的語音
        const enVoices = voices.filter(v => 
          v.lang.toLowerCase().includes('en') || 
          v.name.toLowerCase().includes('english')
        );
        
        console.log(`加載了${enVoices.length}個英文語音選項`);
        setAvailableVoices(enVoices);
        
        // 從 localStorage 中獲取保存的語音設置
        const savedSettings = storage.getVoiceSettings();
        
        // 如果已經保存了語音名稱，嘗試在可用語音中尋找匹配的語音
        if (savedSettings.voiceName && !selectedVoice) {
          const savedVoice = enVoices.find(v => v.name === savedSettings.voiceName);
          
          if (savedVoice) {
            console.log(`從存儲中恢復語音: ${savedVoice.name}, ${savedVoice.lang}`);
            setSelectedVoice(savedVoice);
            return; // 已找到保存的語音，無需設置默認語音
          } else {
            console.log(`未找到已保存的語音 "${savedSettings.voiceName}"，將選擇默認語音`);
          }
        }
        
        // 如果沒有找到保存的語音或者沒有保存過，選擇一個默認語音
        if (!selectedVoice && enVoices.length > 0) {
          // 優先選擇 en-US 語音，如果沒有則用第一個
          const usVoice = enVoices.find(v => v.lang === 'en-US');
          const preferredVoice = usVoice || enVoices[0];
          
          console.log(`設置默認語音: ${preferredVoice.name}, ${preferredVoice.lang}`);
          setSelectedVoice(preferredVoice);
          
          // 保存語音設置
          storage.saveVoiceSettings({
            ...voiceSettings,
            voiceName: preferredVoice.name,
            voiceLang: preferredVoice.lang
          });
        }
      };
      
      // 首次加載嘗試
      loadVoices();
      
      // 加載AI語音設置
      const savedAIVoice = storage.getAIVoice();
      if (savedAIVoice) {
        setSelectedAIVoice(savedAIVoice);
        console.log(`從存儲中恢復AI語音: ${savedAIVoice}`);
      }
      
      // 監聽voices加載完成事件
      window.speechSynthesis.onvoiceschanged = loadVoices;
      
      // 確保語音列表已加載 - 在某些瀏覽器中需要觸發一下
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.cancel();
      }
      
      // 清理函數
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);
  
  // 處理錄音狀態變化
  useEffect(() => {
    if (recorder.audioData && !recorder.recording && useBackend) {
      processPronunciationAssessment();
    }
    
    if (recorder.error) {
      setError(recorder.error);
    }
  }, [recorder.audioData, recorder.recording, recorder.error, useBackend, processPronunciationAssessment]);

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

  // 將評估結果添加到歷史記錄
  useEffect(() => {
    if (result) {
      // 提取單詞評分數據
      let words = [];
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
      
      // 只有不存在相似記錄時才添加
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

  // 統一的開始評估入口
  const startAssessment = async () => {
    try {
      setError(null);
      setResult(null);
      setIsAssessing(true);
      
      if (useBackend) {
        // 使用後端API
        await recorder.startRecording();
      } else {
        // 直接使用Azure
        // 檢查API key和region是否已設置
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
      }
    }
  };
  
  // 停止評估
  const stopAssessment = () => {
    if (recorder.recording) {
      recorder.stopRecording();
      
      // 如果有錄音數據並且使用後端API，則發送到後端
      if (recorder.audioData && useBackend) {
        processPronunciationAssessment();
      }
    }
    
    azureSpeech.cancelAzureSpeech();
    setIsAssessing(false);
  };
  
  // 統一的文本轉語音入口
  const speakText = async () => {
    try {
      if (!referenceText) {
        alert("請先輸入要發音的文字！");
        return;
      }
      
      setIsLoading(true);
      setError(null); // 重置可能的錯誤狀態
      
      // 使用Azure直連模式時，使用AI服務器API
      if (!useBackend) {
        try {
          // 在Azure直連模式下，使用WebM/Opus格式的流式TTS API
          setStreamLoading(true);
          const result = await azureSpeech.speakWithAIServerStream(referenceText, selectedAIVoice)
            .catch((err) => {
              console.error('WebM流式TTS失敗，嘗試標準TTS:', err);
              // 如果WebM流式失敗，嘗試標準TTS API
              return azureSpeech.speakWithAIServer(referenceText, selectedAIVoice)
                .then(res => ({ audio: new Audio(), fromCache: res.fromCache }));
            });
            
          setStreamLoading(false);
          console.log("WebM TTS已完成", result);
          return;
        } catch (err) {
          console.warn('AI服務器WebM TTS完全失敗，嘗試瀏覽器API:', err);
          // 所有AI服務器方法都失敗，回退到瀏覽器API
          if ('speechSynthesis' in window) {
            speakTextWithBrowserAPI();
            return;
          }
        } finally {
          setStreamLoading(false);
        }
      } else {
        // 遠端模式下，直接使用瀏覽器API
        if ('speechSynthesis' in window) {
          console.log('使用瀏覽器的Web Speech API');
          speakTextWithBrowserAPI();
          return;
        } else {
          // 如果瀏覽器不支持語音API，嘗試使用後端服務
          console.log('瀏覽器不支持Web Speech API，嘗試使用後端服務');
          await backendSpeech.speakWithBackend(referenceText);
          return;
        }
      }
      
      // 以下是備用方案，如果上述方法都失敗
      if (useBackend) {
        console.log('嘗試使用後端服務進行TTS');
        await backendSpeech.speakWithBackend(referenceText);
      } else {
        console.log('嘗試直接使用Azure API進行TTS');
        if (azureSettings.key && azureSettings.region) {
          await azureSpeech.speakWithAzure(referenceText, azureSettings);
        } else {
          throw new Error('未設置Azure憑據，無法使用語音服務');
        }
      }
    } catch (err) {
      console.error('所有文本轉語音方法均失敗:', err);
      setError(`文本轉語音失敗: ${err instanceof Error ? err.message : String(err)}`);
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
      <h2 className="pa-title">發音評分</h2>
      <p 
        className="pa-subtitle" 
        onClick={() => {
          // 如果從後端切換到前端，需要檢查Azure憑據
          if (useBackend && (!azureSettings.key || !azureSettings.region)) {
            setShowAzureSettings(true);
            return; // 等用戶填寫設置后再切換
          }
          
          const newMode = !useBackend; // 切換模式
          setUseBackend(newMode);
          storage.saveUseBackend(newMode);
        }}
        style={{ 
          color: useBackend ? 'var(--ios-text-secondary)' : 'var(--ios-primary)',
          cursor: 'pointer'
        }}
      >
        測試中25年0519更新
      </p>
      
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
          {/* 添加选项卡导航 */}
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
              AI助手
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
              
              <div className="integrated-input-container">
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
              title="添加到收藏"
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
                    className={`btn ${isAssessing || recorder.recording ? "btn-danger" : "btn-primary"} btn-flex-1-5`}
            >
                    <i className="fas fa-microphone mic-icon-margin"></i>
              {isAssessing || recorder.recording
                ? "停止錄音"
                : isLoading
                ? "處理中..."
                      : "評分"}
            </button>
            
                  {/* 發音按鈕 */}
            <button
              onClick={() => {
                speakText();
              }}
              disabled={isLoading || streamLoading || !referenceText}
                    className={`btn btn-success btn-flex-0-5 ${(isLoading || streamLoading || !referenceText) ? 'btn-disabled' : ''}`}
                    title={!useBackend ? "使用AI語音播放" : "使用內建語音播放"}
                  >
                    <i className={`fas ${!useBackend ? 'fa-broadcast-tower' : 'fa-volume-up'}`}></i>
                  </button>
                  
                  {/* 前一句按鈕 - 使用統一的按鈕寬度 */}
                  <button
                    onClick={goToPreviousSentence}
                    disabled={favorites.length === 0}
                    className={`btn btn-nav btn-flex-0-75 ${favorites.length === 0 ? 'btn-disabled' : ''}`}
            >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {/* 下一句按鈕 - 使用統一的按鈕寬度 */}
                  <button
                    onClick={goToNextSentence}
                    disabled={favorites.length === 0}
                    className={`btn btn-nav btn-flex-0-75 ${favorites.length === 0 ? 'btn-disabled' : ''}`}
                  >
                    <i className="fas fa-chevron-right"></i>
            </button>
                </div>
            
            {isAssessing && <div className="recording-indicator">錄音中... (最長30秒)</div>}
            
            {isLoading && <div className="loading-indicator">處理中...</div>}
            
            {streamLoading && <div className="loading-indicator stream-loading">流式處理中...</div>}
            
            {cacheTipVisible && <div className="cache-tip">使用已緩存的語音</div>}
          </div>
            </>
          )}
          
          {/* AI助手 TAB */}
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
                  <ScoreBar label="Accuracy" value={pa.AccuracyScore ?? pa.accuracyScore ?? 0} />
                  <ScoreBar label="Fluency" value={pa.FluencyScore ?? pa.fluencyScore ?? 0} />
                  <ScoreBar label="Completeness" value={pa.CompletenessScore ?? pa.completenessScore ?? 0} />
                  <ScoreBar label="Pronunciation" value={pa.PronScore ?? pa.pronScore ?? result.pronunciationScore ?? 0} />
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
                <ScoreBar label="Accuracy" value={result.accuracyScore || 0} />
                <ScoreBar label="Fluency" value={result.fluencyScore || 0} />
                <ScoreBar label="Completeness" value={result.completenessScore || 0} />
                <ScoreBar label="Pronunciation" value={result.pronunciationScore || 0} />
              </div>
            );
          } catch (err) {
            console.error('解析評分資料失敗', err);
            return null;
          }
        })()}
        
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
                  availableVoices={availableVoices}
                  selectedVoice={selectedVoice}
                  onSelectVoice={handleSelectVoice}
                  onSearchChange={handleVoiceSearchChange}
                  rate={voiceSettings.rate}
                  onRateChange={handleSpeechRateChange}
                  useAzureDirect={!useBackend}
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
        
        {/* 添加动画样式 */}
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