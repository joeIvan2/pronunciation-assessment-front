# 發音評估 E2E 測試指南

## 📋 測試概述

本專案包含完整的 E2E 測試套件，支援登入狀態管理和完整功能測試。

## 🚀 快速開始

### 1. 安裝瀏覽器依賴
```bash
npm run test:install
```

### 2. 基準測試（無需登入）
```bash
npm run test:baseline
```

### 3. 手動登入設置
```bash
npm run test:login
```
這個命令會：
- 在瀏覽器中開啟應用程式
- 給您 5 分鐘時間手動登入
- 自動保存登入狀態

### 4. 登入後功能測試
```bash
npm run test:logged-in
```

## 🔐 認證狀態管理

### 手動登入流程
1. 執行 `npm run test:login`
2. 在開啟的瀏覽器中完成登入
3. 等待自動保存認證狀態
4. 後續測試將使用保存的登入狀態

### 認證狀態檢查
```bash
npm run test:auth
```

## 📝 測試腳本說明

### 基準測試
- **檔案**: `tests/playwright-test.js`
- **目標**: 測試基本的發音評估流程
- **流程**: 
  1. 輸入測試文字
  2. 點擊開始錄音
  3. 等待 3 秒
  4. 點擊結束錄音
  5. 驗證結果顯示

### 認證狀態管理
- **功能**: 檢查並保存登入狀態
- **自動檢測**: 登入/登出按鈕
- **狀態保存**: 保存到 `.auth/user.json`

### 登入後功能測試
- **前提**: 需要已保存的認證狀態
- **測試**: 完整的登入後功能流程
- **驗證**: 確認分數顯示和功能正常

## 🔧 故障排除

### 認證狀態遺失
如果認證狀態遺失，重新執行：
```bash
npm run test:login
```

### 測試超時
調整 `playwright.config.js` 中的超時設定：
```javascript
timeout: 60000, // 60 秒
```

### 元素選擇器問題
測試使用多種選擇器策略：
- `data-testid` 屬性
- 文字內容匹配
- 按鈕角色匹配
- CSS 選擇器

## 📊 測試報告

測試完成後，查看報告：
```bash
npx playwright show-report
```

## 🎯 最佳實踐

1. **先執行基準測試** 確保基本功能正常
2. **定期更新認證狀態** 避免過期
3. **使用 --headed 模式** 除錯時查看瀏覽器行為
4. **檢查測試日誌** 了解測試進度和問題

## 🔄 完整測試流程

```bash
# 1. 安裝依賴
npm run test:install

# 2. 執行基準測試
npm run test:baseline

# 3. 手動登入設置
npm run test:login

# 4. 執行登入後功能測試
npm run test:logged-in

# 5. 查看測試報告
npx playwright show-report
```

## 📁 文件結構

```
tests/
├── playwright-test.js          # 主要測試文件
├── pronunciation-assessment.spec.js  # 基本功能測試
└── README.md                   # 本指南

.auth/
└── user.json                   # 保存的認證狀態（不納入版本控制）
```

## 💡 提示

- 使用 `--headed` 參數可以看到瀏覽器操作
- 使用 `--debug` 參數可以逐步執行測試
- 認證狀態文件會自動排除在版本控制之外
- 測試失敗時會自動截圖保存到 `test-results/` 目錄 