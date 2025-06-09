import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Favorite, Tag } from '../types/speech';

// 生成隨機ID
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

// 生成編輯密碼
const generatePassword = (): string => {
  return Math.random().toString(36).substr(2, 12);
};

// 分享數據接口
export interface ShareResponse {
  success: boolean;
  hash?: string;
  editPassword?: string;
  url?: string;
  error?: string;
}

// 加載數據接口
export interface LoadResponse {
  success: boolean;
  data?: {
    favorites: Favorite[];
    tags: Tag[];
  };
  error?: string;
}

// 分享數據到Firebase
export const shareTagsAndFavorites = async (
  favorites: Favorite[], 
  tags: Tag[]
): Promise<ShareResponse> => {
  try {
    const hash = generateId();
    const editPassword = generatePassword();
    
    // 創建分享數據
    const shareData = {
      favorites,
      tags,
      editPassword,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // 存儲到Firebase
    await setDoc(doc(db, 'sharedData', hash), shareData);
    
    // 生成分享URL
    const baseUrl = window.location.origin + window.location.pathname;
    const url = `${baseUrl}?hash=${hash}`;
    
    return {
      success: true,
      hash,
      editPassword,
      url
    };
  } catch (error) {
    console.error('Firebase分享數據出錯:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
};

// 從Firebase加載數據
export const loadFromHash = async (hash: string): Promise<LoadResponse> => {
  try {
    const docRef = doc(db, 'sharedData', hash);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: '找不到指定的分享數據'
      };
    }
    
    const data = docSnap.data();
    
    return {
      success: true,
      data: {
        favorites: data.favorites || [],
        tags: data.tags || []
      }
    };
  } catch (error) {
    console.error('Firebase加載數據出錯:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
};

// 更新Firebase中的分享數據
export const updateSharedData = async (
  hash: string,
  password: string,
  favorites: Favorite[],
  tags: Tag[]
): Promise<ShareResponse> => {
  try {
    // 清理hash值（如果是完整URL）
    let cleanHash = hash.trim();
    if (cleanHash.includes('://') || cleanHash.startsWith('www.')) {
      try {
        const url = new URL(cleanHash.startsWith('www.') ? `https://${cleanHash}` : cleanHash);
        const hashParam = url.searchParams.get('hash');
        if (hashParam) {
          cleanHash = hashParam;
        }
      } catch (e) {
        console.error('URL解析錯誤，將使用原始輸入', e);
      }
    }
    
    if (!cleanHash) {
      return {
        success: false,
        error: '無效的哈希值'
      };
    }
    
    const docRef = doc(db, 'sharedData', cleanHash);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: '找不到指定的分享數據'
      };
    }
    
    const existingData = docSnap.data();
    
    // 驗證密碼
    if (existingData.editPassword !== password) {
      return {
        success: false,
        error: '編輯密碼錯誤'
      };
    }
    
    // 更新數據
    await updateDoc(docRef, {
      favorites,
      tags,
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      hash: cleanHash
    };
  } catch (error) {
    console.error('Firebase更新數據出錯:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
};

// 刪除分享數據（可選功能）
export const deleteSharedData = async (
  hash: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const docRef = doc(db, 'sharedData', hash);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return {
        success: false,
        error: '找不到指定的分享數據'
      };
    }
    
    const existingData = docSnap.data();
    
    // 驗證密碼
    if (existingData.editPassword !== password) {
      return {
        success: false,
        error: '編輯密碼錯誤'
      };
    }
    
    // 刪除數據
    await deleteDoc(docRef);
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Firebase刪除數據出錯:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
}; 