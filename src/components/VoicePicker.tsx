import React from 'react';
import '../styles/VoicePicker.css';

interface VoicePickerProps {
  isExpanded: boolean;
  onToggleExpand: () => void;
  rate: number;
  onRateChange: (rate: number) => void;
  selectedAIVoice: string;
  onSelectAIVoice: (voice: string) => void;
}

const VoicePicker: React.FC<VoicePickerProps> = ({
  isExpanded,
  onToggleExpand,
  rate,
  onRateChange,
  selectedAIVoice,
  onSelectAIVoice
}) => {
  // nicetone.ai 提供的個別聲音選項
  const aiVoiceOptions = [
    // 女性聲音
    { id: 'heart', name: 'Heart (女性)', description: 'Heart 女性聲音' },
    { id: 'sky', name: 'Sky (女性)', description: 'Sky 女性聲音' },
    { id: 'bella', name: 'Bella (女性)', description: 'Bella 女性聲音' },
    { id: 'nicole', name: 'Nicole (女性)', description: 'Nicole 女性聲音' },
    { id: 'sarah', name: 'Sarah (女性)', description: 'Sarah 女性聲音' },
    // 男性聲音
    { id: 'adam', name: 'Adam (男性)', description: 'Adam 男性聲音' },
    { id: 'michael', name: 'Michael (男性)', description: 'Michael 男性聲音' }
  ];
  
  return (
    <div className="voice-picker-container card-section">
      <h3 
        className="card-header collapsible" 
        onClick={onToggleExpand}
      >
        AI語音設置
        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </h3>
      
      {isExpanded && (
        <div className="voice-picker-content">
          {/* 模式說明 */}
          <div className="voice-mode-info ai-mode">
            <p className="mode-info-text">使用AI合成語音進行朗讀</p>
            </div>
          
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
          
          {/* AI語音選擇 */}
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
        </div>
      )}
    </div>
  );
};

export default VoicePicker; 