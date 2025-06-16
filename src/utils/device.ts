export const isIOS = () => /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
export const isFacebookInApp = () => /fban|fbav|fb_iab/i.test(navigator.userAgent.toLowerCase());
export const isLineInApp = () => /line/i.test(navigator.userAgent.toLowerCase());
