// URL 工具函數，處理新的路徑格式和向後兼容

/**
 * 將字符串轉換為URL友好的slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // 將中文字符轉換為拼音或保留（這裡簡化處理）
    .replace(/[\u4e00-\u9fff]/g, (char) => {
      // 簡單的中文字符映射，實際項目中可以使用拼音庫
      const chineseMap: { [key: string]: string } = {
        '的': 'de',
        '和': 'he',
        '完全': 'wanquan',
        '月份': 'yuefen',
        '預估': 'yugu',
        '題目': 'timu',
        '練習': 'lianxi',
        '發音': 'fayin',
        '評估': 'pinggu'
      };
      return chineseMap[char] || char;
    })
    // 替換空格和特殊字符為連字符
    .replace(/[\s\W-]+/g, '-')
    // 移除開頭和結尾的連字符
    .replace(/^-+|-+$/g, '')
    // 限制長度
    .substring(0, 100);
}

/**
 * 從當前URL獲取練習ID（支持新舊格式）
 */
export function getPracticeIdFromUrl(): string | null {
  // 檢查新格式：/practice/:slug
  const pathMatch = window.location.pathname.match(/^\/practice\/(.+)$/);
  if (pathMatch) {
    return decodeURIComponent(pathMatch[1]);
  }
  
  // 檢查舊格式：?hash=xxx（向後兼容）
  const urlParams = new URLSearchParams(window.location.search);
  const hashParam = urlParams.get('hash');
  if (hashParam) {
    return hashParam;
  }
  
  return null;
}

/**
 * 生成練習頁面的URL（新格式）
 */
export function generatePracticeUrl(practiceId: string, baseUrl: string = ''): string {
  // 直接使用practiceId作為URL路徑，不進行slug轉換
  return `${baseUrl}/practice/${encodeURIComponent(practiceId)}`;
}

/**
 * 生成向後兼容的URL（舊格式）
 */
export function generateLegacyUrl(practiceId: string, baseUrl: string = ''): string {
  return `${baseUrl}/?hash=${encodeURIComponent(practiceId)}`;
}

/**
 * 檢查當前URL是否為練習頁面
 */
export function isPracticePage(): boolean {
  return window.location.pathname.startsWith('/practice/') || 
         new URLSearchParams(window.location.search).has('hash');
}

/**
 * 將舊格式URL重定向到新格式
 */
export function redirectToNewFormat(): void {
  const urlParams = new URLSearchParams(window.location.search);
  const hashParam = urlParams.get('hash');
  
  if (hashParam && !window.location.pathname.startsWith('/practice/')) {
    const newUrl = generatePracticeUrl(hashParam);
    // 使用 replaceState 避免在瀏覽器歷史中創建額外條目
    window.history.replaceState(null, '', newUrl);
  }
}

/**
 * 獲取練習頁面的標題
 */
export function getPracticeTitle(practiceId: string): string {
  // 清理和格式化練習ID作為標題
  return practiceId
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim();
}

/**
 * 檢查slug是否有效
 */
export function isValidSlug(slug: string): boolean {
  // 基本驗證：不為空，不包含危險字符
  return slug && 
         slug.length > 0 && 
         slug.length <= 100 &&
         !/[<>\"'&]/.test(slug);
}

/**
 * 標準化練習ID（移除特殊字符，保持一致性）
 */
export function normalizePracticeId(practiceId: string): string {
  return practiceId.trim().replace(/\s+/g, ' ');
}

/**
 * 為分享生成多種URL格式
 */
export function generateShareUrls(practiceId: string, baseUrl: string = '') {
  // 如果沒有提供baseUrl，使用當前域名
  if (!baseUrl) {
    baseUrl = window.location.origin;
  }
  
  const normalizedId = normalizePracticeId(practiceId);
  
  return {
    // 新格式（推薦）
    modern: generatePracticeUrl(normalizedId, baseUrl),
    // 舊格式（兼容性）
    legacy: generateLegacyUrl(normalizedId, baseUrl),
    // 短標題用於顯示
    title: getPracticeTitle(normalizedId),
    // slug用於技術用途  
    slug: generateSlug(normalizedId)
  };
} 