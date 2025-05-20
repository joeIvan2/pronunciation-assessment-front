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
    { tagId: "1", name: "IELTS8分", color: "#1e90ff", createdAt: 1747713791965 },
    { tagId: "2", name: "小學3年級", color: "#ff6347", createdAt: 1747715000000 },
    { tagId: "3", name: "國中2年級", color: "#3cb371", createdAt: 1747715000001 },
    { tagId: "4", name: "高中3年級", color: "#ffa500", createdAt: 1747715000002 },
    { tagId: "5", name: "IELTS7分", color: "#4682b4", createdAt: 1747716000000 },
    { tagId: "6", name: "IELTS9分", color: "#006400", createdAt: 1747716000001 }
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
  // 默認值 - 使用預設的示例數據（使用從0開始的ID避免與用戶添加的項目衝突）
  const defaultFavorites: Favorite[] = [
    {
      "id": "0",
      "text": "The philosophical implications of artificial intelligence challenge traditional concepts of consciousness.",
      "tagIds": ["6"],
      "createdAt": 1747716000600
    },
    {
      "id": "1",
      "text": "Advancements in nanotechnology enable unprecedented manipulation of matter at atomic scales.",
      "tagIds": ["6"],
      "createdAt": 1747716000500
    },
    {
      "id": "2",
      "text": "Socioeconomic disparities significantly impact access to quality education and healthcare.",
      "tagIds": ["1"],
      "createdAt": 1747716000400
    },
    {
      "id": "3",
      "text": "The confluence of quantum mechanics and relativity presents profound challenges in physics.",
      "tagIds": ["1"],
      "createdAt": 1747716000300
    },
    {
      "id": "4",
      "text": "Innovative renewable energy technologies are transforming global power generation.",
      "tagIds": ["5"],
      "createdAt": 1747716000200
    },
    {
      "id": "5",
      "text": "The intricate balance of ecosystems depends on biodiversity and environmental stability.",
      "tagIds": ["5"],
      "createdAt": 1747716000100
    },
    {
      "id": "6",
      "text": "Economic factors influence the supply and demand of goods in a marketplace.",
      "tagIds": ["4"],
      "createdAt": 1747715000600
    },
    {
      "id": "7",
      "text": "The theory of relativity changed how scientists understand time and space.",
      "tagIds": ["4"],
      "createdAt": 1747715000500
    },
    {
      "id": "8",
      "text": "Photosynthesis allows plants to convert sunlight into energy for growth.",
      "tagIds": ["3"],
      "createdAt": 1747715000400
    },
    {
      "id": "9",
      "text": "Water changes its state from liquid to solid when cooled below zero degrees Celsius.",
      "tagIds": ["3"],
      "createdAt": 1747715000300
    },
    {
      "id": "10",
      "text": "Birds can fly high in the sky and build nests in trees.",
      "tagIds": ["2"],
      "createdAt": 1747715000200
    },
    {
      "id": "11",
      "text": "The sun rises in the east and sets in the west every day.",
      "tagIds": ["2"],
      "createdAt": 1747715000100
    }
  ];

  const savedFavorites = localStorage.getItem('favorites');
  
  // 如果没有已保存的数据，返回默认值
  if (!savedFavorites) {
    return defaultFavorites;
  }
  
  // 檢查是否是舊版數據結構(字符串數組)
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
  
  // 如果解析出错，返回默认值
  return defaultFavorites;
};

// 保存收藏夹
export const saveFavorites = (favorites: Favorite[]): void => {
  setItem('favorites', favorites);
};

// 获取下一个收藏ID
export const getNextFavoriteId = (favorites: Favorite[]): number => {
  // 查找当前所有的ID（包括非数字ID和数字ID）
  const allIds = favorites.map(favorite => favorite.id);
  
  // 查找当前最大的数字ID（包括0和正整数）
  const maxNumericId = favorites.reduce((max, favorite) => {
    // 尝试将ID转换为整数
    const id = parseInt(favorite.id, 10);
    // 考虑包括0在内的所有非负整数ID
    if (!isNaN(id) && id >= 0 && id > max) {
      return id;
    }
    return max;
  }, -1); // 从-1开始，确保即使所有ID都是非数字，也会返回至少0
  
  // 从本地存储获取下一个ID值，默认为最大ID+1或12（默认示例数量）
  const storedNextId = getItem<number>('nextFavoriteId', Math.max(maxNumericId + 1, 12));
  
  // 确保生成的ID不会与任何现有ID冲突
  let nextId = Math.max(maxNumericId + 1, storedNextId);
  
  // 检查ID是否已存在（作为字符串），如果存在则递增
  while (allIds.includes(nextId.toString())) {
    nextId++;
  }
  
  return nextId;
};

// 保存下一个收藏ID
export const saveNextFavoriteId = (id: number): void => {
  // 先获取当前所有收藏
  const currentFavorites = getFavorites();
  
  // 查找当前最大的数字ID（包括0和正整数）
  const maxNumericId = currentFavorites.reduce((max, favorite) => {
    const favoriteId = parseInt(favorite.id, 10);
    if (!isNaN(favoriteId) && favoriteId >= 0 && favoriteId > max) {
      return favoriteId;
    }
    return max;
  }, -1); // 从-1开始，确保即使所有ID都是非数字，也会返回至少0
  
  // 确保保存的ID至少比当前最大ID大1
  const safeId = Math.max(id, maxNumericId + 1);
  
  setItem('nextFavoriteId', safeId);
};

// 卡片展开状态相关函数
type CardExpandState = {
  favoriteList: boolean;
  tagManager: boolean;
  voicePicker: boolean;
  historyRecord: boolean;
  shareData: boolean;
};

// 获取卡片展开状态
export const getCardExpandStates = (): CardExpandState => {
  return getItem<CardExpandState>('cardExpandStates', {
    favoriteList: true,
    tagManager: false,
    voicePicker: false,
    historyRecord: true,
    shareData: true
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
export type TabName = 'history' | 'favorites' | 'tags' | 'voices' | 'ai' | 'share';

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

// 分享數據相關功能
export interface ShareResponse {
  success: boolean;
  hash?: string;
  editPassword?: string;
  url?: string;
  error?: string;
}

export interface LoadResponse {
  success: boolean;
  data?: {
    favorites: Favorite[];
    tags: Tag[];
  };
  error?: string;
}

// 分享信息類型
export interface ShareInfo {
  hash: string;
  editPassword: string;
  url: string;
  timestamp: number;
}

// API基礎URL
const API_BASE_URL = 'https://pronunciation-ai-server.onrender.com';

// 分享當前的標籤和收藏數據
export const shareTagsAndFavorites = async (): Promise<ShareResponse> => {
  try {
    const tags = getTags();
    const favorites = getFavorites();
    
    const response = await fetch(`${API_BASE_URL}/api/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        favorites,
        tags
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '分享數據失敗');
    }
    
    return data;
  } catch (error) {
    console.error('分享數據出錯:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
};

// 從哈希值加載數據
export const loadFromHash = async (hash: string): Promise<LoadResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/load/${hash}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '加載數據失敗');
    }
    
    return data;
  } catch (error) {
    console.error('加載數據出錯:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
};

// 應用從服務器加載的數據
export const applyLoadedData = (data: { favorites: Favorite[]; tags: Tag[] }): void => {
  // 處理標籤 - 保持原有ID
  if (data.tags && Array.isArray(data.tags)) {
    saveTags(data.tags);
  }
  
  // 處理收藏項目 - 使用前綴確保ID不會衝突
  if (data.favorites && Array.isArray(data.favorites)) {
    const timestamp = Date.now();
    // 先获取现有收藏，用于后续ID处理
    const existingFavorites = getFavorites();
    
    const processedFavorites = data.favorites.map((fav, index) => {
      // 检查是否与现有收藏文本重复
      const isDuplicate = existingFavorites.some(existing => existing.text === fav.text);
      
      // 如果是重复项，跳过ID处理 - 保留现有收藏
      if (isDuplicate) {
        return null; // 将在后面过滤掉null项
      }
      
      // 檢查ID是否是數字格式的字符串
      const isNumericId = /^\d+$/.test(String(fav.id));
      
      // 如果是數字ID，將其替換為帶前綴的ID以避免衝突
      const newId = isNumericId 
        ? `api-${timestamp}-${index}` // 使用前綴和索引
        : (fav.id || `api-${timestamp}-${index}`);
        
      return {
        ...fav,
        id: newId
      };
    }).filter(item => item !== null); // 过滤掉null项（即重复项）
    
    // 如果有有效的处理结果，保存到收藏列表
    if (processedFavorites.length > 0) {
      // 将新处理的收藏项合并到现有收藏
      const mergedFavorites = [...existingFavorites, ...processedFavorites];
      saveFavorites(mergedFavorites);
      
      // 确保nextFavoriteId更新为最新值
      const maxId = getNextFavoriteId(mergedFavorites);
      saveNextFavoriteId(maxId);
    }
  }
};

// 更新已分享的數據
export const updateSharedData = async (
  hash: string, 
  password: string
): Promise<ShareResponse> => {
  try {
    const tags = getTags();
    const favorites = getFavorites();
    
    const response = await fetch(`${API_BASE_URL}/api/update/${hash}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          favorites,
          tags
        },
        password
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || '更新數據失敗');
    }
    
    return data;
  } catch (error) {
    console.error('更新數據出錯:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
};

// 獲取已保存的分享信息
export const getSavedShareInfo = (): ShareInfo[] => {
  return getItem<ShareInfo[]>('savedShareInfo', []);
};

// 保存分享信息
export const saveShareInfo = (info: Omit<ShareInfo, 'timestamp'>): void => {
  const shareInfos = getSavedShareInfo();
  const newInfo: ShareInfo = {
    ...info,
    timestamp: Date.now()
  };
  
  // 檢查是否已存在相同hash的信息，如果有則更新
  const index = shareInfos.findIndex(item => item.hash === info.hash);
  if (index !== -1) {
    shareInfos[index] = newInfo;
  } else {
    shareInfos.unshift(newInfo); // 添加到列表開頭
  }
  
  // 只保留最近的5個分享
  const updatedInfos = shareInfos.slice(0, 5);
  setItem('savedShareInfo', updatedInfos);
};

// 刪除已保存的分享信息
export const deleteShareInfo = (hash: string): void => {
  const shareInfos = getSavedShareInfo();
  const updatedInfos = shareInfos.filter(info => info.hash !== hash);
  setItem('savedShareInfo', updatedInfos);
}; 