import React, { useState } from 'react';
import ReactDOM from 'react-dom';
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

  const [showDictModal, setShowDictModal] = useState(false);

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
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}
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
          minWidth: '120px',
        }}>
          {/* 音素列表或提示 */}
          {word.Phonemes && word.Phonemes.length > 0 ? (
            word.Phonemes.map((p: Phoneme, i: number) => (
              <div key={i} style={{ color: '#ddd', margin: '6px 0', textAlign: 'left' }}>
                {p.Phoneme}: <span style={{ color: getScoreColor(p.PronunciationAssessment?.AccuracyScore) }}>
                  {p.PronunciationAssessment?.AccuracyScore ?? '-'}
                </span>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 120 }}>
              <button
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 80
                }}
                title="查字典"
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
        <div className="login-modal-overlay" style={{ zIndex: 99999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowDictModal(false)}>
          <div className="login-modal-content" style={{ zIndex: 99999, width: 420, maxWidth: '90vw', height: 600, maxHeight: '90vh', padding: 0, position: 'relative', margin: 'auto', top: 0, left: 0, right: 0, bottom: 0 }} onClick={e => e.stopPropagation()}>
            <button className="login-modal-close" style={{ position: 'absolute', top: 8, right: 8, zIndex: 100000 }} onClick={() => setShowDictModal(false)}>
              <i className="fas fa-times"></i>
            </button>
            <iframe
              src={`https://mobile.youdao.com/dict?le=eng&q=${encodeURIComponent(word.Word)}`}
              width="100%"
              height="100%"
              frameBorder="0"
              style={{ border: 0, borderRadius: 12, minHeight: 580 }}
              title="Youdao Dictionary"
            />
          </div>
        </div>,
        document.body
      )}

      {/* 書本 LOGO 按鈕（有 Phonemes 時 popup 右上角） */}
      {word.Phonemes && word.Phonemes.length > 0 && (
        <button
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            zIndex: 10000
          }}
          title="查字典"
          onClick={e => {
            e.stopPropagation();
            setShowDictModal(true);
            if (onClick) onClick();
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 4.5A2.5 2.5 0 0 1 6.5 7H20"/><path d="M6.5 7v10"/><rect x="2" y="2" width="20" height="20" rx="2.5"/></svg>
        </button>
      )}
    </div>
  );
};

export default Word; 