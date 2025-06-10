import { useState, useRef } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { SpeechAssessmentResult } from '../types/speech';
import { generateSpeechWithNicetone } from '../utils/api';
import { DEFAULT_VOICE } from '../config/voiceConfig';
import { audioCache } from '../utils/audioCache';

// 時間戳工具函數
const getTimeStamp = (): string => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const seconds = now.getSeconds().toString().padStart(2, '0');
  const milliseconds = now.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
};

// 性能計時器
const getPerformanceTime = (): number => {
  return performance.now();
};

// 格式化耗時
const formatDuration = (duration: number): string => {
  if (duration < 1000) {
    return `${duration.toFixed(1)}ms`;
  } else {
    return `${(duration / 1000).toFixed(2)}s`;
  }
};

interface AzureSpeechState {
  isLoading: boolean;
  error: string | null;
}

interface AzureSpeechOptions {
  key: string;
  region: string;
}

interface AzureSpeechResult extends AzureSpeechState {
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
    voice?: string, // 支持的選項：bella, nicole, sarah (女性), adam, michael (男性)
    rate?: number
  ) => Promise<{ audio: HTMLAudioElement }>;
  
  cancelAzureSpeech: () => void;
}

export const useAzureSpeech = (): AzureSpeechResult => {
  const [state, setState] = useState<AzureSpeechState>({
    isLoading: false,
    error: null
  });
  
  const recognizerRef = useRef<SpeechSDK.SpeechRecognizer | null>(null);
  const synthesizerRef = useRef<SpeechSDK.SpeechSynthesizer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // 使用Azure SDK直接进行语音评估
  const assessWithAzure = async (
    referenceText: string,
    strictMode: boolean,
    options: AzureSpeechOptions
  ): Promise<SpeechAssessmentResult | null> => {
    return new Promise((resolve) => {
      try {
        // 检查API key和region是否已设置
        if (!options.key || !options.region) {
          throw new Error('请先设置Azure API key和区域');
        }
        
        setState({ isLoading: true, error: null });
        
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
          options.key, 
          options.region
        );
        speechConfig.speechRecognitionLanguage = "en-US";
        const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
        
        const pronunciationAssessmentConfig = new SpeechSDK.PronunciationAssessmentConfig(
          referenceText,
          SpeechSDK.PronunciationAssessmentGradingSystem.HundredMark,
          SpeechSDK.PronunciationAssessmentGranularity.Phoneme,
          true
        );
        
        // 啟用嚴格評分模式 - 使用类型断言避免TypeScript错误
        (pronunciationAssessmentConfig as any).enableStrictAccuracy = strictMode;
        
        const recognizer = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);
        recognizerRef.current = recognizer;
        pronunciationAssessmentConfig.applyTo(recognizer);
        
        recognizer.recognizeOnceAsync((res) => {
          setState(prev => ({ ...prev, isLoading: false }));
          
          if (res) {
            const paResult = SpeechSDK.PronunciationAssessmentResult.fromResult(res);
            const jsonStr = res.properties.getProperty(SpeechSDK.PropertyId.SpeechServiceResponse_JsonResult);
            let NBest: any = undefined;
            let DisplayText: string | undefined = undefined;
            try {
              const parsed = JSON.parse(jsonStr);
              NBest = parsed.NBest || parsed.nBest;
              DisplayText = parsed.DisplayText;
            } catch {}
            const result: SpeechAssessmentResult = {
              accuracyScore: paResult.accuracyScore,
              fluencyScore: paResult.fluencyScore,
              completenessScore: paResult.completenessScore,
              pronunciationScore: paResult.pronunciationScore,
              NBest,
              DisplayText,
              json: jsonStr
            } as any;
            resolve(result);
          } else {
            resolve(null);
          }
          
          if (recognizerRef.current) {
            recognizerRef.current.close();
            recognizerRef.current = null;
          }
        }, (error) => {
          console.error('Azure语音识别失败:', error);
          setState({ 
            isLoading: false, 
            error: `Azure语音识别失败: ${error}` 
          });
          resolve(null);
          
          if (recognizerRef.current) {
            recognizerRef.current.close();
            recognizerRef.current = null;
          }
        });
      } catch (err) {
        console.error('Azure语音评估初始化失败:', err);
        setState({ 
          isLoading: false, 
          error: `Azure语音评估初始化失败: ${err instanceof Error ? err.message : String(err)}` 
        });
        resolve(null);
      }
    });
  };
  
  // 使用Azure SDK直接进行文本转语音
  const speakWithAzure = async (
    text: string,
    options: AzureSpeechOptions
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (!text) {
          throw new Error("請先輸入要發音的文字！");
        }
        
        // 检查API key和region是否已设置
        if (!options.key || !options.region) {
          throw new Error('请先设置Azure API key和区域');
        }
        
        setState({ isLoading: true, error: null });
        
        const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(
          options.key, 
          options.region
        );
        
        const synthesizer = new SpeechSDK.SpeechSynthesizer(speechConfig);
        synthesizerRef.current = synthesizer;
        
        synthesizer.speakTextAsync(
          text,
          result => {
            setState(prev => ({ ...prev, isLoading: false }));
            
            if (result.reason === SpeechSDK.ResultReason.SynthesizingAudioCompleted) {
              console.log("语音合成完成");
              resolve();
            } else {
              console.error("语音合成失败：", result.errorDetails);
              setState({ 
                isLoading: false, 
                error: `语音合成失败：${result.errorDetails}` 
              });
              reject(new Error(result.errorDetails));
            }
            
            if (synthesizerRef.current) {
              synthesizerRef.current.close();
              synthesizerRef.current = null;
            }
          },
          error => {
            setState({ isLoading: false, error: `语音合成发生错误：${error}` });
            console.error("语音合成发生错误：", error);
            reject(error);
            
            if (synthesizerRef.current) {
              synthesizerRef.current.close();
              synthesizerRef.current = null;
            }
          }
        );
      } catch (err) {
        console.error('初始化Azure语音合成失败:', err);
        setState({ 
          isLoading: false, 
          error: `初始化Azure语音合成失败: ${err instanceof Error ? err.message : String(err)}` 
        });
        reject(err);
      }
    });
  };
  
  // 使用 nicetone.ai 進行流式文本转语音（WebM格式直接播放）
  const speakWithAIServerStream = async (
    text: string,
    voice: string = DEFAULT_VOICE,
    rate?: number
  ): Promise<{ audio: HTMLAudioElement }> => {
    const startTime = getPerformanceTime();
    console.log(`[${getTimeStamp()}] 開始WebM流式TTS: "${text.substring(0, 30)}..." 語音:${voice}`);
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 停止之前的音頻播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // 先檢查緩存
      const cachedUrl = audioCache.get(text, voice, rate);
      let audioUrl: string;
      let fileInfo = '';
      
      if (cachedUrl) {
        // 使用緩存的音頻
        console.log(`[${getTimeStamp()}] 使用緩存音頻: ${cachedUrl}`);
        audioUrl = cachedUrl;
        fileInfo = '(緩存音頻)';
      } else {
        // 調用 nicetone.ai WebM API
        const apiStartTime = getPerformanceTime();
        console.log(`[${getTimeStamp()}] 發送 nicetone.ai WebM API 請求: ${voice}`);
        
        const data = await generateSpeechWithNicetone(text, voice);
        const apiEndTime = getPerformanceTime();
        console.log(`[${getTimeStamp()}] nicetone.ai WebM API 響應完成 (API耗時: ${formatDuration(apiEndTime - apiStartTime)})`);
        
        if (!data.success || !data.audioUrl) {
          throw new Error(data.error || "nicetone.ai WebM API 返回失敗");
        }
        
        audioUrl = data.audioUrl;
        fileInfo = `大小=${data.size} bytes, 類型=${data.type}`;
        
        // 緩存音頻 URL（1天）
        audioCache.set(text, voice, audioUrl, rate);
        
        console.log(`[${getTimeStamp()}] WebM音頻blob URL創建成功，開始播放: ${audioUrl}`);
        console.log(`[${getTimeStamp()}] WebM文件信息: ${fileInfo}`);
      }
      
      // 創建 Audio 元素，使用blob URL進行播放
      const audioCreateTime = getPerformanceTime();
      const audio = new Audio();
      audioRef.current = audio;
      
      // 使用已獲取的 audioUrl，實現快速播放
      audio.src = audioUrl;
      audio.preload = "auto";
      audio.playbackRate = 1.0;
      
      // 設置播放事件 - 儘快開始播放
      let hasStartedPlaying = false;
      
      const tryToPlay = async () => {
        if (hasStartedPlaying) return;
        try {
          await audio.play();
          hasStartedPlaying = true;
          const playTime = getPerformanceTime();
          const totalTime = playTime - startTime;
          console.log(`[${getTimeStamp()}] WebM播放開始 (總耗時: ${formatDuration(totalTime)})`);
        } catch (playError) {
          console.warn(`[${getTimeStamp()}] WebM播放嘗試失敗:`, playError);
        }
      };
      
      // 多個事件監聽，確保儘快開始播放
      audio.onloadeddata = () => {
        console.log(`[${getTimeStamp()}] WebM音頻數據載入完成`);
        tryToPlay();
      };
      audio.oncanplay = () => {
        console.log(`[${getTimeStamp()}] WebM音頻可以開始播放`);
        tryToPlay();
      };
      
      audio.onended = () => {
        const endTime = getPerformanceTime();
        const totalTime = endTime - startTime;
        console.log(`[${getTimeStamp()}] WebM播放完成 (總耗時: ${formatDuration(totalTime)}) - 音頻已緩存1天`);
        
        // 不再立即清理 blob URL，而是讓緩存系統在1天後自動清理
        audioRef.current = null;
      };
      
      audio.onerror = (error) => {
        console.error(`[${getTimeStamp()}] WebM音頻播放錯誤:`, error);
        
        setState(prev => ({ 
          ...prev, 
          error: `WebM音頻播放失敗: ${error}`,
          isLoading: false 
        }));
      };
      
      // 立即開始加載WebM音頻
      audio.load();
      console.log(`[${getTimeStamp()}] WebM音頻開始載入`);
      
      setState(prev => ({ ...prev, isLoading: false }));
      return { audio };
      
    } catch (err) {
      const errorTime = getPerformanceTime();
      const totalTime = errorTime - startTime;
      console.error(`[${getTimeStamp()}] nicetone.ai WebM流式TTS失敗 (總耗時: ${formatDuration(totalTime)}):`, err);
      setState(prev => ({ 
        ...prev, 
        error: `nicetone.ai WebM流式TTS失敗: ${err instanceof Error ? err.message : String(err)}`,
        isLoading: false 
      }));
      throw err;
    }
  };
  
  // 取消当前Azure语音操作
  const cancelAzureSpeech = () => {
    // 停止Azure识别
    if (recognizerRef.current) {
      recognizerRef.current.close();
      recognizerRef.current = null;
    }
    
    // 停止Azure语音合成
    if (synthesizerRef.current) {
      synthesizerRef.current.close();
      synthesizerRef.current = null;
    }
    
    // 停止音频播放但不清理 blob URL（讓緩存系統管理）
    if (audioRef.current) {
      console.log(`[${getTimeStamp()}] 停止音頻播放（保留緩存）`);
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // 关闭音频上下文
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    setState(prev => ({ ...prev, isLoading: false }));
  };
  
  return {
    ...state,
    assessWithAzure,
    speakWithAzure,
    speakWithAIServerStream,
    cancelAzureSpeech
  };
}; 