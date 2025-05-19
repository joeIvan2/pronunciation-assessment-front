import React, { useState, useRef, useEffect } from "react";
import Tesseract from "tesseract.js";
import "../styles/PronunciationAssessment.css";

// 组件导入
import ScoreBar from "../components/ScoreBar";
import ErrorTypeTag from "../components/ErrorTypeTag";
import Word from "../components/Word";
import WordsDisplay from "../components/WordsDisplay";
import TagManager from "../components/TagManager";
import VoicePicker from "../components/VoicePicker";
import FavoriteList from "../components/FavoriteList";

// 钩子导入
import { useRecorder } from "../hooks/useRecorder";
import { useBackendSpeech } from "../hooks/useBackendSpeech";
import { useAzureSpeech } from "../hooks/useAzureSpeech";

// 工具导入
import * as storage from "../utils/storage";

// 类型导入
import { SpeechAssessmentResult, Favorite, Tag, VoiceOption } from "../types/speech";

const PronunciationAssessment: React.FC = () => {
  // 状态定义
  const [result, setResult] = useState<SpeechAssessmentResult | null>(null);
  const [strictMode, setStrictMode] = useState<boolean>(() => storage.getStrictMode());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [useBackend, setUseBackend] = useState<boolean>(() => storage.getUseBackend());
  const [error, setError] = useState<string | null>(null);
  
  // Azure设置
  const [azureSettings, setAzureSettings] = useState(() => storage.getAzureSettings());
  const [showAzureSettings, setShowAzureSettings] = useState<boolean>(false);
  
  // 语音设置
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<VoiceOption | null>(null);
  const [isVoiceExpanded, setIsVoiceExpanded] = useState<boolean>(false);
  const [voiceSettings, setVoiceSettings] = useState(() => storage.getVoiceSettings());
  
  // 标签系统
  const [isTagExpanded, setIsTagExpanded] = useState<boolean>(false);
  const [tags, setTags] = useState<Tag[]>(() => storage.getTags());
  const [nextTagId, setNextTagId] = useState<number>(() => storage.getNextTagId());
  
  // 收藏系统
  const [favorites, setFavorites] = useState<Favorite[]>(() => storage.getFavorites());
  const [nextFavoriteId, setNextFavoriteId] = useState<number>(() => storage.getNextFavoriteId(favorites));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // 文本和界面设置
  const [referenceText, setReferenceText] = useState<string>(() => storage.getReferenceText());
  const [fontSize, setFontSize] = useState<number>(() => storage.getFontSize());
  
  // Refs
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // 使用自定义钩子
  const recorder = useRecorder();
  const backendSpeech = useBackendSpeech();
  const azureSpeech = useAzureSpeech();

  // 在 state 定義區域下方新增 processingRef
  const processingRef = useRef(false);

  // 统一的开始评估入口
  const startAssessment = async () => {
    try {
      setError(null);
      setResult(null);
      setIsAssessing(true);
      
      if (useBackend) {
        // 使用后端API
        await recorder.startRecording();
      } else {
        // 直接使用Azure
        // 检查API key和region是否已设置
        if (!azureSettings.key || !azureSettings.region) {
          setError('请先设置Azure API key和区域');
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
      console.error('启动评估失败:', err);
      setError(`启动评估失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      if (!useBackend) {
        setIsAssessing(false);
        setIsLoading(false);
      }
    }
  };
  
  // 停止评估
  const stopAssessment = () => {
    if (recorder.recording) {
      recorder.stopRecording();
      
      // 如果有录音数据并且使用后端API，则发送到后端
      if (recorder.audioData && useBackend) {
        processPronunciationAssessment();
      }
    }
    
    azureSpeech.cancelAzureSpeech();
    setIsAssessing(false);
  };
  
  // 处理录音评估
  const processPronunciationAssessment = async () => {
    if (!recorder.audioData || processingRef.current) return;
    processingRef.current = true;
    
    try {
      setIsLoading(true); // 在处理录音结果时设置isLoading为true
      
      if (useBackend) {
        // 使用后端API
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
      console.error('评估处理失败:', err);
      setError(`评估处理失败: ${err instanceof Error ? err.message : String(err)}`);
      
      // 如果后端失败，尝试回退到Azure
      if (useBackend) {
        setUseBackend(false);
        storage.saveUseBackend(false);
        alert('后端连接失败，将使用直接连接Azure模式');
      }
    } finally {
      setIsLoading(false);
      processingRef.current = false;
      recorder.resetRecording();
    }
  };
  
  // 统一的文本转语音入口
  const speakText = async () => {
    try {
      if (!referenceText) {
        alert("請先輸入要發音的文字！");
        return;
      }
      
      setIsLoading(true);
      
      // 始终使用浏览器内置的Web Speech API
      if ('speechSynthesis' in window) {
        speakTextWithBrowserAPI();
      } else {
        // 如果不支持Web Speech API，尝试使用后端或Azure
        if (useBackend) {
          await backendSpeech.speakWithBackend(referenceText);
        } else {
          await azureSpeech.speakWithAzure(referenceText, azureSettings);
        }
      }
    } catch (err) {
      console.error('文本转语音失败:', err);
      setError(`文本转语音失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 使用浏览器内置的Web Speech API进行本地文本转语音
  const speakTextWithBrowserAPI = () => {
    try {
      // 检查是否支持语音合成
      if (!('speechSynthesis' in window)) {
        throw new Error('您的浏览器不支持语音合成API');
      }

      // 检查是否有可用的语音
      if (availableVoices.length === 0) {
        setError('语音选项尚未加载，请稍后再试或点击"选择语音"按钮查看状态');
        setIsLoading(false);
        return;
      }
      
      // 创建新的语音合成话语
      const utterance = new SpeechSynthesisUtterance(referenceText);
      
      // 设置语速
      utterance.rate = voiceSettings.rate;
      
      // 如果有选择语音，使用选择的语音
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`使用选择的语音: ${selectedVoice.name}`);
      } else {
        // 如果没有选择语音，尝试使用默认英文语音
        const englishVoices = availableVoices.filter(voice => 
          voice.lang.toLowerCase().includes('en') || 
          voice.name.toLowerCase().includes('english')
        );
        
        if (englishVoices.length > 0) {
          utterance.voice = englishVoices[0];
          console.log(`使用默认英文语音: ${englishVoices[0].name}`);
        }
      }
      
      // 添加事件监听
      utterance.onend = () => {
        setIsLoading(false);
        console.log('语音播放结束');
      };
      
      utterance.onerror = (err) => {
        console.error('语音合成错误:', err);
        setError(`浏览器语音合成出错: ${err.error || '未知错误'}`);
        setIsLoading(false);
      };
      
      // 停止之前可能正在播放的语音
      window.speechSynthesis.cancel();
      
      // 播放语音
      window.speechSynthesis.speak(utterance);
      
      console.log(`使用浏览器内置API播放语音: "${referenceText}"`);
    } catch (err) {
      console.error('浏览器语音合成失败:', err);
      setError(`浏览器语音合成失败: ${err instanceof Error ? err.message : String(err)}`);
      setIsLoading(false);
    }
  };
  
  // 处理粘贴事件，支持文本和图片
  const handlePaste = async (e: React.ClipboardEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      // 检查是否有图片
      if (e.clipboardData.files.length > 0) {
        const file = e.clipboardData.files[0];
        
        if (file.type.startsWith('image/')) {
          // 处理图片OCR
          const result = await Tesseract.recognize(file, 'eng+chi_sim');
          const text = result.data.text.trim();
          setReferenceText(text);
          setIsLoading(false);
          return;
        }
      }
      
      // 处理纯文本
      let text = e.clipboardData.getData('text').trim();
      setReferenceText(text);
    } catch (error) {
      console.error("粘贴处理出错:", error);
      setError(`粘贴内容处理失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 标签相关函数
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
    
    return newTag.id; // 返回新创建的标签ID
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
    // 删除标签
    const updatedTags = tags.filter(tag => tag.id !== id);
    setTags(updatedTags);
    storage.saveTags(updatedTags);
    
    // 从所有收藏中移除该标签
    const updatedFavorites = favorites.map(favorite => ({
      ...favorite,
      tagIds: favorite.tagIds.filter(tagId => tagId !== id)
    }));
    
    setFavorites(updatedFavorites);
    storage.saveFavorites(updatedFavorites);
  };
  
  // 收藏夹相关函数
  const addToFavorites = (text: string, tagIds: string[] = []) => {
    if (!text) {
      alert("請先輸入句子再加入我的最愛！");
      return;
    }
    
    // 检查是否已存在相同文本
    const existingFavorite = favorites.find(fav => fav.text === text);
    if (existingFavorite) {
      // 如果存在，只更新标签
      updateFavoriteTags(existingFavorite.id, tagIds.length ? tagIds : selectedTags);
      alert("此句子已在我的最愛！已更新標籤。");
      return;
    }
    
    // 添加新收藏
    const newFavorite = {
      id: nextFavoriteId.toString(),
      text: text,
      tagIds: tagIds.length ? tagIds : selectedTags, // 使用当前选中的标签或指定的标签
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
      setSelectedTags(favorite.tagIds); // 更新当前选中的标签
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
        // 如果标签已存在，则移除；否则添加
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
  
  // 标签选择相关
  const toggleTagSelection = (tagId: string) => {
    const updatedSelection = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(updatedSelection);
  };
  
  const clearTagSelection = () => {
    setSelectedTags([]);
  };
  
  // 处理参考文本变更
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
  
  // 语音设置相关
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
    setSelectedVoice(voice);
    storage.saveVoiceSettings({
      voiceName: voice.name,
      voiceLang: voice.lang
    });
  };
  
  // 确保在组件加载时预加载语音
  useEffect(() => {
    // 在某些浏览器中，voices列表可能需要时间加载
    if ('speechSynthesis' in window) {
      // 获取当前可用的语音
      const loadVoices = () => {
        const voices = speechSynthesis.getVoices();
        console.log(`加载了${voices.length}个语音选项`);
        setAvailableVoices(voices);
        
        // 如果没有选择过语音，默认选择一个合适的
        if (!selectedVoice && voices.length > 0) {
          // 尝试找到一个合适的默认语音
          const savedVoiceName = voiceSettings.voiceName;
          const savedVoiceLang = voiceSettings.voiceLang;
          
          // 将null改为undefined以修复类型错误
          let preferredVoice: SpeechSynthesisVoice | undefined = undefined;
          
          // 如果之前有选择过语音，尝试找到相同的语音
          if (savedVoiceName) {
            preferredVoice = voices.find(voice => voice.name === savedVoiceName && voice.lang === savedVoiceLang);
          }
          
          // 如果没有找到相同的语音，则尝试找到一个合适的英文语音
          if (!preferredVoice) {
            // 在所有语音中选择一个英文语音
            const englishVoices = voices.filter(voice => 
              voice.name.toLowerCase().includes('english') || 
              voice.lang.toLowerCase().includes('en')
            );
            
            // 如果没有找到英文语音，则选择第一个语音
            preferredVoice = englishVoices.length > 0 ? englishVoices[0] : voices[0];
          }
          
          if (preferredVoice) {
            setSelectedVoice(preferredVoice);
            console.log(`自动选择语音: ${preferredVoice.name}`);
          }
        }
      };
      
      // 首次加载尝试
      loadVoices();
      
      // 监听voices加载完成事件
      speechSynthesis.onvoiceschanged = loadVoices;
      
      // 清理函数
      return () => {
        speechSynthesis.onvoiceschanged = null;
      };
    }
  }, [selectedVoice, voiceSettings]);
  
  // 处理录音状态变化
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

  // JSX 渲染部分
  return (
    <div className="pa-container">
      <h2 className="pa-title">發音評分</h2>
      <p 
        className="pa-subtitle" 
        onClick={() => {
          // 如果从后端切换到前端，需要检查Azure凭据
          if (useBackend && (!azureSettings.key || !azureSettings.region)) {
            setShowAzureSettings(true);
            return; // 等用户填写设置后再切换
          }
          
          const newMode = !useBackend; // 切换模式
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
      
      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}
      
      {/* 主要功能区域 */}
      <div className="pa-main-content">
        {/* 输入区域 */}
        <div className="card-section">
          <h3 className="section-header special-title">輸入文本</h3>
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
        
        {/* 控制按钮区域 */}
        <div className="pa-button-container">
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
            朗讀文本
          </button>
        </div>
        
        {/* 结果显示区域 */}
        {result && (() => {
          try {
            // Azure 直連或後端含 NBest
            const nbestArray = result.NBest || result.nBest || result.nbest;
            if (Array.isArray(nbestArray) && nbestArray.length > 0) {
              const nbest = nbestArray[0];
              const pa = (nbest as any).pronunciationAssessment || nbest.PronunciationAssessment || {};
              const words = nbest.Words || (nbest as any).words || [];
              return (
                <div className="result-section">
                  <h3>總分</h3>
                  <ScoreBar label="Accuracy" value={pa.AccuracyScore ?? pa.accuracyScore ?? 0} />
                  <ScoreBar label="Fluency" value={pa.FluencyScore ?? pa.fluencyScore ?? 0} />
                  <ScoreBar label="Completeness" value={pa.CompletenessScore ?? pa.completenessScore ?? 0} />
                  <ScoreBar label="Pronunciation" value={pa.PronScore ?? pa.pronScore ?? result.pronunciationScore ?? 0} />
                  <h3>句子分析</h3>
                  {words.length > 0 ? (
                    <WordsDisplay words={words} />
                  ) : (
                    <p>無法獲取詳細單詞評分數據</p>
                  )}
                  <h4>識別文本</h4>
                  <p className="recognized-text">
                    {nbest.Display || nbest.display || result.DisplayText || result.text || "--"}
                  </p>
                </div>
              );
            }

            // 後端扁平化結果 (無 NBest)
            return (
              <div className="result-section">
                <h3>評分結果</h3>
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
        
        {/* 收藏列表 */}
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
          onManageTags={() => setIsTagExpanded(!isTagExpanded)}
          currentText={referenceText}
        />
        
        {/* 標籤管理面板 */}
        <TagManager
          tags={tags}
          onAddTag={addTag}
          onEditTag={editTag}
          onDeleteTag={deleteTag}
          isExpanded={isTagExpanded}
          onToggleExpand={() => setIsTagExpanded(!isTagExpanded)}
        />
        
        {/* 語音選擇面板 */}
        <VoicePicker
          availableVoices={availableVoices}
          selectedVoice={selectedVoice}
          voiceSearchTerm={voiceSettings.searchTerm}
          speechRate={voiceSettings.rate}
          referenceText={referenceText}
          onSelectVoice={handleSelectVoice}
          onChangeSearchTerm={handleVoiceSearchChange}
          onChangeSpeechRate={handleSpeechRateChange}
          isExpanded={isVoiceExpanded}
          onToggleExpand={() => setIsVoiceExpanded(!isVoiceExpanded)}
        />
        
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