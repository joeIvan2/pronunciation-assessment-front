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
  const saved = localStorage.getItem('fontSize');
  return saved ? parseInt(saved, 10) : 16; // 默認值為16px
};

// 保存字体大小
export const saveFontSize = (size: number) => {
  localStorage.setItem('fontSize', size.toString());
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
  const defaultTags: Tag[] = [
    { tagId: '1', name: '基礎句型', color: '#4caf50', createdAt: Date.now() },
    { tagId: '2', name: '商務英語', color: '#2196f3', createdAt: Date.now() },
    { tagId: '3', name: '日常對話', color: '#ff9800', createdAt: Date.now() },
    { tagId: '4', name: '難詞發音', color: '#9c27b0', createdAt: Date.now() }
  ];

  return getItem<Tag[]>('tags', defaultTags);
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
  
  // 檢查是否是舊版數據結構(字符串數組)
  if (savedFavorites) {
    try {
      const parsed = JSON.parse(savedFavorites);
      if (Array.isArray(parsed)) {
        // 舊版字符串陣列
        if (typeof parsed[0] === 'string') {
          // 將舊版字符串數組轉換為新結構
          return parsed.map((text, index) => ({
            id: (index + 1).toString(),
            text: text,
            tagIds: [],
            createdAt: Date.now() - (parsed.length - index) * 1000 // 按順序創建時間
          }));
        }
        
        // 如果是對象陣列但缺少 tagIds (可能字段名為 tags)
        const normalized = parsed.map((fav: any) => {
          // 標準化 tagIds/tags 欄位
          if (!fav.tagIds) {
            if (Array.isArray(fav.tags)) {
              // 將 tags 轉換為 tagIds
              return {
                ...fav,
                tagIds: fav.tags,
              };
            } else {
              // 兩個欄位都不存在或不是陣列，設置默認值
              return {
                ...fav,
                tagIds: [],
              };
            }
          }
          
          // 確保 tagIds 是陣列
          if (!Array.isArray(fav.tagIds)) {
            return {
              ...fav,
              tagIds: [],
            };
          }
          
          return fav;
        });
        
        // 根據創建時間排序，最新的排在前面
        const sortedFavorites = [...normalized].sort((a, b) => {
          // 確保 createdAt 是數字類型，如果不是則使用默認值
          const createdAtA = typeof a.createdAt === 'number' ? a.createdAt : 0;
          const createdAtB = typeof b.createdAt === 'number' ? b.createdAt : 0;
          return createdAtB - createdAtA; // 降序排列，最新的在前
        });
        
        return sortedFavorites;
      }
    } catch (e) {
      console.error('解析收藏夾數據出錯:', e);
    }
  }
  
  // 默認值
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

// 卡片展开状态相关函数
type CardExpandState = {
  favoriteList: boolean;
  tagManager: boolean;
  voicePicker: boolean;
  historyRecord: boolean;
};

// 获取卡片展开状态
export const getCardExpandStates = (): CardExpandState => {
  return getItem<CardExpandState>('cardExpandStates', {
    favoriteList: true,
    tagManager: false,
    voicePicker: false,
    historyRecord: true
  });
};

// 保存单个卡片展开状态
export const saveCardExpandState = (cardName: keyof CardExpandState, isExpanded: boolean): void => {
  const states = getCardExpandStates();
  states[cardName] = isExpanded;
  setItem('cardExpandStates', states);
};

// 历史记录相关类型和函数
export interface HistoryItem {
  id: string;
  text: string;
  scoreAccuracy: number;
  scoreFluency: number;
  scoreCompleteness: number;
  scorePronunciation: number;
  timestamp: number;
  recognizedText?: string;
  words?: any[]; // 添加单词评分数据字段
}

// 获取历史记录
export const getHistoryRecords = (): HistoryItem[] => {
  return getItem<HistoryItem[]>('historyRecords', []);
};

// 保存历史记录
export const saveHistoryRecords = (records: HistoryItem[]): void => {
  setItem('historyRecords', records);
};

// 添加历史记录
export const addHistoryRecord = (record: Omit<HistoryItem, 'id' | 'timestamp'>): void => {
  const records = getHistoryRecords();
  const newRecord: HistoryItem = {
    ...record,
    id: Date.now().toString(),
    timestamp: Date.now()
  };
  
  // 限制历史记录数量，只保留最近的20条
  const updatedRecords = [newRecord, ...records].slice(0, 20);
  saveHistoryRecords(updatedRecords);
};

// 删除单个历史记录
export const deleteHistoryRecord = (id: string): void => {
  const records = getHistoryRecords();
  const updatedRecords = records.filter(record => record.id !== id);
  saveHistoryRecords(updatedRecords);
};

// 清空历史记录
export const clearHistoryRecords = (): void => {
  saveHistoryRecords([]);
};

// 标签页相关类型和函数
export type TabName = 'history' | 'favorites' | 'tags' | 'voices' | 'ai';

// 获取当前激活的标签页
export const getActiveTab = (): TabName => {
  return getItem<TabName>('activeTab', 'history');
};

// 保存当前激活的标签页
export const saveActiveTab = (tab: TabName): void => {
  setItem('activeTab', tab);
};

// 获取 AI 助手提示文字
export const getAIPrompt = (): string => {
  // 首选获取新的键，如果不存在则检查旧的键
  const saved = localStorage.getItem('aiPrompt');
  if (saved !== null) {
    return saved;
  }
  
  // 旧版本的键名
  return getItem<string>('AIPrompt', '');
};

// 保存 AI 助手提示文字
export const saveAIPrompt = (prompt: string): void => {
  setItem('aiPrompt', prompt);
};

// 获取AI响应
export const getAIResponse = (): string | null => {
  return getItem<string | null>('aiResponse', null);
};

// 保存AI响应
export const saveAIResponse = (response: string | null): void => {
  setItem('aiResponse', response);
}; 