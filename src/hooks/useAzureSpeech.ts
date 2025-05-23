import { useState, useRef } from 'react';
import * as SpeechSDK from 'microsoft-cognitiveservices-speech-sdk';
import { SpeechAssessmentResult } from '../types/speech';
import { generateSpeech, generateSpeechStream, AI_SERVER_URL } from '../utils/api';
import { getTTSCacheItem, addTTSCacheItem } from '../utils/storage';

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

// 添加到內存緩存
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
  
  // 更新或添加新項
  if (existingIndex !== -1) {
    memoryCache[existingIndex] = newItem;
  } else {
    // 添加到開頭
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
    voice?: string
  ) => Promise<{ fromCache: boolean }>;
  
  speakWithAIServerStream: (
    text: string,
    voice?: string
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
  
  // 使用AI服務器進行文本轉語音
  const speakWithAIServer = async (
    text: string,
    voice: string = "Puck"
  ): Promise<{ fromCache: boolean }> => {
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
      
      // 首先檢查內存緩存
      const memoryCachedItem = getMemoryCacheItem(text, voice);
      if (memoryCachedItem) {
        console.log("使用內存緩存的音頻:", text.substring(0, 20) + "...", voice);
        
        try {
          if (memoryCachedItem.url) {
            // 使用緩存的URL直接播放
            const audio = new Audio(memoryCachedItem.url);
            audioRef.current = audio;
            
            // 播放完成后清理引用
            audio.onended = () => {
              audioRef.current = null;
            };
            
            await audio.play();
            console.log("從內存緩存成功播放音頻");
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
            
            // 播放完成后清理引用
            audio.onended = () => {
              audioRef.current = null;
            };
            
            await audio.play();
            console.log("從內存緩存的blob創建URL並播放成功");
            setState(prev => ({ ...prev, isLoading: false }));
            return { fromCache: true };
          }
        } catch (playError) {
          console.warn("播放內存緩存音頻失敗:", playError);
          // 失敗後將嘗試其他方式
        }
      }
      
      // 檢查localStorage緩存
      const cachedItem = getTTSCacheItem(text, voice);
      
      // 如果有localStorage緩存，嘗試使用
      if (cachedItem && cachedItem.audioUrl) {
        console.log("嘗試使用localStorage緩存的音頻:", text.substring(0, 20) + "...", voice);
        
        // 創建完整的音頻URL（如果是相對路徑）
        const fullAudioUrl = cachedItem.audioUrl.startsWith('http') 
          ? cachedItem.audioUrl 
          : `${AI_SERVER_URL}${cachedItem.audioUrl}`;
        
        try {
          // 播放缓存的音频
          const audio = new Audio(fullAudioUrl);
          audioRef.current = audio;
          
          // 播放完成后清理
          audio.onended = () => {
            audioRef.current = null;
          };
          
          // 嘗試播放
          await audio.play();
          console.log("從localStorage緩存成功播放音頻");
          
          // 同時加入內存緩存
          addToMemoryCache(text, voice, undefined, fullAudioUrl);
          
          setState(prev => ({ ...prev, isLoading: false }));
          return { fromCache: true };
        } catch (error) {
          console.warn("播放localStorage緩存的音頻失敗:", error);
          // 失敗後繼續嘗試請求新音頻
        }
      }
      
      // 沒有緩存或緩存播放失敗，請求新音頻
      console.log("請求新的TTS音頻:", text.substring(0, 20) + "...", voice);
      const response = await generateSpeech(text, voice);
      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        // 創建完整的音頻URL（如果是相對路徑）
        const fullAudioUrl = data.audioUrl.startsWith('http') 
          ? data.audioUrl 
          : `${AI_SERVER_URL}${data.audioUrl}`;
        
        try {
          // 播放生成的音頻
          const audio = new Audio(fullAudioUrl);
          audioRef.current = audio;
          
          // 播放完成后清理
          audio.onended = () => {
            audioRef.current = null;
          };
          
          // 添加到localStorage緩存
          addTTSCacheItem(text, voice, data.audioUrl);
          
          // 同時添加到內存緩存
          addToMemoryCache(text, voice, undefined, fullAudioUrl);
          
          await audio.play();
          console.log("AI服務器新生成的語音播放中");
          setState(prev => ({ ...prev, isLoading: false }));
          return { fromCache: false };
        } catch (playError) {
          console.error("播放服務器返回的音頻URL失敗:", playError);
          throw playError;
        }
      } else {
        throw new Error(data.error || "生成語音失敗");
      }
    } catch (err) {
      console.error('AI服務器語音合成失敗:', err);
      setState({ 
        isLoading: false, 
        error: `AI服務器語音合成失敗: ${err instanceof Error ? err.message : String(err)}` 
      });
      throw err;
    }
  };
  
  // 使用AI服務器進行流式文本转语音
  const speakWithAIServerStream = async (
    text: string,
    voice: string = "Puck"
  ): Promise<{ audio: HTMLAudioElement }> => {
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
      
      // 關閉上一個音頻上下文
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          await audioContextRef.current.close();
        } catch (e) {
          console.warn("關閉上一個音頻上下文失敗:", e);
        }
        audioContextRef.current = null;
      }
      
      // 首先檢查內存緩存
      const memoryCachedItem = getMemoryCacheItem(text, voice);
      if (memoryCachedItem) {
        console.log("使用內存緩存的音頻:", text.substring(0, 20) + "...", voice);
        
        try {
          if (memoryCachedItem.url) {
            // 使用緩存的URL直接播放
            const audio = new Audio(memoryCachedItem.url);
            audioRef.current = audio;
            
            // 播放完成后清理引用
            audio.onended = () => {
              audioRef.current = null;
            };
            
            // 預加載
            audio.preload = "auto";
            
            // 設置音頻就緒事件
            audio.oncanplaythrough = async () => {
              try {
                await audio.play();
                console.log("從內存緩存成功播放音頻");
              } catch (playError) {
                console.error("播放緩存音頻失敗:", playError);
              }
            };
            
            // 觸發加載
            audio.load();
            
            setState(prev => ({ ...prev, isLoading: false }));
            return { audio };
          } 
          else if (memoryCachedItem.blob) {
            // 從blob創建URL
            const audioUrl = URL.createObjectURL(memoryCachedItem.blob);
            
            // 更新緩存項的URL
            memoryCachedItem.url = audioUrl;
            
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            
            // 播放完成后清理引用
            audio.onended = () => {
              audioRef.current = null;
            };
            
            // 預加載
            audio.preload = "auto";
            
            // 設置音頻就緒事件
            audio.oncanplaythrough = async () => {
              try {
                await audio.play();
                console.log("從內存緩存的blob創建URL並播放成功");
              } catch (playError) {
                console.error("播放緩存blob失敗:", playError);
              }
            };
            
            // 觸發加載
            audio.load();
            
            setState(prev => ({ ...prev, isLoading: false }));
            return { audio };
          }
        } catch (playError) {
          console.warn("播放內存緩存音頻失敗:", playError);
          // 失敗後將嘗試其他方式
        }
      }
      
      // 檢查localStorage緩存
      const cachedItem = getTTSCacheItem(text, voice);
      
      // 嘗試使用localStorage緩存
      if (cachedItem && cachedItem.audioUrl) {
        console.log("嘗試使用localStorage緩存音頻URL:", cachedItem.text.substring(0, 20) + "...", cachedItem.voice);
        
        try {
          // 檢查是否為有效的URL
          if (cachedItem.audioUrl.startsWith('http') || 
              cachedItem.audioUrl.startsWith('/')) {
              
            // 創建完整的音頻URL
            const fullAudioUrl = cachedItem.audioUrl.startsWith('http') 
              ? cachedItem.audioUrl 
              : `${AI_SERVER_URL}${cachedItem.audioUrl}`;
            
            // 測試URL是否有效
            const testRequest = await fetch(fullAudioUrl, { method: 'HEAD' }).catch(() => null);
            if (testRequest && testRequest.ok) {
              // 播放缓存的音频
              const audio = new Audio(fullAudioUrl);
              audioRef.current = audio;
              
              // 播放完成后清理
              audio.onended = () => {
                audioRef.current = null;
              };
              
              // 預加載
              audio.preload = "auto";
              
              // 設置音頻就緒事件
              audio.oncanplaythrough = async () => {
                try {
                  await audio.play();
                  console.log("從localStorage緩存成功播放音頻");
                } catch (playError) {
                  console.error("播放緩存音頻失敗:", playError);
                }
              };
              
              // 觸發加載
              audio.load();
              
              // 同時將此URL添加到內存緩存
              addToMemoryCache(text, voice, undefined, fullAudioUrl);
              
              setState(prev => ({ ...prev, isLoading: false }));
              return { audio };
            } else {
              console.log("localStorage緩存的URL無效，將重新請求");
              // URL無效，繼續執行後續代碼請求新音頻
            }
          }
        } catch (playError) {
          console.log("播放localStorage緩存音頻失敗，將重新請求:", playError);
          // 播放失敗，繼續執行後續代碼請求新音頻
        }
      }
      
      // 檢查瀏覽器音頻支持情況
      const hasMediaSource = 'MediaSource' in window && MediaSource.isTypeSupported('audio/webm; codecs="opus"');
      const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
      
      console.log(`瀏覽器支持: MediaSource=${hasMediaSource}, WebAudio=${hasWebAudio}`);
      
      // 傳統方法：收集所有數據後再播放
      const fallbackToTraditionalMethod = async (): Promise<{ audio: HTMLAudioElement }> => {
        console.log("使用傳統方法處理音頻流");
        
        const response = await generateSpeechStream(text, voice);
        console.log("流式響應狀態:", response.status, response.statusText);
        
        if (!response.body) {
          throw new Error("服務器未返回有效的音頻流");
        }
        
        // 獲取流讀取器
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        
        // 讀取所有數據塊，添加超時機制
        let totalBytes = 0;
        const startTime = Date.now();
        let lastDataTime = Date.now();
        const TIMEOUT_MS = 500; // 0.5秒超時
        
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        
        // 創建一個Promise來處理超時和正常結束
        const readAllData = new Promise<void>(async (resolve, reject) => {
          try {
            while (true) {
              // 清除前一個超時
              if (timeoutId) clearTimeout(timeoutId);
              
              // 設置新的超時
              const timeoutPromise = new Promise<{ done: true, value: undefined }>((resolveTimeout) => {
                timeoutId = setTimeout(() => {
                  const timeSinceLastData = Date.now() - lastDataTime;
                  console.log(`數據接收超時 (${timeSinceLastData}ms 無新數據)，視為傳輸完成`);
                  resolveTimeout({ done: true, value: undefined });
                }, TIMEOUT_MS);
              });
              
              // 讀取數據或超時
              const { done, value } = await Promise.race([
                reader.read(),
                timeoutPromise
              ]);
              
              if (done) {
                console.log(`數據流結束，總共接收: ${totalBytes} 字節`);
                break;
              }
              
              // 更新最後接收數據的時間
              lastDataTime = Date.now();
              chunks.push(value);
              totalBytes += value.length;
              console.log(`接收到數據塊: ${value.length} 字節，總計: ${totalBytes} 字節`);
            }
            resolve();
          } catch (err) {
            console.error("讀取流數據時發生錯誤:", err);
            reject(err);
          } finally {
            if (timeoutId) clearTimeout(timeoutId);
          }
        });
        
        // 等待讀取完成
        await readAllData;
        
        const downloadTime = Date.now() - startTime;
        console.log(`總共接收: ${totalBytes} 字節的音頻數據，耗時: ${downloadTime}ms`);
        
        if (totalBytes === 0) {
          throw new Error("服務器返回了空的音頻數據");
        }
        
        // 根據服務器響應頭確定正確的MIME類型
        let mimeType = 'audio/wav'; // 默認值
        const contentType = response.headers.get('content-type');
        if (contentType) {
          mimeType = contentType;
          console.log(`使用服務器提供的MIME類型: ${mimeType}`);
        }
        
        // 創建 Blob 及其 URL
        const blob = new Blob(chunks, { type: mimeType });
        const audioUrl = URL.createObjectURL(blob);
        
        // 創建新的音頻元素
        const traditionalAudio = new Audio(audioUrl);
        audioRef.current = traditionalAudio;
        
        // 預加載
        traditionalAudio.preload = "auto";
        
        // 添加到內存緩存
        addToMemoryCache(text, voice, blob, audioUrl);
        
        // 獲取服務器返回的實際URL進行localStorage緩存
        const serverUrl = response.headers.get('x-audio-url') || '';
        if (serverUrl) {
          addTTSCacheItem(text, voice, serverUrl);
          console.log("將服務器音頻URL添加到localStorage:", serverUrl);
        } else {
          // 如果沒有服務器URL，使用blob URL（雖然會在頁面刷新後失效）
          addTTSCacheItem(text, voice, audioUrl);
        }
        
        // 設置音頻就緒事件
        traditionalAudio.oncanplaythrough = async () => {
          console.log("音頻數據就緒，準備播放");
          
          const processingTime = Date.now() - startTime - downloadTime;
          console.log(`音頻處理時間: ${processingTime}ms`);
          
          try {
            const playStartTime = Date.now();
            await traditionalAudio.play();
            console.log(`播放開始，從請求到播放總延遲: ${Date.now() - startTime}ms`);
          } catch (playError) {
            console.error("播放失敗:", playError);
          }
        };
        
        // 播放完成后只清理引用
        traditionalAudio.onended = () => {
          console.log("音頻播放完成");
          audioRef.current = null;
        };
        
        // 觸發加載
        traditionalAudio.load();
        
        setState(prev => ({ ...prev, isLoading: false }));
        return { audio: traditionalAudio };
      };
      
      // 創建 Audio 元素準備播放
      const audio = new Audio();
      audioRef.current = audio;
      
      // 嘗試使用 MediaSource API 實現真正的流式播放
      if (hasMediaSource) {
        try {
          const mediaSource = new MediaSource();
          audio.src = URL.createObjectURL(mediaSource);
          
          // 當 MediaSource 就緒時添加 SourceBuffer
          mediaSource.addEventListener('sourceopen', async () => {
            try {
              console.log("嘗試直接流式播放 (MediaSource)");
              // 發起請求
              const response = await generateSpeechStream(text, voice);
              
              if (!response.ok) {
                throw new Error(`請求失敗: ${response.status}`);
              }
              
              // 獲取MIME類型
              const contentType = response.headers.get('content-type') || 'audio/wav';
              console.log(`收到的內容類型: ${contentType}`);
              
              // 不同瀏覽器支持的音頻格式不同
              // MediaSource API 通常只支持 MP4 和 WebM 容器格式
              const mimeCodec = contentType.includes('mp4') ? 'audio/mp4; codecs="mp4a.40.2"' : 
                               contentType.includes('webm') ? 'audio/webm; codecs="opus"' : 
                               'audio/webm; codecs="vorbis"';  // 嘗試一個通用格式
              
              // 檢查是否支持該音頻格式
              if (!MediaSource.isTypeSupported(mimeCodec)) {
                console.log(`瀏覽器不支持該音頻格式: ${mimeCodec} (${contentType})，切換到傳統方法`);
                // 平滑切換到傳統方法，不拋出錯誤
                try {
                  // 只有在 open 狀態才能調用 endOfStream
                  if (mediaSource.readyState === 'open') {
                    mediaSource.endOfStream();
                  }
                } catch (e) {
                  console.warn("關閉 MediaSource 時發生錯誤:", e);
                }
                
                // 直接轉到傳統方法
                return await fallbackToTraditionalMethod();
              }
              
              const sourceBuffer = mediaSource.addSourceBuffer(mimeCodec);
              const reader = response.body!.getReader();
              const chunks: Uint8Array[] = [];
              
              // 處理流數據
              const processStream = async () => {
                let startPlaying = false;
                let totalBytes = 0;
                let appendQueue: Uint8Array[] = []; // 待處理的數據隊列
                let isProcessingQueue = false; // 是否正在處理隊列
                let sourceClosed = false; // SourceBuffer 是否已關閉
                
                // 序列化處理 appendBuffer 的函數
                const processQueue = async () => {
                  if (isProcessingQueue || appendQueue.length === 0 || sourceClosed) return;
                  
                  isProcessingQueue = true;
                  
                  try {
                    // 檢查 MediaSource 和 SourceBuffer 狀態
                    if (mediaSource.readyState === 'closed' || 
                        !mediaSource.sourceBuffers.length) {
                      console.log("MediaSource 已關閉或 SourceBuffer 已分離，停止處理隊列");
                      sourceClosed = true;
                      return;
                    }
                    
                    // 檢查是否正在更新
                    if (sourceBuffer.updating) {
                      // 等待更新完成後再處理
                      await new Promise(resolve => {
                        sourceBuffer.addEventListener('updateend', resolve, { once: true });
                      });
                    }
                    
                    // 獲取下一個數據塊
                    const nextChunk = appendQueue.shift();
                    if (!nextChunk) {
                      isProcessingQueue = false;
                      return;
                    }
                    
                    // 追加數據
                    sourceBuffer.appendBuffer(nextChunk);
                    
                    // 當追加完成後處理下一個
                    sourceBuffer.addEventListener('updateend', () => {
                      isProcessingQueue = false;
                      processQueue();
                    }, { once: true });
                    
                  } catch (e) {
                    console.warn("處理數據隊列時發生錯誤:", e);
                    isProcessingQueue = false;
                    
                    // 檢查是否需要切換到傳統方法
                    if (String(e).includes("SourceBuffer has been removed") || 
                        String(e).includes("Invalid state")) {
                      sourceClosed = true;
                      console.log("媒體源錯誤，將繼續收集數據但不再嘗試流式播放");
                    }
                  }
                };
                
                try {
                  // 設置數據接收超時
                  let lastDataTime = Date.now();
                  const TIMEOUT_MS = 800; // 0.8秒超時
                  let timeoutId: ReturnType<typeof setTimeout> | null = null;
                  
                  while (true) {
                    // 清除前一個超時
                    if (timeoutId) clearTimeout(timeoutId);
                    
                    // 設置超時
                    const timeoutPromise = new Promise<{ done: true, value: undefined }>((resolveTimeout) => {
                      timeoutId = setTimeout(() => {
                        const timeSinceLastData = Date.now() - lastDataTime;
                        console.log(`數據接收超時 (${timeSinceLastData}ms 無新數據)，視為傳輸完成`);
                        resolveTimeout({ done: true, value: undefined });
                      }, TIMEOUT_MS);
                    });
                    
                    // 讀取數據或超時
                    const { done, value } = await Promise.race([
                      reader.read(),
                      timeoutPromise
                    ]);
                    
                    if (done) {
                      console.log(`數據流讀取完成或超時，總共接收: ${totalBytes} 字節`);
                      break;
                    }
                    
                    // 更新最後接收數據的時間
                    lastDataTime = Date.now();
                    chunks.push(value);
                    totalBytes += value.length;
                    
                    console.log(`流式接收: ${value.length} 字節，總計: ${totalBytes} 字節`);
                    
                    // 向隊列添加數據，但不直接操作 SourceBuffer
                    if (!sourceClosed) {
                      appendQueue.push(value);
                      processQueue();
                    }
                    
                    // 積累了足夠數據後開始播放
                    if (!startPlaying && totalBytes > 32768 && !sourceClosed) { // 約32KB
                      startPlaying = true;
                      try {
                        await audio.play();
                        console.log("開始流式播放");
                      } catch (playErr) {
                        console.warn("流式播放失敗，可能數據格式不受支持:", playErr);
                        sourceClosed = true;  // 停止嘗試使用 MediaSource
                      }
                    }
                  }
                  
                  // 清理超時計時器
                  if (timeoutId) clearTimeout(timeoutId);
                  
                  // 流讀取完成，關閉 MediaSource
                  if (mediaSource.readyState === 'open' && !sourceClosed) {
                    try {
                      // 等待所有更新完成
                      if (sourceBuffer.updating) {
                        await new Promise(resolve => {
                          sourceBuffer.addEventListener('updateend', resolve, { once: true });
                        });
                      }
                      mediaSource.endOfStream();
                      console.log("流式播放完成，MediaSource 已關閉");
                    } catch (e) {
                      console.warn("關閉 MediaSource 時發生錯誤:", e);
                    }
                  }
                  
                  // 無論 MediaSource 是否正常工作，都創建一個完整的 blob 用於緩存
                  const blob = new Blob(chunks, { type: contentType });
                  const blobUrl = URL.createObjectURL(blob);
                  console.log("已創建完整音頻的 Blob URL:", blobUrl);
                  
                  // 添加到內存緩存
                  addToMemoryCache(text, voice, blob, blobUrl);
                  
                  // 獲取服務器返回的實際URL（如果有）進行 localStorage 緩存
                  const serverUrl = response.headers.get('x-audio-url') || '';
                  if (serverUrl) {
                    addTTSCacheItem(text, voice, serverUrl);
                    console.log("將服務器音頻URL添加到localStorage:", serverUrl);
                  } else {
                    // 如果沒有服務器URL，則將 blob URL 添加到 localStorage（僅當前會話有效）
                    addTTSCacheItem(text, voice, blobUrl);
                    console.log("將 blob URL 添加到 localStorage（僅當前會話有效）");
                  }
                  
                  // 如果 sourceClosed 為 true 表示 MediaSource 播放失敗，需要使用傳統方法播放
                  if (sourceClosed || !startPlaying) {
                    console.log("MediaSource 播放失敗或未開始播放，嘗試傳統方法播放");
                    
                    // 確保先重置當前音頻
                    if (audio.src) {
                      try {
                        audio.pause();
                      } catch (e) { /* 忽略 */ }
                    }
                    
                    // 重新創建音頻元素避免之前的影響
                    const fallbackAudio = new Audio(blobUrl);
                    audioRef.current = fallbackAudio;
                    
                    // 創建互動事件監聽器，用於處理自動播放策略問題
                    const autoPlayHandler = async () => {
                      try {
                        // 嘗試播放(即使之前尚未加載完成)
                        await fallbackAudio.play();
                        console.log("用戶互動後成功播放音頻");
                        
                        // 播放成功後移除事件監聽器
                        document.removeEventListener('click', autoPlayHandler);
                        document.removeEventListener('touchstart', autoPlayHandler);
                        document.removeEventListener('keydown', autoPlayHandler);
                      } catch (e) {
                        console.error("交互後播放仍然失敗:", e);
                      }
                    };
                    
                    fallbackAudio.oncanplaythrough = async () => {
                      try {
                        console.log("傳統方法準備播放音頻");
                        await fallbackAudio.play();
                        console.log("傳統方法成功播放音頻");
                        
                        // 播放成功後移除事件監聽器
                        document.removeEventListener('click', autoPlayHandler);
                        document.removeEventListener('touchstart', autoPlayHandler);
                        document.removeEventListener('keydown', autoPlayHandler);
                      } catch (e) {
                        console.warn("自動播放失敗，等待用戶交互:", e);
                        
                        // 自動播放失敗，添加用戶交互事件監聽器
                        document.addEventListener('click', autoPlayHandler, { once: false });
                        document.addEventListener('touchstart', autoPlayHandler, { once: false });
                        document.addEventListener('keydown', autoPlayHandler, { once: false });
                      }
                    };
                    
                    fallbackAudio.onerror = (e) => {
                      console.error("音頻加載錯誤:", e);
                      // 移除事件監聽器
                      document.removeEventListener('click', autoPlayHandler);
                      document.removeEventListener('touchstart', autoPlayHandler);
                      document.removeEventListener('keydown', autoPlayHandler);
                    };
                    
                    // 播放結束事件
                    fallbackAudio.onended = () => {
                      console.log("音頻播放完成");
                      audioRef.current = null;
                      // 移除事件監聽器
                      document.removeEventListener('click', autoPlayHandler);
                      document.removeEventListener('touchstart', autoPlayHandler);
                      document.removeEventListener('keydown', autoPlayHandler);
                    };
                    
                    fallbackAudio.load();
                  }
                  
                  console.log("流式處理完成，數據已緩存");
                  
                } catch (streamErr) {
                  console.error("流數據處理錯誤:", streamErr);
                }
              };
              
              // 啟動流處理
              processStream().catch(e => console.error("流處理失敗:", e));
              
            } catch (error) {
              console.log("MediaSource 流式處理不支持，切換到傳統方法:", error);
              // 關閉當前 MediaSource
              try {
                if (mediaSource.readyState === 'open') {
                  mediaSource.endOfStream();
                }
              } catch (e) { /* 忽略關閉錯誤 */ }
              
              // 如果 MediaSource 方法失敗，回退到傳統方法
              return await fallbackToTraditionalMethod();
            }
          });
          
          // 錯誤處理
          mediaSource.addEventListener('error', () => {
            console.log("MediaSource 發生錯誤，切換到傳統方法");
            // 不再需要額外處理，直接切換到傳統方法
            fallbackToTraditionalMethod().catch(e => 
              console.error("傳統方法失敗:", e)
            );
          });
          
          setState(prev => ({ ...prev, isLoading: false }));
          return { audio };
          
        } catch (msError) {
          console.error("MediaSource 初始化失敗:", msError);
          // 回退到傳統方法
          return await fallbackToTraditionalMethod();
        }
      } else {
        // 瀏覽器不支持 MediaSource，回退到傳統方法
        console.warn("瀏覽器不支持 MediaSource API，使用傳統方法");
        return await fallbackToTraditionalMethod();
      }
    } catch (err) {
      console.error('流式AI服務器語音合成失敗:', err);
      setState({ 
        isLoading: false, 
        error: `流式AI服務器語音合成失敗: ${err instanceof Error ? err.message : String(err)}` 
      });
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