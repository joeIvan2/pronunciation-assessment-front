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
  
  // 使用 nicetone.ai 進行流式文本转语音（WebM格式直接播放，支持永久blob緩存和失敗重試）
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
      
      // 優先檢查永久blob緩存
      let audioUrl: string | null = null;
      let useRemoteTTS = false;
      let fileInfo = '';
      
      // 首先嘗試使用永久blob緩存
      if (audioCache.hasBlobCache(text, voice, rate)) {
        audioUrl = audioCache.get(text, voice, rate);
        if (audioUrl) {
          console.log(`[${getTimeStamp()}] 使用永久blob緩存: ${audioUrl}`);
          fileInfo = '(永久blob緩存)';
        }
      }
      
      // 如果沒有永久blob緩存，檢查普通緩存
      if (!audioUrl) {
        const cachedUrl = audioCache.get(text, voice, rate);
        if (cachedUrl) {
          console.log(`[${getTimeStamp()}] 使用臨時緩存音頻: ${cachedUrl}`);
          audioUrl = cachedUrl;
          fileInfo = '(臨時緩存音頻)';
        }
      }
      
      // 如果沒有任何緩存，調用遠端API
      if (!audioUrl) {
        const apiStartTime = getPerformanceTime();
        console.log(`[${getTimeStamp()}] 發送 nicetone.ai WebM API 請求: ${voice}`);
        
        try {
          const data = await generateSpeechWithNicetone(text, voice);
          const apiEndTime = getPerformanceTime();
          console.log(`[${getTimeStamp()}] nicetone.ai WebM API 響應完成 (API耗時: ${formatDuration(apiEndTime - apiStartTime)})`);
          
          if (!data.success || !data.audioUrl) {
            throw new Error(data.error || "nicetone.ai WebM API 返回失敗");
          }
          
          // 獲取blob數據並設置為永久緩存
          try {
            const response = await fetch(data.audioUrl);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const blob = await response.blob();
            
            // 設置永久blob緩存
            audioUrl = await audioCache.setBlobPermanent(text, voice, blob, rate);
            fileInfo = `大小=${data.size} bytes, 類型=${data.type} (已設為永久blob緩存)`;
            
            console.log(`[${getTimeStamp()}] WebM音頻blob永久緩存設置成功: ${audioUrl}`);
            console.log(`[${getTimeStamp()}] WebM文件信息: ${fileInfo}`);
          } catch (blobError) {
            console.warn(`[${getTimeStamp()}] 設置永久blob緩存失敗，使用臨時URL:`, blobError);
            
            // 如果blob緩存失敗，使用普通緩存
            audioUrl = data.audioUrl;
            fileInfo = `大小=${data.size} bytes, 類型=${data.type} (臨時緩存)`;
            audioCache.set(text, voice, audioUrl, rate);
            useRemoteTTS = true;
          }
        } catch (apiError) {
          console.error(`[${getTimeStamp()}] nicetone.ai WebM API 調用失敗:`, apiError);
          throw apiError;
        }
      }
      
      if (!audioUrl) {
        throw new Error("無法獲取音頻URL");
      }
      
      // 創建 Audio 元素進行播放
      const audioCreateTime = getPerformanceTime();
      const audio = new Audio();
      audioRef.current = audio;
      
      audio.src = audioUrl;
      audio.preload = "auto";
      audio.playbackRate = 1.0;
      
      // 設置播放事件和錯誤處理
      let hasStartedPlaying = false;
      let playbackFailed = false;
      
      const tryToPlay = async () => {
        if (hasStartedPlaying || playbackFailed) return;
        try {
          await audio.play();
          hasStartedPlaying = true;
          const playTime = getPerformanceTime();
          const totalTime = playTime - startTime;
          console.log(`[${getTimeStamp()}] WebM播放開始 (總耗時: ${formatDuration(totalTime)})`);
        } catch (playError) {
          console.warn(`[${getTimeStamp()}] WebM播放嘗試失敗:`, playError);
          
          // 如果blob播放失敗且不是遠端TTS，嘗試使用遠端TTS
          if (!useRemoteTTS && !playbackFailed) {
            playbackFailed = true;
            console.log(`[${getTimeStamp()}] blob播放失敗，嘗試使用遠端TTS重試`);
            
            try {
              // 重新調用API獲取遠端URL
              const fallbackData = await generateSpeechWithNicetone(text, voice);
              if (fallbackData.success && fallbackData.audioUrl) {
                console.log(`[${getTimeStamp()}] 遠端TTS重試成功，切換音頻源`);
                
                // 更新音頻源為遠端URL
                audio.src = fallbackData.audioUrl;
                
                // 設置臨時緩存
                audioCache.set(text, voice, fallbackData.audioUrl, rate);
                
                // 重新嘗試播放
                await audio.play();
                hasStartedPlaying = true;
                const retryPlayTime = getPerformanceTime();
                const retryTotalTime = retryPlayTime - startTime;
                console.log(`[${getTimeStamp()}] 遠端TTS重試播放成功 (總耗時: ${formatDuration(retryTotalTime)})`);
              } else {
                throw new Error("遠端TTS重試也失敗");
              }
            } catch (retryError) {
              console.error(`[${getTimeStamp()}] 遠端TTS重試失敗:`, retryError);
              throw retryError;
            }
          }
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
        console.log(`[${getTimeStamp()}] WebM播放完成 (總耗時: ${formatDuration(totalTime)}) - ${fileInfo}`);
        
        audioRef.current = null;
      };
      
      audio.onerror = (error) => {
        console.error(`[${getTimeStamp()}] WebM音頻播放錯誤:`, error);
        
        // 如果是blob URL出錯且不是遠端TTS，嘗試遠端TTS
        if (!useRemoteTTS && !playbackFailed) {
          console.log(`[${getTimeStamp()}] blob音頻出錯，嘗試遠端TTS`);
          tryToPlay(); // 這會觸發遠端TTS重試邏輯
        } else {
          setState(prev => ({ 
            ...prev, 
            error: `WebM音頻播放失敗: ${error}`,
            isLoading: false 
          }));
        }
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