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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await checkNetworkConnection();
    
    await retryOperation(async () => {
      const docRef = doc(db, 'sharedData', shareId);
      await setDoc(docRef, shareData);
    });

    // 如果有使用者ID，將分享記錄儲存到使用者歷史
    if (uid) {
      try {
        await saveShareToUserHistory(uid, shareId, editPassword);
      } catch (error) {
        console.warn('儲存分享記錄到使用者歷史失敗，但分享成功:', error);
      }
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

// 讀取使用者收藏
export const loadUserFavorites = async (uid: string): Promise<Favorite[]> => {
  if (!uid) return [];

  await checkNetworkConnection();

  const { collection, getDocs } = await import('firebase/firestore');

  const colRef = collection(db, 'users', uid, 'favorites');
  const snap = await retryOperation(() => getDocs(colRef));

  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text as string,
      tagIds: Array.isArray(data.tagIds) ? data.tagIds : [],
      createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
    } as Favorite;
  });
};

// 儲存使用者收藏
export const saveUserFavorites = async (
  uid: string,
  favorites: Favorite[]
): Promise<void> => {
  if (!uid) return;

  await checkNetworkConnection();

  const { collection, doc, getDocs, writeBatch } = await import('firebase/firestore');

  const colRef = collection(db, 'users', uid, 'favorites');
  const existing = await retryOperation(() => getDocs(colRef));

  const batch = writeBatch(db);
  const newIds = favorites.map(f => f.id);

  favorites.forEach(f => {
    const docRef = doc(db, 'users', uid, 'favorites', f.id);
    batch.set(docRef, f);
  });

  existing.docs.forEach(d => {
    if (!newIds.includes(d.id)) {
      batch.delete(d.ref);
    }
  });

  await retryOperation(() => batch.commit());
};

// 讀取使用者標籤
export const loadUserTags = async (uid: string): Promise<Tag[]> => {
  if (!uid) return [];

  try {
    await checkNetworkConnection();

    const { collection, getDocs } = await import('firebase/firestore');

    const colRef = collection(db, 'users', uid, 'tags');
    const snap = await retryOperation(() => getDocs(colRef));

    const tags = snap.docs.map(doc => {
      const data = doc.data();
      return {
        tagId: doc.id,
        name: data.name as string,
        color: data.color as string,
        createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
      } as Tag;
    });

    console.log('使用者標籤載入成功:', uid, tags.length);
    return tags;
  } catch (error) {
    console.error('載入使用者標籤失敗:', error);
    return [];
  }
};

// 儲存使用者標籤
export const saveUserTags = async (
  uid: string,
  tags: Tag[]
): Promise<void> => {
  if (!uid) return;

  try {
    await checkNetworkConnection();

    const { collection, doc, getDocs, writeBatch } = await import('firebase/firestore');

    const colRef = collection(db, 'users', uid, 'tags');
    const existing = await retryOperation(() => getDocs(colRef));

    const batch = writeBatch(db);
    const newIds = tags.map(t => t.tagId);

    // 新增或更新標籤
    tags.forEach(tag => {
      const docRef = doc(db, 'users', uid, 'tags', tag.tagId);
      batch.set(docRef, {
        name: tag.name,
        color: tag.color,
        createdAt: tag.createdAt
      });
    });

    // 刪除不存在的標籤
    existing.docs.forEach(d => {
      if (!newIds.includes(d.id)) {
        batch.delete(d.ref);
      }
    });

    await retryOperation(() => batch.commit());
    console.log('使用者標籤儲存成功:', uid, tags.length);
  } catch (error) {
    console.error('儲存使用者標籤失敗:', error);
    throw new Error(`儲存失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
};

// 讀取使用者個人資料（包含分享歷史）
export const loadUserProfile = async (uid: string): Promise<{
  displayName?: string;
  email?: string;
  tokens?: number;
  shareHistory?: Array<{ shareId: string; editPassword: string; createdAt: any }>;
  preferences?: Record<string, any>;
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

    console.log('使用者資料載入成功:', uid);
    return result;
  } catch (error) {
    console.error('載入使用者資料失敗:', error);
    throw new Error(`載入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
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
      
      // 更新分享歷史
      const shareHistory = existingData.shareHistory || [];
      shareHistory.push({
        shareId,
        editPassword,
        createdAt: serverTimestamp()
      });
      
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
