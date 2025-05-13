import React, { useState, useRef } from "react";
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
  const [referenceText, setReferenceText] = useState("Hello, how are you?");
  const [fontSize, setFontSize] = useState(16);
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
          <button onClick={startAssessment} style={{ padding: "8px 20px", background: "#4cafef", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold" }}>
            開始錄音並評分
          </button>
        )}
        {recording && (
          <button onClick={stopAssessment} style={{ padding: "8px 20px", background: "#e53935", color: "#fff", border: "none", borderRadius: 4, fontWeight: "bold" }}>
            停止錄音
          </button>
        )}
      </div>
      
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