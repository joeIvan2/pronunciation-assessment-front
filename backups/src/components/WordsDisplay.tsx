import React from 'react';
import { Word as WordType } from '../types/speech';
import Word from './Word';

interface WordsDisplayProps {
  words: WordType[];
}

const WordsDisplay: React.FC<WordsDisplayProps> = ({ words }) => {
  const [selected, setSelected] = React.useState<number | null>(null);

  if (!words || words.length === 0) {
    return <div style={{ color: '#aaa' }}>暫無單詞評分數據</div>;
  }

  return (
    <div style={{ 
      marginTop: '16px',
      marginBottom: '20px',
      padding: '16px 12px',
      background: 'rgba(20, 20, 24, 0.6)',
      borderRadius: '12px',
      border: '1px solid var(--ios-border)',
      wordBreak: 'break-word',
      overflowWrap: 'break-word',
      position: 'relative',
      zIndex: 1
    }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'center',
        width: '100%',
        position: 'relative',
        marginBottom: '10px'
      }}>
        {words.map((word, index) => (
          <Word 
            key={`${word.Word}-${index}`}
            word={word}
            index={index}
            isSelected={selected === index}
            onClick={() => setSelected(selected === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
};

export default WordsDisplay; 