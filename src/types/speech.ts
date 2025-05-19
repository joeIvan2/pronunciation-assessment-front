// 语音评估结果类型定义

// 语音评估单词中的音素评估结果
export interface PhonemeAssessment {
  AccuracyScore?: number;
  ErrorType?: string;
}

// 语音评估单词中的音素
export interface Phoneme {
  Phoneme: string;
  PronunciationAssessment?: PhonemeAssessment;
}

// 单词评估结果
export interface WordAssessment {
  AccuracyScore?: number;
  ErrorType?: string;
}

// 评估结果中的单词
export interface Word {
  Word: string;
  PronunciationAssessment?: WordAssessment;
  Phonemes?: Phoneme[];
}

// 评估详细结果
export interface PronunciationAssessmentResult {
  AccuracyScore: number;
  FluencyScore: number;
  CompletenessScore: number;
  PronScore: number;
}

// NBest结果
export interface NBestResult {
  Words: Word[];
  PronunciationAssessment?: PronunciationAssessmentResult;
  Display?: string;
  display?: string;
}

// 语音评估的完整结果
export interface SpeechAssessmentResult {
  accuracy?: number;
  fluency?: number;
  completeness?: number;
  pronScore?: number;
  text?: string;
  DisplayText?: string;
  accuracyScore?: number;
  fluencyScore?: number;
  completenessScore?: number;
  pronunciationScore?: number;
  NBest?: NBestResult[];
  nBest?: NBestResult[];
  nbest?: NBestResult[];
  json?: string;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

// 收藏项目类型
export interface Favorite {
  id: string;
  text: string;
  tagIds: string[];
  createdAt: number;
}

// 语音选项类型
export interface VoiceOption extends SpeechSynthesisVoice {
  // 扩展浏览器标准的SpeechSynthesisVoice类型
} 