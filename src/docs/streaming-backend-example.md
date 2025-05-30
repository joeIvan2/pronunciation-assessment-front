# Streaming語音評估後端API實現示例

## 概述
這個文檔說明了如何在後端實現streaming語音評估功能，支持邊錄邊傳的實時音頻處理。

## API端點

### 1. 初始化Streaming會話
**POST** `/api/streaming-assessment/init`

請求體：
```json
{
  "sessionId": "stream_1234567890_abc123",
  "referenceText": "Hello world",
  "strictMode": true
}
```

響應：
```json
{
  "success": true,
  "sessionId": "stream_1234567890_abc123",
  "message": "Streaming session initialized"
}
```

### 2. 發送音頻chunk
**POST** `/api/streaming-assessment/chunk`

請求體：
```json
{
  "sessionId": "stream_1234567890_abc123",
  "audioChunk": "base64編碼的音頻數據",
  "chunkIndex": 0
}
```

響應：
```json
{
  "success": true,
  "chunkIndex": 0,
  "partialResult": {
    "recognizedText": "Hello",
    "confidence": 0.85
  }
}
```

### 3. 完成評估並獲取結果
**POST** `/api/streaming-assessment/finalize`

請求體：
```json
{
  "sessionId": "stream_1234567890_abc123"
}
```

響應：
```json
{
  "success": true,
  "result": {
    "accuracyScore": 85,
    "fluencyScore": 78,
    "completenessScore": 90,
    "pronunciationScore": 82,
    "NBest": [...],
    "recognizedText": "Hello world"
  }
}
```

## 後端實現示例 (Node.js/Express)

```javascript
// server.js
const express = require('express');
const multer = require('multer');
const app = express();

// 存儲streaming會話
const streamingSessions = new Map();

// 初始化streaming會話
app.post('/api/streaming-assessment/init', (req, res) => {
  const { sessionId, referenceText, strictMode } = req.body;
  
  // 創建會話
  streamingSessions.set(sessionId, {
    referenceText,
    strictMode,
    chunks: [],
    startTime: Date.now()
  });
  
  console.log(`初始化streaming會話: ${sessionId}`);
  
  res.json({
    success: true,
    sessionId,
    message: 'Streaming session initialized'
  });
});

// 接收音頻chunk
app.post('/api/streaming-assessment/chunk', async (req, res) => {
  const { sessionId, audioChunk, chunkIndex } = req.body;
  
  const session = streamingSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ 
      success: false, 
      error: 'Session not found' 
    });
  }
  
  // 存儲chunk
  session.chunks.push({
    data: audioChunk,
    index: chunkIndex,
    timestamp: Date.now()
  });
  
  console.log(`接收到chunk ${chunkIndex}，會話 ${sessionId}`);
  
  // 可選：實時處理partial結果
  let partialResult = null;
  if (session.chunks.length > 0) {
    // 這裡可以調用語音識別API獲取部分結果
    partialResult = await processPartialAudio(session);
  }
  
  res.json({
    success: true,
    chunkIndex,
    partialResult
  });
});

// 完成評估
app.post('/api/streaming-assessment/finalize', async (req, res) => {
  const { sessionId } = req.body;
  
  const session = streamingSessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ 
      success: false, 
      error: 'Session not found' 
    });
  }
  
  try {
    // 合併所有音頻chunks
    const combinedAudio = combineAudioChunks(session.chunks);
    
    // 調用Azure Speech API進行完整評估
    const result = await assessAudio(
      combinedAudio, 
      session.referenceText, 
      session.strictMode
    );
    
    // 清理會話
    streamingSessions.delete(sessionId);
    
    console.log(`完成streaming評估: ${sessionId}`);
    
    res.json({
      success: true,
      result
    });
    
  } catch (error) {
    console.error('Streaming評估失敗:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 輔助函數
async function processPartialAudio(session) {
  // 實現部分音頻處理邏輯
  // 可以調用Azure Speech-to-Text獲取實時識別結果
  return {
    recognizedText: "部分識別結果",
    confidence: 0.8
  };
}

function combineAudioChunks(chunks) {
  // 將所有base64音頻chunk合併成完整音頻
  const sortedChunks = chunks.sort((a, b) => a.index - b.index);
  const combinedBase64 = sortedChunks.map(chunk => chunk.data).join('');
  
  // 轉換為Buffer或Blob供Azure API使用
  return Buffer.from(combinedBase64, 'base64');
}

async function assessAudio(audioBuffer, referenceText, strictMode) {
  // 調用Azure Speech API進行完整評估
  // 返回評估結果
  return {
    accuracyScore: 85,
    fluencyScore: 78,
    completenessScore: 90,
    pronunciationScore: 82,
    NBest: [...],
    recognizedText: "評估文本"
  };
}

app.listen(3001, () => {
  console.log('Streaming語音評估服務啟動在端口 3001');
});
```

## 優勢

1. **實時處理**: 音頻數據邊錄邊傳，減少等待時間
2. **進度反饋**: 可以提供實時進度更新
3. **部分結果**: 可以顯示實時識別結果
4. **容錯性**: 如果streaming失敗，可以fallback到傳統模式
5. **帶寬優化**: 分塊傳輸，避免大文件上傳超時

## 注意事項

1. 需要在後端維護會話狀態
2. 要處理網絡中斷和重連
3. 音頻格式轉換和合併
4. 適當的錯誤處理和清理機制 