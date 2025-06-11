// 檢測是否在內建瀏覽器中（如 Facebook Messenger, LINE, Instagram 等）
export const isInAppBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return (
    ua.includes('fbav') ||           // Facebook App
    ua.includes('fban') ||           // Facebook Browser
    ua.includes('line') ||           // LINE App
    ua.includes('instagram') ||      // Instagram App
    ua.includes('micromessenger') || // WeChat
    ua.includes('twitter') ||        // Twitter App
    ua.includes('whatsapp') ||       // WhatsApp
    ua.includes('linkedin')          // LinkedIn App
  );
};

// 檢測是否在行動裝置上
export const isMobile = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 獲取當前網址並生成外部瀏覽器連結
export const getExternalBrowserLink = (): string => {
  const currentUrl = window.location.href;
  
  // 如果是 Android，使用 intent:// 強制用 Chrome 開啟
  if (navigator.userAgent.includes('Android')) {
    return `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end;`;
  }
  
  // 其他情況使用一般連結
  return currentUrl;
};

// 顯示引導訊息
export const showBrowserGuideMessage = (): void => {
  const isAndroid = navigator.userAgent.includes('Android');
  const externalLink = getExternalBrowserLink();
  
  const message = isAndroid 
    ? '請點擊下方連結用 Chrome 瀏覽器開啟網站以完成 Google 登入'
    : '請點擊下方連結用外部瀏覽器（Safari/Chrome）開啟網站以完成 Google 登入';
  
  // 創建引導介面
  const guideDiv = document.createElement('div');
  guideDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  guideDiv.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    ">
      <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">
        需要使用外部瀏覽器
      </h3>
      <p style="margin: 0 0 20px 0; color: #666; line-height: 1.5; font-size: 14px;">
        ${message}
      </p>
      <div style="display: flex; gap: 12px; justify-content: center;">
        <a href="${externalLink}" 
           target="_blank" 
           rel="noopener noreferrer"
           style="
             background: #007AFF;
             color: white;
             padding: 12px 20px;
             border-radius: 8px;
             text-decoration: none;
             font-weight: 500;
             display: inline-block;
           ">
          👉 開啟外部瀏覽器
        </a>
        <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                style="
                  background: #f0f0f0;
                  color: #333;
                  border: none;
                  padding: 12px 20px;
                  border-radius: 8px;
                  cursor: pointer;
                  font-weight: 500;
                ">
          取消
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(guideDiv);
}; 