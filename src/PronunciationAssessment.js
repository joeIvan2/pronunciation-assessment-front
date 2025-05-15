// Azure Speech SDK 发音评分应用 - 带有根据分数变色功能
import React, { useState, useRef, useEffect } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import Tesseract from "tesseract.js";

// 后端API地址
const BACKEND_URL = "https://pronunciation-assessment-app-1.onrender.com";
// Azure配置（备用，将优先使用后端API）
const AZURE_KEY = "6De1xcmCRcloGS9zt9dRsW6l31tzdsX2nYznw99BppG8OKDqrSIEJQQJ99BEACxCCsyXJ3w3AAAYACOGgvSV";
const AZURE_REGION = "japanwest"; // 例如 southeastasia

function ScoreBar({ label, value, max = 100 }) {
  return (
    <div style={{ margin: "8px 0" }}>
      <div style={{ fontWeight: "bold", color: "#fff" }}>{label}: {value}</div>
      <div style={{ background: "#333", borderRadius: 4, height: 12 }}>
        <div style={{
          width: `${(value / max) * 100}%`,
          background: "#4caf50",
          height: "100%",
          borderRadius: 4
        }} />
      </div>
    </div>
  );
}

function ErrorTypeTag({ type }) {
  if (!type || type === "None") return null;
  const color = {
    Mispronunciation: "#e53935",
    Omission: "#ffb300",
    Insertion: "#1e88e5",
    "UnexpectedBreak": "#8e24aa",
    "MissingBreak": "#fbc02d"
  }[type] || "#757575";
  return (
    <span style={{
      background: color,
      color: "#fff",
      borderRadius: 4,
      padding: "2px 6px",
      marginLeft: 6,
      fontSize: 12
    }}>{type}</span>
  );
}

function Word({ word, onClick, isSelected }) {
  // 计算分数颜色，100分为绿色(#4caf50)，0分为红色(#e53935)，中间根据分数线性插值
  const getScoreColor = (score) => {
    if (score === undefined || score === null) return "#bbb";
    // 将分数限制在0-100之间
    const normalizedScore = Math.max(0, Math.min(100, score));
    // 计算红绿色值
    const red = Math.round(229 - (normalizedScore / 100) * (229 - 76));
    const green = Math.round(57 + (normalizedScore / 100) * (175 - 57));
    const blue = Math.round(53 + (normalizedScore / 100) * (80 - 53));
    return `rgb(${red}, ${green}, ${blue})`;
  };

  const accuracyScore = word.PronunciationAssessment?.AccuracyScore;
  const scoreColor = getScoreColor(accuracyScore);

  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-block",
        margin: "0 8px 16px 8px",
        textAlign: "center",
        cursor: "pointer",
        borderBottom: isSelected ? "2px solid #4cafef" : "none",
        padding: "4px",
      }}
    >
      <div style={{ fontSize: "1.2em", marginBottom: "4px" }}>{word.Word}</div>
      <div style={{ fontSize: "0.9em", color: scoreColor, fontWeight: "bold" }}>
        {accuracyScore ?? "-"}
      </div>
      {isSelected && word.Phonemes && (
        <div style={{ 
          marginTop: "8px", 
          background: "#23272f", 
          padding: "8px",
          borderRadius: "4px",
          position: "absolute",
          zIndex: 10,
          boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
        }}>
          {word.Phonemes.map((p, i) => {
            const phonemeScore = p.PronunciationAssessment?.AccuracyScore;
            const phonemeColor = getScoreColor(phonemeScore);
            return (
              <div key={i} style={{ margin: "4px 0", color: "#ddd" }}>
                {p.Phoneme}: <span style={{ color: phonemeColor, fontWeight: "bold" }}>{phonemeScore ?? "-"}</span>
              </div>
            );
          })}
        </div>
      )}
      <ErrorTypeTag type={word.PronunciationAssessment?.ErrorType} />
    </div>
  );
}

function WordsDisplay({ words }) {
  const [selectedWord, setSelectedWord] = useState(null);

  return (
    <div style={{ 
      display: "flex", 
      flexWrap: "wrap", 
      background: "#23272f", 
      padding: "16px", 
      borderRadius: "8px",
      marginTop: "16px"
    }}>
      {words.map((word, index) => (
        <Word 
          key={index} 
          word={word} 
          isSelected={selectedWord === index}
          onClick={() => setSelectedWord(selectedWord === index ? null : index)}
        />
      ))}
    </div>
  );
}

export default function PronunciationAssessment() {
  const [result, setResult] = useState(null);
  const [recording, setRecording] = useState(false);
  const [strictMode, setStrictMode] = useState(true); // 預設使用嚴格模式
  const [isLoading, setIsLoading] = useState(false); // 新增加载状态
  const [useBackend, setUseBackend] = useState(true); // 是否使用后端API
  const [error, setError] = useState(null); // 错误信息

  // 從 localStorage 讀取初始值，若無則使用預設值
  const [referenceText, setReferenceText] = useState(
    localStorage.getItem("referenceText") || "Hello, how are you?"
  );
  const [fontSize, setFontSize] = useState(() => {
    const savedFontSize = localStorage.getItem('fontSize');
    return savedFontSize !== null ? parseInt(savedFontSize, 10) : 16;
  });
  const [favorites, setFavorites] = useState(() => {
    const savedFavorites = localStorage.getItem('favorites');
    return savedFavorites !== null ? JSON.parse(savedFavorites) : [];
  });

  const recognizerRef = useRef(null);
  const textareaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 使用后端API进行语音评估
  const startAssessmentWithBackend = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setRecording(true);
      
      // 开始录音
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };
      
      mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const formData = new FormData();
          formData.append('audio', audioBlob);
          formData.append('referenceText', referenceText);
          formData.append('strictMode', strictMode);
          
          // 发送到后端
          const response = await fetch(`${BACKEND_URL}/api/pronunciation-assessment`, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`后端请求失败: ${response.status}`);
          }
          
          const data = await response.json();
          setResult({
            accuracy: data.accuracyScore,
            fluency: data.fluencyScore,
            completeness: data.completenessScore,
            pronScore: data.pronunciationScore,
            json: JSON.stringify(data)
          });
        } catch (err) {
          console.error('处理录音失败:', err);
          setError(`处理录音失败: ${err.message}`);
          // 如果后端失败，回退到直接使用Azure
          if (useBackend) {
            setUseBackend(false);
            alert('后端连接失败，将使用直接连接Azure模式');
            startAssessmentWithAzure();
          }
        } finally {
          setRecording(false);
          setIsLoading(false);
          // 关闭麦克风
          stream.getTracks().forEach(track => track.stop());
        }
      };
      
      mediaRecorder.start();
    } catch (err) {
      console.error('启动录音失败:', err);
      setError(`启动录音失败: ${err.message}`);
      setRecording(false);
      setIsLoading(false);
    }
  };

  // 原始的Azure直接调用方法（保留作为备用）
  const startAssessmentWithAzure = () => {
    setResult(null);
    setRecording(true);
    setIsLoading(true);
    setError(null);
    
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
    speechConfig.speechRecognitionLanguage = "en-US";
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    const pronunciationAssessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
      referenceText,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    
    // 啟用嚴格評分模式
    pronunciationAssessmentConfig.enableStrictAccuracy = strictMode;

    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    recognizerRef.current = recognizer;
    pronunciationAssessmentConfig.applyTo(recognizer);

    recognizer.recognizeOnceAsync((res) => {
      setRecording(false);
      setIsLoading(false);
      const paResult = SpeechSDK.PronunciationAssessmentResult.fromResult(res);
      setResult({
        accuracy: paResult.accuracyScore,
        fluency: paResult.fluencyScore,
        completeness: paResult.completenessScore,
        pronScore: paResult.pronunciationScore,
        json: res.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult)
      });
    }, (error) => {
      console.error('Azure语音识别失败:', error);
      setError(`Azure语音识别失败: ${error}`);
      setRecording(false);
      setIsLoading(false);
    });
  };

  // 统一的开始评估入口
  const startAssessment = () => {
    if (useBackend) {
      startAssessmentWithBackend();
    } else {
      startAssessmentWithAzure();
    }
  };

  const stopAssessment = () => {
    setRecording(false);
    
    // 停止后端录音
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    // 停止Azure识别
    if (recognizerRef.current) {
      recognizerRef.current.close();
      recognizerRef.current = null;
    }
  };

  // 使用后端API进行文本转语音
  const speakTextWithBackend = async () => {
    try {
      if (!referenceText) {
        alert("請先輸入要發音的文字！");
        return;
      }
      
      setIsLoading(true);
      
      // 发送请求到后端
      const response = await fetch(`${BACKEND_URL}/api/text-to-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: referenceText }),
      });
      
      if (!response.ok) {
        throw new Error(`后端请求失败: ${response.status}`);
      }
      
      // 获取音频数据并播放
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error('文本转语音失败:', err);
      setError(`文本转语音失败: ${err.message}`);
      // 如果后端失败，回退到直接使用Azure
      if (useBackend) {
        setUseBackend(false);
        alert('后端连接失败，将使用直接连接Azure模式');
        speakTextWithAzure();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 原始的Azure直接调用方法（保留作为备用）
  const speakTextWithAzure = () => {
    if (!referenceText) {
      alert("請先輸入要發音的文字！");
      return;
    }
    
    setIsLoading(true);
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
    // 你可以根據需要設定特定的語音，例如：
    // speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"; // 英文女聲
    // speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoxiaoNeural"; // 中文女聲
    // 更多語音請參考 Azure 文件：https://aka.ms/speech/tts-languages

    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);

    synthesizer.speakTextAsync(
      referenceText,
      result => {
        setIsLoading(false);
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log("語音合成完成");
        } else {
          console.error("語音合成失敗：", result.errorDetails);
          setError(`語音合成失敗：${result.errorDetails}`);
        }
        synthesizer.close();
      },
      error => {
        setIsLoading(false);
        console.error("語音合成發生錯誤：", error);
        setError(`語音合成發生錯誤：${error}`);
        synthesizer.close();
      }
    );
  };

  // 统一的文本转语音入口
  const speakText = () => {
    if (useBackend) {
      speakTextWithBackend();
    } else {
      speakTextWithAzure();
    }
  };

  // 收藏夹相关函数
  const addToFavorites = () => {
    if (referenceText && !favorites.includes(referenceText)) {
      setFavorites(prevFavorites => [...prevFavorites, referenceText].slice(-10)); // 最多只保留最近10筆
    } else if (favorites.includes(referenceText)) {
      alert("此句子已在我的最愛！");
    } else {
      alert("請先輸入句子再加入我的最愛！");
    }
  };

  const removeFromFavorite = (textToRemove) => {
    setFavorites(prevFavorites => prevFavorites.filter(fav => fav !== textToRemove));
  };

  const loadFavorite = (textToLoad) => {
    setReferenceText(textToLoad);
  };

  // 切换API模式
  const toggleApiMode = () => {
    setUseBackend(!useBackend);
    localStorage.setItem('useBackend', (!useBackend).toString());
  };

  // 初始化时从localStorage读取API模式设置
  useEffect(() => {
    const savedUseBackend = localStorage.getItem('useBackend');
    if (savedUseBackend !== null) {
      setUseBackend(savedUseBackend === 'true');
    }
  }, []);

  // OCR 處理圖片
  const handlePaste = async (event) => {
    const items = event.clipboardData.items;
    let imageItem = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        imageItem = items[i];
        break;
      }
    }
    if (imageItem) {
      event.preventDefault();
      const file = imageItem.getAsFile();
      const reader = new FileReader();
      reader.onload = async function (e) {
        // 可選：顯示 loading 狀態
        const { data: { text } } = await Tesseract.recognize(
          e.target.result,
          'chi_sim+eng',
        );
        // 插入到光標處
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const newValue = value.substring(0, start) + text + value.substring(end);
        setReferenceText(newValue);
        // 等待 setState 完成後設置光標
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + text.length;
        }, 0);
      };
      reader.readAsDataURL(file);
    }
  };

  // 保存 referenceText 到 localStorage
  useEffect(() => {
    localStorage.setItem("referenceText", referenceText);
  }, [referenceText]);

  // 保存 fontSize 到 localStorage
  useEffect(() => {
    localStorage.setItem('fontSize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  return (
    <div style={{ background: "#181c23", minHeight: "100vh", color: "#fff", padding: 24 }}>
      <h2 style={{ color: "#4cafef" }}>發音評分（React + Azure）</h2>
      
      {error && (
        <div style={{ 
          background: "#c62828", 
          color: "white", 
          padding: "10px", 
          borderRadius: "4px", 
          marginBottom: "16px" 
        }}>
          {error}
        </div>
      )}
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <textarea
            ref={textareaRef}
            value={referenceText}
            onChange={e => setReferenceText(e.target.value)}
            onPaste={handlePaste}
            style={{
              padding: 8,
              borderRadius: 4,
              border: "1px solid #333",
              background: "#23272f",
              color: "#fff",
              width: "100%",
              minHeight: 100,
              resize: "both",
              fontSize: `${fontSize}px`,
              fontFamily: "Arial, sans-serif",
              marginBottom: 8,
              textAlign: "center"
            }}
            placeholder="請輸入你要朗讀的句子"
          />
        </div>
        
        <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
          <label style={{ marginRight: 8, color: "#bbb" }}>字體大小: </label>
          <button 
            onClick={() => setFontSize(Math.max(12, fontSize - 2))}
            style={{ padding: "4px 8px", background: "#333", color: "#fff", border: "none", borderRadius: 4, marginRight: 4 }}
          >
            -
          </button>
          <span style={{ margin: "0 8px", color: "#bbb" }}>{fontSize}px</span>
          <button 
            onClick={() => setFontSize(fontSize + 2)}
            style={{ padding: "4px 8px", background: "#333", color: "#fff", border: "none", borderRadius: 4 }}
          >
            +
          </button>
          
          <div style={{ marginLeft: 24, display: "flex", alignItems: "center" }}>
            <label style={{ marginRight: 8, color: "#bbb" }}>嚴格評分: </label>
            <button 
              onClick={() => setStrictMode(true)} 
              style={{ 
                padding: "4px 8px", 
                background: strictMode ? "#ff5722" : "#333", 
                color: "#fff", 
                border: "none", 
                borderRadius: 4, 
                marginRight: 4,
                fontWeight: strictMode ? "bold" : "normal"
              }}
            >
              嚴格
            </button>
            <button 
              onClick={() => setStrictMode(false)}
              style={{ 
                padding: "4px 8px", 
                background: !strictMode ? "#4cafef" : "#333", 
                color: "#fff", 
                border: "none", 
                borderRadius: 4,
                fontWeight: !strictMode ? "bold" : "normal"
              }}
            >
              標準
            </button>
          </div>
          
          <div style={{ marginLeft: 24, display: "flex", alignItems: "center" }}>
            <label style={{ marginRight: 8, color: "#bbb" }}>API模式: </label>
            <button 
              onClick={toggleApiMode} 
              style={{ 
                padding: "4px 8px", 
                background: useBackend ? "#9c27b0" : "#3f51b5", 
                color: "#fff", 
                border: "none", 
                borderRadius: 4, 
                fontWeight: "bold"
              }}
            >
              {useBackend ? "後端API" : "直連Azure"}
            </button>
          </div>
        </div>
        
        {isLoading && (
          <div style={{ marginBottom: 12, color: "#ff9800" }}>
            處理中...請稍候...
          </div>
        )}
        
        {!recording && (
          <button 
            onClick={startAssessment} 
            disabled={isLoading}
            style={{ 
              padding: "8px 20px", 
              background: isLoading ? "#666" : "#4cafef", 
              color: "#fff", 
              border: "none", 
              borderRadius: 4, 
              fontWeight: "bold", 
              marginRight: "8px",
              cursor: isLoading ? "not-allowed" : "pointer"
            }}
          >
            開始錄音並評分
          </button>
        )}
        {recording && (
          <button onClick={stopAssessment} style={{ padding: "8px 20px", background: "#e53935", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold", marginRight: "8px" }}>
            停止錄音
          </button>
        )}
        <button 
          onClick={speakText} 
          disabled={isLoading}
          style={{ 
            padding: "8px 20px", 
            background: isLoading ? "#666" : "#4caf50", 
            color: "#fff", 
            border: "none", 
            borderRadius: 4, 
            fontWeight: "bold",
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          發音
        </button>
        <button 
          onClick={addToFavorites} 
          disabled={isLoading}
          style={{ 
            padding: "8px 20px", 
            background: isLoading ? "#666" : "#ff9800", 
            color: "#fff", 
            border: "none", 
            borderRadius: 4, 
            fontWeight: "bold", 
            marginLeft: "8px",
            cursor: isLoading ? "not-allowed" : "pointer"
          }}
        >
          加入我的最愛
        </button>
      </div>
      
      {favorites.length > 0 && (
        <div style={{ marginTop: 24, marginBottom: 16 }}>
          <h3 style={{ color: "#4cafef", marginBottom: 8 }}>我的最愛</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {favorites.map((fav, index) => (
              <li 
                key={index} 
                style={{
                  background: "#23272f", 
                  padding: "8px 12px", 
                  borderRadius: 4, 
                  marginBottom: 8, 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center"
                }}
              >
                <span 
                  onClick={() => loadFavorite(fav)} 
                  style={{ cursor: "pointer", flexGrow: 1, marginRight: 8, color: "#eee" }}
                >
                  {fav}
                </span>
                <button 
                  onClick={() => removeFromFavorite(fav)} 
                  style={{ background: "#e53935", color: "#fff", border: "none", borderRadius: "50%", width: 24, height: 24, cursor: "pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize: 14, padding:0 }}
                >
                  X
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {result && (() => {
        const json = JSON.parse(result.json);
        const nbest = json.NBest?.[0];
        return (
          <div>
            <h3 style={{ color: "#4cafef" }}>總分</h3>
            <ScoreBar label="Accuracy" value={nbest.PronunciationAssessment.AccuracyScore} />
            <ScoreBar label="Fluency" value={nbest.PronunciationAssessment.FluencyScore} />
            <ScoreBar label="Completeness" value={nbest.PronunciationAssessment.CompletenessScore} />
            <ScoreBar label="Pronunciation" value={nbest.PronunciationAssessment.PronScore} />
            
            <h3 style={{ color: "#4cafef" }}>句子分析</h3>
            <WordsDisplay words={nbest.Words} />
            
            {/*
            <h4 style={{ color: "#aaa", marginTop: 20 }}>原始 JSON</h4>
            <pre style={{ background: "#23272f", padding: 8, borderRadius: 4, fontSize: 12, color: "#eee" }}>{result.json}</pre>
            */}
          </div>
        );
      })()}
    </div>
  );
} 