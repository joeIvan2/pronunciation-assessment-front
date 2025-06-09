import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Favorite, Tag } from '../types/speech';

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

// 重試機制
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`操作失敗，重試 ${i + 1}/${maxRetries}:`, error);
      
      if (i === maxRetries - 1) {
        throw error;
      }
      
      // 等待後重試
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('重試次數已用盡');
};

// 檢查網路連接
const checkNetworkConnection = async (): Promise<void> => {
  try {
    await enableNetwork(db);
    console.log('Firebase 網路連接已啟用');
  } catch (error) {
    console.warn('網路連接檢查失敗:', error);
  }
};

// 分享標籤和收藏項目
export const shareTagsAndFavorites = async (tags: Tag[], favorites: Favorite[]): Promise<{ shareId: string; editPassword: string }> => {
  const shareId = generateId();
  const editPassword = generatePassword();
  
  const shareData = {
    tags,
    favorites,
    shareId,
    editPassword,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await checkNetworkConnection();
    
    await retryOperation(async () => {
      const docRef = doc(db, 'sharedData', shareId);
      await setDoc(docRef, shareData);
    });

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
  favorites: Favorite[]
): Promise<void> => {
  if (!shareId || !editPassword) {
    throw new Error('缺少分享ID或編輯密碼');
  }

  try {
    await checkNetworkConnection();
    
    await retryOperation(async () => {
      const docRef = doc(db, 'sharedData', shareId);
      
      // 先驗證編輯密碼
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('分享數據不存在');
      }
      
      const existingData = docSnap.data();
      if (existingData.editPassword !== editPassword) {
        throw new Error('編輯密碼錯誤');
      }
      
      // 更新數據
      await updateDoc(docRef, {
        tags,
        favorites,
        updatedAt: serverTimestamp()
      });
    });

    console.log('分享數據更新成功:', shareId);
  } catch (error) {
    console.error('更新分享數據失敗:', error);
    throw new Error(`更新失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// 刪除分享的數據
