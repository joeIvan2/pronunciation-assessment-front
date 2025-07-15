import { useState, useRef, useCallback } from 'react';
import { sendAssessmentRequest, sendTTSRequest, BACKEND_URL, API_PATHS } from '../utils/api';
import { blobToBase64 } from './useRecorder';
import { 
  SpeechAssessmentResult, 
  BackendSpeechState, 
  BackendSpeechResult 
} from '../types/speech';

// 接口定義已移至 ../types/speech.ts

export const useBackendSpeech = (): BackendSpeechResult => {
  const [state, setState] = useState<BackendSpeechState>({
    isLoading: false,
    error: null,
    isStreaming: false,
    streamProgress: 0
  });
  
  const streamingSessionRef = useRef<string | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamingConfigRef = useRef<{
    referenceText: string;
    strictMode: boolean;
    onProgress?: (progress: number) => void;
    onPartialResult?: (result: Partial<SpeechAssessmentResult>) => void;
  } | null>(null);

  const generateSessionId = () => {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const startStreamingAssessment = useCallback(async (
    referenceText: string,
    strictMode: boolean,
    onProgress?: (progress: number) => void,
    onPartialResult?: (result: Partial<SpeechAssessmentResult>) => void
  ): Promise<(chunk: Blob) => void> => {
    try {
      setState(prev => ({ 
        ...prev, 
        isStreaming: true, 
        error: null,
        streamProgress: 0
      }));

      const sessionId = generateSessionId();
      streamingSessionRef.current = sessionId;
      audioChunksRef.current = [];
      
      streamingConfigRef.current = {
        referenceText,
        strictMode,
        onProgress,
        onPartialResult
      };

      console.log(`開始streaming評估會話: ${sessionId}`);

      // 嘗試初始化streaming會話
      try {
        const initResponse = await fetch(`${BACKEND_URL}${API_PATHS.STREAMING.ASSESSMENT}/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            referenceText,
            strictMode,
            options: {
              language: 'en-US',
              enableMiscue: true
            }
          }),
        });

        if (!initResponse.ok) {
          throw new Error(`初始化streaming會話失敗: ${initResponse.status}`);
        }

        const initData = await initResponse.json();
        console.log('Streaming會話初始化成功:', initData);
        
        if (onProgress) {
          onProgress(5);
        }
        setState(prev => ({ ...prev, streamProgress: 5 }));

      } catch (initError) {
        console.warn('Streaming會話初始化失敗，使用累積模式:', initError);
        console.log('使用累積模式進行streaming處理');
      }

      return async (chunk: Blob) => {
        await sendAudioChunk(chunk);
      };

    } catch (err) {
      console.error('啟動streaming評估失敗:', err);
      setState(prev => ({ 
        ...prev, 
        isStreaming: false,
        error: `啟動streaming評估失敗: ${err instanceof Error ? err.message : String(err)}`
      }));
      throw err;
    }
  }, []);

  const sendAudioChunk = useCallback(async (chunk: Blob) => {
    if (!streamingSessionRef.current || !streamingConfigRef.current) {
      console.warn('沒有active的streaming會話');
      return;
    }

    try {
      audioChunksRef.current.push(chunk);
      
      // 計算進度 (基於chunks數量，最大到90%)
      const progress = Math.min(audioChunksRef.current.length * 10, 90);
      setState(prev => ({ ...prev, streamProgress: progress }));
      
      if (streamingConfigRef.current.onProgress) {
        streamingConfigRef.current.onProgress(progress);
      }

      console.log(`累積音頻chunk: ${chunk.size} 字節, 總chunks: ${audioChunksRef.current.length}`);

      // 嘗試實時發送chunk到後端
      try {
        const base64Chunk = await blobToBase64(chunk);
        
        const chunkResponse = await fetch(`${BACKEND_URL}${API_PATHS.STREAMING.ASSESSMENT}/chunk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: streamingSessionRef.current,
            audioChunk: base64Chunk,
            chunkIndex: audioChunksRef.current.length - 1
          }),
        });

        if (chunkResponse.ok) {
          const chunkData = await chunkResponse.json();
          console.log('Chunk發送成功:', chunkData);
          
          // 如果有部分結果，調用回調
          if (chunkData.partialResult && streamingConfigRef.current.onPartialResult) {
            streamingConfigRef.current.onPartialResult(chunkData.partialResult);
          }
        } else {
          console.warn(`Chunk發送失敗: ${chunkResponse.status}, 將在最後統一處理`);
        }
      } catch (chunkError) {
        console.warn('實時chunk發送失敗，將累積處理:', chunkError);
      }

    } catch (err) {
      console.error('發送音頻chunk失敗:', err);
      setState(prev => ({ 
        ...prev, 
        error: `發送音頻chunk失敗: ${err instanceof Error ? err.message : String(err)}`
      }));
    }
  }, []);

  const stopStreamingAssessment = useCallback(async (): Promise<SpeechAssessmentResult | null> => {
    if (!streamingSessionRef.current || !streamingConfigRef.current) {
      console.warn('沒有active的streaming會話');
      return null;
    }

    try {
      setState(prev => ({ ...prev, streamProgress: 95 }));

      // 首先嘗試finalize streaming會話
      try {
        const finalizeResponse = await fetch(`${BACKEND_URL}${API_PATHS.STREAMING.ASSESSMENT}/finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: streamingSessionRef.current,
            options: { method: 'direct' }
          }),
        });

        if (finalizeResponse.ok) {
          const finalData = await finalizeResponse.json();
          console.log('Streaming會話finalize成功:', finalData);
          
          // 修正：檢查streaming API的實際回應格式
          if (finalData.success && (finalData.result || finalData.assessmentResults || finalData.text)) {
            // 處理不同的回應格式
            const assessmentData = finalData.result || finalData.assessmentResults || finalData;
            
            // 詳細調試日誌
            console.log('🔍 Streaming API回應詳細解析:', {
              success: finalData.success,
              hasResult: !!finalData.result,
              hasAssessmentResults: !!finalData.assessmentResults,
              hasText: !!finalData.text,
              finalDataKeys: Object.keys(finalData),
              assessmentDataKeys: Object.keys(assessmentData),
              rawAssessmentResults: finalData.assessmentResults,
              rawText: finalData.text
            });
            
            const result: SpeechAssessmentResult = {
              accuracyScore: assessmentData.accuracyScore || finalData.accuracyScore || 0,
              fluencyScore: assessmentData.fluencyScore || finalData.fluencyScore || 0,
              completenessScore: assessmentData.completenessScore || finalData.completenessScore || 0,
              pronunciationScore: assessmentData.pronunciationScore || finalData.pronunciationScore || 0,
              DisplayText: assessmentData.text || finalData.text || '',
              text: assessmentData.text || finalData.text || '',
              NBest: (assessmentData.wordAnalysis || finalData.wordAnalysis || finalData.phonemeAnalysis) ? [{
                Display: assessmentData.text || finalData.text || '',
                Words: (assessmentData.wordAnalysis || finalData.wordAnalysis || []).map((word: any) => {
                  // 從rawResponse中提取詳細的音素數據
                  let phonemes = undefined;
                  if (finalData.rawResponse) {
                    try {
                      const parsedResponse = JSON.parse(finalData.rawResponse);
                      const nbestData = parsedResponse.NBest?.[0];
                      if (nbestData?.Words) {
                        const matchedWord = nbestData.Words.find((w: any) => 
                          w.Word?.toLowerCase() === word.word?.toLowerCase()
                        );
                        if (matchedWord?.Phonemes) {
                          phonemes = matchedWord.Phonemes.map((p: any) => ({
                            Phoneme: p.Phoneme,
                            PronunciationAssessment: {
                              AccuracyScore: p.PronunciationAssessment?.AccuracyScore
                            }
                          }));
                        }
                      }
                    } catch (e) {
                      console.warn('解析rawResponse音素數據失敗:', e);
                    }
                  }
                  
                  return {
                    Word: word.word,
                    PronunciationAssessment: {
                      AccuracyScore: word.accuracyScore,
                      ErrorType: word.errorType
                    },
                    Phonemes: phonemes
                  };
                }),
                PronunciationAssessment: assessmentData || finalData.assessmentResults
              }] : undefined,
              json: finalData.json
            };

            setState(prev => ({ 
              ...prev, 
              isStreaming: false,
              streamProgress: 100
            }));

            streamingSessionRef.current = null;
            streamingConfigRef.current = null;
            audioChunksRef.current = [];

            console.log('從streaming API成功獲取評估結果:', result);
            return result;
          }
        } else {
          throw new Error(`Finalize失敗: ${finalizeResponse.status}`);
        }
      } catch (finalizeError) {
        console.warn('Streaming finalize失敗，回退到標準API:', finalizeError);
      }

      // 回退到標準API處理累積的音頻數據
      console.log('📢 Streaming API無法完成評估，回退到標準API處理累積的音頻數據');
      
      if (audioChunksRef.current.length === 0) {
        throw new Error('沒有音頻數據可處理');
      }

      if (!streamingConfigRef.current) {
        throw new Error('Streaming配置丟失');
      }

      const combinedAudio = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log(`合併音頻大小: ${combinedAudio.size} 字節`);

      const base64Data = await blobToBase64(combinedAudio);

      // 使用標準評估API
      const response = await sendAssessmentRequest(
        streamingConfigRef.current.referenceText,
        base64Data,
        streamingConfigRef.current.strictMode
      );

      const data = await response.json();
      console.log('從標準API獲取結果:', data);

      // 修改檢查邏輯：如果有必要的評分數據就認為成功
      if (data.accuracyScore !== undefined || data.assessmentResults) {
        console.log('檢測到有效的評分數據，開始處理結果...');
        const result: SpeechAssessmentResult = {
          accuracyScore: data.assessmentResults?.accuracyScore || data.accuracyScore || 0,
          fluencyScore: data.assessmentResults?.fluencyScore || data.fluencyScore || 0,
          completenessScore: data.assessmentResults?.completenessScore || data.completenessScore || 0,
          pronunciationScore: data.assessmentResults?.pronunciationScore || data.pronunciationScore || 0,
          DisplayText: data.text || '',
          text: data.text || '',
          NBest: data.wordAnalysis ? [{
            Display: data.text || '',
            Words: data.wordAnalysis.map((word: any) => {
              // 從data.json中提取詳細的音素數據
              let phonemes = undefined;
              if (data.json) {
                try {
                  const parsedResponse = JSON.parse(data.json);
                  const nbestData = parsedResponse.NBest?.[0];
                  if (nbestData?.Words) {
                    const matchedWord = nbestData.Words.find((w: any) => 
                      w.Word?.toLowerCase() === word.word?.toLowerCase()
                    );
                    if (matchedWord?.Phonemes) {
                      phonemes = matchedWord.Phonemes.map((p: any) => ({
                        Phoneme: p.Phoneme,
                        PronunciationAssessment: {
                          AccuracyScore: p.PronunciationAssessment?.AccuracyScore
                        }
                      }));
                    }
                  }
                } catch (e) {
                  console.warn('解析json音素數據失敗:', e);
                }
              }
              
              return {
                Word: word.word,
                PronunciationAssessment: {
                  AccuracyScore: word.accuracyScore,
                  ErrorType: word.errorType
                },
                Phonemes: phonemes
              };
            }),
            PronunciationAssessment: data.assessmentResults || {
              AccuracyScore: data.accuracyScore || 0,
              FluencyScore: data.fluencyScore || 0,
              CompletenessScore: data.completenessScore || 0,
              PronScore: data.pronunciationScore || 0
            }
          }] : undefined,
          json: data.json
        };

        setState(prev => ({ 
          ...prev, 
          isStreaming: false,
          streamProgress: 100
        }));

        streamingSessionRef.current = null;
        streamingConfigRef.current = null;
        audioChunksRef.current = [];

        console.log('成功處理標準API結果:', result);
        return result;
      } else {
        // 只有在真正沒有數據時才拋出錯誤
        console.error('API回應數據格式異常:', { 
          hasAccuracyScore: data.accuracyScore !== undefined,
          hasAssessmentResults: !!data.assessmentResults,
          dataKeys: Object.keys(data)
        });
        throw new Error(data.error || '評估API未返回有效數據');
      }

    } catch (err) {
      console.error('停止streaming評估失敗:', err);
      setState(prev => ({ 
        ...prev, 
        isStreaming: false,
        error: `停止streaming評估失敗: ${err instanceof Error ? err.message : String(err)}`
      }));
      
      // 清理狀態
      streamingSessionRef.current = null;
      streamingConfigRef.current = null;
      audioChunksRef.current = [];
      
      return null;
    }
  }, []);
  
  // 使用後端API進行語音評估
  const assessWithBackend = async (
    audioBlob: Blob,
    referenceText: string,
    strictMode: boolean
  ): Promise<SpeechAssessmentResult | null> => {
    if (state.isLoading) return null;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      if (audioBlob.size === 0) {
        throw new Error('錄音數據為空，請檢查麥克風權限和設置');
      }
      
      // 將Blob轉換為base64
      const base64Data = await blobToBase64(audioBlob);
      console.log(`音頻轉換為base64完成，數據長度: ${base64Data.length}`);
      
      // 發送到後端並處理響應
      const response = await sendAssessmentRequest(referenceText, base64Data, strictMode);
      const data = await response.json();
      console.log(`收到評分數據:`, data);
      
      if (data.accuracyScore === 0 && data.fluencyScore === 0 && 
          data.completenessScore === 0 && data.pronunciationScore === 0) {
        console.warn('警告: 所有分數都是0，可能音頻處理有問題');
      }
      
      // 解析 json 字符串，提取 NBest 供前端顯示單字
      let nBest = undefined;
      if (data.json) {
        try {
          const parsed = JSON.parse(data.json);
          nBest = parsed.NBest || parsed.nBest;
        } catch (e) {
          console.warn('解析 json 失敗');
        }
      }
      
      // 返回統一欄位
      return {
        accuracyScore: data.accuracyScore,
        fluencyScore: data.fluencyScore,
        completenessScore: data.completenessScore,
        pronunciationScore: data.pronunciationScore,
        NBest: nBest,
        nBest: nBest,
        json: data.json
      } as any;
    } catch (err) {
      console.error('處理錄音失敗:', err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `後端API連接失敗: ${err instanceof Error ? err.message : String(err)}` 
      }));
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  // 使用後端API進行文本轉語音
  const speakWithBackend = async (text: string): Promise<void> => {
    try {
      if (!text) {
        throw new Error("請先輸入要發音的文字！");
      }
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // 發送請求到後端
      const response = await sendTTSRequest(text);
      
      // 獲取音頻數據並播放
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error('文本轉語音失敗:', err);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: `文本轉語音失敗: ${err instanceof Error ? err.message : String(err)}` 
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  return {
    ...state,
    assessWithBackend,
    speakWithBackend,
    startStreamingAssessment,
    stopStreamingAssessment,
    sendAudioChunk
  };
}; 