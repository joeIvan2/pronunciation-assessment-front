import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  serverTimestamp,
  enableNetwork
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Favorite, Tag } from '../types/speech';
import {
  compressHistoryItem,
  decompressHistoryItem,
  CompressedHistoryItem
} from './storage';

// 生成隨機ID (5位小寫英文加數字)
const generateId = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// 生成編輯密碼
const generatePassword = (): string => {
  return Math.random().toString(36).substr(2, 12);
};

// 處理 Target ID 衝突，返回 true 表示需要重試
const handleTargetIdConflict = async (error: any): Promise<boolean> => {
  if (
    error?.code === 'already-exists' ||
    (error instanceof Error && error.message.includes('Target ID'))
  ) {
    console.log('Firebase Target ID 衝突，等待後重試...');
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    return true;
  }
  return false;
};

// 重試機制
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; ) {
    try {
      return await operation();
    } catch (error) {
      if (await handleTargetIdConflict(error)) {
        continue;
      }

      console.warn(`操作失敗，重試 ${i + 1}/${maxRetries}:`, error);
      i++;
      if (i === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay * i));
    }
  }
  throw new Error('重試次數已用盡');
};

// 網路連接狀態追蹤
let isNetworkEnabled = false;
let networkPromise: Promise<void> | null = null;

// 檢查網路連接
const checkNetworkConnection = async (): Promise<void> => {
  // 如果已經啟用或正在啟用中，直接返回
  if (isNetworkEnabled) {
    return;
  }
  
  // 如果正在啟用中，等待完成
  if (networkPromise) {
    return await networkPromise;
  }
  
  // 創建新的啟用承諾
  networkPromise = (async () => {
    try {
      await enableNetwork(db);
      isNetworkEnabled = true;
      console.log('Firebase 網路連接已啟用');
    } catch (error) {
      // 如果錯誤是因為已經啟用，則忽略
      if (error instanceof Error && error.message.includes('already enabled')) {
        isNetworkEnabled = true;
        console.log('Firebase 網路連接已經啟用');
      } else {
        console.warn('網路連接檢查失敗:', error);
        throw error;
      }
    } finally {
      networkPromise = null;
    }
  })();
  
  return await networkPromise;
};

// 檢查分享ID是否已存在
const checkShareIdExists = async (shareId: string): Promise<boolean> => {
  try {
    const docRef = doc(db, 'sharedData', shareId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    return false; // 如果發生錯誤，假設不存在
  }
};

// 分享標籤和收藏項目
export const shareTagsAndFavorites = async (
  tags: Tag[], 
  favorites: Favorite[], 
  uid?: string,
  customShareId?: string
): Promise<{ shareId: string; editPassword: string }> => {
  // 強制要求登入
  if (!uid) {
    throw new Error('分享功能需要登入，請先登入您的帳戶');
  }
  
  let shareId: string;
  
  // 如果提供了自訂分享ID，檢查是否已存在
  if (customShareId && customShareId.trim()) {
    const exists = await checkShareIdExists(customShareId);
    if (exists) {
      throw new Error('此分享名稱已被他人使用，請重新命名');
    }
    shareId = customShareId.trim();
  } else {
    shareId = generateId();
  }
  
  const editPassword = generatePassword();
  
  const shareData = {
    tags,
    favorites,
    shareId,
    editPassword,
    createdBy: uid, // 記錄創建者
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await checkNetworkConnection();
    
    await retryOperation(async () => {
      const docRef = doc(db, 'sharedData', shareId);
      await setDoc(docRef, shareData);
    });

    // 將分享記錄儲存到使用者歷史
    try {
      await saveShareToUserHistory(uid, shareId, editPassword);
    } catch (error) {
      console.warn('儲存分享記錄到使用者歷史失敗，但分享成功:', error);
    }

    console.log('數據分享成功:', shareId);
    return { shareId, editPassword };
  } catch (error) {
    console.error('分享數據失敗:', error);
    throw new Error(`分享失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// 從分享ID載入數據
export const loadFromHash = async (shareId: string): Promise<{ tags: Tag[]; favorites: Favorite[] } | null> => {
  if (!shareId) {
    return null;
  }

  try {
    await checkNetworkConnection();
    
    const result = await retryOperation(async () => {
      const docRef = doc(db, 'sharedData', shareId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('分享數據不存在');
      }
      
      return docSnap.data();
    });

    console.log('分享數據載入成功:', shareId);
    return {
      tags: result.tags || [],
      favorites: result.favorites || []
    };
  } catch (error) {
    console.error('載入分享數據失敗:', error);
    throw new Error(`載入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// 更新分享的數據
export const updateSharedData = async (
  shareId: string,
  editPassword: string,
  tags: Tag[],
  favorites: Favorite[],
  uid?: string
): Promise<void> => {
  if (!shareId || !editPassword) {
    throw new Error('缺少分享ID或編輯密碼');
  }
  
  // 強制要求登入
  if (!uid) {
    throw new Error('更新分享數據需要登入，請先登入您的帳戶');
  }

  try {
    await checkNetworkConnection();
    
    await retryOperation(async () => {
      const docRef = doc(db, 'sharedData', shareId);
      
      // 驗證編輯密碼（不檢查創建者）
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('分享數據不存在');
      }
      
      const existingData = docSnap.data();
      
      // 只驗證編輯密碼，不檢查創建者
      if (existingData.editPassword !== editPassword) {
        throw new Error('編輯密碼錯誤');
      }
      
      // 更新數據，並記錄最後修改者
      await updateDoc(docRef, {
        tags,
        favorites,
        updatedAt: serverTimestamp(),
        lastUpdatedBy: uid // 記錄最後修改者
      });
    });

    console.log('分享數據更新成功:', shareId, '修改者:', uid);
  } catch (error) {
    console.error('更新分享數據失敗:', error);
    throw new Error(`更新失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// 讀取使用者個人資料（包含分享歷史和歷史記錄）
export const loadUserProfile = async (uid: string): Promise<{
  displayName?: string;
  email?: string;
  tokens?: number;
  shareHistory?: Array<{ shareId: string; editPassword: string; createdAt: any }>;
  preferences?: Record<string, any>;
  historyRecords?: Array<any>;
} | null> => {
  if (!uid) return null;

  try {
    await checkNetworkConnection();
    
    const result = await retryOperation(async () => {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return docSnap.data();
    });

    if (result && Array.isArray(result.historyRecords)) {
      const arr = result.historyRecords;
      if (arr.length > 0 && (arr[0].a !== undefined || arr[0].b !== undefined)) {
        result.historyRecords = arr.map((item: CompressedHistoryItem | any) =>
          decompressHistoryItem(item)
        );
      }
    }

    console.log('使用者資料載入成功:', uid);
    return result;
  } catch (error) {
    console.error('載入使用者資料失敗:', error);
    throw new Error(`載入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// 創建或更新使用者基本資料（首次登入時調用）
export const createOrUpdateUserProfile = async (
  uid: string,
  displayName?: string,
  email?: string
): Promise<void> => {
  if (!uid) return;

  try {
    await checkNetworkConnection();
    
    await retryOperation(async () => {
      const userDocRef = doc(db, 'users', uid);
      
      // 先檢查是否已存在
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};
      
      // 準備更新資料
      const updateData: any = {
        updatedAt: serverTimestamp()
      };
      
      // 如果是新用戶或者顯示名稱/電子郵件有變更，則更新
      if (!userDoc.exists() || !existingData.displayName || !existingData.email) {
        updateData.createdAt = existingData.createdAt || serverTimestamp();
        if (displayName) updateData.displayName = displayName;
        if (email) updateData.email = email;
        
        // 初始化預設值（僅在首次創建時）
        if (!userDoc.exists()) {
          updateData.tokens = 0;
          updateData.shareHistory = [];
          updateData.preferences = {};
          updateData.historyRecords = [];
        }
      }
      
      // 儲存或更新資料
      await setDoc(userDocRef, updateData, { merge: true });
    });

    console.log('使用者基本資料已創建/更新:', uid, displayName, email);
  } catch (error) {
    console.error('創建/更新使用者資料失敗:', error);
    throw new Error(`操作失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// 儲存分享記錄到使用者資料
export const saveShareToUserHistory = async (
  uid: string, 
  shareId: string, 
  editPassword: string
): Promise<void> => {
  if (!uid || !shareId || !editPassword) return;

  try {
    await checkNetworkConnection();
    
    await retryOperation(async () => {
      const userDocRef = doc(db, 'users', uid);
      
      // 先讀取現有資料
      const userDoc = await getDoc(userDocRef);
      const existingData = userDoc.exists() ? userDoc.data() : {};
      
      // 更新分享歷史 - 檢查是否已存在相同的shareId
      const shareHistory = existingData.shareHistory || [];
      const existingIndex = shareHistory.findIndex((item: any) => item.shareId === shareId);
      
      if (existingIndex !== -1) {
        // 如果已存在，更新現有記錄
        shareHistory[existingIndex] = {
          shareId,
          editPassword,
          createdAt: shareHistory[existingIndex].createdAt // 保持原有創建時間
        };
      } else {
        // 如果不存在，添加新記錄
        shareHistory.push({
          shareId,
          editPassword,
          createdAt: Date.now()
        });
        
        // 只保留最近的10個分享記錄
        if (shareHistory.length > 10) {
          shareHistory.sort((a: any, b: any) => b.createdAt - a.createdAt);
          shareHistory.splice(10);
        }
      }
      
      // 儲存更新後的資料
      await setDoc(userDocRef, {
        ...existingData,
        shareHistory,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    console.log('分享記錄已儲存到使用者歷史:', shareId);
  } catch (error) {
    console.error('儲存分享記錄失敗:', error);
    throw new Error(`儲存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// 更新使用者偏好設定
export const saveUserPreferences = async (
  uid: string,
  preferences: Record<string, any>
): Promise<void> => {
  if (!uid) return;

  try {
    await checkNetworkConnection();
    
    await retryOperation(async () => {
      const userDocRef = doc(db, 'users', uid);
      await setDoc(userDocRef, {
        preferences,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    console.log('使用者偏好設定已儲存');
  } catch (error) {
    console.error('儲存偏好設定失敗:', error);
    throw new Error(`儲存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// 儲存使用者歷史記錄
export const saveUserHistoryRecords = async (
  uid: string,
  historyRecords: Array<any>
): Promise<void> => {
  if (!uid) return;

  try {
    await checkNetworkConnection();

    await retryOperation(async () => {
      const userDocRef = doc(db, 'users', uid);
      const compressed = historyRecords.map(record =>
        record.a !== undefined || record.b !== undefined
          ? (record as CompressedHistoryItem)
          : compressHistoryItem(record)
      );
      await setDoc(userDocRef, {
        historyRecords: compressed,
        updatedAt: serverTimestamp()
      }, { merge: true });
    });

    console.log('使用者歷史記錄已儲存');
  } catch (error) {
    console.error('儲存使用者歷史記錄失敗:', error);
    throw new Error(`儲存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};
