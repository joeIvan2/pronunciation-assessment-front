// 音頻緩存工具模塊
interface AudioCacheItem {
  url: string;
  text: string;
  voice: string;
  rate?: number;
  timestamp: number;
  expiresAt: number;
  neverExpire?: boolean; // 新增：是否永不過期
  isBlob?: boolean; // 新增：是否為本地blob
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1天（毫秒）
const CACHE_KEY = 'audioCache';
const BLOB_CACHE_KEY = 'audioBlobCache'; // 新增：blob緩存鍵

class AudioCacheManager {
  private cache: Map<string, AudioCacheItem> = new Map();
  private blobCache: Map<string, { blob: Blob; item: AudioCacheItem }> = new Map(); // 新增：blob緩存
  private isInitialized = false;

  // 生成緩存鍵
  private generateCacheKey(text: string, voice: string, rate?: number): string {
    return `${text}_${voice}_${rate || 1.0}`;
  }

  // 初始化緩存，從 localStorage 載入
  private initialize() {
    if (this.isInitialized) return;
    
    try {
      const storedCache = localStorage.getItem(CACHE_KEY);
      if (storedCache) {
        const cacheData = JSON.parse(storedCache);
        Object.entries(cacheData).forEach(([key, item]: [string, any]) => {
          // 檢查是否過期（永不過期的除外）
          if (item.neverExpire || item.expiresAt > Date.now()) {
            this.cache.set(key, item as AudioCacheItem);
          } else {
            // 清理過期的 blob URL
            try {
              if (item.isBlob) {
                URL.revokeObjectURL(item.url);
                console.log(`[音頻緩存] 清理過期 blob URL: ${item.url}`);
              }
            } catch (e) {
              console.warn(`[音頻緩存] 清理過期 blob URL 失敗:`, e);
            }
          }
        });
      }

      // 載入blob緩存
      this.loadBlobCache();
    } catch (e) {
      console.warn('[音頻緩存] 初始化失敗:', e);
    }
    
    this.isInitialized = true;
  }

  // 載入blob緩存
  private loadBlobCache() {
    try {
      const storedBlobCache = localStorage.getItem(BLOB_CACHE_KEY);
      if (storedBlobCache) {
        const blobCacheData = JSON.parse(storedBlobCache);
        Object.entries(blobCacheData).forEach(([key, data]: [string, any]) => {
          try {
            // 從base64恢復blob
            const binaryString = atob(data.blobData);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: data.mimeType });
            const url = URL.createObjectURL(blob);
            
            const item: AudioCacheItem = {
              ...data.item,
              url: url,
              isBlob: true,
              neverExpire: true
            };
            
            this.cache.set(key, item);
            this.blobCache.set(key, { blob, item });
            
            console.log(`[音頻緩存] 恢復永久blob緩存: ${item.text.substring(0, 30)}...`);
          } catch (e) {
            console.warn(`[音頻緩存] 恢復blob緩存失敗:`, e);
          }
        });
      }
    } catch (e) {
      console.warn('[音頻緩存] 載入blob緩存失敗:', e);
    }
  }

  // 保存緩存到 localStorage
  private saveToStorage() {
    try {
      const cacheData: Record<string, AudioCacheItem> = {};
      this.cache.forEach((item, key) => {
        // 不保存blob URL到localStorage，只保存元數據
        if (!item.isBlob) {
          cacheData[key] = item;
        } else {
          // 對於blob，只保存元數據，不保存URL
          cacheData[key] = {
            ...item,
            url: '' // blob URL不持久化
          };
        }
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('[音頻緩存] 保存到 localStorage 失敗:', e);
    }
  }

  // 保存blob到localStorage
  private async saveBlobToStorage(key: string, blob: Blob, item: AudioCacheItem) {
    try {
      // 將blob轉換為base64保存
      const arrayBuffer = await blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binaryString = '';
      for (let i = 0; i < bytes.length; i++) {
        binaryString += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binaryString);
      
      const storedBlobCache = localStorage.getItem(BLOB_CACHE_KEY);
      const blobCacheData = storedBlobCache ? JSON.parse(storedBlobCache) : {};
      
      blobCacheData[key] = {
        blobData: base64Data,
        mimeType: blob.type,
        item: {
          ...item,
          url: '' // 不保存blob URL
        }
      };
      
      localStorage.setItem(BLOB_CACHE_KEY, JSON.stringify(blobCacheData));
      console.log(`[音頻緩存] 已保存永久blob緩存: ${item.text.substring(0, 30)}...`);
    } catch (e) {
      console.warn('[音頻緩存] 保存blob到 localStorage 失敗:', e);
    }
  }

  // 設置緩存（普通緩存，會過期）
  set(text: string, voice: string, audioUrl: string, rate?: number): void {
    this.initialize();
    
    const key = this.generateCacheKey(text, voice, rate);
    const now = Date.now();
    const item: AudioCacheItem = {
      url: audioUrl,
      text,
      voice,
      rate,
      timestamp: now,
      expiresAt: now + CACHE_DURATION,
      isBlob: false
    };
    
    this.cache.set(key, item);
    this.saveToStorage();
    
    console.log(`[音頻緩存] 已緩存音頻: ${text.substring(0, 30)}... (語音:${voice}, 過期時間:${new Date(item.expiresAt).toLocaleString()})`);
  }

  // 設置永久blob緩存
  async setBlobPermanent(text: string, voice: string, blob: Blob, rate?: number): Promise<string> {
    this.initialize();
    
    const key = this.generateCacheKey(text, voice, rate);
    const url = URL.createObjectURL(blob);
    const now = Date.now();
    
    const item: AudioCacheItem = {
      url,
      text,
      voice,
      rate,
      timestamp: now,
      expiresAt: now + (100 * 365 * 24 * 60 * 60 * 1000), // 100年後過期，相當於永不過期
      neverExpire: true,
      isBlob: true
    };
    
    this.cache.set(key, item);
    this.blobCache.set(key, { blob, item });
    
    // 異步保存到localStorage
    this.saveBlobToStorage(key, blob, item);
    this.saveToStorage();
    
    console.log(`[音頻緩存] 已設置永久blob緩存: ${text.substring(0, 30)}... (語音:${voice})`);
    return url;
  }

  // 檢測blob URL是否有效
  private async isBlobUrlValid(url: string): Promise<boolean> {
    if (!url.startsWith('blob:')) {
      return true; // 非blob URL假設有效
    }
    
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn(`[音頻緩存] blob URL檢測失效: ${url}`, error);
      return false;
    }
  }

  // 獲取緩存
  async getAsync(text: string, voice: string, rate?: number): Promise<string | null> {
    this.initialize();
    
    const key = this.generateCacheKey(text, voice, rate);
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // 檢查是否過期（永不過期的除外）
    if (!item.neverExpire && item.expiresAt <= Date.now()) {
      // 清理過期的項目
      this.cache.delete(key);
      this.blobCache.delete(key);
      this.saveToStorage();
      
      try {
        if (item.isBlob) {
          URL.revokeObjectURL(item.url);
          console.log(`[音頻緩存] 清理過期緩存: ${text.substring(0, 30)}... blob URL: ${item.url}`);
        }
      } catch (e) {
        console.warn(`[音頻緩存] 清理過期 blob URL 失敗:`, e);
      }
      
      return null;
    }
    
    // 對於blob緩存，檢查URL是否仍然有效
    if (item.isBlob && item.url) {
      const isValid = await this.isBlobUrlValid(item.url);
      
      if (!isValid) {
        console.warn(`[音頻緩存] blob URL已失效，嘗試重新創建: ${item.url}`);
        
        // 嘗試重新創建blob URL
        const blobData = this.blobCache.get(key);
        if (blobData) {
          try {
            // 撤銷舊的blob URL
            URL.revokeObjectURL(item.url);
            
            // 創建新的blob URL
            const newUrl = URL.createObjectURL(blobData.blob);
            item.url = newUrl;
            this.cache.set(key, item);
            
            console.log(`[音頻緩存] 重新創建blob URL成功: ${text.substring(0, 30)}... 新URL: ${newUrl}`);
            
            if (item.neverExpire) {
              console.log(`[音頻緩存] 命中永久blob緩存（重新創建）: ${text.substring(0, 30)}... (語音:${voice})`);
            } else {
              console.log(`[音頻緩存] 命中blob緩存（重新創建）: ${text.substring(0, 30)}... (剩餘時間:${Math.round((item.expiresAt - Date.now()) / (60 * 60 * 1000))}小時)`);
            }
            return newUrl;
          } catch (recreateError) {
            console.warn(`[音頻緩存] 重新創建blob URL失敗:`, recreateError);
            // 清理無效的緩存
            this.cache.delete(key);
            this.blobCache.delete(key);
            return null;
          }
        } else {
          console.warn(`[音頻緩存] 沒有找到blob數據，無法重新創建URL`);
          // 清理無效的緩存
          this.cache.delete(key);
          return null;
        }
      } else {
        // blob URL有效
        if (item.neverExpire) {
          console.log(`[音頻緩存] 命中永久blob緩存: ${text.substring(0, 30)}... (語音:${voice})`);
        } else {
          console.log(`[音頻緩存] 命中blob緩存: ${text.substring(0, 30)}... (剩餘時間:${Math.round((item.expiresAt - Date.now()) / (60 * 60 * 1000))}小時)`);
        }
        return item.url;
      }
    }
    
    // 非blob緩存的情況
    if (item.neverExpire) {
      console.log(`[音頻緩存] 命中永久緩存: ${text.substring(0, 30)}... (語音:${voice})`);
    } else {
      console.log(`[音頻緩存] 命中緩存: ${text.substring(0, 30)}... (剩餘時間:${Math.round((item.expiresAt - Date.now()) / (60 * 60 * 1000))}小時)`);
    }
    return item.url;
  }

  // 獲取緩存（同步版本，保持向後兼容）
  get(text: string, voice: string, rate?: number): string | null {
    this.initialize();
    
    const key = this.generateCacheKey(text, voice, rate);
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // 檢查是否過期（永不過期的除外）
    if (!item.neverExpire && item.expiresAt <= Date.now()) {
      // 清理過期的項目
      this.cache.delete(key);
      this.blobCache.delete(key);
      this.saveToStorage();
      
      try {
        if (item.isBlob) {
          URL.revokeObjectURL(item.url);
          console.log(`[音頻緩存] 清理過期緩存: ${text.substring(0, 30)}... blob URL: ${item.url}`);
        }
      } catch (e) {
        console.warn(`[音頻緩存] 清理過期 blob URL 失敗:`, e);
      }
      
      return null;
    }
    
    // 對於blob緩存，進行簡單的同步檢查
    if (item.isBlob && item.url) {
      // 嘗試重新創建blob URL（如果有blob數據的話）
      const blobData = this.blobCache.get(key);
      if (blobData) {
        try {
          // 創建新的blob URL替換可能失效的URL
          const newUrl = URL.createObjectURL(blobData.blob);
          if (newUrl !== item.url) {
            // 撤銷舊URL
            URL.revokeObjectURL(item.url);
            item.url = newUrl;
            this.cache.set(key, item);
            console.log(`[音頻緩存] 預防性重新創建blob URL: ${text.substring(0, 30)}...`);
          }
        } catch (e) {
          console.warn(`[音頻緩存] 預防性重新創建blob URL失敗:`, e);
        }
      }
      
      if (item.neverExpire) {
        console.log(`[音頻緩存] 命中永久blob緩存: ${text.substring(0, 30)}... (語音:${voice})`);
      } else {
        console.log(`[音頻緩存] 命中blob緩存: ${text.substring(0, 30)}... (剩餘時間:${Math.round((item.expiresAt - Date.now()) / (60 * 60 * 1000))}小時)`);
      }
      return item.url;
    }
    
    if (item.neverExpire) {
      console.log(`[音頻緩存] 命中永久緩存: ${text.substring(0, 30)}... (語音:${voice})`);
    } else {
      console.log(`[音頻緩存] 命中緩存: ${text.substring(0, 30)}... (剩餘時間:${Math.round((item.expiresAt - Date.now()) / (60 * 60 * 1000))}小時)`);
    }
    return item.url;
  }

  // 檢查blob緩存是否存在且有效
  hasBlobCache(text: string, voice: string, rate?: number): boolean {
    this.initialize();
    
    const key = this.generateCacheKey(text, voice, rate);
    const item = this.cache.get(key);
    
    return !!(item && item.isBlob && item.neverExpire && this.blobCache.has(key));
  }

  // 清理所有過期的緩存（不包括永不過期的）
  cleanExpired(): void {
    this.initialize();
    
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (!item.neverExpire && item.expiresAt <= now) {
        expiredKeys.push(key);
        try {
          if (item.isBlob) {
            URL.revokeObjectURL(item.url);
            console.log(`[音頻緩存] 清理過期緩存: ${item.text.substring(0, 30)}... blob URL: ${item.url}`);
          }
        } catch (e) {
          console.warn(`[音頻緩存] 清理過期 blob URL 失敗:`, e);
        }
      }
    });
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.blobCache.delete(key);
    });
    
    if (expiredKeys.length > 0) {
      this.saveToStorage();
      console.log(`[音頻緩存] 已清理 ${expiredKeys.length} 個過期緩存項目`);
    }
  }

  // 清理所有緩存
  clearAll(): void {
    this.initialize();
    
    // 清理所有 blob URL
    this.cache.forEach((item) => {
      try {
        if (item.isBlob) {
          URL.revokeObjectURL(item.url);
          console.log(`[音頻緩存] 清理所有緩存 blob URL: ${item.url}`);
        }
      } catch (e) {
        console.warn(`[音頻緩存] 清理 blob URL 失敗:`, e);
      }
    });
    
    this.cache.clear();
    this.blobCache.clear();
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(BLOB_CACHE_KEY);
    console.log(`[音頻緩存] 已清理所有緩存`);
  }

  // 獲取緩存統計信息
  getStats(): { total: number; expired: number; permanent: number; size: string } {
    this.initialize();
    
    const now = Date.now();
    let expired = 0;
    let permanent = 0;
    
    this.cache.forEach((item) => {
      if (item.neverExpire) {
        permanent++;
      } else if (item.expiresAt <= now) {
        expired++;
      }
    });
    
    return {
      total: this.cache.size,
      expired,
      permanent,
      size: `${this.cache.size} 個項目 (${permanent} 個永久)`
    };
  }
}

// 單例實例
export const audioCache = new AudioCacheManager();

// 定期清理過期緩存（每小時檢查一次）
if (typeof window !== 'undefined') {
  setInterval(() => {
    audioCache.cleanExpired();
  }, 60 * 60 * 1000); // 每小時
}

export default audioCache; 