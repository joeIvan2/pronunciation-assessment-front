// API 相關常量和工具函數

// 導入語音配置

// 後端API基礎URL
const BACKEND_URL = 'https://pronunciation-assessment-app-jxea.onrender.com';

// 導出BACKEND_URL供其他模組使用
export { BACKEND_URL };

// 新增AI服務器API地址
export const AI_SERVER_URL = "https://pronunciation-ai-server-439s.onrender.com";

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
 * 使用 nicetone.ai API 生成語音（WebM格式流式播放）
 * @param text - 要轉換為語音的文本
 * @param character - 語音角色，支持的選項：{getVoiceListString()}
 * @param speed - 語速控制，默認為 1.0，範圍通常為 0.5 到 2.0
 * @returns Promise<any> - 包含 audioUrl（blob URL）的響應
 */
export const generateSpeechWithNicetone = async (
  text: string,
  character: string = "bella",
  speed: number = 1.0
): Promise<any> => {
  try {
    const apiUrl = `${NICETONE_API_URL}/api/tts-webm`;
    console.log(`使用 nicetone.ai WebM流式TTS API: ${apiUrl}`);
    
    // 使用查詢參數的方式傳遞參數，添加file=true進行流式播放
    const params = new URLSearchParams({
      text: text,
      character: character,
      file: 'true', // 啟用WebM流式播放，直接返回二進制文件
      speed: speed.toString()
    });
    
    const fullUrl = `${apiUrl}?${params.toString()}`;
    console.log(`WebM流式請求URL: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Accept': 'audio/webm, audio/*, */*',  // 期望音頻文件而不是JSON
      },
    });
    
    if (response.ok) {
      // file=true時，API直接返回WebM二進制文件，不是JSON
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log(`nicetone.ai WebM流式TTS成功，生成blob URL:`, audioUrl);
      console.log(`WebM文件大小: ${audioBlob.size} bytes，類型: ${audioBlob.type}`);
      
      return {
        success: true,
        audioUrl: audioUrl,
        blob: audioBlob,
        size: audioBlob.size,
        type: audioBlob.type
      };
    } else {
      const errorText = await response.text();
      console.warn(`nicetone.ai WebM TTS API 失敗: ${response.status} ${response.statusText}`);
      console.warn(`返回內容: ${errorText}`);
      throw new Error(`nicetone.ai WebM API 請求失敗: ${response.status} - ${errorText}`);
    }
  } catch (err) {
    console.warn(`nicetone.ai WebM TTS API 嘗試失敗: ${err instanceof Error ? err.message : String(err)}`);
    throw err instanceof Error ? err : new Error(String(err));
  }
};

/**
 * 下載音頻文件並轉換為 Blob
 * @param audioUrl - 音頻文件的 URL
 * @returns Promise<Blob> - 音頻文件的 Blob 對象
 */
