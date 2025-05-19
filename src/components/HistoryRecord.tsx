import React, { useState } from 'react';
import { HistoryItem } from '../utils/storage';
import '../styles/PronunciationAssessment.css';
import WordsDisplay from './WordsDisplay';

interface HistoryRecordProps {
  historyRecords: HistoryItem[];
  onDeleteRecord: (id: string) => void;
  onClearRecords: () => void;
  onLoadText: (text: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

const HistoryRecord: React.FC<HistoryRecordProps> = ({
  historyRecords,
  onDeleteRecord,
  onClearRecords,
  onLoadText,
  isExpanded,
  onToggleExpand
}) => {
  // 添加詞語評分的顯示狀態
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  
  // 切換顯示單詞評分詳情
  const toggleWordsDisplay = (recordId: string) => {
    if (expandedRecordId === recordId) {
      setExpandedRecordId(null);
    } else {
      setExpandedRecordId(recordId);
    }
  };

  // 格式化日期
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 獲取分數的顏色
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'var(--ios-success)';
    if (score >= 60) return 'var(--ios-warning)';
    return 'var(--ios-danger)';
  };

  return (
    <div>
      {!isExpanded && (
        <h3 
          className="section-header special-title"
          onClick={onToggleExpand}
          style={{ cursor: 'pointer' }}
        >
          發音歷史
        </h3>
      )}
      
      {isExpanded && (
        <>
          {historyRecords.length > 0 ? (
            <div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end', 
                marginBottom: '12px' 
              }}>
                <button
                  onClick={onClearRecords}
                  style={{
                    padding: '4px 12px',
                    background: 'var(--ios-danger)',
                    color: 'var(--ios-text)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  清空歷史
                </button>
              </div>
              
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {historyRecords.map(record => (
                  <li
                    key={record.id}
                    style={{
                      background: 'rgba(44, 44, 48, 0.5)',
                      padding: '12px',
                      borderRadius: '12px',
                      marginBottom: '10px',
                      border: '1px solid var(--ios-border)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div 
                        onClick={() => onLoadText(record.text)}
                        style={{ 
                          cursor: 'pointer', 
                          flexGrow: 1,
                          fontSize: '15px',
                          color: 'var(--ios-text)',
                          marginRight: '8px',
                          lineHeight: '1.3'
                        }}
                      >
                        {record.text}
                      </div>
                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className="btn-delete"
                        title="刪除"
                      >
                        <span>×</span>
                      </button>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: 'var(--ios-text-secondary)', marginBottom: '8px' }}>
                      {formatDate(record.timestamp)}
                    </div>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ 
                        background: 'rgba(20, 20, 24, 0.6)', 
                        padding: '4px 8px', 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        color: getScoreColor(record.scoreAccuracy)
                      }}>
                        準確性: {record.scoreAccuracy}
                      </div>
                      <div style={{ 
                        background: 'rgba(20, 20, 24, 0.6)', 
                        padding: '4px 8px', 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        color: getScoreColor(record.scoreFluency)
                      }}>
                        流暢性: {record.scoreFluency}
                      </div>
                      <div style={{ 
                        background: 'rgba(20, 20, 24, 0.6)', 
                        padding: '4px 8px', 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        color: getScoreColor(record.scoreCompleteness)
                      }}>
                        完整性: {record.scoreCompleteness}
                      </div>
                      <div style={{ 
                        background: 'rgba(20, 20, 24, 0.6)', 
                        padding: '4px 8px', 
                        borderRadius: '8px', 
                        fontSize: '12px',
                        color: getScoreColor(record.scorePronunciation)
                      }}>
                        發音: {record.scorePronunciation}
                      </div>
                    </div>
                    
                    {record.recognizedText && (
                      <div style={{
                        fontSize: '13px',
                        background: 'rgba(20, 20, 24, 0.4)',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        color: 'var(--ios-text-secondary)',
                        fontStyle: 'italic',
                        marginBottom: '8px'
                      }}>
                        "{record.recognizedText}"
                      </div>
                    )}
                    
                    {/* 單詞評分按鈕和詳情 */}
                    {record.words && record.words.length > 0 && (
                      <>
                        <button 
                          onClick={() => toggleWordsDisplay(record.id)}
                          style={{
                            background: 'rgba(20, 20, 24, 0.6)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            color: 'var(--ios-primary)',
                            fontSize: '12px',
                            cursor: 'pointer',
                            marginTop: '8px'
                          }}
                        >
                          {expandedRecordId === record.id ? '隱藏單詞評分' : '顯示單詞評分'}
                        </button>
                        
                        {expandedRecordId === record.id && (
                          <div style={{ marginTop: '10px' }}>
                            <WordsDisplay words={record.words} />
                          </div>
                        )}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div style={{ 
              padding: '16px', 
              background: 'rgba(44, 44, 48, 0.5)', 
              borderRadius: '12px', 
              color: 'var(--ios-text-secondary)',
              textAlign: 'center',
              border: '1px solid var(--ios-border)'
            }}>
              暫無歷史紀錄，錄製完畢後會自動出現紀錄
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryRecord; 