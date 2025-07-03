import React from 'react';
import '../styles/VoicePicker.css';
import '../styles/PronunciationAssessment.css';
import { getVoiceOptions, SPEED_RANGE } from '../config/voiceConfig';
import { Tooltip } from 'react-tooltip';

interface VoicePickerProps {
  rate: number;
  onRateChange: (rate: number) => void;
  selectedAIVoice: string;
  onSelectAIVoice: (voice: string) => void;
}

const VoicePicker: React.FC<VoicePickerProps> = ({
  rate,
  onRateChange,
  selectedAIVoice,
  onSelectAIVoice
}) => {
  // 使用集中配置的語音選項
  const aiVoiceOptions = getVoiceOptions().map(voice => ({
    id: voice.id,
    name: `${voice.name} (${voice.gender === 'male' ? '男性' : '女性'})`,
    description: voice.description
  }));
  
  return (
    <div className="voice-picker-container card-section">
      <h3 className="card-header">
        AI語音設置
        <span 
          data-tooltip-id="ai-voice-tooltip"
          data-tooltip-content="使用AI合成語音進行朗讀"
          className="voice-picker-tooltip-icon"
        >
          <i className="fas fa-question-circle" />
        </span>
      </h3>
      <Tooltip
        id="ai-voice-tooltip"
        openOnClick
        clickable
        className="voice-picker-tooltip"
      />

      <div className="voice-picker-content">
          
          {/* 語音速率設置 */}
          <div className="rate-control">
            <label htmlFor="speechRate">語音速度：{rate.toFixed(1)}x</label>
            <input 
              type="range" 
              id="speechRate"
              min={SPEED_RANGE.min} 
              max={SPEED_RANGE.max} 
              step={SPEED_RANGE.step} 
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
    </div>
  );
};

export default VoicePicker; 