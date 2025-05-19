import React, { useEffect, useState } from 'react';
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
  // 檢測是否為Android設備
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  
  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);
  
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
          {/* 搜索框 */}
          <div style={{ marginBottom: 16 }}>
            <input 
              type="text" 
              placeholder="搜索語音..." 
              value={voiceSearchTerm}
              onChange={(e) => onChangeSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          {/* Android設備提示信息 */}
          {isAndroid && (
            <div style={{ 
              marginBottom: 16, 
              padding: '8px 12px', 
              background: 'rgba(255, 152, 0, 0.2)',
              border: '1px solid rgba(255, 152, 0, 0.5)',
              borderRadius: 8,
              fontSize: 13
            }}>
              <p style={{ margin: '0 0 6px 0', color: '#ff9800', fontWeight: 'bold' }}>Android裝置注意</p>
              <p style={{ margin: 0, color: '#eee' }}>由於Android系統限制，語音選擇可能無法正常工作。請嘗試選擇不同語言（非方言）的語音以獲得更好效果。</p>
            </div>
          )}
          
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
            <h4 style={{ color: "var(--ios-primary)", margin: "0 0 8px 0", fontSize: 15, fontWeight: 600 }}>可用語音 ({availableVoices.length})</h4>
            
            {availableVoices.length === 0 ? (
              <p style={{ color: "var(--ios-text-secondary)" }}>未找到語音選項，請等待瀏覽器加載語音。</p>
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
                          const testUtterance = new SpeechSynthesisUtterance(
                            referenceText.slice(0, 20) + "..."
                          );
                          testUtterance.voice = voice;
                          testUtterance.rate = speechRate;
                          
                          // 在Android設備上，設置語言屬性以確保生效
                          if (isAndroid) {
                            testUtterance.lang = voice.lang;
                          }
                          
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