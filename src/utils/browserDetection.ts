// 檢測是否為內建瀏覽器
export const isInAppBrowser = (): boolean => {
  const userAgent = navigator.userAgent || '';
  const isInApp = 
    userAgent.includes('FBAN') ||        // Facebook
    userAgent.includes('FBAV') ||        // Facebook
    userAgent.includes('Instagram') ||   // Instagram  
    userAgent.includes('Line') ||        // LINE
    userAgent.includes('Messenger');     // Messenger

  return isInApp;
};

// 檢測是否為 iPhone
export const isIPhone = (): boolean => {
  return /iPhone|iPod/.test(navigator.userAgent);
};

// 檢測是否為 iPhone 在內建瀏覽器中（這種情況下 Google OAuth 有問題）
export const isIPhoneInAppBrowser = (): boolean => {
  return isIPhone() && isInAppBrowser();
};

// 檢測是否應該禁用 Google 登入（僅針對 iPhone 在內建瀏覽器）
export const shouldDisableGoogleAuth = (): boolean => {
  return isIPhoneInAppBrowser();
};

// 顯示瀏覽器引導訊息（現在只針對非 iPhone 或 Google OAuth 不可用時）
export const showBrowserGuideMessage = (): void => {
  const userAgent = navigator.userAgent || '';
  const isAndroid = /Android/.test(userAgent);
  
  // iPhone 在內建瀏覽器時不顯示引導訊息，因為 Facebook 可以正常運作
  if (isIPhoneInAppBrowser()) {
    return;
  }

  let message = '為了確保登入功能正常運作，建議您使用外部瀏覽器開啟此頁面。\n\n';
  
  if (isAndroid) {
    message += '請點擊右上角的選單，選擇「在瀏覽器中開啟」或「在 Chrome 中開啟」。';
  } else {
    message += '請點擊右上角或右下角的選單，選擇「在 Safari 中開啟」或「在瀏覽器中開啟」。';
  }

  alert(message);

  // 嘗試開啟外部瀏覽器
  setTimeout(() => {
    if (isAndroid) {
      // Android Chrome Intent
      window.location.href = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      // iOS Safari
      window.location.href = `x-web-search://?${encodeURIComponent(window.location.href)}`;
    }
  }, 1000);
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