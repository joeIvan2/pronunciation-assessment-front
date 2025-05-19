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
      marginTop: '10px',
      padding: '15px',
      background: '#282c34',
      borderRadius: '4px',
      lineHeight: '2'
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
  );
};

export default WordsDisplay; 