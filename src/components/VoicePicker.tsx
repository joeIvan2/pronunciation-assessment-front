import React from 'react';
import { VoiceOption } from '../types/speech';
import '../styles/PronunciationAssessment.css';

interface VoicePickerProps {
  availableVoices: VoiceOption[];
  selectedVoice: VoiceOption | null;
  voiceSearchTerm: string;
  speechRate: number;
  referenceText: string;
  onSelectVoice: (voice: VoiceOption) => void;
  onChangeSearchTerm: (term: string) => void;
  onChangeSpeechRate: (rate: number) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
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
  isExpanded,
  onToggleExpand
}) => {
  return (
    <div>
      {!isExpanded && (
        <h3 
          className="section-header special-title"
          onClick={onToggleExpand}
          style={{ cursor: 'pointer' }}
        >
          選擇語音
        </h3>
      )}
      
      {isExpanded && (
        <>
          {/* 語速選擇 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", color: "var(--ios-text-secondary)", marginBottom: 8 }}>語速選擇：</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <button 
                onClick={() => onChangeSpeechRate(0.5)}
                style={{ 
                  padding: "6px 12px", 
                  background: speechRate === 0.5 ? "var(--ios-success)" : "var(--ios-card)", 
                  color: "var(--ios-text)", 
                  border: speechRate === 0.5 ? "none" : "1px solid var(--ios-border)", 
                  borderRadius: 12, 
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500
                }}
              >
                0.5x (慢)
              </button>
              <button 
                onClick={() => onChangeSpeechRate(0.8)}
                style={{ 
                  padding: "6px 12px", 
                  background: speechRate === 0.8 ? "var(--ios-success)" : "var(--ios-card)", 
                  color: "var(--ios-text)", 
                  border: speechRate === 0.8 ? "none" : "1px solid var(--ios-border)", 
                  borderRadius: 12, 
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500
                }}
              >
                0.8x
              </button>
              <button 
                onClick={() => onChangeSpeechRate(1.0)}
                style={{ 
                  padding: "6px 12px", 
                  background: speechRate === 1.0 ? "var(--ios-primary)" : "var(--ios-card)", 
                  color: "var(--ios-text)", 
                  border: speechRate === 1.0 ? "none" : "1px solid var(--ios-border)", 
                  borderRadius: 12, 
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500
                }}
              >
                1.0x (正常)
              </button>
              <button 
                onClick={() => onChangeSpeechRate(1.5)}
                style={{ 
                  padding: "6px 12px", 
                  background: speechRate === 1.5 ? "var(--ios-warning)" : "var(--ios-card)", 
                  color: "var(--ios-text)", 
                  border: speechRate === 1.5 ? "none" : "1px solid var(--ios-border)", 
                  borderRadius: 12, 
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500
                }}
              >
                1.5x
              </button>
              <button 
                onClick={() => onChangeSpeechRate(2.0)}
                style={{ 
                  padding: "6px 12px", 
                  background: speechRate === 2.0 ? "var(--ios-danger)" : "var(--ios-card)", 
                  color: "var(--ios-text)", 
                  border: speechRate === 2.0 ? "none" : "1px solid var(--ios-border)", 
                  borderRadius: 12,
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: 500
                }}
              >
                2.0x (快)
              </button>
            </div>
          </div>
          
          {/* 語音列表 */}
          <div>
            <h4 style={{ color: "var(--ios-primary)", margin: "0 0 8px 0", fontSize: 15, fontWeight: 600 }}>可用英文語音 ({availableVoices.length})</h4>
            
            <div style={{ 
              background: "var(--ios-card)", 
              padding: "12px", 
              borderRadius: "12px",
              marginBottom: "16px",
              fontSize: "14px",
              color: "var(--ios-text-secondary)"
            }}>
              本應用使用瀏覽器內建的英文語音，在 iOS 設備上長文本會自動分段處理以提高穩定性。
            </div>
            
            {availableVoices.length === 0 ? (
              <p style={{ color: "var(--ios-text-secondary)" }}>未找到英文語音選項，請確認您的瀏覽器是否支援英文語音。</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {availableVoices.map((voice, index) => (
                  <li 
                    key={index} 
                    onClick={() => onSelectVoice(voice)}
                    style={{
                      padding: "12px",
                      background: selectedVoice && selectedVoice.name === voice.name ? "var(--ios-primary)" : "var(--ios-card)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                      borderRadius: 12,
                      border: "1px solid var(--ios-border)",
                      cursor: "pointer"
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "bold", color: "var(--ios-text)" }}>{voice.name}</div>
                      <div style={{ fontSize: "0.8em", color: "var(--ios-text-secondary)", marginTop: 4 }}>
                        {voice.lang} | {voice.default ? "預設" : "可選"} | {voice.localService ? "本地" : "遠程"}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // 阻止點擊事件冒泡
                        
                        // 創建臨時話語對象來測試語音
                        const testUtterance = new SpeechSynthesisUtterance(referenceText);
                        testUtterance.voice = voice;
                        testUtterance.lang = "en-US";
                        testUtterance.rate = speechRate;
                        
                        // 播放測試語音
                        window.speechSynthesis.speak(testUtterance);
                      }}
                      style={{ 
                        padding: "6px 12px", 
                        background: "var(--ios-success)", 
                        color: "var(--ios-text)", 
                        border: "none", 
                        borderRadius: 12,
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: 500
                      }}
                    >
                      測試
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default VoicePicker; 