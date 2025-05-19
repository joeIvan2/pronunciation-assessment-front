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
  // 获取评估结果
  const assessment: WordAssessment | undefined = word.PronunciationAssessment;
  
  // 计算显示颜色
  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return '#ffffff'; // 默认白色
    
    if (score >= 80) return '#4caf50'; // 绿色
    if (score >= 60) return '#ff9800'; // 橙色
    return '#f44336'; // 红色
  };
  
  // 检查是否有错误
  const hasError = assessment?.ErrorType && assessment.ErrorType !== 'None';
  
  return (
    <span 
      key={`word-${index}`}
      style={{ 
        color: getScoreColor(assessment?.AccuracyScore),
        fontWeight: hasError ? 'bold' : 'normal',
        position: 'relative',
        marginRight: '6px',
        display: 'inline-block',
        cursor: 'pointer'
      }}
      onClick={onClick}
    >
      {word.Word}
      
      {/* 显示评分 */}
      {assessment?.AccuracyScore !== undefined && (
        <span 
          style={{
            fontSize: '10px',
            position: 'absolute',
            top: '-12px',
            right: '0',
            color: '#aaa'
          }}
        >
          {Math.round(assessment.AccuracyScore)}
        </span>
      )}
      
      {/* 错误标签 */}
      {hasError && (
        <ErrorTypeTag 
          type={assessment?.ErrorType || ''} 
          style={{ position: 'absolute', bottom: '-12px', left: '50%', transform: 'translateX(-50%)' }}
        />
      )}

      {/* 音素 Tooltip */}
      {isSelected && word.Phonemes && word.Phonemes.length > 0 && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: '50%', 
          transform: 'translateX(-50%)',
          background: '#23272f',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          zIndex: 20,
          marginTop: '6px'
        }}>
          {word.Phonemes!.map((p: Phoneme, i: number) => (
            <div key={i} style={{ color: '#ddd', margin: '4px 0' }}>
              {p.Phoneme}: <span style={{ color: getScoreColor(p.PronunciationAssessment?.AccuracyScore) }}>
                {p.PronunciationAssessment?.AccuracyScore ?? '-'}
              </span>
            </div>
          ))}
        </div>
      )}
    </span>
  );
};

export default Word; 