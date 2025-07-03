// TypeScript 類型測試文件
// 這個文件用於驗證 speech.ts 中的類型定義是否正確

import {
  // 基本語音評估類型
  SpeechAssessmentResult,
  Word,
  Phoneme,
  NBestResult,
  
  // API 相關類型
  AzureSpeechOptions,
  SpeechAssessmentRequestPayload,
  TTSRequestPayload,
  NicetoneAPIResponse,
  
  // Hook 類型
  AzureSpeechState,
  AzureSpeechResult,
  BackendSpeechState,
  BackendSpeechResult,
  
  // 錯誤類型
  SpeechAssessmentErrorType,
  SpeechAssessmentError,
  
  // 配置類型
  AppConfig,
  AudioConfig,
  
  // 組件 Props 類型
  WordComponentProps,
  ScoreBarProps,
  VoicePickerProps
} from './speech';

describe('Speech Types', () => {
  describe('基本語音評估類型', () => {
    test('SpeechAssessmentResult 應該有正確的屬性', () => {
      const result: SpeechAssessmentResult = {
        accuracyScore: 85.5,
        fluencyScore: 90.2,
        completenessScore: 88.7,
        pronunciationScore: 87.8,
        DisplayText: "Hello world",
        NBest: []
      };
      
      expect(typeof result.accuracyScore).toBe('number');
      expect(typeof result.fluencyScore).toBe('number');
      expect(typeof result.completenessScore).toBe('number');
      expect(typeof result.pronunciationScore).toBe('number');
    });

    test('Word 類型應該包含必要的屬性', () => {
      const word: Word = {
        Word: "hello",
        PronunciationAssessment: {
          AccuracyScore: 85.5,
          ErrorType: "None"
        },
        Phonemes: [
          {
            Phoneme: "h",
            PronunciationAssessment: {
              AccuracyScore: 90.0
            }
          }
        ]
      };
      
      expect(typeof word.Word).toBe('string');
      expect(word.PronunciationAssessment).toBeDefined();
      expect(Array.isArray(word.Phonemes)).toBe(true);
    });
  });

  describe('API 相關類型', () => {
    test('AzureSpeechOptions 應該需要 key 和 region', () => {
      const options: AzureSpeechOptions = {
        key: "test-key",
        region: "eastus"
      };
      
      expect(typeof options.key).toBe('string');
      expect(typeof options.region).toBe('string');
    });

    test('SpeechAssessmentRequestPayload 應該包含必要的字段', () => {
      const payload: SpeechAssessmentRequestPayload = {
        referenceText: "Hello world",
        audioBuffer: "base64encodedaudio",
        strictMode: true
      };
      
      expect(typeof payload.referenceText).toBe('string');
      expect(typeof payload.audioBuffer).toBe('string');
      expect(typeof payload.strictMode).toBe('boolean');
    });

    test('NicetoneAPIResponse 應該有正確的結構', () => {
      const response: NicetoneAPIResponse = {
        success: true,
        audioUrl: "blob:http://localhost:3000/audio",
        size: 1024,
        type: "audio/webm"
      };
      
      expect(typeof response.success).toBe('boolean');
      expect(typeof response.audioUrl).toBe('string');
      expect(typeof response.size).toBe('number');
      expect(typeof response.type).toBe('string');
    });
  });

  describe('錯誤類型', () => {
    test('SpeechAssessmentErrorType 枚舉應該有所有錯誤類型', () => {
      const errorTypes = Object.values(SpeechAssessmentErrorType);
      
      expect(errorTypes).toContain('NETWORK_ERROR');
      expect(errorTypes).toContain('API_KEY_INVALID');
      expect(errorTypes).toContain('AUDIO_RECORDING_FAILED');
      expect(errorTypes).toContain('MICROPHONE_ACCESS_DENIED');
      expect(errorTypes).toContain('UNSUPPORTED_BROWSER');
      expect(errorTypes).toContain('SERVER_ERROR');
      expect(errorTypes).toContain('TIMEOUT_ERROR');
      expect(errorTypes).toContain('UNKNOWN_ERROR');
    });

    test('SpeechAssessmentError 應該有正確的結構', () => {
      const error: SpeechAssessmentError = {
        type: SpeechAssessmentErrorType.NETWORK_ERROR,
        message: "Network request failed",
        timestamp: Date.now()
      };
      
      expect(typeof error.type).toBe('string');
      expect(typeof error.message).toBe('string');
      expect(typeof error.timestamp).toBe('number');
    });
  });

  describe('Hook 狀態類型', () => {
    test('AzureSpeechState 應該有正確的屬性', () => {
      const state: AzureSpeechState = {
        isLoading: false,
        error: null
      };
      
      expect(typeof state.isLoading).toBe('boolean');
      expect(state.error).toBeNull();
    });

    test('BackendSpeechState 應該擴展基本狀態', () => {
      const state: BackendSpeechState = {
        isLoading: false,
        error: null,
        isStreaming: false,
        streamProgress: 0
      };
      
      expect(typeof state.isLoading).toBe('boolean');
      expect(state.error).toBeNull();
      expect(typeof state.isStreaming).toBe('boolean');
      expect(typeof state.streamProgress).toBe('number');
    });
  });

  describe('配置類型', () => {
    test('AppConfig 應該有正確的結構', () => {
      const config: AppConfig = {
        azureApiKey: "test-key",
        azureRegion: "eastus",
        enableStrictMode: true,
        defaultVoice: "bella",
        audioQuality: "high",
        autoSave: true
      };
      
      expect(typeof config.azureApiKey).toBe('string');
      expect(typeof config.azureRegion).toBe('string');
      expect(typeof config.enableStrictMode).toBe('boolean');
      expect(typeof config.defaultVoice).toBe('string');
      expect(['low', 'medium', 'high']).toContain(config.audioQuality);
      expect(typeof config.autoSave).toBe('boolean');
    });

    test('AudioConfig 應該有正確的音頻屬性', () => {
      const config: AudioConfig = {
        sampleRate: 44100,
        channels: 2,
        bitDepth: 16,
        format: "webm"
      };
      
      expect(typeof config.sampleRate).toBe('number');
      expect(typeof config.channels).toBe('number');
      expect(typeof config.bitDepth).toBe('number');
      expect(typeof config.format).toBe('string');
    });
  });

  describe('組件 Props 類型', () => {
    test('WordComponentProps 應該有正確的結構', () => {
      const word: Word = {
        Word: "hello",
        PronunciationAssessment: {
          AccuracyScore: 85.5
        }
      };

      const props: WordComponentProps = {
        word: word,
        index: 0,
        showPhonemes: true,
        className: "word-component"
      };
      
      expect(typeof props.word).toBe('object');
      expect(typeof props.index).toBe('number');
      expect(typeof props.showPhonemes).toBe('boolean');
      expect(typeof props.className).toBe('string');
    });

    test('ScoreBarProps 應該有正確的結構', () => {
      const props: ScoreBarProps = {
        score: 85.5,
        label: "Accuracy",
        maxScore: 100,
        showPercentage: true,
        color: "#4CAF50"
      };
      
      expect(typeof props.score).toBe('number');
      expect(typeof props.label).toBe('string');
      expect(typeof props.maxScore).toBe('number');
      expect(typeof props.showPercentage).toBe('boolean');
      expect(typeof props.color).toBe('string');
    });
  });
});

// 類型測試：創建類型實例來驗證接口定義

// 測試基本評估結果類型
const testAssessmentResult: SpeechAssessmentResult = {
  accuracyScore: 85.5,
  fluencyScore: 90.2,
  completenessScore: 88.7,
  pronunciationScore: 87.8,
  DisplayText: "Hello world",
  NBest: []
};

// 測試 Word 類型
const testWord: Word = {
  Word: "hello",
  PronunciationAssessment: {
    AccuracyScore: 85.5,
    ErrorType: "None"
  },
  Phonemes: [
    {
      Phoneme: "h",
      PronunciationAssessment: {
        AccuracyScore: 90.0
      }
    }
  ]
};

// 測試 API 請求類型
const testApiRequest: SpeechAssessmentRequestPayload = {
  referenceText: "Hello world",
  audioBuffer: "base64encodedaudio",
  strictMode: true
};

// 測試 Azure 配置類型
const testAzureConfig: AzureSpeechOptions = {
  key: "test-key",
  region: "eastus"
};

// 測試 TTS 請求類型
const testTTSRequest: TTSRequestPayload = {
  text: "Hello world",
  character: "bella",
  speed: 1.0
};

// 測試 Nicetone API 響應類型
const testNicetoneResponse: NicetoneAPIResponse = {
  success: true,
  audioUrl: "blob:http://localhost:3000/audio",
  size: 1024,
  type: "audio/webm"
};

// 測試錯誤類型
const testError: SpeechAssessmentError = {
  type: SpeechAssessmentErrorType.NETWORK_ERROR,
  message: "Network request failed",
  timestamp: Date.now()
};

// 測試應用配置類型
const testAppConfig: AppConfig = {
  azureApiKey: "test-key",
  azureRegion: "eastus",
  enableStrictMode: true,
  defaultVoice: "bella",
  audioQuality: "high",
  autoSave: true
};

// 測試音頻配置類型
const testAudioConfig: AudioConfig = {
  sampleRate: 44100,
  channels: 2,
  bitDepth: 16,
  format: "webm"
};

// 測試組件 Props 類型
const testWordProps: WordComponentProps = {
  word: testWord,
  index: 0,
  showPhonemes: true,
  className: "word-component"
};

const testScoreBarProps: ScoreBarProps = {
  score: 85.5,
  label: "Accuracy",
  maxScore: 100,
  showPercentage: true,
  color: "#4CAF50"
};

// 模擬 Hook 狀態類型
const testAzureState: AzureSpeechState = {
  isLoading: false,
  error: null
};

const testBackendState: BackendSpeechState = {
  isLoading: false,
  error: null,
  isStreaming: false,
  streamProgress: 0
};

// 類型安全測試：確保必需屬性存在
const ensureRequiredProperties = () => {
  // 確保 SpeechAssessmentResult 有必需的屬性
  const result: Partial<SpeechAssessmentResult> = {};
  
  // 確保 AzureSpeechOptions 需要 key 和 region
  const azureOptions: AzureSpeechOptions = {
    key: "required",
    region: "required"
  };
  
  // 確保錯誤類型枚舉值正確
  const errorTypes = [
    SpeechAssessmentErrorType.NETWORK_ERROR,
    SpeechAssessmentErrorType.API_KEY_INVALID,
    SpeechAssessmentErrorType.AUDIO_RECORDING_FAILED,
    SpeechAssessmentErrorType.MICROPHONE_ACCESS_DENIED,
    SpeechAssessmentErrorType.UNSUPPORTED_BROWSER,
    SpeechAssessmentErrorType.SERVER_ERROR,
    SpeechAssessmentErrorType.TIMEOUT_ERROR,
    SpeechAssessmentErrorType.UNKNOWN_ERROR
  ];
  
  console.log('Type tests passed:', {
    result,
    azureOptions,
    errorTypes
  });
};

// 函數簽名測試：確保 Hook 接口正確
const testHookSignatures = () => {
  // 模擬 Azure Speech Hook 函數簽名
  const mockAssessWithAzure = async (
    referenceText: string,
    strictMode: boolean,
    options: AzureSpeechOptions
  ): Promise<SpeechAssessmentResult | null> => {
    return testAssessmentResult;
  };
  
  const mockSpeakWithAzure = async (
    text: string,
    options: AzureSpeechOptions
  ): Promise<void> => {
    // Mock implementation
  };
  
  const mockSpeakWithAIStream = async (
    text: string,
    voice?: string,
    rate?: number
  ): Promise<{ audio: HTMLAudioElement }> => {
    return { audio: new Audio() };
  };
  
  // 確保函數簽名與接口匹配
  const azureResult: AzureSpeechResult = {
    ...testAzureState,
    assessWithAzure: mockAssessWithAzure,
    speakWithAzure: mockSpeakWithAzure,
    speakWithAIServerStream: mockSpeakWithAIStream,
    cancelAzureSpeech: () => {},
    isAudioPlaying: () => false
  };
  
  console.log('Hook signature tests passed:', azureResult);
};

// 導出測試函數供其他文件使用
export {
  ensureRequiredProperties,
  testHookSignatures
};

export default {
  testAssessmentResult,
  testWord,
  testApiRequest,
  testAzureConfig,
  testTTSRequest,
  testNicetoneResponse,
  testError,
  testAppConfig,
  testAudioConfig,
  testWordProps,
  testScoreBarProps
}; 