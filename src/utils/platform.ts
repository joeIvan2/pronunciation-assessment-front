// 使用原生方法檢測平台而不依賴 Ionic

// 檢測當前平台
export const getPlatform = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  } else if (/android/i.test(userAgent)) {
    return 'android';
  } else if (window.innerWidth > 768 && !isMobile()) {
    return 'desktop';
  } else if (window.innerWidth >= 600 && window.innerWidth <= 1024) {
    return 'tablet';
  } else if (isMobile()) {
    return 'mobile';
  }
  return 'unknown';
};

// 檢查是否是移動設備
export const isMobile = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

// 檢查是否是平板
export const isTablet = () => {
  return window.innerWidth >= 600 && window.innerWidth <= 1024 && isTouchSupported();
};

// 檢查是否是 iOS 設備
export const isIOS = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
};

// 檢查是否是 Android 設備
export const isAndroid = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android/i.test(userAgent);
};

// 檢查是否是桌面設備
export const isDesktop = () => {
  return window.innerWidth > 768 && !isMobile();
};

// 根據平台返回適當的類名
export const getPlatformClass = () => {
  if (isIOS()) return 'platform-ios';
  if (isAndroid()) return 'platform-android';
  if (isDesktop()) return 'platform-desktop';
  if (isTablet()) return 'platform-tablet';
  return '';
};

// 檢測是否支持觸控操作
export const isTouchSupported = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}; 