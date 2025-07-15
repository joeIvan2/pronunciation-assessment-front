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
  /**
   * 標籤唯一識別碼
   */
  tagId: string;
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

// AI 指令收藏類型
export interface PromptFavorite {
  id: string;
  prompt: string;
  createdAt: number;
}

// 语音选项类型
export interface VoiceOption extends SpeechSynthesisVoice {
  // 扩展浏览器标准的SpeechSynthesisVoice类型
}

// ===== API 相關類型定義 =====

/**
 * Azure Speech 服務配置選項
 */
export interface AzureSpeechOptions {
  key: string;
  region: string;
}

/**
 * 語音評估請求負載
 */
export interface SpeechAssessmentRequestPayload {
  referenceText: string;
  audioBuffer: string; // Base64 編碼的音頻數據
  strictMode: boolean;
}

/**
 * TTS 請求負載
 */
export interface TTSRequestPayload {
  text: string;
  character?: string;
  speed?: number;
}

/**
 * Nicetone API 響應
 */
export interface NicetoneAPIResponse {
  success: boolean;
  audioUrl?: string;
  blob?: Blob;
  size?: number;
  type?: string;
  error?: string;
}

/**
 * Streaming 評估配置
 */
export interface StreamingAssessmentConfig {
  referenceText: string;
  strictMode: boolean;
  language?: string;
  enableMiscue?: boolean;
}

/**
 * Streaming 會話初始化請求
 */
export interface StreamingSessionInitRequest {
  sessionId: string;
  referenceText: string;
  strictMode: boolean;
  options?: {
    language?: string;
    enableMiscue?: boolean;
  };
}

/**
 * 音頻 Chunk 請求
 */
export interface AudioChunkRequest {
  sessionId: string;
  audioChunk: string; // Base64 編碼
  chunkIndex: number;
}

/**
 * Streaming 部分結果
 */
export interface StreamingPartialResult {
  partialText?: string;
  confidence?: number;
  timestamp?: number;
}

// ===== Hook 狀態和結果類型 =====

/**
 * Azure Speech Hook 狀態
 */
export interface AzureSpeechState {
  isLoading: boolean;
  error: string | null;
}

/**
 * Backend Speech Hook 狀態
 */
export interface BackendSpeechState {
  isLoading: boolean;
  error: string | null;
  isStreaming: boolean;
  streamProgress: number;
}

/**
 * Azure Speech Hook 返回結果
 */
export interface AzureSpeechResult extends AzureSpeechState {
  assessWithAzure: (
    referenceText: string,
    strictMode: boolean,
    options: AzureSpeechOptions
  ) => Promise<SpeechAssessmentResult | null>;
  
  speakWithAzure: (
    text: string,
    options: AzureSpeechOptions
  ) => Promise<void>;
  
  speakWithAIServerStream: (
    text: string,
    voice?: string,
    rate?: number
  ) => Promise<{ audio: HTMLAudioElement }>;
  
  cancelAzureSpeech: () => void;
  isAudioPlaying: () => boolean;
}

/**
 * Backend Speech Hook 返回結果
 */
export interface BackendSpeechResult extends BackendSpeechState {
  assessWithBackend: (
    audioBlob: Blob,
    referenceText: string,
    strictMode: boolean
  ) => Promise<SpeechAssessmentResult | null>;
  
  speakWithBackend: (text: string) => Promise<void>;
  
  startStreamingAssessment: (
    referenceText: string,
    strictMode: boolean,
    onProgress?: (progress: number) => void,
    onPartialResult?: (result: Partial<SpeechAssessmentResult>) => void
  ) => Promise<(chunk: Blob) => void>;
  
  stopStreamingAssessment: () => Promise<SpeechAssessmentResult | null>;
  sendAudioChunk: (chunk: Blob) => Promise<void>;
}

/**
 * 錄音器狀態
 */
export interface RecorderState {
  isRecording: boolean;
  isLoading: boolean;
  error: string | null;
  audioBlob: Blob | null;
  duration: number;
}

/**
 * 錄音器選項
 */
export interface RecorderOptions {
  audioBitsPerSecond?: number;
  mimeType?: string;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

/**
 * 錄音器結果
 */
export interface RecorderResult extends RecorderState {
  startRecording: (options?: RecorderOptions) => Promise<void>;
  stopRecording: () => void;
  clearRecording: () => void;
  downloadRecording: () => void;
}

// ===== 組件 Props 類型 =====

/**
 * Word 組件 Props
 */
export interface WordComponentProps {
  word: Word;
  index: number;
  showPhonemes?: boolean;
  className?: string;
}

/**
 * ScoreBar 組件 Props
 */
export interface ScoreBarProps {
  score: number;
  label: string;
  maxScore?: number;
  showPercentage?: boolean;
  color?: string;
  className?: string;
}

/**
 * VoicePicker 組件 Props
 */
export interface VoicePickerProps {
  selectedVoice: string;
  onVoiceChange: (voice: string) => void;
  availableVoices?: VoiceOption[];
  disabled?: boolean;
}

/**
 * TagManager 組件 Props
 */
export interface TagManagerProps {
  tags: Tag[];
  onTagCreate: (tag: Omit<Tag, 'tagId' | 'createdAt'>) => void;
  onTagUpdate: (tagId: string, updates: Partial<Tag>) => void;
  onTagDelete: (tagId: string) => void;
  className?: string;
}

// ===== 錯誤類型 =====

/**
 * 語音評估錯誤類型
 */
export enum SpeechAssessmentErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_KEY_INVALID = 'API_KEY_INVALID',
  AUDIO_RECORDING_FAILED = 'AUDIO_RECORDING_FAILED',
  MICROPHONE_ACCESS_DENIED = 'MICROPHONE_ACCESS_DENIED',
  UNSUPPORTED_BROWSER = 'UNSUPPORTED_BROWSER',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 語音評估錯誤
 */
export interface SpeechAssessmentError {
  type: SpeechAssessmentErrorType;
  message: string;
  details?: any;
  timestamp?: number;
}

// ===== 配置類型 =====

/**
 * 應用程式配置
 */
export interface AppConfig {
  azureApiKey?: string;
  azureRegion?: string;
  enableStrictMode: boolean;
  defaultVoice: string;
  audioQuality: 'low' | 'medium' | 'high';
  autoSave: boolean;
}

/**
 * 音頻配置
 */
export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  format: string;
} 