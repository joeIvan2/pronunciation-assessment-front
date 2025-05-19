import React, { useState, useRef, useEffect } from "react";
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

// 鉤子導入
import { useRecorder } from "../hooks/useRecorder";
import { useBackendSpeech } from "../hooks/useBackendSpeech";
import { useAzureSpeech } from "../hooks/useAzureSpeech";

// 工具導入
import * as storage from "../utils/storage";

// 類型導入
import { SpeechAssessmentResult, Favorite, Tag, VoiceOption } from "../types/speech";

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
  const [activeTab, setActiveTab] = useState<storage.TabName>(() => storage.getActiveTab());
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 使用自定義鉤子
  const recorder = useRecorder();
  const backendSpeech = useBackendSpeech();
  const azureSpeech = useAzureSpeech();

  // 在 state 定義區域下方新增 processingRef
  const processingRef = useRef(false);

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
  
  // 處理錄音評估
  const processPronunciationAssessment = async () => {
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
  };
  
  // 統一的文本轉語音入口
  const speakText = async () => {
    try {
      if (!referenceText) {
        alert("請先輸入要發音的文字！");
        return;
      }
      
      setIsLoading(true);
      
      // 始終使用瀏覽器內置的Web Speech API
      if ('speechSynthesis' in window) {
        speakTextWithBrowserAPI();
      } else {
        // 如果不支持Web Speech API，嘗試使用後端或Azure
        if (useBackend) {
          await backendSpeech.speakWithBackend(referenceText);
        } else {
          await azureSpeech.speakWithAzure(referenceText, azureSettings);
        }
      }
    } catch (err) {
      console.error('文本轉語音失敗:', err);
      setError(`文本轉語音失敗: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 使用瀏覽器內置的Web Speech API進行本地文本轉語音
  const speakTextWithBrowserAPI = () => {
    try {
      // 檢查是否支援語音合成
      if (!('speechSynthesis' in window)) {
        throw new Error('您的瀏覽器不支援語音合成API');
      }

      const synth = window.speechSynthesis;
      
      // 優先使用選定的語音，其次尋找任何英文語音
      let voice = null;
      if (selectedVoice) {
        // 使用選定的語音
        voice = synth.getVoices().find(v => v.name === selectedVoice.name);
      }
      
      // 如果沒有找到選定的語音，尋找任何英文語音
      if (!voice) {
        voice = synth.getVoices().find(v => 
          v.lang.toLowerCase().includes('en') || 
          v.name.toLowerCase().includes('english')
        );
      }

      if (!voice) {
        setError('裝置未提供英文語音，請選擇一個可用的語音');
        setIsLoading(false);
        return;
      }

      const speak = (txt: string) => {
        const u = new SpeechSynthesisUtterance(txt);
        u.voice = voice;
        u.lang = voice.lang; // 使用語音自帶的語言設置
        u.rate = voiceSettings.rate;
        
        // 添加事件監聽
        u.onend = () => {
          console.log('語音片段播放結束');
        };
        
        u.onerror = (err) => {
          console.error('語音合成錯誤:', err);
          setError(`瀏覽器語音合成出錯: ${err.error || '未知錯誤'}`);
          setIsLoading(false);
        };
        
        synth.speak(u);
      };

      // iOS: 長文本分段，其他一次唸
      const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const chunks = isiOS && referenceText.length > 150
        ? referenceText.match(/[^.!?…。\n]+[.!?…。\n]?/g) || []
        : [referenceText];

      synth.cancel();
      chunks.forEach(c => speak(c.trim()));
      
      console.log(`使用語音 ${voice.name} (${voice.lang}) 播放: "${referenceText.substring(0, 30)}..."${isiOS ? '（iOS分段模式）' : ''}`);
      
      // 設置延時檢查所有片段是否播放完畢
      const checkAllChunksCompleted = () => {
        if (synth.speaking) {
          // 如果還在播放，繼續等待
          setTimeout(checkAllChunksCompleted, 300);
        } else {
          // 所有片段播放完畢
          setIsLoading(false);
          console.log('所有語音片段播放完畢');
        }
      };
      
      // 開始檢查
      setTimeout(checkAllChunksCompleted, 300);
      
    } catch (err) {
      console.error('瀏覽器語音合成失敗:', err);
      setError(`瀏覽器語音合成失敗: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
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
    const newTag = {
      id: nextTagId.toString(),
      name: name,
      color: color,
      createdAt: Date.now()
    };
    
    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    storage.saveTags(updatedTags);
    
    const newNextId = nextTagId + 1;
    setNextTagId(newNextId);
    storage.saveNextTagId(newNextId);
    
    return newTag.id; // 返回新創建的標籤ID
  };
  
  const editTag = (id: string, newName: string, newColor?: string) => {
    const updatedTags = tags.map(tag => 
      tag.id === id 
        ? { ...tag, name: newName || tag.name, color: newColor || tag.color } 
        : tag
    );
    
    setTags(updatedTags);
    storage.saveTags(updatedTags);
  };
  
  const deleteTag = (id: string) => {
    // 刪除標籤
    const updatedTags = tags.filter(tag => tag.id !== id);
    setTags(updatedTags);
    storage.saveTags(updatedTags);
    
    // 從所有收藏中移除該標籤
    const updatedFavorites = favorites.map(favorite => ({
      ...favorite,
      tagIds: favorite.tagIds.filter(tagId => tagId !== id)
    }));
    
    setFavorites(updatedFavorites);
    storage.saveFavorites(updatedFavorites);
  };
  
  // 收藏夾相關函數
  const addToFavorites = (text: string, tagIds: string[] = []) => {
    if (!text) {
      alert("請先輸入句子再加入我的最愛！");
      return;
    }
    
    // 檢查是否已存在相同文本
    const existingFavorite = favorites.find(fav => fav.text === text);
    if (existingFavorite) {
      // 如果存在，只更新標籤
      updateFavoriteTags(existingFavorite.id, tagIds.length ? tagIds : selectedTags);
      alert("此句子已在我的最愛！已更新標籤。");
      return;
    }
    
    // 添加新收藏
    const newFavorite = {
      id: nextFavoriteId.toString(),
      text: text,
      tagIds: tagIds.length ? tagIds : selectedTags, // 使用當前選中的標籤或指定的標籤
      createdAt: Date.now()
    };
    
    const updatedFavorites = [...favorites].slice(-19).concat(newFavorite);
    setFavorites(updatedFavorites);
    storage.saveFavorites(updatedFavorites);
    
    const newNextId = nextFavoriteId + 1;
    setNextFavoriteId(newNextId);
    storage.saveNextFavoriteId(newNextId);
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
      setSelectedTags(favorite.tagIds); // 更新當前選中的標籤
      storage.saveReferenceText(favorite.text);
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
    
    // 保存語音設置到本地存儲
    storage.saveVoiceSettings({
      voiceName: voice.name,
      voiceLang: voice.lang
    });
    
    // 預先測試一下選擇的語音
    const testUtterance = new SpeechSynthesisUtterance('Test');
    testUtterance.voice = voice;
    testUtterance.volume = 0; // 靜音測試
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
        
        // 如果沒有選擇過語音，默認選擇一個可用的英文語音
        if (!selectedVoice && enVoices.length > 0) {
          // 優先選擇 en-US 語音，如果沒有則用第一個
          const usVoice = enVoices.find(v => v.lang === 'en-US');
          const preferredVoice = usVoice || enVoices[0];
          
          console.log(`設置語音: ${preferredVoice.name}, ${preferredVoice.lang}`);
          setSelectedVoice(preferredVoice);
          
          // 保存語音設置
          storage.saveVoiceSettings({
            voiceName: preferredVoice.name,
            voiceLang: preferredVoice.lang
          });
        }
      };
      
      // 首次加載嘗試
      loadVoices();
      
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
      try {
        const nbestArray = result.NBest || result.nBest || result.nbest;
        if (Array.isArray(nbestArray) && nbestArray.length > 0) {
          const nbest = nbestArray[0];
          words = nbest.Words || (nbest as any).words || [];
        }
      } catch (err) {
        console.error('提取單詞評分數據失敗:', err);
      }

      // 生成一個唯一ID，使用時間戳加隨機數
      const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // 檢查當前記錄是否已經存在相似記錄（同一文本和相近時間）
      const existingRecords = storage.getHistoryRecords();
      const last5Seconds = Date.now() - 5000; // 5秒內
      
      const hasSimilarRecord = existingRecords.some(record => 
        record.text === referenceText && 
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
          recognizedText: result.DisplayText || result.text || '',
          words: words // 保存單詞評分數據
        });
        setHistoryRecords(storage.getHistoryRecords());
      } else {
        console.log('檢測到重複的歷史記錄，已忽略');
      }
    }
  }, [result, referenceText]);

  // 切換標籤頁
  const handleTabChange = (tab: storage.TabName) => {
    setActiveTab(tab);
    storage.saveActiveTab(tab);
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
        {/* 輸入區域 */}
        <div className="card-section">
          <h3 
            className="section-header special-title"
            onClick={() => {
              // 輸入文本區域始終保持展開狀態
              textareaRef.current?.focus();
            }}
            style={{ cursor: 'pointer' }}
          >
            輸入文本
          </h3>
          <div className="input-container">
            <textarea
              ref={textareaRef}
              value={referenceText}
              onChange={handleReferenceTextChange}
              onPaste={handlePaste}
              className="textarea-input"
              style={{ fontSize: `${fontSize}px` }}
              placeholder="輸入或粘貼要練習的文本..."
            />
          </div>
          <div className="text-controls">
            <button
              onClick={() => addToFavorites(referenceText)}
              disabled={!referenceText}
              className="btn-favorite"
              title="添加到收藏"
            >
              <span>★</span>
            </button>
            <div className="font-size-controls">
              <button onClick={decreaseFontSize} className="btn-size-control">
                <span style={{ fontSize: "14px" }}>A-</span>
              </button>
              <span className="font-size-display">{fontSize}px</span>
              <button onClick={increaseFontSize} className="btn-size-control">
                <span style={{ fontSize: "14px" }}>A+</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* 控制按鈕區域 */}
        <div className="card-section">
          <h3 
            className="section-header special-title"
            onClick={() => {
              // 錄音評分區域始終保持展開狀態
            }}
            style={{ cursor: 'pointer' }}
          >
            錄音評分
          </h3>
          <div className="button-controls">
            <button
              onClick={isAssessing || recorder.recording ? stopAssessment : startAssessment}
              disabled={(isLoading && !isAssessing && !recorder.recording) || (!isAssessing && !recorder.recording && !referenceText)}
              className={`btn ${isAssessing || recorder.recording ? "btn-danger" : "btn-primary"}`}
            >
              {isAssessing || recorder.recording
                ? "停止錄音"
                : isLoading
                ? "處理中..."
                : "開始錄音評分"}
            </button>
            
            <button
              onClick={speakText}
              disabled={isLoading || !referenceText}
              className="btn btn-success"
              style={{ opacity: isLoading || !referenceText ? 0.55 : 1, cursor: isLoading || !referenceText ? "not-allowed" : "pointer" }}
            >
              英文朗讀
            </button>
          </div>
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
                className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => handleTabChange('history')}
              >
                發音歷史
              </button>
              <button 
                className={`tab-button ${activeTab === 'favorites' ? 'active' : ''}`}
                onClick={() => handleTabChange('favorites')}
              >
                我的最愛
              </button>
              <button 
                className={`tab-button ${activeTab === 'tags' ? 'active' : ''}`}
                onClick={() => handleTabChange('tags')}
              >
                管理標籤
              </button>
              <button 
                className={`tab-button ${activeTab === 'voices' ? 'active' : ''}`}
                onClick={() => handleTabChange('voices')}
              >
                選擇語音
              </button>
            </div>
            
            <div className="tab-content">
              {/* 歷史記錄標籤頁 */}
              {activeTab === 'history' && (
                <HistoryRecord
                  historyRecords={historyRecords}
                  onDeleteRecord={handleDeleteHistoryRecord}
                  onClearRecords={handleClearHistoryRecords}
                  onLoadText={handleLoadHistoryText}
                  isExpanded={true} // 標籤頁模式下始終展開
                  onToggleExpand={() => {}} // 標籤頁模式下不需要切換展開狀態
                />
              )}
              
              {/* 收藏列表標籤頁 */}
              {activeTab === 'favorites' && (
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
                />
              )}
              
              {/* 標籤管理標籤頁 */}
              {activeTab === 'tags' && (
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
              {activeTab === 'voices' && (
                <VoicePicker
                  availableVoices={availableVoices}
                  selectedVoice={selectedVoice}
                  voiceSearchTerm={voiceSettings.searchTerm}
                  speechRate={voiceSettings.rate}
                  referenceText={referenceText}
                  onSelectVoice={handleSelectVoice}
                  onChangeSearchTerm={handleVoiceSearchChange}
                  onChangeSpeechRate={handleSpeechRateChange}
                  isExpanded={true} // 標籤頁模式下始終展開
                  onToggleExpand={() => {}} // 標籤頁模式下不需要切換展開狀態
                />
              )}
            </div>
          </div>
        </div>
        
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