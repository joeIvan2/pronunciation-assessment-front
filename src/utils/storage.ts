// 本地存储工具函数

import { Tag, Favorite } from '../types/speech';
import { AI_SERVER_URL } from './api'; // 從api.ts導入常量
import { DEFAULT_VOICE } from '../config/voiceConfig'; // 導入預設語音配置
import { auth } from '../config/firebaseConfig';
import { isUserLoggedIn } from './authStatus';

// 获取localStorage中的数据，返回默认值如果不存在
export const getItem = <T>(key: string, defaultValue: T): T => {
  if (!isUserLoggedIn()) {
    return defaultValue;
  }

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
  if (!isUserLoggedIn()) {
    return;
  }

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

// 获取字体大小（不受登入狀態限制）
export const getFontSize = (): number => {
  const item = localStorage.getItem('fontSize');
  if (item === null) {
    return 16; // 預設值
  }
  try {
    return JSON.parse(item) as number;
  } catch {
    return 16;
  }
};

// 保存字体大小（不受登入狀態限制）
export const saveFontSize = (size: number) => {
  localStorage.setItem('fontSize', JSON.stringify(size));
};

// 获取textarea高度

// 获取严格模式设置
export const getStrictMode = (): boolean => {
  return getItem<boolean>('strictMode', true);
};

// 保存严格模式设置

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

// 获取语音设置（不受登入狀態限制）
export const getVoiceSettings = (): { 
  searchTerm: string; 
  rate: number;
  voiceName?: string;
  voiceLang?: string;
} => {
  const getLocalItem = (key: string, defaultValue: any) => {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    try {
      return JSON.parse(item);
    } catch {
      return item; // 如果解析失敗，返回字串
    }
  };

  return {
    searchTerm: getLocalItem('voiceSearchTerm', 'english'),
    rate: getLocalItem('speechRate', 1.0),
    voiceName: getLocalItem('selectedVoiceName', ''),
    voiceLang: getLocalItem('selectedVoiceLang', '')
  };
};

// 保存语音设置（不受登入狀態限制）
export const saveVoiceSettings = (
  settings: { 
    searchTerm?: string; 
    rate?: number;
    voiceName?: string;
    voiceLang?: string;
  }
): void => {
  if (settings.searchTerm !== undefined) {
    localStorage.setItem('voiceSearchTerm', JSON.stringify(settings.searchTerm));
  }
  if (settings.rate !== undefined) {
    localStorage.setItem('speechRate', JSON.stringify(settings.rate));
  }
  if (settings.voiceName !== undefined) {
    localStorage.setItem('selectedVoiceName', JSON.stringify(settings.voiceName));
  }
  if (settings.voiceLang !== undefined) {
    localStorage.setItem('selectedVoiceLang', JSON.stringify(settings.voiceLang));
  }
};

// 获取标签
export const getTags = (): Tag[] => {
  const defaultTags: Tag[] = [
    { tagId: "1", name: "範例標籤", color: "#1e90ff", createdAt: 1747713791965 }
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
  // 默認值 - 使用預設的示例數據（使用從0開始的ID避免與用戶新增的項目衝突）
  const defaultFavorites: Favorite[] = [
    {
      id: "0",
      text: "Hi, How are you?",
      tagIds: ["1"],
      createdAt: Date.now()
    }
  ];

  if (!isUserLoggedIn()) {
    return defaultFavorites;
  }

  // 登入使用者的收藏將從 Firestore 載入
  // 若 Firestore 載入為空，回傳預設句子
  // 這裡假設 Firestore 載入邏輯會覆蓋本地收藏
  const userFavorites: Favorite[] = [];
  return userFavorites.length === 0 ? defaultFavorites : userFavorites;
};

// 保存收藏夹
// 保存收藏夹（不再寫入 localStorage）
export const saveFavorites = (_favorites: Favorite[]): void => {
  // Firestore 同步在頁面中處理，這裡保留函式接口以維持兼容
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
  
  // 不再讀取 localStorage，直接根據現有收藏計算
  let nextId = maxNumericId + 1;

  if (nextId < 0) {
    nextId = 0;
  }
  
  // 检查ID是否已存在（作为字符串），如果存在则递增
  while (allIds.includes(nextId.toString())) {
    nextId++;
  }
  
  return nextId;
};

// 保存下一个收藏ID
export const saveNextFavoriteId = (_id: number): void => {
  // 不再保存到 localStorage
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
  words?: any[]; // 新增单词评分数据字段
}

// 壓縮後的歷史記錄結構，使用更短的欄位名稱以節省空間
interface CompressedHistoryItem {
  a: string; // id
  b: string; // text
  c: number; // scoreAccuracy
  d: number; // scoreFluency
  e: number; // scoreCompleteness
  f: number; // scorePronunciation
  g: number; // timestamp
  h?: string; // recognizedText
  i?: any[]; // words
}

const compressHistoryItem = (item: HistoryItem): CompressedHistoryItem => ({
  a: item.id,
  b: item.text,
  c: item.scoreAccuracy,
  d: item.scoreFluency,
  e: item.scoreCompleteness,
  f: item.scorePronunciation,
  g: item.timestamp,
  h: item.recognizedText,
  i: item.words
});

const decompressHistoryItem = (data: any): HistoryItem => ({
  id: data.a ?? data.id,
  text: data.b ?? data.text,
  scoreAccuracy: data.c ?? data.scoreAccuracy,
  scoreFluency: data.d ?? data.scoreFluency,
  scoreCompleteness: data.e ?? data.scoreCompleteness,
  scorePronunciation: data.f ?? data.scorePronunciation,
  timestamp: data.g ?? data.timestamp,
  recognizedText: data.h ?? data.recognizedText,
  words: data.i ?? data.words
});

const saveHistoryRecordsToStorage = (records: HistoryItem[]): void => {
  const compressed = records.map(compressHistoryItem);
  setItem('historyRecords', compressed);
};

// 获取历史记录
export const getHistoryRecords = (): HistoryItem[] => {
  const raw = getItem<any[]>('historyRecords', []);
  if (Array.isArray(raw) && raw.length > 0 && (raw[0].a !== undefined || raw[0].b !== undefined)) {
    return raw.map(item => decompressHistoryItem(item));
  }
  return raw as HistoryItem[];
};

// 保存历史记录

// 新增历史记录
export const addHistoryRecord = (record: Omit<HistoryItem, 'id' | 'timestamp'>): void => {
  const records = getHistoryRecords();
  const newRecord: HistoryItem = {
    ...record,
    id: Date.now().toString(),
    timestamp: Date.now()
  };

  // 限制历史记录数量，只保留最近的20条
  const updatedRecords = [newRecord, ...records].slice(0, 20);
  saveHistoryRecordsToStorage(updatedRecords);
};

// 删除单个历史记录
export const deleteHistoryRecord = (id: string): void => {
  const records = getHistoryRecords();
  const updatedRecords = records.filter(record => record.id !== id);
  saveHistoryRecordsToStorage(updatedRecords);
};

// 刪除歷史記錄（支援Firebase同步）
export const deleteHistoryRecordWithSync = async (id: string, uid?: string): Promise<void> => {
  const records = getHistoryRecords();
  const updatedRecords = records.filter(record => record.id !== id);
  saveHistoryRecordsToStorage(updatedRecords);
  
  // 如果用戶已登入，同步到Firebase
  if (uid) {
    try {
      const { saveUserHistoryRecords } = await import('./firebaseStorage');
      await saveUserHistoryRecords(uid, updatedRecords);
      console.log('歷史記錄刪除已同步到Firebase');
    } catch (error) {
      console.error('同步歷史記錄刪除失敗:', error);
    }
  }
};

// 清空历史记录
export const clearHistoryRecords = (): void => {
  saveHistoryRecordsToStorage([]);
};

// 清空歷史記錄（支援Firebase同步）
export const clearHistoryRecordsWithSync = async (uid?: string): Promise<void> => {
  saveHistoryRecordsToStorage([]);
  
  // 如果用戶已登入，同步到Firebase
  if (uid) {
    try {
      const { saveUserHistoryRecords } = await import('./firebaseStorage');
      await saveUserHistoryRecords(uid, []);
      console.log('歷史記錄清空已同步到Firebase');
    } catch (error) {
      console.error('同步歷史記錄清空失敗:', error);
    }
  }
};

// 标签页相关类型和函数
export type TabName = 'history' | 'favorites' | 'tags' | 'voices' | 'ai' | 'share' | 'input';
export type TopTabName = 'input' | 'ai';
export type BottomTabName = 'history' | 'favorites' | 'voices';

// 获取顶部标签页
export const getTopActiveTab = (): TopTabName => {
  return getItem<TopTabName>('topActiveTab', 'input');
};

// 保存顶部标签页
export const saveTopActiveTab = (tab: TopTabName): void => {
  setItem('topActiveTab', tab);
};

// 获取底部标签页
export const getBottomActiveTab = (): BottomTabName => {
  return getItem<BottomTabName>('bottomActiveTab', 'favorites');
};

// 保存底部标签页
export const saveBottomActiveTab = (tab: BottomTabName): void => {
  setItem('bottomActiveTab', tab);
};

// 获取 AI 助理提示文字
export const getAIPrompt = (): string => {
  // 首选获取新的键，如果不存在则检查旧的键
  if (isUserLoggedIn()) {
    const saved = localStorage.getItem('aiPrompt');
    if (saved !== null) {
      return saved;
    }
  }
  
  // 旧版本的键名
  return getItem<string>('AIPrompt', '');
};

// 保存 AI 助理提示文字
export const saveAIPrompt = (prompt: string): void => {
  setItem('aiPrompt', prompt);
};

// 获取AI响应
export const getAIResponse = (): string | null => {
  try {
    if (!isUserLoggedIn()) {
      return null;
    }

    const item = localStorage.getItem('aiResponse');
    if (item === null) {
      return null;
    }
    
    // 确保返回的是字符串类型
    return item;
  } catch (e) {
    console.error('获取AI响应出错:', e);
    return null;
  }
};

// 保存AI响应
export const saveAIResponse = (response: string | null): void => {
  try {
    if (!isUserLoggedIn()) {
      return;
    }

    if (response === null) {
      localStorage.removeItem('aiResponse');
      return;
    }
    
    // 如果response是对象，将其转换为字符串
    if (typeof response === 'object') {
      localStorage.setItem('aiResponse', JSON.stringify(response));
    } else {
      localStorage.setItem('aiResponse', response);
    }
  } catch (e) {
    console.error('保存AI响应出错:', e);
  }
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
const API_BASE_URL = AI_SERVER_URL; // 使用導入的常量

// 檢查URL是否有效（不是blob URL，並且是有效的HTTP或相對路徑）
export const isValidURL = (url: string): boolean => {
  // 不緩存blob URL，因為它們在頁面刷新後無效
  if (url.startsWith('blob:')) {
    return false;
  }
  
  // 檢查是否是絕對URL或相對路徑
  return url.startsWith('http') || url.startsWith('/');
};

// 分享當前的標籤和收藏數據
export const shareTagsAndFavorites = async (
  tags?: Tag[], 
  favorites?: Favorite[], 
  uid?: string, 
  customShareId?: string
): Promise<ShareResponse> => {
  try {
    const tagsToShare = tags || getTags();
    const favoritesToShare = favorites || getFavorites();
    
    // 動態導入Firebase存儲服務
    const { shareTagsAndFavorites: firebaseShare } = await import('./firebaseStorage');
    const result = await firebaseShare(tagsToShare, favoritesToShare, uid, customShareId);
    
    // 生成分享URL - 使用新的路徑格式
    const { generateShareUrls } = await import('./urlUtils');
    const { modern } = generateShareUrls(result.shareId);
    
    return {
      success: true,
      hash: result.shareId,
      editPassword: result.editPassword,
      url: modern
    };
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
    // 動態導入Firebase存儲服務
    const { loadFromHash: firebaseLoad } = await import('./firebaseStorage');
    const result = await firebaseLoad(hash);
    
    if (result) {
      return {
        success: true,
        data: result
      };
    } else {
      return {
        success: false,
        error: '找不到指定的分享數據'
      };
    }
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
    }
  }
};

// 更新已分享的數據
export const updateSharedData = async (
  hash: string, 
  password: string,
  uid?: string
): Promise<ShareResponse> => {
  try {
    const tags = getTags();
    const favorites = getFavorites();
    
    // 動態導入Firebase存儲服務
    const { updateSharedData: firebaseUpdate } = await import('./firebaseStorage');
    await firebaseUpdate(hash, password, tags, favorites, uid);
    
    return {
      success: true,
      hash
    };
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
    shareInfos.unshift(newInfo); // 新增到列表開頭
  }
  
  // 只保留最近的5個分享
  const updatedInfos = shareInfos.slice(0, 5);
  setItem('savedShareInfo', updatedInfos);
};

// 從Firebase同步分享歷史到本地存儲
export const syncShareHistoryFromFirebase = async (uid: string): Promise<void> => {
  if (!uid) return;
  
  try {
    // 動態導入Firebase函數
    const { loadUserProfile } = await import('./firebaseStorage');
    const userProfile = await loadUserProfile(uid);
    
    if (userProfile && userProfile.shareHistory) {
      // 轉換Firebase格式到本地格式
      const localShareHistory: ShareInfo[] = userProfile.shareHistory.map((item: any) => ({
        hash: item.shareId,
        editPassword: item.editPassword,
        url: `${window.location.origin}/practice/${item.shareId}`, // 使用新的URL格式
        timestamp: typeof item.createdAt === 'number' ? item.createdAt : Date.now()
      }));
      
      // 更新本地存儲
      setItem('savedShareInfo', localShareHistory);
      console.log('分享歷史已從Firebase同步到本地:', localShareHistory.length);
    }
  } catch (error) {
    console.error('同步分享歷史失敗:', error);
  }
};

// 將本地分享歷史同步到Firebase
export const syncShareHistoryToFirebase = async (uid: string): Promise<void> => {
  if (!uid) return;
  
  try {
    const localShareHistory = getSavedShareInfo();
    if (localShareHistory.length === 0) return;
    
    // 動態導入Firebase函數
    const { loadUserProfile, saveShareToUserHistory } = await import('./firebaseStorage');
    
    // 先載入Firebase中現有的分享歷史
    const userProfile = await loadUserProfile(uid);
    const existingShareIds = new Set(
      (userProfile?.shareHistory || []).map((item: any) => item.shareId)
    );
    
    // 只同步Firebase中不存在的記錄
    const newShareHistory = localShareHistory.filter(
      shareInfo => !existingShareIds.has(shareInfo.hash)
    );
    
    // 將新的分享歷史同步到Firebase
    for (const shareInfo of newShareHistory) {
      try {
        await saveShareToUserHistory(uid, shareInfo.hash, shareInfo.editPassword);
      } catch (error) {
        console.warn(`同步分享記錄失敗: ${shareInfo.hash}`, error);
      }
    }
    
    console.log(`分享歷史已同步到Firebase: ${newShareHistory.length}/${localShareHistory.length} 筆新記錄`);
  } catch (error) {
    console.error('同步分享歷史到Firebase失敗:', error);
  }
};

// 刪除已保存的分享信息
export const deleteShareInfo = (hash: string): void => {
  const shareInfos = getSavedShareInfo();
  const updatedInfos = shareInfos.filter(info => info.hash !== hash);
  setItem('savedShareInfo', updatedInfos);
};

// 刪除分享信息（支援Firebase同步）
export const deleteShareInfoWithSync = async (hash: string, uid?: string): Promise<void> => {
  const shareInfos = getSavedShareInfo();
  const updatedInfos = shareInfos.filter(info => info.hash !== hash);
  setItem('savedShareInfo', updatedInfos);
  
  // 如果用戶已登入，需要更新Firebase中的分享歷史
  if (uid) {
    try {
      // 先載入用戶資料
      const { loadUserProfile } = await import('./firebaseStorage');
      const userProfile = await loadUserProfile(uid);
      
      if (userProfile && userProfile.shareHistory) {
        // 從Firebase分享歷史中移除指定的記錄
        const updatedFirebaseHistory = userProfile.shareHistory.filter(
          (item: any) => item.shareId !== hash
        );
        
        // 更新用戶資料
        const { setDoc, doc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../config/firebaseConfig');
        
        const userDocRef = doc(db, 'users', uid);
        await setDoc(userDocRef, {
          ...userProfile,
          shareHistory: updatedFirebaseHistory,
          updatedAt: serverTimestamp()
        }, { merge: true });
        
        console.log('分享歷史刪除已同步到Firebase:', hash);
      }
    } catch (error) {
      console.error('同步分享歷史刪除失敗:', error);
    }
  }
};

// 获取AI语音设置（不受登入狀態限制）
export const getAIVoice = (): string => {
  const item = localStorage.getItem('selectedAIVoice');
  if (item === null) {
    return DEFAULT_VOICE; // 預設值
  }
  try {
    return JSON.parse(item) as string;
  } catch {
    return item; // 如果解析失敗，返回字串
  }
};

// 保存AI语音设置（不受登入狀態限制）
export const saveAIVoice = (voice: string): void => {
  localStorage.setItem('selectedAIVoice', JSON.stringify(voice));
};

// TTS缓存相关类型和函数
