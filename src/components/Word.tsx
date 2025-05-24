import React from 'react';
import { Word as WordType, WordAssessment, Phoneme } from '../types/speech';
import ErrorTypeTag from './ErrorTypeTag';

interface WordProps {
  word: WordType;
  index: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const Word: React.FC<WordProps> = ({ word, index, isSelected, onClick }) => {
  // 獲取評估結果
  const assessment: WordAssessment | undefined = word.PronunciationAssessment;
  
  // 計算顯示顏色
  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return '#ffffff'; // 默認白色
    
    if (score >= 80) return '#4caf50'; // 綠色
    if (score >= 60) return '#ff9800'; // 橙色
    return '#f44336'; // 紅色
  };
  
  // 檢查是否有錯誤
  const hasError = assessment?.ErrorType && assessment.ErrorType !== 'None';
  
  return (
    <div className={`word-container ${isSelected ? 'word-selected' : ''}`} style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      margin: '8px',
      width: '70px',
      maxWidth: '80px',
      overflow: 'visible',
      zIndex: isSelected ? 9999 : 1
    }}>
      {/* 分數顯示 */}
      {assessment?.AccuracyScore !== undefined && (
        <div style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#fff',
          marginBottom: '4px',
          background: 'rgba(0, 0, 0, 0.5)',
          padding: '2px 6px',
          borderRadius: '8px',
          minWidth: '20px',
          textAlign: 'center'
        }}>
          {Math.round(assessment.AccuracyScore)}
        </div>
      )}
      
      {/* 單詞本身 */}
      <div 
        onClick={onClick}
        style={{
          color: getScoreColor(assessment?.AccuracyScore),
          fontWeight: hasError ? 'bold' : 'normal',
          cursor: 'pointer',
          padding: '4px',
          marginBottom: '4px',
          textAlign: 'center'
        }}
      >
        {word.Word}
      </div>
      
      {/* 錯誤標籤 - 內聯顯示而非絕對定位 */}
      {hasError && (
        <div style={{ 
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '4px'
        }}>
          <ErrorTypeTag 
            type={assessment?.ErrorType || ''} 
          />
        </div>
      )}

      {/* 音素 Tooltip */}
      {isSelected && word.Phonemes && word.Phonemes.length > 0 && (
        <div className="phoneme-details-popup" style={{ 
          position: 'absolute', 
          top: '100%', 
          left: '50%', 
          transform: 'translateX(-50%)',
          background: '#23272f',
          padding: '10px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          zIndex: 9999,
          marginTop: '8px',
          minWidth: '120px'
        }}>
          {word.Phonemes!.map((p: Phoneme, i: number) => (
            <div key={i} style={{ color: '#ddd', margin: '6px 0', textAlign: 'left' }}>
              {p.Phoneme}: <span style={{ color: getScoreColor(p.PronunciationAssessment?.AccuracyScore) }}>
                {p.PronunciationAssessment?.AccuracyScore ?? '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Word; 