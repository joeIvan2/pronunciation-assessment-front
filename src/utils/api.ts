// API 相關常量和工具函數

// 後端API地址
export const BACKEND_URL = "https://pronunciation-assessment-app-1.onrender.com";

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
  ]
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