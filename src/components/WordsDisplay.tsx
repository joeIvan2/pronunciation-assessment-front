import React from 'react';
import { Word as WordType } from '../types/speech';
import Word from './Word';
import '../styles/PronunciationAssessment.css';

interface WordsDisplayProps {
  words: WordType[];
}

const WordsDisplay: React.FC<WordsDisplayProps> = ({ words }) => {
  const [selected, setSelected] = React.useState<number | null>(null);

  if (!words || words.length === 0) {
    return <div className="words-display-empty">暫無單詞評分數據</div>;
  }

  return (
    <div className="words-display-container">
      <div className="words-display-wrapper">
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