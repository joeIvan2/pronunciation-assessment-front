import React from 'react';
import { VoiceOption } from '../types/speech';

interface VoicePickerProps {
  availableVoices: VoiceOption[];
  selectedVoice: VoiceOption | null;
  voiceSearchTerm: string;
  speechRate: number;
  referenceText: string;
  onSelectVoice: (voice: VoiceOption) => void;
  onChangeSearchTerm: (term: string) => void;
  onChangeSpeechRate: (rate: number) => void;
  onClose: () => void;
}

const VoicePicker: React.FC<VoicePickerProps> = ({
  availableVoices,
  selectedVoice,
  voiceSearchTerm,
  speechRate,
  referenceText,
  onSelectVoice,
  onChangeSearchTerm,
  onChangeSpeechRate,
  onClose
}) => {
  return (
    <div style={{ marginTop: 16, padding: 16, background: "#2a2e39", borderRadius: 8, maxHeight: 500, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <h3 style={{ color: "#4cafef", margin: 0 }}>選擇語音</h3>
        <button 
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "#999", cursor: "pointer", fontSize: "16px" }}
        >
          X
        </button>
      </div>
      
      {/* 搜索框 */}
      <div style={{ marginBottom: 16 }}>
        <input 
          type="text" 
          placeholder="搜索語音..." 
          value={voiceSearchTerm}
          onChange={(e) => onChangeSearchTerm(e.target.value)}
          style={{ 
            width: "100%", 
            padding: "8px 12px", 
            background: "#23272f", 
            border: "1px solid #444", 
            borderRadius: 4, 
            color: "#fff" 
          }}
        />
      </div>
      
      {/* 语速选择 */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", color: "#bbb", marginBottom: 8 }}>語速選擇：</label>
        <div style={{ display: "flex" }}>
          <button 
            onClick={() => onChangeSpeechRate(0.5)}
            style={{ 
              padding: "6px 12px", 
              background: speechRate === 0.5 ? "#4caf50" : "#333", 
              color: "#fff", 
              border: "none", 
              borderRadius: 4, 
              marginRight: 8,
              cursor: "pointer"
            }}
          >
            0.5x (慢)
          </button>
          <button 
            onClick={() => onChangeSpeechRate(0.8)}
            style={{ 
              padding: "6px 12px", 
              background: speechRate === 0.8 ? "#8bc34a" : "#333", 
              color: "#fff", 
              border: "none", 
              borderRadius: 4, 
              marginRight: 8,
              cursor: "pointer"
            }}
          >
            0.8x
          </button>
          <button 
            onClick={() => onChangeSpeechRate(1.0)}
            style={{ 
              padding: "6px 12px", 
              background: speechRate === 1.0 ? "#2196f3" : "#333", 
              color: "#fff", 
              border: "none", 
              borderRadius: 4, 
              marginRight: 8,
              cursor: "pointer"
            }}
          >
            1.0x (正常)
          </button>
          <button 
            onClick={() => onChangeSpeechRate(1.5)}
            style={{ 
              padding: "6px 12px", 
              background: speechRate === 1.5 ? "#ff9800" : "#333", 
              color: "#fff", 
              border: "none", 
              borderRadius: 4, 
              marginRight: 8,
              cursor: "pointer"
            }}
          >
            1.5x
          </button>
          <button 
            onClick={() => onChangeSpeechRate(2.0)}
            style={{ 
              padding: "6px 12px", 
              background: speechRate === 2.0 ? "#f44336" : "#333", 
              color: "#fff", 
              border: "none", 
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            2.0x (快)
          </button>
        </div>
      </div>
      
      {/* 语音列表 */}
      <div>
        <h4 style={{ color: "#4cafef", margin: "0 0 8px 0" }}>可用語音 ({availableVoices.length})</h4>
        
        {availableVoices.length === 0 ? (
          <p style={{ color: "#bbb" }}>未找到語音選項，請等待瀏覽器加載語音。</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {availableVoices
              .filter(voice => 
                voice.name.toLowerCase().includes(voiceSearchTerm.toLowerCase()) || 
                voice.lang.toLowerCase().includes(voiceSearchTerm.toLowerCase())
              )
              .map((voice, index) => (
                <li 
                  key={index} 
                  onClick={() => onSelectVoice(voice)}
                  style={{
                    padding: "10px 12px",
                    background: selectedVoice && selectedVoice.name === voice.name ? "#1e88e5" : "#23272f",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                    borderRadius: 4,
                    border: "1px solid #333",
                    cursor: "pointer"
                  }}
                >
                  <div>
                    <div style={{ fontWeight: "bold" }}>{voice.name}</div>
                    <div style={{ fontSize: "0.8em", color: "#bbb", marginTop: 4 }}>
                      {voice.lang} | {voice.default ? "默認" : "可選"} | {voice.localService ? "本地" : "遠程"}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // 阻止点击事件冒泡
                      
                      // 创建临时话语对象来测试语音
                      const testUtterance = new SpeechSynthesisUtterance(
                        referenceText.slice(0, 20) + "..."
                      );
                      testUtterance.voice = voice;
                      testUtterance.rate = speechRate;
                      
                      // 播放测试语音
                      window.speechSynthesis.speak(testUtterance);
                    }}
                    style={{ 
                      padding: "6px 12px", 
                      background: "#4caf50", 
                      color: "#fff", 
                      border: "none", 
                      borderRadius: 4,
                      cursor: "pointer"
                    }}
                  >
                    測試
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default VoicePicker; 