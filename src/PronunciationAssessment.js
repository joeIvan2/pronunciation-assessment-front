// Azure Speech SDK 发音评分应用 - 带有根据分数变色功能
import React, { useState, useRef, useEffect } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import Tesseract from "tesseract.js";

// 后端API地址
const BACKEND_URL = "https://pronunciation-assessment-app-1.onrender.com";
// 尝试不同的API路径
const API_PATHS = {
  ASSESSMENT: [
    "/api/pronunciation-assessment", 
    "/pronunciation-assessment",
    "/api/assess",
    "/assess",
    "/api/v1/pronunciation-assessment"
  ],
  TTS: [
    "/api/text-to-speech",
    "/text-to-speech",
    "/api/tts",
    "/tts"
  ]
};
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
      
      // 开始录音，使用更高的采样率和比特率
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // 使用更高质量的录音配置
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log(`收到音频数据块: ${e.data.size} 字节`);
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        try {
          setIsLoading(true);
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log(`录音完成，总大小: ${audioBlob.size} 字节`);
          
          if (audioBlob.size === 0) {
            throw new Error('录音数据为空，请检查麦克风权限和设置');
          }
          
          // 将Blob转换为base64
          const reader = new FileReader();
          
          // 使用Promise包装FileReader
          const base64Data = await new Promise((resolve, reject) => {
            reader.onloadend = () => {
              try {
                // 获取base64数据（去掉data:audio/webm;base64,前缀）
                const base64Result = reader.result.split(',')[1];
                console.log(`音频转换为base64完成，数据长度: ${base64Result.length}`);
                resolve(base64Result);
              } catch (err) {
                reject(new Error(`音频数据处理失败: ${err.message}`));
              }
            };
            reader.onerror = () => reject(new Error('读取音频文件失败'));
            reader.readAsDataURL(audioBlob);
          });
          
          // 尝试所有可能的API路径
          let success = false;
          let lastError = null;
          
          // 精简请求数据，避免发送过大的JSON
          const requestData = {
            referenceText: referenceText,
            audioBuffer: base64Data,
            strictMode: strictMode
          };
          
          console.log(`准备发送数据，参考文本长度: ${referenceText.length}, 音频数据长度: ${base64Data.length}`);
          
          for (const path of API_PATHS.ASSESSMENT) {
            try {
              console.log(`尝试连接API: ${BACKEND_URL}${path}`);
              
              // 发送到后端 - 使用JSON格式
              const response = await fetch(`${BACKEND_URL}${path}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
              });
              
              // 记录HTTP状态和响应头信息
              console.log(`API响应状态: ${response.status} ${response.statusText}`);
              console.log(`响应类型: ${response.headers.get('content-type')}`);
              
              if (response.ok) {
                const data = await response.json();
                console.log(`收到评分数据:`, data);
                
                if (data.accuracyScore === 0 && data.fluencyScore === 0 && data.completenessScore === 0 && data.pronunciationScore === 0) {
                  console.warn('警告: 所有分数都是0，可能音频处理有问题');
                }
                
                setResult({
                  accuracy: data.accuracyScore,
                  fluency: data.fluencyScore,
                  completeness: data.completenessScore,
                  pronScore: data.pronunciationScore,
                  json: JSON.stringify(data)
                });
                success = true;
                console.log(`成功连接到API: ${BACKEND_URL}${path}`);
                break;
              } else {
                console.warn(`API路径失败 ${path}: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.warn(`返回内容: ${text}`);
                lastError = new Error(`后端请求失败: ${response.status} - ${text}`);
              }
            } catch (err) {
              console.warn(`API路径尝试失败 ${path}: ${err.message}`);
              lastError = err;
            }
          }
          
          if (!success) {
            throw lastError || new Error('所有API路径尝试均失败');
          }
        } catch (err) {
          console.error('处理录音失败:', err);
          setError(`后端API连接失败: ${err.message}。请检查后端服务是否正常运行，或尝试使用直连Azure模式。`);
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
      
      // 开始录制，每500毫秒保存一次数据块，提高数据收集频率
      mediaRecorder.start(500);
      console.log('开始录音...');
      
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
      
      // 尝试所有可能的API路径
      let success = false;
      let lastError = null;
      
      for (const path of API_PATHS.TTS) {
        try {
          console.log(`尝试连接TTS API: ${BACKEND_URL}${path}`);
          
          // 发送请求到后端
          const response = await fetch(`${BACKEND_URL}${path}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: referenceText }),
          });
          
          if (response.ok) {
            // 获取音频数据并播放
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            success = true;
            console.log(`成功连接到TTS API: ${BACKEND_URL}${path}`);
            break;
          } else {
            console.warn(`TTS API路径失败 ${path}: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.warn(`返回内容: ${text}`);
            lastError = new Error(`后端请求失败: ${response.status} - ${text}`);
          }
        } catch (err) {
          console.warn(`TTS API路径尝试失败 ${path}: ${err.message}`);
          lastError = err;
        }
      }
      
      if (!success) {
        throw lastError || new Error('所有TTS API路径尝试均失败');
      }
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
          <p>{error}</p>
          <p style={{ fontSize: "0.9em", marginTop: "10px" }}>
            後端API URL: {BACKEND_URL}<br/>
            嘗試的評分API路徑: {API_PATHS.ASSESSMENT.join(", ")}<br/>
            嘗試的TTS API路徑: {API_PATHS.TTS.join(", ")}
          </p>
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
        try {
          // 添加调试日志
          console.log("开始解析结果，原始result对象:", JSON.parse(JSON.stringify(result)));
          
          // 首先检查是否为Azure直连模式返回的数据
          if (result.NBest) {
            console.log("检测到直连Azure模式数据");
            // 直接使用Azure返回的结构化数据
            const nbest = result.NBest[0];
            const pa = nbest.PronunciationAssessment;
            const words = nbest.Words || [];
            
            return (
              <div>
                <h3 style={{ color: "#4cafef" }}>總分</h3>
                <ScoreBar label="Accuracy" value={pa.AccuracyScore} />
                <ScoreBar label="Fluency" value={pa.FluencyScore} />
                <ScoreBar label="Completeness" value={pa.CompletenessScore} />
                <ScoreBar label="Pronunciation" value={pa.PronScore} />
                
                <h3 style={{ color: "#4cafef" }}>句子分析</h3>
                {words && words.length > 0 ? (
                  <WordsDisplay words={words} />
                ) : (
                  <p style={{ color: "#fff" }}>無法獲取詳細單詞評分數據</p>
                )}
                
                <h4 style={{ color: "#4cafef", marginTop: "20px" }}>識別文本</h4>
                <p style={{ color: "#fff", fontSize: "1.1em", padding: "10px", background: "#23272f", borderRadius: "4px" }}>{result.DisplayText || "無文本"}</p>
              </div>
            );
          }
          
          // 后端API模式 - 处理嵌套JSON结构
          console.log("检测到后端API模式数据");
          
          // 确保json属性是字符串
          if (typeof result.json !== 'string') {
            console.error("结果中json属性不是字符串，实际类型:", typeof result.json, result.json);
            throw new Error("结果数据格式错误: result.json 不是字符串");
          }
          
          const jsonStr = result.json;
          console.log("后端返回的JSON字符串长度:", jsonStr.length);
          
          // 解析后端返回的第一层JSON
          let jsonData;
          try {
            jsonData = JSON.parse(jsonStr);
            console.log("解析后的第一层JSON:", jsonData);
          } catch (parseError) {
            console.error("第一层JSON解析错误:", parseError);
            throw parseError;
          }
          
          // 检查是否是嵌套的JSON结构
          if (jsonData && typeof jsonData.json === 'string') {
            console.log("检测到嵌套JSON结构");
            
            // 解析内层JSON字符串
            try {
              const innerJsonData = JSON.parse(jsonData.json);
              console.log("解析内层JSON成功:", innerJsonData);
              
              // 内层JSON中查找NBest数据
              const nbest = innerJsonData.NBest?.[0];
              if (nbest) {
                console.log("在内层JSON中找到NBest:", nbest);
                const pa = nbest.PronunciationAssessment;
                const words = nbest.Words || [];
                
                return (
                  <div>
                    <h3 style={{ color: "#4cafef" }}>總分</h3>
                    <ScoreBar label="Accuracy" value={pa.AccuracyScore} />
                    <ScoreBar label="Fluency" value={pa.FluencyScore} />
                    <ScoreBar label="Completeness" value={pa.CompletenessScore} />
                    <ScoreBar label="Pronunciation" value={pa.PronScore} />
                    
                    <h3 style={{ color: "#4cafef" }}>句子分析</h3>
                    {words && words.length > 0 ? (
                      <WordsDisplay words={words} />
                    ) : (
                      <p style={{ color: "#fff" }}>無法獲取詳細單詞評分數據</p>
                    )}
                    
                    <h4 style={{ color: "#4cafef", marginTop: "20px" }}>識別文本</h4>
                    <p style={{ color: "#fff", fontSize: "1.1em", padding: "10px", background: "#23272f", borderRadius: "4px" }}>{innerJsonData.DisplayText || jsonData.text || "無文本"}</p>
                  </div>
                );
              }
            } catch (innerParseError) {
              console.error("内层JSON解析错误:", innerParseError);
              // 内层解析失败，继续使用外层数据
            }
          }
          
          // 在外层JSON中尝试查找NBest
          const nbest = jsonData.NBest?.[0] || jsonData.nBest?.[0] || jsonData.nbest?.[0];
          console.log("在外层JSON中查找NBest:", nbest);
          
          if (nbest) {
            // 找到了NBest数据
            const pa = nbest.PronunciationAssessment || nbest.pronunciationAssessment;
            const words = nbest.Words || nbest.words || [];
            
            return (
              <div>
                <h3 style={{ color: "#4cafef" }}>總分</h3>
                {pa ? (
                  <>
                    <ScoreBar label="Accuracy" value={pa.AccuracyScore || pa.accuracyScore || result.accuracyScore || 0} />
                    <ScoreBar label="Fluency" value={pa.FluencyScore || pa.fluencyScore || result.fluencyScore || 0} />
                    <ScoreBar label="Completeness" value={pa.CompletenessScore || pa.completenessScore || result.completenessScore || 0} />
                    <ScoreBar label="Pronunciation" value={pa.PronScore || pa.pronScore || result.pronunciationScore || 0} />
                  </>
                ) : (
                  <>
                    <ScoreBar label="Accuracy" value={result.accuracyScore || 0} />
                    <ScoreBar label="Fluency" value={result.fluencyScore || 0} />
                    <ScoreBar label="Completeness" value={result.completenessScore || 0} />
                    <ScoreBar label="Pronunciation" value={result.pronunciationScore || 0} />
                  </>
                )}
                
                <h3 style={{ color: "#4cafef" }}>句子分析</h3>
                {words && words.length > 0 ? (
                  <WordsDisplay words={words} />
                ) : (
                  <p style={{ color: "#fff" }}>無法獲取詳細單詞評分數據</p>
                )}
                
                <h4 style={{ color: "#4cafef", marginTop: "20px" }}>識別文本</h4>
                <p style={{ color: "#fff", fontSize: "1.1em", padding: "10px", background: "#23272f", borderRadius: "4px" }}>
                  {jsonData.DisplayText || nbest.Display || nbest.display || result.text || "無文本"}
                </p>
              </div>
            );
          }
          
          // 使用后端直接返回的评分数据
          console.log("没有找到NBest结构，使用后端直接返回的评分数据");
          return (
            <div>
              <h3 style={{ color: "#4cafef" }}>評分結果</h3>
              <ScoreBar label="Accuracy" value={result.accuracyScore || 0} />
              <ScoreBar label="Fluency" value={result.fluencyScore || 0} />
              <ScoreBar label="Completeness" value={result.completenessScore || 0} />
              <ScoreBar label="Pronunciation" value={result.pronunciationScore || 0} />
              
              <h4 style={{ color: "#4cafef", marginTop: "20px" }}>識別文本</h4>
              <p style={{ color: "#fff", fontSize: "1.1em", padding: "10px", background: "#23272f", borderRadius: "4px" }}>
                {jsonData.DisplayText || jsonData.text || result.text || "無文本"}
              </p>
              
              <h4 style={{ color: "#aaa", marginTop: 20 }}>調試信息</h4>
              <details>
                <summary style={{ color: "#bbb", cursor: "pointer", marginBottom: "10px" }}>點擊查看原始數據</summary>
                <div style={{ overflowX: "auto" }}>
                  <pre style={{ background: "#23272f", padding: 8, borderRadius: 4, fontSize: 12, color: "#eee", maxHeight: "200px", overflow: "auto" }}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          );
        } catch (error) {
          console.error('解析評分數據時出錯:', error);
          // 處理JSON解析或其他錯誤
          return (
            <div>
              <h3 style={{ color: "#e53935" }}>解析結果時出錯</h3>
              <p style={{ color: "#fff" }}>處理評分數據時發生錯誤，但API可能已成功返回原始結果。</p>
              
              {result.accuracyScore !== undefined && (
                <div>
                  <h3 style={{ color: "#4cafef" }}>總分</h3>
                  <ScoreBar label="Accuracy" value={result.accuracyScore} />
                  <ScoreBar label="Fluency" value={result.fluencyScore} />
                  <ScoreBar label="Completeness" value={result.completenessScore} />
                  <ScoreBar label="Pronunciation" value={result.pronunciationScore} />
                  
                  <h4 style={{ color: "#4cafef", marginTop: "20px" }}>識別文本</h4>
                  <p style={{ color: "#fff", fontSize: "1.1em", padding: "10px", background: "#23272f", borderRadius: "4px" }}>{result.text || "無文本"}</p>
                </div>
              )}
              
              <h4 style={{ color: "#aaa", marginTop: 20 }}>調試信息</h4>
              <details>
                <summary style={{ color: "#bbb", cursor: "pointer", marginBottom: "10px" }}>點擊查看錯誤詳情</summary>
                <p style={{ color: "#bbb", fontSize: "0.9em", marginBottom: "10px" }}>錯誤信息: {error.message}</p>
                <p style={{ color: "#bbb", fontSize: "0.9em", marginBottom: "10px" }}>錯誤堆栈: {error.stack}</p>
                <div style={{ overflowX: "auto" }}>
                  <pre style={{ background: "#23272f", padding: 8, borderRadius: 4, fontSize: 12, color: "#eee", maxHeight: "200px", overflow: "auto" }}>
                    原始数据: {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          );
        }
      })()}
    </div>
  );
} 