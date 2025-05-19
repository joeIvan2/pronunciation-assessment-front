// API 相关常量和工具函数

// 后端API地址
export const BACKEND_URL = "https://pronunciation-assessment-app-1.onrender.com";

// 尝试不同的API路径
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

// 发送评估请求到后端
export const sendAssessmentRequest = async (
  referenceText: string, 
  audioBase64: string, 
  strictMode: boolean
): Promise<Response> => {
  // 构建请求数据
  const requestData = {
    referenceText,
    audioBuffer: audioBase64,
    strictMode
  };
  
  // 尝试所有可能的API路径
  let lastError: Error | null = null;
  
  for (const path of API_PATHS.ASSESSMENT) {
    try {
      console.log(`尝试连接API: ${BACKEND_URL}${path}`);
      
      const response = await fetch(`${BACKEND_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });
      
      console.log(`API响应状态: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        console.log(`成功连接到API: ${BACKEND_URL}${path}`);
        return response;
      } else {
        console.warn(`API路径失败 ${path}: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.warn(`返回内容: ${text}`);
        lastError = new Error(`后端请求失败: ${response.status} - ${text}`);
      }
    } catch (err) {
      console.warn(`API路径尝试失败 ${path}: ${err instanceof Error ? err.message : String(err)}`);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  
  throw lastError || new Error('所有API路径尝试均失败');
};

// 发送TTS请求到后端
export const sendTTSRequest = async (text: string): Promise<Response> => {
  // 尝试所有可能的API路径
  let lastError: Error | null = null;
  
  for (const path of API_PATHS.TTS) {
    try {
      console.log(`尝试连接TTS API: ${BACKEND_URL}${path}`);
      
      const response = await fetch(`${BACKEND_URL}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });
      
      if (response.ok) {
        console.log(`成功连接到TTS API: ${BACKEND_URL}${path}`);
        return response;
      } else {
        console.warn(`TTS API路径失败 ${path}: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.warn(`返回内容: ${text}`);
        lastError = new Error(`后端请求失败: ${response.status} - ${text}`);
      }
    } catch (err) {
      console.warn(`TTS API路径尝试失败 ${path}: ${err instanceof Error ? err.message : String(err)}`);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  
  throw lastError || new Error('所有TTS API路径尝试均失败');
}; 