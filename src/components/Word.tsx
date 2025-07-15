import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Word as WordType, WordAssessment, Phoneme } from '../types/speech';
import ErrorTypeTag from './ErrorTypeTag';
import '../styles/PronunciationAssessment.css';

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

  const [showDictModal, setShowDictModal] = useState(false);

  return (
    <div className={`word-container ${isSelected ? 'word-selected' : ''}`}>
      {/* 分數顯示 */}
      {assessment?.AccuracyScore !== undefined && (
        <div className="word-score">
          {Math.round(assessment.AccuracyScore)}
        </div>
      )}
      
      {/* 單詞本身 */}
      <div 
        onClick={onClick}
        className={`word-text ${hasError ? 'word-has-error' : ''}`}
        style={{ color: getScoreColor(assessment?.AccuracyScore) }}
      >
        {word.Word}
      </div>
      
      {/* 錯誤標籤 - 內聯顯示而非絕對定位 */}
      {hasError && (
        <div className="word-error-container">
          <span className={`word-error-span ${assessment?.ErrorType === 'Omission' ? 'word-omission' : ''}`}
            onClick={assessment?.ErrorType === 'Omission' ? onClick : undefined}
          >
            <ErrorTypeTag 
              type={assessment?.ErrorType || ''} 
              style={{ cursor: assessment?.ErrorType === 'Omission' ? 'pointer' : undefined }}
            />
          </span>
        </div>
      )}

      {/* 音素 Tooltip（Omission 也要顯示 popup，即使沒有 Phonemes） */}
      {isSelected && (
        <div className="phoneme-details-popup">
          {/* 音素列表或提示 */}
          {word.Phonemes && word.Phonemes.length > 0 ? (
            <div className="phoneme-details-content">
              <button
                className="phoneme-dict-button"
                title="查字典2"
                onClick={e => {
                  e.stopPropagation();
                  setShowDictModal(true);
                  if (onClick) onClick();
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20"/><path d="M6.5 7v10"/><rect x="2" y="2" width="20" height="20" rx="2.5"/></svg>
              </button>
              <div>
                {word.Phonemes.map((p: Phoneme, i: number) => (
                  <div key={i} className="phoneme-list">
                    {p.Phoneme}: <span style={{ color: getScoreColor(p.PronunciationAssessment?.AccuracyScore) }}>
                      {p.PronunciationAssessment?.AccuracyScore ?? '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="phoneme-empty-container">
              <button
                className="phoneme-dict-button phoneme-dict-large"
                title="查字典3"
                onClick={e => {
                  e.stopPropagation();
                  setShowDictModal(true);
                  if (onClick) onClick();
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20"/><path d="M6.5 7v10"/><rect x="2" y="2" width="20" height="20" rx="2.5"/></svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 字典 Modal（用 Portal 保證永遠在最上層） */}
      {showDictModal && ReactDOM.createPortal(
        <div className="word-dict-modal-overlay" onClick={() => setShowDictModal(false)}>
          <div className="word-dict-modal-content" onClick={e => e.stopPropagation()}>
            <button className="word-dict-modal-close" onClick={() => setShowDictModal(false)}>
              <i className="fas fa-times"></i>
            </button>
            <iframe
              src={`https://mobile.youdao.com/dict?le=eng&q=${encodeURIComponent(word.Word)}`}
              width="100%"
              height="100%"
              frameBorder="0"
              className="word-dict-iframe"
              title="Youdao Dictionary"
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Word; 