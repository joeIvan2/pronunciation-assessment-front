import { db } from '../config/firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  getDocs,
  DocumentReference,
  Query,
  DocumentSnapshot
} from 'firebase/firestore';

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

// 等待函數
const wait = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// 指數退避延遲計算
const calculateDelay = (attempt: number, options: RetryOptions): number => {
  const { baseDelay = 1000, maxDelay = 10000, backoffMultiplier = 2 } = options;
  const delay = baseDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
};

// 檢查錯誤是否為可重試的錯誤
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  
  const errorCode = error.code;
  const errorMessage = error.message || error.toString();
  
  // Firestore 可重試的錯誤類型
  const retryableCodes = [
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'internal',
    'unknown'
  ];
  
  // 網絡相關錯誤
  const networkErrors = [
    'network-request-failed',
    'timeout',
    'fetch'
  ];

  // Firebase 特定錯誤訊息
  if (errorMessage.includes('Target ID already exists')) {
    return true;
  }
  
  // 檢查是否為廣告攔截器導致的錯誤
  const isBlockedByClient = errorMessage.includes('ERR_BLOCKED_BY_CLIENT') ||
                           errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT');
  
  // 如果是廣告攔截器錯誤，不進行重試，而是讓 FirestoreErrorHandler 處理
  if (isBlockedByClient) {
    return false;
  }
  
  return retryableCodes.includes(errorCode) || 
         networkErrors.some(pattern => errorMessage.includes(pattern));
};

// 重試包裝器函數
async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultRetryOptions, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries!; attempt++) {
    try {
      const result = await operation();
      
      // 成功時記錄（僅在重試後成功時）
      if (attempt > 0) {
        console.log(`${operationName} 在第 ${attempt + 1} 次嘗試後成功`);
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // 檢查是否為廣告攔截器錯誤
      const errorMessage = error.message || error.toString();
      if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT')) {
        console.warn(`${operationName} 被廣告攔截器阻止，由 FirestoreErrorHandler 處理`);
        throw error; // 不重試，讓 FirestoreErrorHandler 處理
      }
      
      // 檢查是否應該重試
      if (attempt >= opts.maxRetries! || !isRetryableError(error)) {
        console.error(`${operationName} 最終失敗:`, error);
        throw error;
      }
      
      // 計算延遲時間
      const delay = calculateDelay(attempt, opts);
      console.warn(`${operationName} 第 ${attempt + 1} 次嘗試失敗，${delay}ms 後重試:`, error.message);
      
      // 等待後重試
      await wait(delay);
    }
  }
  
  throw lastError;
}

// Firestore 操作包裝器
export const firestoreUtils = {
  // 獲取文檔
  async getDocument(docRef: DocumentReference, options?: RetryOptions): Promise<DocumentSnapshot> {
    return withRetry(
      () => getDoc(docRef),
      `獲取文檔 ${docRef.path}`,
      options
    );
  },

  // 設置文檔
  async setDocument(docRef: DocumentReference, data: any, options?: RetryOptions): Promise<void> {
    return withRetry(
      () => setDoc(docRef, data),
      `設置文檔 ${docRef.path}`,
      options
    );
  },

  // 更新文檔
  async updateDocument(docRef: DocumentReference, data: any, options?: RetryOptions): Promise<void> {
    return withRetry(
      () => updateDoc(docRef, data),
      `更新文檔 ${docRef.path}`,
      options
    );
  },

  // 刪除文檔
  async deleteDocument(docRef: DocumentReference, options?: RetryOptions): Promise<void> {
    return withRetry(
      () => deleteDoc(docRef),
      `刪除文檔 ${docRef.path}`,
      options
    );
  },

  // 查詢文檔
  async queryDocuments(q: Query, options?: RetryOptions): Promise<any> {
    return withRetry(
      () => getDocs(q),
      `查詢文檔`,
      options
    );
  },

  // 創建文檔引用
  createDocRef(collectionName: string, docId?: string): DocumentReference {
    if (docId) {
      return doc(db, collectionName, docId);
    } else {
      return doc(collection(db, collectionName));
    }
  },

  // 創建查詢
  createQuery(collectionName: string): Query {
    return query(collection(db, collectionName));
  },

  // 檢查 Firestore 連接狀態
  async checkConnection(): Promise<boolean> {
    try {
      const testRef = doc(db, '_test', 'connection');
      await getDoc(testRef);
      return true;
    } catch (error: any) {
      console.warn('Firestore 連接檢查失敗:', error);
      return false;
    }
  }
};

// 錯誤處理助手
export const handleFirestoreError = (error: any, operationName: string): string => {
  const errorMessage = error.message || error.toString();
  
  if (errorMessage.includes('ERR_BLOCKED_BY_CLIENT')) {
    return '連接被廣告攔截器阻止，請暫時停用廣告攔截器或將本網站加入白名單';
  } else if (error.code === 'permission-denied') {
    return '權限不足，請確認已正確登入';
  } else if (error.code === 'not-found') {
    return '找不到請求的資源';
  } else if (error.code === 'unavailable') {
    return '服務暫時不可用，請稍後重試';
  } else if (error.code === 'deadline-exceeded') {
    return '操作超時，請檢查網絡連接';
  } else if (error.code === 'network-request-failed') {
    return '網絡請求失敗，請檢查網絡連接';
  } else {
    return `${operationName}失敗: ${errorMessage}`;
  }
};

// ================== Favorites 物件存取 ==================
export interface FavoriteSentence {
  text: string;
  note?: string;
}

export type FavoritesMap = Record<string, FavoriteSentence>;

/** 取得整包 favorites */
export async function fetchFavorites(uid: string): Promise<FavoritesMap> {
  const docRef = doc(db, 'users', uid);
  const snap = await withRetry(
    () => getDoc(docRef),
    `取得 favorites ${uid}`
  );
  const data = snap.data()?.favorites ?? {};
  console.log('[fetchFavorites] Firestore 讀到的 favorites:', data);
  return data as FavoritesMap;
}

/** 整包寫回 favorites（覆蓋） */
export async function saveFavorites(uid: string, data: FavoritesMap) {
  const docRef = doc(db, 'users', uid);
  await withRetry(
    () => updateDoc(docRef, { favorites: data }),
    `保存 favorites ${uid}`
  );
}

export default firestoreUtils; 