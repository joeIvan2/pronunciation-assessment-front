import React, { useState, useEffect } from 'react';
import '../styles/VoicePicker.css';

interface VoicePickerProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  onSelectVoice: (voice: SpeechSynthesisVoice) => void;
  onSearchChange: (searchTerm: string) => void;
  rate: number;
  onRateChange: (rate: number) => void;
  useAzureDirect: boolean;
  selectedAIVoice: string;
  onSelectAIVoice: (voice: string) => void;
}

const VoicePicker: React.FC<VoicePickerProps> = ({
  isExpanded,
  onToggleExpand,
  availableVoices,
  selectedVoice,
  onSelectVoice,
  onSearchChange,
  rate,
  onRateChange,
  useAzureDirect,
  selectedAIVoice,
  onSelectAIVoice
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // AI服務器提供的聲音選項
  const aiVoiceOptions = [
    { id: 'Puck', name: 'Puck (中性)', description: '默認中性聲音' },
    { id: 'Charon', name: 'Charon (男聲)', description: '深邃神秘男聲' },
    { id: 'Kore', name: 'Kore (女聲)', description: '清新純淨女聲' },
    { id: 'Fenrir', name: 'Fenrir (男聲)', description: '強勁有力男聲' },
    { id: 'Aoede', name: 'Aoede (女聲)', description: '優雅歌唱女聲' },
    { id: 'Leda', name: 'Leda (女聲)', description: '溫柔親切女聲' },
    { id: 'Orus', name: 'Orus (男聲)', description: '莊重威嚴男聲' },
    { id: 'Zephyr', name: 'Zephyr (中性)', description: '輕柔清風聲音' }
  ];
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearchChange(term);
  };
  
  // 過濾本地語音列表
  const filteredVoices = availableVoices.filter(voice => 
    voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voice.lang.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="voice-picker-container card-section">
      <h3 
        className="card-header collapsible" 
        onClick={onToggleExpand}
      >
        語音朗讀設置
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </h3>
      
      {isExpanded && (
        <div className="voice-picker-content">
          {/* 模式說明 */}
          {useAzureDirect ? (
            <div className="voice-mode-info azure-mode">
              <p className="mode-info-text">Azure直連模式：僅支援AI語音</p>
            </div>
          ) : (
            <div className="voice-mode-info remote-mode">
              <p className="mode-info-text">遠端模式：僅支援本地語音</p>
            </div>
          )}
          
          {/* 語音速率設置 */}
          <div className="rate-control">
            <label htmlFor="speechRate">語音速度：{rate.toFixed(1)}x</label>
            <input 
              type="range" 
              id="speechRate"
              min="0.5" 
              max="2" 
              step="0.1" 
              value={rate} 
              onChange={(e) => onRateChange(parseFloat(e.target.value))}
            />
          </div>
          
          {useAzureDirect ? (
            /* Azure直連模式：僅顯示AI語音選擇 */
            <div className="voice-list ai-voice-list">
              {aiVoiceOptions.map((voice) => (
                <div 
                  key={voice.id} 
                  className={`voice-item ${selectedAIVoice === voice.id ? 'selected' : ''}`}
                  onClick={() => onSelectAIVoice(voice.id)}
                >
                  <div className="voice-name">{voice.name}</div>
                  <div className="voice-lang">{voice.description}</div>
                </div>
              ))}
            </div>
          ) : (
            /* 遠端模式：僅顯示本地語音選擇 */
            <>
              <div className="search-container">
                <input 
                  type="text"
                  placeholder="搜索語音..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="voice-search"
                />
              </div>
              <div className="voice-list">
                {filteredVoices.length === 0 ? (
                  <div className="no-voices">沒有找到匹配的語音</div>
                ) : (
                  filteredVoices.map((voice) => (
                    <div 
                      key={voice.name} 
                      className={`voice-item ${selectedVoice?.name === voice.name ? 'selected' : ''}`}
                      onClick={() => onSelectVoice(voice)}
                    >
                      <div className="voice-name">{voice.name}</div>
                      <div className="voice-lang">{voice.lang}</div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VoicePicker; 