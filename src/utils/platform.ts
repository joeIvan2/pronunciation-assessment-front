import { isPlatform } from '@ionic/react';

// 檢測當前平台
export const getPlatform = () => {
  if (isPlatform('ios')) {
    return 'ios';
  } else if (isPlatform('android')) {
    return 'android';
  } else if (isPlatform('desktop')) {
    return 'desktop';
  } else if (isPlatform('tablet')) {
    return 'tablet';
  } else if (isPlatform('mobile')) {
    return 'mobile';
  }
  return 'unknown';
};

// 檢查是否是移動設備
export const isMobile = () => {
  return isPlatform('mobile') || isPlatform('android') || isPlatform('ios');
};

// 檢查是否是平板
export const isTablet = () => {
  return isPlatform('tablet');
};

// 檢查是否是 iOS 設備
export const isIOS = () => {
  return isPlatform('ios');
};

// 檢查是否是 Android 設備
export const isAndroid = () => {
  return isPlatform('android');
};

// 檢查是否是桌面設備
export const isDesktop = () => {
  return isPlatform('desktop');
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