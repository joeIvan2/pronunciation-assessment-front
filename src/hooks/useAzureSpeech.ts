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
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // 檢查內存緩存
      const cached = getMemoryCacheItem(text, voice);
      if (cached && cached.blob) {
        console.log("從內存緩存播放");
        
        const audio = new Audio();
        audioRef.current = audio;
        audio.src = cached.url || URL.createObjectURL(cached.blob);
        audio.preload = "auto";
        
        audio.oncanplaythrough = async () => {
          try {
            await audio.play();
            console.log("緩存音頻播放成功");
          } catch (playError) {
            console.error("緩存音頻播放失敗:", playError);
          }
        };
        
        audio.onended = () => {
          console.log("緩存音頻播放完成");
          audioRef.current = null;
        };
        
        audio.load();
        setState(prev => ({ ...prev, isLoading: false }));
        return { audio };
      }
      
      // 檢查瀏覽器WebM/Opus支持情況
      const hasMediaSource = 'MediaSource' in window && MediaSource.isTypeSupported('audio/webm; codecs="opus"');
      const hasWebAudio = 'AudioContext' in window || 'webkitAudioContext' in window;
      
      // console.log(`瀏覽器支持: MediaSource WebM/Opus=${hasMediaSource}, WebAudio=${hasWebAudio}`);
      
      // WebM流式播放方法
      const streamWebMSpeech = async (text: string, voice: string = "Puck"): Promise<Response> => {
        const response = await fetch(`${AI_SERVER_URL}/generate-speech-stream-webm`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            voice: voice,
            languageCode: "en-US"
          })
        });
        
        if (!response.ok) {
          throw new Error('WebM流式請求失敗: ' + response.status);
        }
        
        return response;
      };
      
      // 使用MediaSource API播放WebM流
      const playStreamingWebMAudio = async (text: string, voice: string): Promise<HTMLAudioElement> => {
        // 創建 MediaSource 對象
        const mediaSource = new MediaSource();
        const audio = new Audio();
        
        // console.log("創建MediaSource和Audio元素");
        
        // 將 MediaSource 綁定到 audio 元素
        audio.src = URL.createObjectURL(mediaSource);
        // console.log("設置audio.src:", audio.src);
        
        return new Promise((resolve, reject) => {
          // 添加超時保護
          const timeoutId = setTimeout(() => {
            console.error("MediaSource初始化超時");
            reject(new Error("MediaSource初始化超時"));
          }, 10000); // 10秒超時
          
          // 監聽 MediaSource 開啟事件
          mediaSource.addEventListener('sourceopen', async () => {
            // console.log("MediaSource sourceopen 事件觸發");
            clearTimeout(timeoutId);
            
            try {
              // 檢查MediaSource狀態
              // console.log("MediaSource readyState:", mediaSource.readyState);
              
              // 創建 SourceBuffer
              const sourceBuffer = mediaSource.addSourceBuffer('audio/webm; codecs="opus"');
              // console.log("SourceBuffer創建成功");
              
              // 發送請求獲取流
              // console.log("開始發送WebM流請求");
              const response = await streamWebMSpeech(text, voice);
              // console.log("WebM流請求成功，開始讀取數據");
              
              const reader = response.body!.getReader();
              
              let hasStartedPlaying = false;
              let totalBytesReceived = 0;
              let chunkCount = 0;
              const chunks: Uint8Array[] = [];
              
              // 處理音頻數據塊的函數
              const appendBuffer = (chunk: Uint8Array): Promise<void> => {
                return new Promise((resolve, reject) => {
                  const updateEndHandler = () => {
                    // console.log(`SourceBuffer updateend - 數據塊 ${chunkCount} 處理完成`);
                    resolve();
                  };
                  const errorHandler = (e: any) => {
                    console.error(`SourceBuffer error - 數據塊 ${chunkCount}:`, e);
                    reject(e);
                  };
                  
                  sourceBuffer.addEventListener('updateend', updateEndHandler, { once: true });
                  sourceBuffer.addEventListener('error', errorHandler, { once: true });
                  
                  try {
                    // console.log(`嘗試添加數據塊 ${chunkCount}，大小: ${chunk.length} 字節`);
                    sourceBuffer.appendBuffer(chunk);
                  } catch (e) {
                    console.error(`appendBuffer失敗 - 數據塊 ${chunkCount}:`, e);
                    sourceBuffer.removeEventListener('updateend', updateEndHandler);
                    sourceBuffer.removeEventListener('error', errorHandler);
                    reject(e);
                  }
                });
              };
              
              // console.log("開始讀取流數據");
              
              // 數據隊列：強制積極讀取策略
              const dataQueue: Uint8Array[] = [];
              let isReadingComplete = false;
              let readError: Error | null = null;
              
              // 強制積極讀取：無視反壓控制，立即讀取所有可用數據
              const aggressiveReadDataAsync = async () => {
                try {
                  // console.log("開始強制積極讀取數據流（無反壓控制）");
                  let consecutiveReads = 0;
                  
                  while (true) {
                    const { done, value } = await reader.read();
                    consecutiveReads++;
                    // console.log(`強制讀取 #${consecutiveReads} - done: ${done}, value存在: ${!!value}, 大小: ${value?.length || 0}`);
                    
                    if (done) {
                      // console.log(`強制讀取完成，總共讀取 ${consecutiveReads} 次`);
                      isReadingComplete = true;
                      break;
                    }
                    
                    if (value && value.length > 0) {
                      dataQueue.push(value);
                      // console.log(`數據強制入隊，隊列長度: ${dataQueue.length}`);
                      
                      // 積極讀取：立即繼續循環，無延遲
                      // 瀏覽器兼容的立即執行
                    }
                  }
                } catch (error) {
                  console.error("強制讀取發生錯誤:", error);
                  readError = error as Error;
                  isReadingComplete = true;
                }
              };
              
              // 啟動強制積極讀取（立即執行）
              const readPromise = aggressiveReadDataAsync();
              
              // 嘗試播放的函數
              const tryToPlay = async () => {
                if (hasStartedPlaying) return;
                
                const bufferedInfo = audio.buffered.length > 0 ? 
                  `start:${audio.buffered.start(0).toFixed(3)}, end:${audio.buffered.end(0).toFixed(3)}` : 
                  "無緩衝";
                // console.log(`嘗試播放 - readyState:${audio.readyState}, currentTime:${audio.currentTime.toFixed(3)}, buffered:${audio.buffered.length} [${bufferedInfo}]`);
                
                // 檢查是否有足夠的緩衝數據，並且確保有足夠的緩衝時間
                if (audio.readyState >= 3 && audio.buffered.length > 0) { // HAVE_FUTURE_DATA或更高
                  const bufferedEnd = audio.buffered.end(0);
                  const bufferedStart = audio.buffered.start(0);
                  const bufferedDuration = bufferedEnd - bufferedStart;
                  // console.log(`音頻緩衝詳情: 開始:${bufferedStart.toFixed(3)}s, 結束:${bufferedEnd.toFixed(3)}s, 持續:${bufferedDuration.toFixed(3)}s`);
                  
                  // 確保至少有1秒的緩衝時間再開始播放（邊下載邊播放）
                  if (bufferedEnd >= 1) {
                                          // console.log("🎵 1秒緩衝就緒，開始邊下載邊播放！");
                      try {
                        await audio.play();
                        hasStartedPlaying = true;
                        // console.log("✅ 邊下載邊播放已開始 - 1秒緩衝模式");
                    } catch (playError) {
                      console.error("播放失敗:", playError);
                      // 如果是自動播放策略問題，等待用戶交互
                      if (playError.name === 'NotAllowedError') {
                        // console.log("自動播放被阻止，等待用戶交互");
                      }
                    }
                  } else {
                    // console.log("緩衝時間不足，當前:", bufferedEnd, "秒，需要至少1秒");
                  }
                } else {
                  // console.log("音頻還沒準備好，readyState:", audio.readyState, "buffered:", audio.buffered.length);
                }
              };
              
              // 監聽音頻準備就緒事件
              audio.addEventListener('canplay', () => {
                // console.log('Audio canplay 事件觸發');
                if (!hasStartedPlaying) {
                  tryToPlay();
                }
              }, { once: true });
              
              audio.addEventListener('canplaythrough', () => {
                // console.log('Audio canplaythrough 事件觸發');
                if (!hasStartedPlaying) {
                  tryToPlay();
                }
              }, { once: true });
              
              // 超積極處理：並行處理隊列數據，無等待
              while (true) {
                // 立即檢查隊列，無延遲等待
                while (dataQueue.length === 0 && !isReadingComplete) {
                  // 立即檢查，不等待（瀏覽器兼容）
                  await new Promise(resolve => setTimeout(resolve, 0));
                }
                
                // 檢查是否有錯誤
                if (readError) {
                  throw readError;
                }
                
                // 如果隊列空且讀取完成，退出
                if (dataQueue.length === 0 && isReadingComplete) {
                  // console.log("所有數據強制處理完成");
                  break;
                }
                
                                // 從隊列取出數據處理  
                if (dataQueue.length > 0) {
                  const value = dataQueue.shift()!;
                  chunkCount++;
                  totalBytesReceived += value.length;
                  chunks.push(value); // 保存到chunks用於緩存
                  // console.log(`處理數據塊 ${chunkCount}，大小: ${value.length} 字節，總計: ${totalBytesReceived} 字節，隊列剩餘: ${dataQueue.length}`);
                  
                  // 等待上一次操作完成
                  if (sourceBuffer.updating) {
                    console.log("等待上一次SourceBuffer操作完成");
                    await new Promise(resolve => {
                      sourceBuffer.addEventListener('updateend', resolve, { once: true });
                    });
                  }
                  
                  // 檢查MediaSource狀態
                  if (mediaSource.readyState !== 'open') {
                    console.error("MediaSource不再開放，狀態:", mediaSource.readyState);
                    break;
                  }
                  
                  // 添加數據到 buffer
                  try {
                    await appendBuffer(value);
                    // console.log(`成功添加數據塊 ${chunkCount}`);
                    
                    // 每次添加數據塊後都檢查是否可以開始播放和播放狀態
                    const currentBufferedInfo = audio.buffered.length > 0 ? 
                      `start:${audio.buffered.start(0).toFixed(3)}, end:${audio.buffered.end(0).toFixed(3)}` : 
                      "無緩衝";
                    // console.log(`數據塊${chunkCount}處理後 - currentTime:${audio.currentTime.toFixed(3)}, paused:${audio.paused}, buffered:[${currentBufferedInfo}], 隊列:${dataQueue.length}`);
                    
                    // 強制積極模式：移除緩衝保護，讓音頻持續播放
                    if (hasStartedPlaying && audio.buffered.length > 0) {
                      const bufferedEnd = audio.buffered.end(0);
                      const remainingBuffer = bufferedEnd - audio.currentTime;
                      // console.log(`強制模式 - 剩餘緩衝:${remainingBuffer.toFixed(3)}s, 隊列:${dataQueue.length}, 讀取完成:${isReadingComplete}, 持續播放`);
                      
                      // 不進行任何暫停操作，讓音頻自然播放
                      // 依賴強制讀取確保數據及時到達
                    }
                    
                    if (!hasStartedPlaying) {
                      // console.log("檢查緩衝時間是否足夠播放");
                      await tryToPlay();
                    }
                    
                  } catch (bufferError) {
                    console.error(`添加數據塊 ${chunkCount} 失敗:`, bufferError);
                    throw bufferError;
                  }
                }
              }
              
              // 確保強制讀取完成
              await readPromise;
              
              // console.log(`所有數據接收完成，總共 ${chunkCount} 個數據塊，${totalBytesReceived} 字節`);
              
              // 確保所有數據塊都已處理完成
              let retryCount = 0;
              const maxRetries = 50; // 最多等待5秒
              while (sourceBuffer.updating && retryCount < maxRetries) {
                console.log(`等待SourceBuffer完成處理，重試 ${retryCount + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 100));
                retryCount++;
              }
              
              if (sourceBuffer.updating) {
                console.warn("SourceBuffer仍在更新，但已達到最大等待時間");
              }
              
              // 額外等待更長時間確保音頻解碼器穩定
              console.log("等待音頻解碼器穩定...");
              await new Promise(resolve => setTimeout(resolve, 500)); // 增加到500ms
              
              // 再次檢查SourceBuffer狀態
              if (sourceBuffer.updating) {
                console.log("SourceBuffer仍在更新，等待完成");
                await new Promise(resolve => {
                  sourceBuffer.addEventListener('updateend', resolve, { once: true });
                });
              }
              
              // 標記流結束 - 更保守的處理
              if (mediaSource.readyState === 'open') {
                // console.log("準備標記MediaSource流結束");
                
                // 檢查是否接近音頻結尾，如果是則延遲endOfStream
                if (audio.buffered.length > 0) {
                  const bufferedEnd = audio.buffered.end(0);
                  const currentTime = audio.currentTime;
                  const remainingTime = bufferedEnd - currentTime;
                  // console.log(`檢查播放狀態 - 當前:${currentTime.toFixed(3)}s, 緩衝結束:${bufferedEnd.toFixed(3)}s, 剩餘:${remainingTime.toFixed(3)}s`);
                  
                  // 如果播放接近結尾(剩餘<1秒)，延遲endOfStream調用
                  if (remainingTime < 1) {
                    // console.log("播放接近結尾，延遲endOfStream調用避免破音");
                    await new Promise(resolve => setTimeout(resolve, 300));
                  }
                }
                
                try {
                  // console.log("標記MediaSource流結束");
                  mediaSource.endOfStream();
                  // console.log("endOfStream調用成功");
                } catch (endError) {
                  console.warn("endOfStream調用失敗:", endError);
                  // 如果失敗，再等待一下再試
                  await new Promise(resolve => setTimeout(resolve, 200));
                  if (mediaSource.readyState === 'open') {
                    try {
                      console.log("重試endOfStream");
                      mediaSource.endOfStream();
                      console.log("重試endOfStream成功");
                    } catch (retryError) {
                      console.error("重試endOfStream也失敗:", retryError);
                    }
                  }
                }
                              } else {
                  // console.log(`MediaSource狀態不是open(${mediaSource.readyState})，跳過endOfStream`);
                }
                
                // console.log("WebM流式播放設置完成");
              
              // 如果還沒開始播放，現在嘗試播放
              if (!hasStartedPlaying && audio.paused) {
                // console.log("音頻仍然暫停且未開始播放，嘗試播放");
                try {
                  await audio.play();
                  hasStartedPlaying = true;
                  // console.log("延遲播放成功");
                } catch (delayedPlayError) {
                  console.error("延遲播放也失敗:", delayedPlayError);
                }
              } else if (hasStartedPlaying) {
                // console.log("音頻已開始播放，跳過重複播放");
              }
              
              // 創建完整的blob用於緩存
              const blob = new Blob(chunks, { type: 'audio/webm; codecs="opus"' });
              const blobUrl = URL.createObjectURL(blob);
              addToMemoryCache(text, voice, blob, blobUrl);
              // console.log("添加到內存緩存完成");
              
              // 設置播放結束事件
              audio.onended = () => {
                const bufferedInfo = audio.buffered.length > 0 ? 
                  `[${audio.buffered.start(0).toFixed(3)}-${audio.buffered.end(0).toFixed(3)}]` : 
                  "無緩衝";
                // console.log(`WebM音頻播放完成 - currentTime:${audio.currentTime.toFixed(3)}, duration:${audio.duration.toFixed(3)}, buffered:${bufferedInfo}`);
                audioRef.current = null;
                // 清理MediaSource URL
                if (audio.src && audio.src.startsWith('blob:')) {
                  URL.revokeObjectURL(audio.src);
                }
              };
              
              // 設置錯誤處理
              audio.onerror = (error) => {
                console.error("音頻播放錯誤:", error);
                if (mediaSource.readyState === 'open') {
                  try {
                    mediaSource.endOfStream('decode');
                  } catch (e) {
                    console.warn("錯誤時endOfStream失敗:", e);
                  }
                }
              };
              
              resolve(audio);
              
            } catch (error) {
              console.error('WebM流式播放錯誤:', error);
              clearTimeout(timeoutId);
              if (mediaSource.readyState === 'open') {
                try {
                  mediaSource.endOfStream('decode');
                } catch (e) {
                  console.warn("endOfStream('decode')失敗:", e);
                }
              }
              reject(error);
            }
          });
          
          // MediaSource錯誤處理
          mediaSource.addEventListener('error', (event) => {
            console.error('MediaSource錯誤事件:', event);
            clearTimeout(timeoutId);
            reject(new Error('MediaSource錯誤'));
          });
          
          // 添加其他事件監聽
          mediaSource.addEventListener('sourceended', () => {
            // console.log('MediaSource sourceended 事件');
          });
          
          mediaSource.addEventListener('sourceclose', () => {
            // console.log('MediaSource sourceclose 事件');
          });
          
          // 音頻事件監聽
          // audio.addEventListener('loadstart', () => console.log('Audio loadstart'));
          // audio.addEventListener('loadedmetadata', () => console.log('Audio loadedmetadata'));
          // audio.addEventListener('loadeddata', () => console.log('Audio loadeddata'));
          // audio.addEventListener('canplay', () => console.log('Audio canplay'));
          // audio.addEventListener('canplaythrough', () => console.log('Audio canplaythrough'));
          audio.addEventListener('playing', () => {
            const bufferedInfo = audio.buffered.length > 0 ? 
              `[${audio.buffered.start(0).toFixed(3)}-${audio.buffered.end(0).toFixed(3)}]` : 
              "無緩衝";
            // console.log(`Audio playing - currentTime:${audio.currentTime.toFixed(3)}, buffered:${bufferedInfo}`);
          });
          audio.addEventListener('pause', () => {
            const bufferedInfo = audio.buffered.length > 0 ? 
              `[${audio.buffered.start(0).toFixed(3)}-${audio.buffered.end(0).toFixed(3)}]` : 
              "無緩衝";
            // console.log(`Audio pause - currentTime:${audio.currentTime.toFixed(3)}, buffered:${bufferedInfo}, ended:${audio.ended}`);
          });
          audio.addEventListener('timeupdate', () => {
            if (audio.buffered.length > 0) {
              const bufferedEnd = audio.buffered.end(0);
              const remainingBuffer = bufferedEnd - audio.currentTime;
                                    // if (remainingBuffer < 0.5 || audio.currentTime % 1 < 0.1) { // 每秒或緩衝不足0.5秒時log
                      //   console.log(`播放進度 - currentTime:${audio.currentTime.toFixed(3)}, buffered:[${audio.buffered.start(0).toFixed(3)}-${bufferedEnd.toFixed(3)}], 剩餘緩衝:${remainingBuffer.toFixed(3)}s`);
                      // }
            }
          });
                      audio.addEventListener('progress', () => {
              // if (audio.buffered.length > 0) {
              //   console.log(`緩衝進度 - buffered:[${audio.buffered.start(0).toFixed(3)}-${audio.buffered.end(0).toFixed(3)}]`);
              // }
            });
          audio.addEventListener('error', (e) => console.error('Audio error:', e));
        });
      };
      
      // 傳統方法：收集所有WebM數據後再播放
      const fallbackToTraditionalMethod = async (): Promise<{ audio: HTMLAudioElement }> => {
        // console.log("使用傳統方法處理WebM音頻流");
        
        const response = await generateSpeechStream(text, voice);
        // console.log("WebM流式響應狀態:", response.status, response.statusText);
        
        if (!response.body) {
          throw new Error("服務器未返回有效的WebM音頻流");
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
                  // console.log(`WebM數據接收超時 (${timeSinceLastData}ms 無新數據)，視為傳輸完成`);
                  resolveTimeout({ done: true, value: undefined });
                }, TIMEOUT_MS);
              });
              
              // 讀取數據或超時
              const { done, value } = await Promise.race([
                reader.read(),
                timeoutPromise
              ]);
              
              if (done) {
                // console.log(`WebM數據流結束，總共接收: ${totalBytes} 字節`);
                break;
              }
              
              // 更新最後接收數據的時間
              lastDataTime = Date.now();
              chunks.push(value);
              totalBytes += value.length;
              // console.log(`接收到WebM數據塊: ${value.length} 字節，總計: ${totalBytes} 字節`);
            }
            resolve();
          } catch (err) {
            console.error("讀取WebM流數據時發生錯誤:", err);
            reject(err);
          } finally {
            if (timeoutId) clearTimeout(timeoutId);
          }
        });
        
        // 等待讀取完成
        await readAllData;
        
        const downloadTime = Date.now() - startTime;
        // console.log(`總共接收: ${totalBytes} 字節的WebM音頻數據，耗時: ${downloadTime}ms`);
        
        if (totalBytes === 0) {
          throw new Error("服務器返回了空的WebM音頻數據");
        }
        
        // 創建WebM Blob及其URL
        const blob = new Blob(chunks, { type: 'audio/webm; codecs="opus"' });
        const audioUrl = URL.createObjectURL(blob);
        
        // 創建新的音頻元素
        const traditionalAudio = new Audio(audioUrl);
        audioRef.current = traditionalAudio;
        
        // 預加載
        traditionalAudio.preload = "auto";
        
        // WebM音頻修復：設置特殊屬性
        traditionalAudio.controls = false;
        traditionalAudio.crossOrigin = "anonymous";
        
        // 添加到內存緩存
        addToMemoryCache(text, voice, blob, audioUrl);
        
        // 獲取服務器返回的實際URL進行localStorage緩存
        const serverUrl = response.headers.get('x-audio-url') || '';
        if (serverUrl) {
          addTTSCacheItem(text, voice, serverUrl);
          // console.log("將服務器WebM音頻URL添加到localStorage:", serverUrl);
        } else {
          // 如果沒有服務器URL，使用blob URL（雖然會在頁面刷新後失效）
          addTTSCacheItem(text, voice, audioUrl);
        }
        
        // 設置音頻就緒事件 - 加強緩衝檢查
        traditionalAudio.oncanplaythrough = async () => {
          // console.log("WebM音頻數據就緒，準備播放");
          
          // 額外等待確保音頻完全解碼
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // 檢查是否真的有完整緩衝
          if (traditionalAudio.buffered.length > 0) {
            const bufferedEnd = traditionalAudio.buffered.end(0);
            const duration = traditionalAudio.duration || 0;
            // console.log(`緩衝檢查: buffered=${bufferedEnd.toFixed(3)}s, duration=${duration.toFixed(3)}s, 完整度=${((bufferedEnd/duration)*100).toFixed(1)}%`);
            
            // 確保至少90%的音頻已緩衝
            if (duration > 0 && bufferedEnd >= duration * 0.9) {
              // console.log("音頻緩衝充足，開始播放");
            } else {
              console.warn("音頻緩衝不足，等待更多數據");
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
          
          const processingTime = Date.now() - startTime - downloadTime;
          // console.log(`WebM音頻處理時間: ${processingTime}ms`);
          
          try {
            const playStartTime = Date.now();
            await traditionalAudio.play();
            // console.log(`WebM播放開始，從請求到播放總延遲: ${Date.now() - startTime}ms`);
          } catch (playError) {
            console.error("WebM播放失敗:", playError);
          }
        };
        
        // 播放完成后只清理引用
        traditionalAudio.onended = () => {
          // console.log("WebM音頻播放完成");
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
      
      // 優先使用 MediaSource API 實現真正的邊下載邊播放（1秒緩衝）
      if (hasMediaSource) {
        try {
          // console.log("🚀 開始真正的邊下載邊播放 - MediaSource流式播放");
          const streamAudio = await playStreamingWebMAudio(text, voice);
          audioRef.current = streamAudio;
          setState(prev => ({ ...prev, isLoading: false }));
          // console.log("✅ MediaSource邊下載邊播放成功！");
          return { audio: streamAudio };
        } catch (error) {
          console.warn("❌ MediaSource播放失敗，切換到傳統下載:", error);
          // 繼續嘗試傳統方法
        }
      } else {
                  // console.log("⚠️ 瀏覽器不支持MediaSource，使用傳統下載方法");
      }
      
              // 如果MediaSource失敗或不支持，使用傳統方法（完全下載後播放）
        // console.log("📥 Fallback: 傳統完全下載方法");
        return await fallbackToTraditionalMethod();
      
    } catch (err) {
      console.error('WebM流式語音生成失敗:', err);
      setState(prev => ({ 
        ...prev, 
        error: `WebM流式語音生成失敗: ${err instanceof Error ? err.message : String(err)}`,
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