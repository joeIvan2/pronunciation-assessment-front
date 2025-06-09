// 語音配置集中管理
export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female';
}

// nicetone.ai 支援的語音選項配置
export const VOICE_OPTIONS: VoiceOption[] = [
  // 女性聲音
  { id: 'heart', name: 'Heart', description: 'Heart 女性聲音', gender: 'female' },
  { id: 'sky', name: 'Sky', description: 'Sky 女性聲音', gender: 'female' },
  { id: 'bella', name: 'Bella', description: 'Bella 女性聲音', gender: 'female' },
  { id: 'nicole', name: 'Nicole', description: 'Nicole 女性聲音', gender: 'female' },
  { id: 'sarah', name: 'Sarah', description: 'Sarah 女性聲音', gender: 'female' },
  // 男性聲音
  { id: 'adam', name: 'Adam', description: 'Adam 男性聲音', gender: 'male' },
  { id: 'michael', name: 'Michael', description: 'Michael 男性聲音', gender: 'male' }
];

// 預設語音
export const DEFAULT_VOICE = 'heart';

// 語速範圍
export const SPEED_RANGE = {
  min: 0.5,
  max: 2.0,
  default: 1.0,
  step: 0.1
};

// 獲取語音選項的輔助函數
export const getVoiceOptions = () => VOICE_OPTIONS;

