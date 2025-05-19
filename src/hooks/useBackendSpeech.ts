import { useState } from 'react';
import { sendAssessmentRequest, sendTTSRequest } from '../utils/api';
import { blobToBase64 } from './useRecorder';
import { SpeechAssessmentResult } from '../types/speech';

interface BackendSpeechState {
  isLoading: boolean;
  error: string | null;
}

interface BackendSpeechResult extends BackendSpeechState {
  assessWithBackend: (
    audioBlob: Blob,
    referenceText: string,
    strictMode: boolean
  ) => Promise<SpeechAssessmentResult | null>;
  
  speakWithBackend: (text: string) => Promise<void>;
}

export const useBackendSpeech = (): BackendSpeechResult => {
  const [state, setState] = useState<BackendSpeechState>({
    isLoading: false,
    error: null
  });
  
  // 使用后端API进行语音评估
  const assessWithBackend = async (
    audioBlob: Blob,
    referenceText: string,
    strictMode: boolean
  ): Promise<SpeechAssessmentResult | null> => {
    if (state.isLoading) return null;
    
    try {
      setState({ isLoading: true, error: null });
      
      if (audioBlob.size === 0) {
        throw new Error('录音数据为空，请检查麦克风权限和设置');
      }
      
      // 将Blob转换为base64
      const base64Data = await blobToBase64(audioBlob);
      console.log(`音频转换为base64完成，数据长度: ${base64Data.length}`);
      
      // 发送到后端并处理响应
      const response = await sendAssessmentRequest(referenceText, base64Data, strictMode);
      const data = await response.json();
      console.log(`收到评分数据:`, data);
      
      if (data.accuracyScore === 0 && data.fluencyScore === 0 && 
          data.completenessScore === 0 && data.pronunciationScore === 0) {
        console.warn('警告: 所有分数都是0，可能音频处理有问题');
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
      console.error('处理录音失败:', err);
      setState({ 
        isLoading: false, 
        error: `后端API连接失败: ${err instanceof Error ? err.message : String(err)}` 
      });
      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  // 使用后端API进行文本转语音
  const speakWithBackend = async (text: string): Promise<void> => {
    try {
      if (!text) {
        throw new Error("請先輸入要發音的文字！");
      }
      
      setState({ isLoading: true, error: null });
      
      // 发送请求到后端
      const response = await sendTTSRequest(text);
      
      // 获取音频数据并播放
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (err) {
      console.error('文本转语音失败:', err);
      setState({ 
        isLoading: false, 
        error: `文本转语音失败: ${err instanceof Error ? err.message : String(err)}` 
      });
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };
  
  return {
    ...state,
    assessWithBackend,
    speakWithBackend
  };
}; 