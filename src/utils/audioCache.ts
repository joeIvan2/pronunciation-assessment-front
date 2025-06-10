// 音頻緩存工具模塊
interface AudioCacheItem {
  url: string;
  text: string;
  voice: string;
  rate?: number;
  timestamp: number;
  expiresAt: number;
}

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 1天（毫秒）
const CACHE_KEY = 'audioCache';

class AudioCacheManager {
  private cache: Map<string, AudioCacheItem> = new Map();
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
          // 檢查是否過期
          if (item.expiresAt > Date.now()) {
            this.cache.set(key, item as AudioCacheItem);
          } else {
            // 清理過期的 blob URL
            try {
              URL.revokeObjectURL(item.url);
              console.log(`[音頻緩存] 清理過期 blob URL: ${item.url}`);
            } catch (e) {
              console.warn(`[音頻緩存] 清理過期 blob URL 失敗:`, e);
            }
          }
        });
      }
    } catch (e) {
      console.warn('[音頻緩存] 初始化失敗:', e);
    }
    
    this.isInitialized = true;
  }

  // 保存緩存到 localStorage
  private saveToStorage() {
    try {
      const cacheData: Record<string, AudioCacheItem> = {};
      this.cache.forEach((item, key) => {
        cacheData[key] = item;
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('[音頻緩存] 保存到 localStorage 失敗:', e);
    }
  }

  // 設置緩存
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
      expiresAt: now + CACHE_DURATION
    };
    
    this.cache.set(key, item);
    this.saveToStorage();
    
    console.log(`[音頻緩存] 已緩存音頻: ${text.substring(0, 30)}... (語音:${voice}, 過期時間:${new Date(item.expiresAt).toLocaleString()})`);
  }

  // 獲取緩存
  get(text: string, voice: string, rate?: number): string | null {
    this.initialize();
    
    const key = this.generateCacheKey(text, voice, rate);
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // 檢查是否過期
    if (item.expiresAt <= Date.now()) {
      // 清理過期的項目
      this.cache.delete(key);
      this.saveToStorage();
      
      try {
        URL.revokeObjectURL(item.url);
        console.log(`[音頻緩存] 清理過期緩存: ${text.substring(0, 30)}... blob URL: ${item.url}`);
      } catch (e) {
        console.warn(`[音頻緩存] 清理過期 blob URL 失敗:`, e);
      }
      
      return null;
    }
    
    console.log(`[音頻緩存] 命中緩存: ${text.substring(0, 30)}... (剩餘時間:${Math.round((item.expiresAt - Date.now()) / (60 * 60 * 1000))}小時)`);
    return item.url;
  }

  // 清理所有過期的緩存
  cleanExpired(): void {
    this.initialize();
    
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (item.expiresAt <= now) {
        expiredKeys.push(key);
        try {
          URL.revokeObjectURL(item.url);
          console.log(`[音頻緩存] 清理過期緩存: ${item.text.substring(0, 30)}... blob URL: ${item.url}`);
        } catch (e) {
          console.warn(`[音頻緩存] 清理過期 blob URL 失敗:`, e);
        }
      }
    });
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
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
        URL.revokeObjectURL(item.url);
        console.log(`[音頻緩存] 清理所有緩存 blob URL: ${item.url}`);
      } catch (e) {
        console.warn(`[音頻緩存] 清理 blob URL 失敗:`, e);
      }
    });
    
    this.cache.clear();
    localStorage.removeItem(CACHE_KEY);
    console.log(`[音頻緩存] 已清理所有緩存`);
  }

  // 獲取緩存統計信息
  getStats(): { total: number; expired: number; size: string } {
    this.initialize();
    
    const now = Date.now();
    let expired = 0;
    
    this.cache.forEach((item) => {
      if (item.expiresAt <= now) {
        expired++;
      }
    });
    
    return {
      total: this.cache.size,
      expired,
      size: `${this.cache.size} 個項目`
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