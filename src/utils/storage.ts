// 本地存储工具函数

import { Tag, Favorite } from '../types/speech';

// 获取localStorage中的数据，返回默认值如果不存在
export const getItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (item === null) {
    return defaultValue;
  }
  
  try {
    return JSON.parse(item) as T;
  } catch (e) {
    // 如果是简单字符串，不需要JSON解析
    return item as unknown as T;
  }
};

// 设置localStorage中的数据
export const setItem = <T>(key: string, value: T): void => {
  if (typeof value === 'string') {
    localStorage.setItem(key, value);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// 获取参考文本
export const getReferenceText = (): string => {
  return getItem<string>('referenceText', 'Hello, how are you?');
};

// 保存参考文本
export const saveReferenceText = (text: string): void => {
  setItem('referenceText', text);
};

// 获取字体大小
export const getFontSize = (): number => {
  return getItem<number>('fontSize', 16);
};

// 保存字体大小
export const saveFontSize = (size: number): void => {
  setItem('fontSize', size);
};

// 获取严格模式设置
export const getStrictMode = (): boolean => {
  return getItem<boolean>('strictMode', true);
};

// 保存严格模式设置
export const saveStrictMode = (isStrict: boolean): void => {
  setItem('strictMode', isStrict);
};

// 获取API模式设置
export const getUseBackend = (): boolean => {
  return getItem<boolean>('useBackend', true);
};

// 保存API模式设置
export const saveUseBackend = (useBackend: boolean): void => {
  setItem('useBackend', useBackend);
};

// 获取Azure设置
export const getAzureSettings = (): { key: string; region: string } => {
  return {
    key: getItem<string>('azureKey', ''),
    region: getItem<string>('azureRegion', 'japanwest')
  };
};

// 保存Azure设置
export const saveAzureSettings = (key: string, region: string): void => {
  setItem('azureKey', key);
  setItem('azureRegion', region);
};

// 获取语音设置
export const getVoiceSettings = (): { 
  searchTerm: string; 
  rate: number;
  voiceName?: string;
  voiceLang?: string;
} => {
  return {
    searchTerm: getItem<string>('voiceSearchTerm', 'english'),
    rate: getItem<number>('speechRate', 1.0),
    voiceName: getItem<string>('selectedVoiceName', ''),
    voiceLang: getItem<string>('selectedVoiceLang', '')
  };
};

// 保存语音设置
export const saveVoiceSettings = (
  settings: { 
    searchTerm?: string; 
    rate?: number;
    voiceName?: string;
    voiceLang?: string;
  }
): void => {
  if (settings.searchTerm !== undefined) {
    setItem('voiceSearchTerm', settings.searchTerm);
  }
  if (settings.rate !== undefined) {
    setItem('speechRate', settings.rate);
  }
  if (settings.voiceName !== undefined) {
    setItem('selectedVoiceName', settings.voiceName);
  }
  if (settings.voiceLang !== undefined) {
    setItem('selectedVoiceLang', settings.voiceLang);
  }
};

// 获取标签
export const getTags = (): Tag[] => {
  return getItem<Tag[]>('tags', [
    { id: '1', name: '基礎句型', color: '#4caf50', createdAt: Date.now() },
    { id: '2', name: '商務英語', color: '#2196f3', createdAt: Date.now() },
    { id: '3', name: '日常對話', color: '#ff9800', createdAt: Date.now() },
    { id: '4', name: '難詞發音', color: '#9c27b0', createdAt: Date.now() }
  ]);
};

// 保存标签
export const saveTags = (tags: Tag[]): void => {
  setItem('tags', tags);
};

// 获取下一个标签ID
export const getNextTagId = (): number => {
  return getItem<number>('nextTagId', 5);
};

// 保存下一个标签ID
export const saveNextTagId = (id: number): void => {
  setItem('nextTagId', id);
};

// 获取收藏夹
export const getFavorites = (): Favorite[] => {
  const savedFavorites = localStorage.getItem('favorites');
  
  // 检查是否是旧版数据结构(字符串数组)
  if (savedFavorites) {
    try {
      const parsed = JSON.parse(savedFavorites);
      if (Array.isArray(parsed)) {
        // 旧版数据
        if (typeof parsed[0] === 'string') {
          // 将旧版字符串数组转换为新结构
          return parsed.map((text, index) => ({
            id: (index + 1).toString(),
            text: text,
            tagIds: [],
            createdAt: Date.now() - (parsed.length - index) * 1000 // 按顺序创建时间
          }));
        }
        // 已经是新版数据结构
        return parsed;
      }
    } catch (e) {
      console.error('解析收藏夹数据出错:', e);
    }
  }
  
  // 默认值
  return [];
};

// 保存收藏夹
export const saveFavorites = (favorites: Favorite[]): void => {
  setItem('favorites', favorites);
};

// 获取下一个收藏ID
export const getNextFavoriteId = (favorites: Favorite[]): number => {
  return getItem<number>('nextFavoriteId', favorites.length > 0 ? favorites.length + 1 : 1);
};

// 保存下一个收藏ID
export const saveNextFavoriteId = (id: number): void => {
  setItem('nextFavoriteId', id);
}; 