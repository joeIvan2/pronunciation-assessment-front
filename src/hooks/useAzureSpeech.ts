import { useState, useRef } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { SpeechAssessmentResult } from '../types/speech';
import { generateSpeech, generateSpeechStream, AI_SERVER_URL, generateSpeechWithNicetone, downloadAudioAsBlob } from '../utils/api';
import { getTTSCacheItem, addTTSCacheItem } from '../utils/storage';
import { DEFAULT_VOICE } from '../config/voiceConfig';

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

// 內存緩存 - 用於存儲音頻Blob和URL，在頁面刷新前保持有效
interface MemoryCacheItem {
  text: string;
  voice: string;
  blob?: Blob;
  url?: string;
  timestamp: number;
}

// 內存緩存，應用生命週期內有效
const memoryCache: MemoryCacheItem[] = [];

// 按文本和語音查找內存緩存項
const getMemoryCacheItem = (text: string, voice: string): MemoryCacheItem | undefined => {
  return memoryCache.find(item => item.text === text && item.voice === voice);
};

// 新增到內存緩存
const addToMemoryCache = (text: string, voice: string, blob?: Blob, url?: string): MemoryCacheItem => {
  // 查詢是否已有相同項
  const existingIndex = memoryCache.findIndex(item => item.text === text && item.voice === voice);
  
  const newItem: MemoryCacheItem = {
    text,
    voice,
    blob,
    url,
    timestamp: Date.now()
  };
  
  // 更新或新增新項
  if (existingIndex !== -1) {
    memoryCache[existingIndex] = newItem;
  } else {
    // 新增到開頭
    memoryCache.unshift(newItem);
    
    // 保持緩存大小在合理範圍（10項）
    if (memoryCache.length > 10) {
      const removed = memoryCache.pop();
      // 釋放被移除項的URL資源
      if (removed?.url?.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(removed.url);
        } catch (e) {
          console.warn('釋放blob URL失敗:', e);
        }
      }
    }
  }
  
  return newItem;
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
  
  speakWithAIServer: (
    text: string,
    voice?: string, // 支持的選項：heart, sky, bella, nicole, sarah (女性), adam, michael (男性)
    rate?: number
  ) => Promise<{ fromCache: boolean }>;
  
  speakWithAIServerStream: (
    text: string,
    voice?: string, // 支持的選項：heart, sky, bella, nicole, sarah (女性), adam, michael (男性)
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
  
  // 使用 nicetone.ai 進行文本轉語音
  const speakWithAIServer = async (
    text: string,
    voice: string = DEFAULT_VOICE,
    rate?: number
  ): Promise<{ fromCache: boolean }> => {
    const startTime = getPerformanceTime();
    console.log(`[${getTimeStamp()}] 開始TTS請求: "${text.substring(0, 30)}..." 語音:${voice} 語速:${rate || 1.0}`);
    
    try {
      if (!text) {
        throw new Error("請先輸入要發音的文字！");
      }
      
      setState({ isLoading: true, error: null });
      
      // 停止之前的音頻播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // 將語速參數調整為 nicetone.ai 的格式（通常 0.5-2.0）
      const speed = rate || 1.0;
      
      // 首先檢查內存緩存（使用 voice + speed 作為緩存鍵）
      const cacheKey = `${voice}_${speed}`;
      const cacheCheckTime = getPerformanceTime();
      const memoryCachedItem = getMemoryCacheItem(text, cacheKey);
      if (memoryCachedItem) {
        const cacheHitTime = getPerformanceTime();
        console.log(`[${getTimeStamp()}] 內存緩存命中 (檢查耗時: ${formatDuration(cacheHitTime - cacheCheckTime)}): ${text.substring(0, 20)}... ${cacheKey}`);
        
        try {
          if (memoryCachedItem.url) {
            // 使用緩存的URL直接播放
            const audio = new Audio(memoryCachedItem.url);
            audioRef.current = audio;
            
            // 設置播放速度（注意：這裡是播放器的速度，不同於 TTS 生成時的速度）
            audio.playbackRate = 1.0; // 保持 1.0，因為語速已經在生成時控制
            
            // 播放完成后清理引用
            audio.onended = () => {
              audioRef.current = null;
            };
            
            // 錯誤處理：如果 URL 失效，嘗試重新創建
            audio.onerror = (error) => {
              console.warn(`[${getTimeStamp()}] 緩存URL播放失敗，嘗試重新創建:`, error);
              if (memoryCachedItem.blob) {
                const newUrl = URL.createObjectURL(memoryCachedItem.blob);
                memoryCachedItem.url = newUrl;
                audio.src = newUrl;
                audio.load();
                audio.play().catch(e => console.error(`[${getTimeStamp()}] 重新播放失敗:`, e));
              }
            };
            
            const playStartTime = getPerformanceTime();
            await audio.play();
            const totalTime = getPerformanceTime() - startTime;
            console.log(`[${getTimeStamp()}] 內存緩存播放成功 (總耗時: ${formatDuration(totalTime)}) 語速: ${speed}x`);
            setState(prev => ({ ...prev, isLoading: false }));
            return { fromCache: true };
          } 
          else if (memoryCachedItem.blob) {
            // 從blob創建URL
            const audioUrl = URL.createObjectURL(memoryCachedItem.blob);
            
            // 更新緩存項的URL
            memoryCachedItem.url = audioUrl;
            
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            
            // 設置播放速度
            audio.playbackRate = 1.0;
            
            // 播放完成后清理引用
            audio.onended = () => {
              audioRef.current = null;
            };
            
            const playStartTime = getPerformanceTime();
            await audio.play();
            const totalTime = getPerformanceTime() - startTime;
            console.log(`[${getTimeStamp()}] 內存緩存blob播放成功 (總耗時: ${formatDuration(totalTime)}) 語速: ${speed}x`);
            setState(prev => ({ ...prev, isLoading: false }));
            return { fromCache: true };
          }
        } catch (playError) {
          console.warn(`[${getTimeStamp()}] 播放內存緩存音頻失敗:`, playError);
          // 失敗後將嘗試其他方式
        }
      }
      
      // 檢查localStorage緩存（使用相同的緩存鍵）
      const storageCacheTime = getPerformanceTime();
      const cachedItem = getTTSCacheItem(text, cacheKey);
      
      // 如果有localStorage緩存，嘗試使用
      if (cachedItem && cachedItem.audioUrl) {
        const storageHitTime = getPerformanceTime();
        console.log(`[${getTimeStamp()}] localStorage緩存命中 (檢查耗時: ${formatDuration(storageHitTime - storageCacheTime)}): ${text.substring(0, 20)}... ${cacheKey}`);
        
        try {
          // 播放缓存的音频
          const audio = new Audio(cachedItem.audioUrl);
          audioRef.current = audio;
          
          // 設置播放速度
          audio.playbackRate = 1.0;
          
          // 播放完成后清理
          audio.onended = () => {
            audioRef.current = null;
          };
          
          // 嘗試播放
          const playStartTime = getPerformanceTime();
          await audio.play();
          const totalTime = getPerformanceTime() - startTime;
          console.log(`[${getTimeStamp()}] localStorage緩存播放成功 (總耗時: ${formatDuration(totalTime)}) 語速: ${speed}x`);
          
          // 同時加入內存緩存
          addToMemoryCache(text, cacheKey, undefined, cachedItem.audioUrl);
          
          setState(prev => ({ ...prev, isLoading: false }));
          return { fromCache: true };
        } catch (error) {
          console.warn(`[${getTimeStamp()}] 播放localStorage緩存的音頻失敗:`, error);
          // 失敗後繼續嘗試請求新音頻
        }
      }
      
      // 沒有緩存或緩存播放失敗，請求新音頻
      const apiStartTime = getPerformanceTime();
      console.log(`[${getTimeStamp()}] 發送 nicetone.ai API 請求: ${voice} 語速:${speed}`);
      
      // 使用 nicetone.ai API 生成語音
      const data = await generateSpeechWithNicetone(text, voice, speed);
      const apiEndTime = getPerformanceTime();
      console.log(`[${getTimeStamp()}] nicetone.ai API 響應完成 (API耗時: ${formatDuration(apiEndTime - apiStartTime)}): ${data.audioUrl}`);
      
      if (data.success && data.audioUrl) {
        try {
          // 優先嘗試直接流式播放（更快）
          const playStartTime = getPerformanceTime();
          console.log(`[${getTimeStamp()}] 嘗試直接流式播放音頻`);
          const audio = new Audio(data.audioUrl);
          audioRef.current = audio;
          
          // 設置播放速度
          audio.playbackRate = 1.0;
          
          // 播放完成后清理
          audio.onended = () => {
            audioRef.current = null;
          };
          
          // 錯誤處理 - 如果直接播放失敗，下載後播放
          audio.onerror = async (error) => {
            const fallbackStartTime = getPerformanceTime();
            console.warn(`[${getTimeStamp()}] 直接播放失敗，改為下載後播放:`, error);
            try {
              // 下載音頻文件為 Blob
              const audioBlob = await downloadAudioAsBlob(data.audioUrl);
              
              // 創建本地 URL
              const localAudioUrl = URL.createObjectURL(audioBlob);
              
              // 重新設置音頻源
              audio.src = localAudioUrl;
              audio.load();
              
              // 加入緩存
              addToMemoryCache(text, cacheKey, audioBlob, localAudioUrl);
              
              await audio.play();
              const fallbackTime = getPerformanceTime() - fallbackStartTime;
              const totalTime = getPerformanceTime() - startTime;
              console.log(`[${getTimeStamp()}] 下載後播放成功 (降級耗時: ${formatDuration(fallbackTime)}, 總耗時: ${formatDuration(totalTime)}) 語速: ${speed}x`);
            } catch (downloadError) {
              console.error(`[${getTimeStamp()}] 下載播放也失敗:`, downloadError);
              throw downloadError;
            }
          };
          
          // 嘗試直接播放
          await audio.play();
          const playTime = getPerformanceTime();
          const playSetupTime = playTime - playStartTime;
          const totalTime = playTime - startTime;
          console.log(`[${getTimeStamp()}] 直接流式播放成功 (播放設置: ${formatDuration(playSetupTime)}, 總耗時: ${formatDuration(totalTime)}) 語速: ${speed}x`);
          
          // 新增到localStorage緩存（使用原始的URL）
          addTTSCacheItem(text, cacheKey, data.audioUrl);
          
          // 後台下載用於本地緩存（不阻塞當前播放）
          setTimeout(async () => {
            try {
              const cacheStartTime = getPerformanceTime();
              const audioBlob = await downloadAudioAsBlob(data.audioUrl);
              const localAudioUrl = URL.createObjectURL(audioBlob);
              addToMemoryCache(text, cacheKey, audioBlob, localAudioUrl);
              const cacheTime = getPerformanceTime() - cacheStartTime;
              console.log(`[${getTimeStamp()}] 後台緩存完成 (緩存耗時: ${formatDuration(cacheTime)}, 檔案大小: ${audioBlob.size} bytes)`);
            } catch (cacheError) {
              console.warn(`[${getTimeStamp()}] 後台緩存失敗:`, cacheError);
            }
          }, 100);
          
          setState(prev => ({ ...prev, isLoading: false }));
          return { fromCache: false };
        } catch (playError) {
          console.error(`[${getTimeStamp()}] 播放 nicetone.ai 返回的音頻失敗:`, playError);
          throw playError;
        }
      } else {
        throw new Error(data.error || "nicetone.ai 生成語音失敗");
      }
    } catch (err) {
      const errorTime = getPerformanceTime();
      const totalTime = errorTime - startTime;
      console.error(`[${getTimeStamp()}] nicetone.ai 語音合成失敗 (總耗時: ${formatDuration(totalTime)}):`, err);
      setState({ 
        isLoading: false, 
        error: `nicetone.ai 語音合成失敗: ${err instanceof Error ? err.message : String(err)}` 
      });
      throw err;
    }
  };
  
  // 使用 nicetone.ai 進行流式文本转语音（邊下載邊播放）
  const speakWithAIServerStream = async (
    text: string,
    voice: string = DEFAULT_VOICE,
    rate?: number
  ): Promise<{ audio: HTMLAudioElement }> => {
    const startTime = getPerformanceTime();
    console.log(`[${getTimeStamp()}] 開始流式TTS請求: "${text.substring(0, 30)}..." 語音:${voice} 語速:${rate || 1.0}`);
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 將語速參數調整為 nicetone.ai 的格式
      const speed = rate || 1.0;
      const cacheKey = `${voice}_${speed}`;
      
      // 檢查內存緩存
      const cacheCheckTime = getPerformanceTime();
      const cached = getMemoryCacheItem(text, cacheKey);
      if (cached && cached.blob) {
        const cacheHitTime = getPerformanceTime();
        console.log(`[${getTimeStamp()}] 內存緩存命中 (檢查耗時: ${formatDuration(cacheHitTime - cacheCheckTime)})`);
        
        const audio = new Audio();
        audioRef.current = audio;
        
        // 如果已有URL且有效，使用它；否則重新創建
        let audioUrl = cached.url;
        if (!audioUrl || audioUrl.startsWith('blob:')) {
          // 重新創建 blob URL
          audioUrl = URL.createObjectURL(cached.blob);
          // 更新緩存項的URL
          cached.url = audioUrl;
        }
        
        audio.src = audioUrl;
        audio.preload = "auto";
        audio.playbackRate = 1.0; // 保持1.0，因為語速在生成時已控制
        
        // 設置播放事件
        audio.oncanplaythrough = async () => {
          try {
            const playStartTime = getPerformanceTime();
            await audio.play();
            const totalTime = getPerformanceTime() - startTime;
            console.log(`[${getTimeStamp()}] 緩存音頻播放成功 (總耗時: ${formatDuration(totalTime)}) 語速: ${speed}x`);
          } catch (playError) {
            console.error(`[${getTimeStamp()}] 緩存音頻播放失敗:`, playError);
          }
        };
        
        audio.onended = () => {
          console.log(`[${getTimeStamp()}] 緩存音頻播放完成（流式）`);
          audioRef.current = null;
        };
        
        audio.onerror = (error) => {
          console.error(`[${getTimeStamp()}] 緩存音頻播放錯誤:`, error);
          // 如果播放失敗，可能是 blob URL 失效，嘗試重新創建
          if (cached.blob) {
            console.log(`[${getTimeStamp()}] 嘗試重新創建 blob URL`);
            const newUrl = URL.createObjectURL(cached.blob);
            cached.url = newUrl;
            audio.src = newUrl;
            audio.load();
          }
        };
        
        audio.load();
        setState(prev => ({ ...prev, isLoading: false }));
        return { audio };
      }
      
      // 沒有緩存，使用 nicetone.ai API 獲取音頻
      const apiStartTime = getPerformanceTime();
      console.log(`[${getTimeStamp()}] 發送 nicetone.ai API 請求: ${voice} 語速:${speed}`);
      
      // 調用 nicetone.ai API
      const data = await generateSpeechWithNicetone(text, voice, speed);
      const apiEndTime = getPerformanceTime();
      console.log(`[${getTimeStamp()}] nicetone.ai API 響應完成 (API耗時: ${formatDuration(apiEndTime - apiStartTime)})`);
      
      if (!data.success || !data.audioUrl) {
        throw new Error(data.error || "nicetone.ai API 返回失敗");
      }
      
      console.log(`[${getTimeStamp()}] 音頻URL獲取成功，開始流式播放: ${data.audioUrl}`);
      
      // 創建 Audio 元素，直接使用遠端URL進行流式播放
      const audioCreateTime = getPerformanceTime();
      const audio = new Audio();
      audioRef.current = audio;
      
      // 直接使用遠端URL，實現邊下載邊播放
      audio.src = data.audioUrl;
      audio.preload = "auto";
      audio.playbackRate = 1.0;
      
      // 設置播放事件 - 儘快開始播放
      let hasStartedPlaying = false;
      let firstPlayTime: number | null = null;
      
      const tryToPlay = async () => {
        if (hasStartedPlaying) return;
        try {
          if (!firstPlayTime) firstPlayTime = getPerformanceTime();
          await audio.play();
          hasStartedPlaying = true;
          const playTime = getPerformanceTime();
          const setupTime = playTime - audioCreateTime;
          const totalTime = playTime - startTime;
          console.log(`[${getTimeStamp()}] 流式播放開始 (設置耗時: ${formatDuration(setupTime)}, 總耗時: ${formatDuration(totalTime)}) 語速: ${speed}x`);
        } catch (playError) {
          console.warn(`[${getTimeStamp()}] 流式播放嘗試失敗，等待更多數據:`, playError);
        }
      };
      
      // 多個事件監聽，確保儘快開始播放
      audio.onloadeddata = () => {
        console.log(`[${getTimeStamp()}] 音頻數據開始載入，準備播放`);
        tryToPlay();
      };
      audio.oncanplay = () => {
        console.log(`[${getTimeStamp()}] 音頻可以開始播放`);
        tryToPlay();
      };
      audio.oncanplaythrough = () => {
        console.log(`[${getTimeStamp()}] 音頻足夠播放到結束`);
        tryToPlay();
      };
      
      audio.onended = () => {
        const endTime = getPerformanceTime();
        const totalTime = endTime - startTime;
        console.log(`[${getTimeStamp()}] 流式音頻播放完成 (總生命週期: ${formatDuration(totalTime)})`);
        audioRef.current = null;
      };
      
      audio.onerror = (error) => {
        console.error(`[${getTimeStamp()}] 音頻流式播放錯誤:`, error);
        setState(prev => ({ 
          ...prev, 
          error: `音頻播放失敗: ${error}`,
          isLoading: false 
        }));
      };
      
      // 進度監聽 - 可選，用於調試
      audio.onprogress = () => {
        if (audio.buffered.length > 0) {
          const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
          const duration = audio.duration || 0;
          if (duration > 0) {
            const bufferPercent = (bufferedEnd / duration * 100).toFixed(1);
            console.log(`[${getTimeStamp()}] 音頻緩衝進度: ${bufferPercent}%`);
          }
        }
      };
      
      // 開始加載音頻 - 這會觸發流式下載
      const loadStartTime = getPerformanceTime();
      audio.load();
      console.log(`[${getTimeStamp()}] 音頻開始載入 (設置耗時: ${formatDuration(loadStartTime - audioCreateTime)})`);
      
      // 在後台並行下載完整文件用於緩存（不阻塞播放）
      setTimeout(async () => {
        try {
          const cacheStartTime = getPerformanceTime();
          console.log(`[${getTimeStamp()}] 開始後台下載音頻用於緩存`);
          const audioBlob = await downloadAudioAsBlob(data.audioUrl);
          
          // 加入緩存
          const localAudioUrl = URL.createObjectURL(audioBlob);
          addToMemoryCache(text, cacheKey, audioBlob, localAudioUrl);
          addTTSCacheItem(text, cacheKey, data.audioUrl);
          
          const cacheEndTime = getPerformanceTime();
          console.log(`[${getTimeStamp()}] 後台緩存完成 (緩存耗時: ${formatDuration(cacheEndTime - cacheStartTime)}, 檔案大小: ${audioBlob.size} bytes)`);
        } catch (cacheError) {
          console.warn(`[${getTimeStamp()}] 後台緩存失敗，但不影響當前播放:`, cacheError);
        }
      }, 100); // 延遲100ms開始緩存，確保播放優先
      
      setState(prev => ({ ...prev, isLoading: false }));
      return { audio };
      
    } catch (err) {
      const errorTime = getPerformanceTime();
      const totalTime = errorTime - startTime;
      console.error(`[${getTimeStamp()}] nicetone.ai 流式語音生成失敗 (總耗時: ${formatDuration(totalTime)}):`, err);
      setState(prev => ({ 
        ...prev, 
        error: `nicetone.ai 流式語音生成失敗: ${err instanceof Error ? err.message : String(err)}`,
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
    
    // 停止音频播放
    if (audioRef.current) {
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
    speakWithAIServer,
    speakWithAIServerStream,
    cancelAzureSpeech
  };
}; 