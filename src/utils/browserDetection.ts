const ua = navigator.userAgent.toLowerCase();

// 檢測是否為內建瀏覽器
export const isInAppBrowser = (): boolean => {
  return /fban|fbav|fb_iab|line|instagram|messenger/i.test(ua);
};

// 檢測是否為 iPhone
export const isIPhone = (): boolean => {
  return /iphone|ipod/.test(ua);
};

// 檢測是否為 iOS 設備（包括 iPhone、iPad、iPod）
export const isIOS = (): boolean => {
  return /iphone|ipad|ipod/.test(ua);
};

// 檢測是否為 iPhone 在內建瀏覽器中（這種情況下 Google OAuth 有問題）
export const isIPhoneInAppBrowser = (): boolean => {
  return isIPhone() && isInAppBrowser();
};

// 檢測是否為 iOS 設備在內建瀏覽器中
export const isIOSInAppBrowser = (): boolean => {
  return isIOS() && isInAppBrowser();
};

// 檢測是否為 Facebook 內建瀏覽器
export const isFacebookInAppBrowser = (): boolean => {
  return /fban|fbav|fb_iab/i.test(ua);
};

// 檢測是否為 LINE 內建瀏覽器
export const isLineInAppBrowser = (): boolean => {
  return /line/i.test(ua);
};

// 檢測是否應該禁用 Google 登入（不再隱藏按鈕，統一採用引導方式）
export const shouldDisableGoogleAuth = (): boolean => {
  // 不再隱藏任何按鈕，統一採用引導訊息的方式
  return false;
};

// 為URL添加openExternalBrowser參數的函式
export const appendOpenExternalBrowserParam = (originalURL: string): string => {
  try {
    const url = new URL(originalURL);
    url.searchParams.set('openExternalBrowser', '1');
    return url.toString();
  } catch (error) {
    console.error('URL解析失敗:', error);
    return originalURL;
  }
};

// 檢測是否為 Messenger 內建瀏覽器
export const isMessengerInAppBrowser = (): boolean => {
  return /messenger/i.test(ua);
};

// 顯示瀏覽器引導訊息
export const showBrowserGuideMessage = (): void => {
  const isAndroid = /android/.test(ua);

  if (isAndroid) {
    // Android WebView 顯示跳轉提示 Modal
    console.log('Android WebView 檢測到，顯示跳轉 Chrome 的提示');
    window.dispatchEvent(new Event('showAndroidChromeModal'));
    return;
  }

  // iOS LINE 使用 openExternalBrowser 參數直接跳轉
  if (isLineInAppBrowser()) {
    console.log('iOS LINE WebView 檢測到，使用 openExternalBrowser 參數跳轉');
    const currentUrl = window.location.href;
    const newUrl = appendOpenExternalBrowserParam(currentUrl);
    window.location.href = newUrl;
    return;
  }

  // iOS 設備顯示引導訊息
  let message = '為了確保登入功能正常運作，建議您使用外部瀏覽器開啟此頁面。\n\n';
  
  // iOS 設備針對不同的內建瀏覽器提供具體的操作指導
  if (isFacebookInAppBrowser() || isMessengerInAppBrowser()) {
    message += '請點擊右下角的選單，選擇「在瀏覽器中開啟」或「在 Safari 中開啟」。';
  } else {
    // 其他iOS內建瀏覽器的一般性指導
    message += '請點擊右上角或右下角的選單，選擇「在 Safari 中開啟」或「在瀏覽器中開啟」。';
  }

  alert(message);

  // 對於所有iOS瀏覽器，只重新整理頁面，不進行跳轉
  setTimeout(() => {
    // 只是重新整理頁面，用戶需要手動點擊選單開啟外部瀏覽器
    window.location.reload();
  }, 1000);
};

// 檢測是否在行動裝置上
export const isMobile = (): boolean => {
  return /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
};

// 獲取當前網址並生成外部瀏覽器連結
export const getExternalBrowserLink = (): string => {
  const currentUrl = window.location.href;
  
  // 如果是 Android，使用 intent:// 強制用 Chrome 開啟
  if (/android/.test(ua)) {
    return `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end;`;
  }
  
  // 其他情況使用一般連結
  return currentUrl;
}; 