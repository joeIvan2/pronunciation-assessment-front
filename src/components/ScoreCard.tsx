import React from 'react';

interface ScoreCardProps {
  title: string;
  score: number; // 0 - 100
  color?: string; // color name
}

const ScoreCard: React.FC<ScoreCardProps> = ({ title, score, color = 'primary' }) => {
  // 將 Ionic 的顏色轉換為 CSS 顏色
  const getColorValue = (colorName: string) => {
    switch(colorName) {
      case 'primary': return '#3880ff';
      case 'secondary': return '#3dc2ff';
      case 'success': return '#2dd36f';
      case 'warning': return '#ffc409';
      case 'danger': return '#eb445a';
      default: return '#3880ff';
    }
  };

  return (
    <div className="score-card">
      <div className="score-card-header">
        <h2 className="score-card-title">{title}</h2>
      </div>
      <div className="score-card-content">
        <div className="score-value">
          <span style={{ fontSize: '1.5rem' }}>
            {score}%
          </span>
        </div>
        <div className="progress-bar-container">
          <div 
            className="progress-bar" 
            style={{ 
              width: `${score}%`, 
              backgroundColor: getColorValue(color) 
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ScoreCard; 