import { useState, useRef } from 'react';

interface RecorderState {
  recording: boolean;
  audioData: Blob | null;
  error: string | null;
}

interface RecorderResult extends RecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetRecording: () => void;
}

export const useRecorder = (): RecorderResult => {
  const [state, setState] = useState<RecorderState>({
    recording: false,
    audioData: null,
    error: null
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  
  const resetRecording = () => {
    setState({
      recording: false,
      audioData: null,
      error: null
    });
    audioChunksRef.current = [];
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
            error: null
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
            error: `处理录音失败: ${err instanceof Error ? err.message : String(err)}`
          });
        }
      };
      
      // 更改为只在停止录音时传送数据，避免中间多次触发
      mediaRecorder.start();
      console.log('开始录音...');
      
    } catch (err) {
      console.error('启动录音失败:', err);
      setState({
        recording: false,
        audioData: null,
        error: `启动录音失败: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // 关闭录音器
      mediaRecorderRef.current.stop();
    } else {
      console.warn('嘗試停止未運行的錄音機');
      
      // 如果mediaRecorder不存在或未在錄製，仍然嘗試清理狀態
      setState({
        recording: false,
        audioData: null,
        error: null
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
    resetRecording
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