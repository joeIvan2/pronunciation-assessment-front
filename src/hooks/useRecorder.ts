import { useState, useRef } from 'react';

interface RecorderState {
  recording: boolean;
  audioData: Blob | null;
  error: string | null;
  streamingActive: boolean; // 新增streaming狀態
}

interface RecorderResult extends RecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
  // 新增streaming相關方法
  startStreamingRecording: (onDataChunk: (chunk: Blob) => void) => Promise<void>;
  stopStreamingRecording: () => void;
}

export const useRecorder = (): RecorderResult => {
  const [state, setState] = useState<RecorderState>({
    recording: false,
    audioData: null,
    error: null,
    streamingActive: false
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderTimerRef = useRef<number | null>(null);
  const streamingCallbackRef = useRef<((chunk: Blob) => void) | null>(null);
  const MAX_RECORDING_TIME = 30000; // 最大录音时长30秒
  const STREAMING_INTERVAL = 500; // streaming間隔時間(毫秒)
  
  const resetRecording = () => {
    setState({
      recording: false,
      audioData: null,
      error: null,
      streamingActive: false
    });
    audioChunksRef.current = [];
    streamingCallbackRef.current = null;
  };

  // 新增streaming錄音功能
  const startStreamingRecording = async (onDataChunk: (chunk: Blob) => void) => {
    try {
      resetRecording();
      setState(prev => ({ 
        ...prev, 
        recording: true, 
        streamingActive: true 
      }));
      
      streamingCallbackRef.current = onDataChunk;
      
      // 开始录音，使用更高的采样率和比特率
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // 使用更高质量的录音配置
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log(`收到音频数据块: ${e.data.size} 字節`);
          audioChunksRef.current.push(e.data);
          
          // 實時發送數據塊
          if (streamingCallbackRef.current) {
            streamingCallbackRef.current(e.data);
          }
        }
      };
      
      mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log(`录音完成，总大小: ${audioBlob.size} 字節`);
          
          setState(prev => ({
            ...prev,
            recording: false,
            streamingActive: false,
            audioData: audioBlob,
            error: null
          }));
          
          // 关闭麦克风
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        } catch (err) {
          console.error('处理录音失败:', err);
          setState({
            recording: false,
            audioData: null,
            error: `处理录音失败: ${err instanceof Error ? err.message : String(err)}`,
            streamingActive: false
          });
        }
      };
      
      // 每STREAMING_INTERVAL毫秒触发一次数据事件，用於實時streaming
      mediaRecorder.start(STREAMING_INTERVAL);
      console.log(`开始streaming录音... (間隔: ${STREAMING_INTERVAL}ms)`);
      
      // 设置最大录音时长
      if (recorderTimerRef.current) {
        window.clearTimeout(recorderTimerRef.current);
      }
      
      recorderTimerRef.current = window.setTimeout(() => {
        console.log(`录音达到最大时长 ${MAX_RECORDING_TIME/1000} 秒，自动停止`);
        stopStreamingRecording();
      }, MAX_RECORDING_TIME);
      
    } catch (err) {
      console.error('启动streaming录音失败:', err);
      setState({
        recording: false,
        audioData: null,
        error: `启动streaming录音失败: ${err instanceof Error ? err.message : String(err)}`,
        streamingActive: false
      });
    }
  };

  const stopStreamingRecording = () => {
    // 清除录音计时器
    if (recorderTimerRef.current) {
      window.clearTimeout(recorderTimerRef.current);
      recorderTimerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // 关闭录音器
      mediaRecorderRef.current.stop();
    } else {
      console.warn('嘗試停止未運行的streaming錄音機');
      
      setState(prev => ({
        ...prev,
        recording: false,
        streamingActive: false
      }));
      
      // 關閉媒體流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };
  
  const startRecording = async () => {
    try {
      resetRecording();
      setState(prev => ({ ...prev, recording: true }));
      
      // 开始录音，使用更高的采样率和比特率
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // 使用更高质量的录音配置
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          console.log(`收到音频数据块: ${e.data.size} 字节`);
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log(`录音完成，总大小: ${audioBlob.size} 字节`);
          
          if (audioBlob.size === 0) {
            throw new Error('录音数据为空，请检查麦克风权限和设置');
          }
          
          setState({
            recording: false,
            audioData: audioBlob,
            error: null,
            streamingActive: false
          });
          
          // 关闭麦克风
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
          }
        } catch (err) {
          console.error('处理录音失败:', err);
          setState({
            recording: false,
            audioData: null,
            error: `处理录音失败: ${err instanceof Error ? err.message : String(err)}`,
            streamingActive: false
          });
        }
      };
      
      // 每秒触发一次数据事件，避免录音被中断时丢失数据
      mediaRecorder.start(1000); // 每1000毫秒(1秒)触发一次ondataavailable事件
      console.log('开始录音...');
      
      // 设置最大录音时长
      if (recorderTimerRef.current) {
        window.clearTimeout(recorderTimerRef.current);
      }
      
      recorderTimerRef.current = window.setTimeout(() => {
        console.log(`录音达到最大时长 ${MAX_RECORDING_TIME/1000} 秒，自动停止`);
        stopRecording();
      }, MAX_RECORDING_TIME);
      
    } catch (err) {
      console.error('启动录音失败:', err);
      setState({
        recording: false,
        audioData: null,
        error: `启动录音失败: ${err instanceof Error ? err.message : String(err)}`,
        streamingActive: false
      });
    }
  };
  
  const stopRecording = () => {
    // 清除录音计时器
    if (recorderTimerRef.current) {
      window.clearTimeout(recorderTimerRef.current);
      recorderTimerRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // 关闭录音器
      mediaRecorderRef.current.stop();
    } else {
      console.warn('嘗試停止未運行的錄音機');
      
      // 如果mediaRecorder不存在或未在錄製，仍然嘗試清理狀態
      setState({
        recording: false,
        audioData: null,
        error: null,
        streamingActive: false
      });
      
      // 關閉媒體流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };
  
  return {
    ...state,
    startRecording,
    stopRecording,
    resetRecording,
    startStreamingRecording,
    stopStreamingRecording
  };
};

// 将Blob转为base64
export const blobToBase64 = async (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        if (!reader.result) {
          throw new Error('转换结果为空');
        }
        // 获取base64数据（去掉data:audio/webm;base64,前缀）
        const result = reader.result as string;
        const base64Result = result.split(',')[1];
        resolve(base64Result);
      } catch (err) {
        reject(new Error(`音频数据处理失败: ${err instanceof Error ? err.message : String(err)}`));
      }
    };
    reader.onerror = () => reject(new Error('读取音频文件失败'));
    reader.readAsDataURL(blob);
  });
}; 