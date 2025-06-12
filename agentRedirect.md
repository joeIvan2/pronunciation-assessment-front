# Agent 檢測與跳轉邏輯文檔

本文檔整理了系統中所有基於 UserAgent 的環境檢測和跳轉邏輯。

## 檢測函數定義

### 基礎檢測函數
位置：`src/pages/PronunciationAssessment.tsx`

```javascript
// iOS設備檢測
const isIOS = () => {
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
};

// Facebook In-App瀏覽器檢測
const isFacebookInApp = () => {
  return /fban|fbav|fb_iab/i.test(navigator.userAgent.toLowerCase());
};

// LINE In-App瀏覽器檢測
const isLineInApp = () => {
  return /line/i.test(navigator.userAgent.toLowerCase());
};
```

### 外部檢測函數
位置：`src/utils/browserDetection.js`

```javascript
// Android WebView檢測
export const isAndroidWebView = () => {
  // 檢測邏輯（需要確認具體實現）
};
```

## Modal組件檢測與跳轉邏輯

### 1. IOSFacebookModal
**檔案**: `src/components/IOSFacebookModal.tsx`

**觸發條件**: `isIOS() && isFacebookInApp()`

**顯示邏輯**:
```javascript
// PronunciationAssessment.tsx 中的初始檢測
useEffect(() => {
  if (isIOS() && isFacebookInApp()) {
    setShowIOSFacebookModal(true);
  }
}, []);
```

**功能**: 
- 顯示操作指引modal
- 無自動跳轉
- 指導用戶手動切換瀏覽器

**內容**: 
- 標題: "🔍 為了達到最好的瀏覽效果"
- 說明: "請點擊右下角的**三個橫點按鈕（⋯）**，選擇「在瀏覽器中開啟」或「在 Safari 中開啟」"
- 無按鈕（用戶需手動操作）

**z-index**: 10000

---

### 2. IOSLINEModal
**檔案**: `src/components/IOSLINEModal.tsx`

**觸發條件**: `isIOS() && isLineInApp()`

**顯示邏輯**:
```javascript
// PronunciationAssessment.tsx 中的初始檢測
useEffect(() => {
  if (isIOS() && isLineInApp()) {
    setShowIOSLINEModal(true);
  }
}, []);
```

**自動跳轉邏輯**:
```javascript
React.useEffect(() => {
  // 檢查是否在LINE環境中
  const isLineInApp = /line/i.test(navigator.userAgent.toLowerCase());
  
  if (isLineInApp) {
    // 延遲100毫秒後自動跳轉
    const timer = setTimeout(() => {
      let currentUrl = window.location.href;

      // 避免重複加參數
      if (!currentUrl.includes('openExternalBrowser=1')) {
        const separator = currentUrl.includes('?') ? '&' : '?';
        currentUrl = `${currentUrl}${separator}openExternalBrowser=1`;
      }

      // 執行跳轉
      window.location.replace(currentUrl);
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, []);
```

**功能**:
- 顯示跳轉modal
- 1秒後自動跳轉到當前URL + `openExternalBrowser=1`參數
- 手動按鈕跳轉選項

**內容**:
- 標題: "🔍 為了達到最好的瀏覽效果"
- 按鈕: "點此為您開啟標準瀏覽器"

**z-index**: 10000

---

### 3. AndroidChromeModal
**檔案**: `src/components/AndroidChromeModal.tsx`

**觸發條件**: `isAndroidWebView()` (舊邏輯，已改為下方新邏輯)

**新的自動跳轉檢測邏輯**:
```javascript
React.useEffect(() => {
  // 檢查是否在Android + LINE環境中
  const isAndroid = /android/i.test(navigator.userAgent);
  const isLineInApp = /line/i.test(navigator.userAgent.toLowerCase());
  
  if (isAndroid && isLineInApp) {
    // 延遲100毫秒後自動跳轉
    const timer = setTimeout(() => {
      let currentUrl = window.location.href;

      // 避免重複加參數
      if (!currentUrl.includes('openExternalBrowser=1')) {
        const separator = currentUrl.includes('?') ? '&' : '?';
        currentUrl = `${currentUrl}${separator}openExternalBrowser=1`;
      }

      // 執行跳轉
      window.location.replace(currentUrl);
    }, 100);
    
    return () => clearTimeout(timer);
  }
}, []);
```

**顯示邏輯**:
```javascript
// PronunciationAssessment.tsx 中的初始檢測
useEffect(() => {
  if (isAndroidWebView()) {
    setShowAndroidModal(true);
  }
}, []);
```

**功能**:
- 顯示跳轉modal
- 在Android + LINE環境下，1秒後自動跳轉到固定URL
- 手動按鈕跳轉選項

**內容**:
- 標題: "切換至 Chrome 瀏覽器"
- 說明: "為了更佳的使用體驗，將為您切換到 Chrome 瀏覽器。"
- 按鈕: "前往 Chrome"
- 跳轉目標: `https://nicetone.ai/?openExternalBrowser=1`

**z-index**: 10000

## 跳轉目標整理

### URL參數說明
- `openExternalBrowser=1`: 表示用戶要求在外部瀏覽器中打開

### 跳轉邏輯

**URL構建邏輯：**
- 在當前URL後添加 `openExternalBrowser=1` 參數
- 自動檢查避免重複添加相同參數

**具體行為：**
1. **iOS + LINE**: 當前URL + `openExternalBrowser=1` (避免重複)
2. **Android + LINE**: 當前URL + `openExternalBrowser=1` (避免重複)
3. **iOS + Facebook**: 無自動跳轉，顯示手動操作指引

## 環境檢測邏輯總結

| 環境組合 | 檢測邏輯 | 觸發組件 | 自動跳轉 | 跳轉目標 |
|---------|---------|---------|---------|---------|
| iOS + Facebook | `isIOS() && isFacebookInApp()` | IOSFacebookModal | ❌ | - |
| iOS + LINE | `isIOS() && isLineInApp()` | IOSLINEModal | ✅ (0.1秒) | 當前URL + `openExternalBrowser=1` |
| Android + LINE | `isAndroid && isLineInApp` | AndroidChromeModal | ✅ (0.1秒) | 當前URL + `openExternalBrowser=1` |
| Android WebView | `isAndroidWebView()` | AndroidChromeModal | ❌ | 手動點擊跳轉 |

## UserAgent 檢測正則表達式

```javascript
// iOS設備
/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())

// Android設備
/android/i.test(navigator.userAgent)

// Facebook App
/fban|fbav|fb_iab/i.test(navigator.userAgent.toLowerCase())

// LINE App
/line/i.test(navigator.userAgent.toLowerCase())

// Android WebView (需確認具體實現)
/wv|webview/i.test(navigator.userAgent) && /android/i.test(navigator.userAgent)
```

## 注意事項

1. **避免無限跳轉**: 所有自動跳轉都包含環境檢測，確保只在特定環境下執行
2. **z-index層級**: 所有browser redirect modal設定為10000，高於一般modal(1000)
3. **延遲跳轉**: 給用戶1秒時間看到提示信息
4. **cleanup**: 所有setTimeout都有對應的cleanup邏輯

## 待確認項目

1. `isAndroidWebView()` 函數的具體實現邏輯
2. 是否需要統一所有檢測函數到一個工具檔案中
3. 是否需要添加更多環境檢測（如微信、其他瀏覽器等） 