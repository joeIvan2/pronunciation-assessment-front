import type { HistoryItem } from './storage';

export interface CompactHistoryItem {
  id: string;
  recTxt?: string;
  txt: string;
  ts: number;
  scores: {
    acc: number;
    comp: number;
    flu: number;
    pron: number;
  };
  words?: {
    w: string[];
    e: string[];
    s: number[];
    p: { p: string[]; s: number[] }[];
  };
}

export const toCompactHistory = (item: HistoryItem): CompactHistoryItem => {
  const wordsData = Array.isArray(item.words)
    ? item.words.map(w => ({
        Word: w.Word || w.word || '',
        PronunciationAssessment:
          w.PronunciationAssessment || (w as any).pronunciationAssessment || {},
        Phonemes: Array.isArray(w.Phonemes) ? w.Phonemes : []
      }))
    : [];

  const compactWords = wordsData.length
    ? {
        w: wordsData.map(w => String(w.Word)),
        e: wordsData.map(w =>
          String(
            (w.PronunciationAssessment as any).ErrorType ||
              (w.PronunciationAssessment as any).errorType ||
              ''
          )
        ),
        s: wordsData.map(w =>
          typeof (w.PronunciationAssessment as any).AccuracyScore === 'number'
            ? (w.PronunciationAssessment as any).AccuracyScore
            : 0
        ),
        p: wordsData.map(w => {
          const phonemes = Array.isArray(w.Phonemes) ? w.Phonemes : [];
          return {
            p: phonemes.map(ph => String(ph.Phoneme || ph.phoneme || '')),
            s: phonemes.map(ph =>
              typeof (ph.PronunciationAssessment as any).AccuracyScore ===
              'number'
                ? (ph.PronunciationAssessment as any).AccuracyScore
                : 0
            )
          };
        })
      }
    : undefined;

  return {
    id: item.id,
    recTxt: item.recognizedText,
    txt: item.text,
    ts: item.timestamp,
    scores: {
      acc: item.scoreAccuracy,
      comp: item.scoreCompleteness,
      flu: item.scoreFluency,
      pron: item.scorePronunciation
    },
    ...(compactWords ? { words: compactWords } : {})
  };
};

export const fromCompactHistory = (item: CompactHistoryItem): HistoryItem => {
  const words: any[] | undefined = item.words
    ? item.words.w.map((word, index) => {
        const errorType = item.words!.e[index];
        const wScore = item.words!.s[index];
        const phonemeInfo = item.words!.p[index] || { p: [], s: [] };
        const phonemes = phonemeInfo.p.map((p, idx) => ({
          Phoneme: p,
          PronunciationAssessment: {
            AccuracyScore: phonemeInfo.s[idx] || 0
          }
        }));
        return {
          Word: word,
          PronunciationAssessment: {
            ErrorType: errorType,
            AccuracyScore: wScore
          },
          Phonemes: phonemes
        };
      })
    : undefined;

  return {
    id: item.id,
    recognizedText: item.recTxt,
    text: item.txt,
    scoreAccuracy: item.scores.acc,
    scoreCompleteness: item.scores.comp,
    scoreFluency: item.scores.flu,
    scorePronunciation: item.scores.pron,
    timestamp: item.ts,
    ...(words ? { words } : {})
  };
};
