// API 相關常量和工具函數

// 導入語音配置
import { getVoiceListString } from '../config/voiceConfig';

// 後端API基礎URL
const BACKEND_URL = 'https://pronunciation-assessment-app-1.onrender.com';

// 導出BACKEND_URL供其他模組使用
export { BACKEND_URL };

// 新增AI服務器API地址
export const AI_SERVER_URL = "https://pronunciation-ai-server.onrender.com";

// 新增 nicetone.ai TTS API 地址
export const NICETONE_API_URL = "https://tts.nicetone.ai";

// 嘗試不同的API路徑
export const API_PATHS = {
  ASSESSMENT: [
    "/api/pronunciation-assessment", 
    "/pronunciation-assessment",
    "/api/assess",
    "/assess",
    "/api/v1/pronunciation-assessment"
  ],
  TTS: [
    "/api/text-to-speech",
    "/text-to-speech",
    "/api/tts",
    "/tts"
  ],
  // 新增streaming相關API路徑 - 使用實際的後端API
  STREAMING: {
    // 主要streaming評估端點
    ASSESSMENT: "/api/streaming-assessment",
    // 批量處理端點
    BATCH: "/api/streaming-assessment/batch",
    // 統計端點
    STATS: "/api/streaming-assessment/stats",
    // 健康檢查端點
    HEALTH: "/api/streaming-assessment/health"
  }
};

// 發送評估請求到後端
export const sendAssessmentRequest = async (
  referenceText: string, 
  audioBase64: string, 
  strictMode: boolean
): Promise<Response> => {
  // 構建請求數據
  const requestData = {
    referenceText,
    audioBuffer: audioBase64,
    strictMode
  };
  
  // 嘗試所有可能的API路徑
  let lastError: Error | null = null;
  
  for (const path of API_PATHS.ASSESSMENT) {
    try {
      console.log(`嘗試連接API: ${BACKEND_URL}${path}`);
      
      const response = await fetch(`${BACKEND_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log(`API響應狀態: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`成功連接到API: ${BACKEND_URL}${path}`);
        return response;
      } else {
        console.warn(`API路徑失敗 ${path}: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.warn(`返回內容: ${text}`);
        lastError = new Error(`後端請求失敗: ${response.status} - ${text}`);
      }
    } catch (err) {
      console.warn(`API路徑嘗試失敗 ${path}: ${err instanceof Error ? err.message : String(err)}`);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  
  throw lastError || new Error('所有API路徑嘗試均失敗');
};

// 發送TTS請求到後端
export const sendTTSRequest = async (text: string): Promise<Response> => {
  // 嘗試所有可能的API路徑
  let lastError: Error | null = null;
  
  for (const path of API_PATHS.TTS) {
    try {
      console.log(`嘗試連接TTS API: ${BACKEND_URL}${path}`);
      
      const response = await fetch(`${BACKEND_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (response.ok) {
        console.log(`成功連接到TTS API: ${BACKEND_URL}${path}`);
        return response;
      } else {
        console.warn(`TTS API路徑失敗 ${path}: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.warn(`返回內容: ${text}`);
        lastError = new Error(`後端請求失敗: ${response.status} - ${text}`);
      }
    } catch (err) {
      console.warn(`TTS API路徑嘗試失敗 ${path}: ${err instanceof Error ? err.message : String(err)}`);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  
  throw lastError || new Error('所有TTS API路徑嘗試均失敗');
}; 

/**
 * 使用新的AI服務器生成語音
 * @param text - 要轉換為語音的文本
 * @param voice - 語音角色，支持的選項：Puck, Charon, Kore, Fenrir, Aoede, Leda, Orus, Zephyr
 * @param languageCode - 語言代碼，默認為 "en-US"
 * @returns Promise<Response> - 包含音頻數據的響應
 */
export const generateSpeech = async (
  text: string, 
  voice: string = "Puck", 
  languageCode: string = "en-US"
): Promise<Response> => {
  try {
    console.log(`嘗試連接AI服務器TTS API: ${AI_SERVER_URL}/generate-speech`);
    
    const response = await fetch(`${AI_SERVER_URL}/generate-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text, 
        voice, 
        languageCode 
      }),
    });
    
    if (response.ok) {
      console.log(`成功連接到AI服務器TTS API`);
      return response;
    } else {
      const errorText = await response.text();
      console.warn(`AI服務器TTS API失敗: ${response.status} ${response.statusText}`);
      console.warn(`返回內容: ${errorText}`);
      throw new Error(`AI服務器請求失敗: ${response.status} - ${errorText}`);
    }
  } catch (err) {
    console.warn(`AI服務器TTS API嘗試失敗: ${err instanceof Error ? err.message : String(err)}`);
    throw err instanceof Error ? err : new Error(String(err));
  }
}; 

/**
 * 使用新的AI服務器生成流式語音（WebM/Opus格式）
 * @param text - 要轉換為語音的文本
 * @param voice - 語音角色，支持的選項：
 *   - Puck: 默認中性聲音
 *   - Charon: 深邃神秘男聲
 *   - Kore: 清新純淨女聲
 *   - Fenrir: 強勁有力男聲
 *   - Aoede: 優雅歌唱女聲
 *   - Leda: 溫柔親切女聲
 *   - Orus: 莊重威嚴男聲
 *   - Zephyr: 輕柔清風聲音
 * @param languageCode - 語言代碼，默認為 "en-US"
 * @returns Promise<Response> - 包含WebM/Opus格式音頻流的響應
 */
export const generateSpeechStream = async (
  text: string, 
  voice: string = "Puck", 
  languageCode: string = "en-US"
): Promise<Response> => {
  // 最大重試次數
  const MAX_RETRIES = 2;
  // 請求超時（毫秒）
  const REQUEST_TIMEOUT = 15000;
  
  // 定義重試函數
  const fetchWithRetry = async (retryCount = 0): Promise<Response> => {
    try {
      const apiUrl = `${AI_SERVER_URL}/generate-speech-stream-webm`;
      console.log(`嘗試連接AI服務器WebM流式TTS API (嘗試 ${retryCount + 1}/${MAX_RETRIES + 1}): ${apiUrl}`);
      
      // 創建請求控制器，用於超時控制
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            text, 
            voice, 
            languageCode
          }),
          signal: controller.signal
        });
        
        // 清除超時計時器
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`成功連接到AI服務器WebM流式TTS API，狀態碼：${response.status}`);
          
          // 檢查響應頭
          const contentType = response.headers.get('content-type') || '';
          console.log(`響應內容類型: ${contentType}`);
          
          if (contentType.includes('webm') || contentType.includes('audio/') || contentType.includes('application/octet-stream')) {
            return response;
          } else {
            console.warn(`警告：響應內容類型不是WebM音頻 (${contentType})`);
            return response; // 仍然返回響應，後續處理將嘗試多種格式
          }
        } else {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = '無法讀取錯誤詳情';
          }
          
          console.warn(`AI服務器WebM流式TTS API失敗: ${response.status} ${response.statusText}`);
          console.warn(`返回內容: ${errorText}`);
          
          const error = new Error(`AI服務器WebM流式請求失敗: ${response.status} - ${errorText}`);
          throw error;
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err) {
      // 檢查是否因超時而中止
      if (err.name === 'AbortError') {
        console.warn(`請求超時 (${REQUEST_TIMEOUT}ms)`);
        throw new Error(`AI服務器請求超時 (${REQUEST_TIMEOUT}ms)`);
      }
      
      console.warn(`AI服務器WebM流式TTS API嘗試失敗: ${err instanceof Error ? err.message : String(err)}`);
      
      // 是否還有重試機會
      if (retryCount < MAX_RETRIES) {
        console.log(`重試請求 (${retryCount + 1}/${MAX_RETRIES})...`);
        // 指數退避重試
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(retryCount + 1);
      }
      
      // 已達最大重試次數
      throw err instanceof Error ? err : new Error(String(err));
    }
  };
  
  // 開始請求（最多重試指定次數）
  return fetchWithRetry();
}; 

/**
 * 使用 nicetone.ai API 生成語音（WebM格式）
 * @param text - 要轉換為語音的文本
 * @param character - 語音角色，支持的選項：{getVoiceListString()}
 * @param speed - 語速控制，默認為 1.0，範圍通常為 0.5 到 2.0
 * @returns Promise<any> - 包含 audioUrl 等信息的 JSON 響應
 */
export const generateSpeechWithNicetone = async (
  text: string, 
  character: string = "female_english", 
  speed: number = 1.0
): Promise<any> => {
  try {
    const apiUrl = `${NICETONE_API_URL}/api/tts-webm`;
    console.log(`嘗試連接 nicetone.ai TTS API: ${apiUrl}`);
    
    // 使用查詢參數的方式傳遞參數
    const params = new URLSearchParams({
      text: text,
      character: character,
      speed: speed.toString()
    });
    
    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log(`完整請求URL: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`成功連接到 nicetone.ai TTS API，返回數據:`, data);
      
      if (data.success && data.audioUrl) {
        return data;
      } else {
        throw new Error(`nicetone.ai API 響應失敗: ${data.error || '未知錯誤'}`);
      }
    } else {
      const errorText = await response.text();
      console.warn(`nicetone.ai TTS API 失敗: ${response.status} ${response.statusText}`);
      console.warn(`返回內容: ${errorText}`);
      throw new Error(`nicetone.ai API 請求失敗: ${response.status} - ${errorText}`);
    }
  } catch (err) {
    console.warn(`nicetone.ai TTS API 嘗試失敗: ${err instanceof Error ? err.message : String(err)}`);
    throw err instanceof Error ? err : new Error(String(err));
  }
};

/**
 * 下載音頻文件並轉換為 Blob
 * @param audioUrl - 音頻文件的 URL
 * @returns Promise<Blob> - 音頻文件的 Blob 對象
 */
export const downloadAudioAsBlob = async (audioUrl: string): Promise<Blob> => {
  try {
    console.log(`下載音頻文件: ${audioUrl}`);
    
    const response = await fetch(audioUrl, {
      method: 'GET',
      headers: {
        'Accept': 'audio/webm, audio/*, */*',
      },
    });
    
    if (!response.ok) {
      throw new Error(`下載音頻失敗: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log(`音頻下載完成，大小: ${blob.size} 字節，類型: ${blob.type}`);
    
    return blob;
  } catch (err) {
    console.error(`下載音頻文件失敗: ${err instanceof Error ? err.message : String(err)}`);
    throw err instanceof Error ? err : new Error(String(err));
  }
}; 