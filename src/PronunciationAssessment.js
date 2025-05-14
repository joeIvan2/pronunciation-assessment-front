import React, { useState, useRef, useEffect } from "react";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import Tesseract from "tesseract.js";

// 請填入你的 Azure 金鑰與區域
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
      <div style={{ fontSize: "0.9em", color: "#bbb" }}>
        {word.PronunciationAssessment?.AccuracyScore ?? "-"}
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
          {word.Phonemes.map((p, i) => (
            <div key={i} style={{ margin: "4px 0", color: "#ddd" }}>
              {p.Phoneme}: {p.PronunciationAssessment?.AccuracyScore ?? "-"}
            </div>
          ))}
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

  // 從 localStorage 讀取初始值，若無則使用預設值
  const [referenceText, setReferenceText] = useState(
    localStorage.getItem("referenceText") || "Hello, how are you?"
  );
  const [fontSize, setFontSize] = useState(
    parseInt(localStorage.getItem("fontSize"), 10) || 16
  );
  const [favorites, setFavorites] = useState(
    JSON.parse(localStorage.getItem("favorites")) || []
  );

  const recognizerRef = useRef(null);
  const textareaRef = useRef(null);

  const startAssessment = () => {
    setResult(null);
    setRecording(true);
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
    speechConfig.speechRecognitionLanguage = "en-US";
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();

    const pronunciationAssessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
      referenceText,
      SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
      SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
      true
    );

    const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
    recognizerRef.current = recognizer;
    pronunciationAssessmentConfig.applyTo(recognizer);

    recognizer.recognizeOnceAsync((res) => {
      setRecording(false);
      const paResult = SpeechSDK.PronunciationAssessmentResult.fromResult(res);
      setResult({
        accuracy: paResult.accuracyScore,
        fluency: paResult.fluencyScore,
        completeness: paResult.completenessScore,
        pronScore: paResult.pronunciationScore,
        json: res.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult)
      });
    });
  };

  const stopAssessment = () => {
    setRecording(false);
    if (recognizerRef.current) {
      recognizerRef.current.close();
      recognizerRef.current = null;
    }
  };

  const speakText = () => {
    if (!referenceText) {
      alert("請先輸入要發音的文字！");
      return;
    }
    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_KEY, AZURE_REGION);
    // 你可以根據需要設定特定的語音，例如：
    // speechConfig.speechSynthesisVoiceName = "en-US-JennyNeural"; // 英文女聲
    // speechConfig.speechSynthesisVoiceName = "zh-CN-XiaoxiaoNeural"; // 中文女聲
    // 更多語音請參考 Azure 文件：https://aka.ms/speech/tts-languages

    const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);

    synthesizer.speakTextAsync(
      referenceText,
      result => {
        if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
          console.log("語音合成完成");
        } else {
          console.error("語音合成失敗：", result.errorDetails);
        }
        synthesizer.close();
      },
      error => {
        console.error("語音合成發生錯誤：", error);
        synthesizer.close();
      }
    );
  };

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
    localStorage.setItem("fontSize", fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  return (
    <div style={{ background: "#181c23", minHeight: "100vh", color: "#fff", padding: 24 }}>
      <h2 style={{ color: "#4cafef" }}>發音評分（React + Azure）</h2>
      
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
        </div>
        
        {!recording && (
          <button onClick={startAssessment} style={{ padding: "8px 20px", background: "#4cafef", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold", marginRight: "8px" }}>
            開始錄音並評分
          </button>
        )}
        {recording && (
          <button onClick={stopAssessment} style={{ padding: "8px 20px", background: "#e53935", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold", marginRight: "8px" }}>
            停止錄音
          </button>
        )}
        <button onClick={speakText} style={{ padding: "8px 20px", background: "#4caf50", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold" }}>
          發音
        </button>
        <button onClick={addToFavorites} style={{ padding: "8px 20px", background: "#ff9800", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold", marginLeft: "8px" }}>
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