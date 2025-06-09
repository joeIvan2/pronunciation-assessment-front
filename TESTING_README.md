# 發音評估應用程式 - 自動化測試說明

## 概述
本測試套件使用 Playwright 進行端到端 (E2E) 自動化測試，確保發音評估應用程式的所有功能正常運作。

## 測試文件結構
```
├── TEST_GUIDE.md           # 完整功能測試指南
├── playwright-test.js      # 主要自動化測試腳本
├── playwright.config.js    # Playwright 配置文件
├── run-tests.ps1          # Windows PowerShell 執行腳本
├── test-package.json      # 測試專用 package.json
└── TESTING_README.md      # 本說明文件
```

## 快速開始

### 1. 環境準備
確保您的系統已安裝：
- Node.js (v14.0.0 或更高版本)
- npm 或 yarn
- Windows PowerShell (Windows 系統)

### 2. 安裝測試依賴
```bash
# 安裝 Playwright
npm install playwright

# 安裝瀏覽器
npx playwright install
```

### 3. 啟動開發伺服器
在另一個終端視窗中：
```bash
npm start
```
確保應用程式運行在 `http://localhost:3000`

### 4. 執行測試

#### 方法一：使用 PowerShell 腳本（推薦）
```powershell
.\run-tests.ps1
```

#### 方法二：直接執行測試
```bash
node playwright-test.js
```

#### 方法三：使用 npm 腳本
```bash
# 複製 test-package.json 為 package.json
cp test-package.json package.json

# 執行測試
npm test
```

## 測試涵蓋範圍

### 核心功能測試
- [x] 應用程式啟動和載入
- [x] 頁面標題驗證
- [x] 發音評分頁面功能
- [x] 文字輸入和編輯
- [x] 句子庫選擇
- [x] 標籤過濾功能
- [x] 側邊欄功能（我的最愛、發音歷史等）
- [x] 數據分享功能
- [x] AI 助理功能
- [x] Firebase 登入功能

### 技術測試
- [x] 響應式設計（桌面、平板、手機）
- [x] 跨瀏覽器兼容性
- [x] 性能測試
- [x] 錯誤處理

## 測試結果

### 輸出文件
測試完成後會生成以下文件：
- `test-report.md` - 詳細測試報告
- `test-results.png` - 應用程式截圖
- `test-results/` - 測試結果目錄（如果使用 Playwright Test Runner）

### 測試狀態指示
- ✅ 測試通過
- ❌ 測試失敗
- ⚠️ 測試警告
- 📋 測試步驟
- 🎉 測試完成

## 自定義測試

### 修改測試設定
編輯 `playwright.config.js` 來調整：
- 瀏覽器設定
- 視窗大小
- 超時時間
- 重試次數

### 添加新測試
在 `playwright-test.js` 中添加新的測試案例：

```javascript
// 測試新功能
console.log('\n📋 測試13: 新功能測試');
await page.click('button:has-text("新功能")');
await page.waitForSelector('.new-feature');
console.log('✅ 新功能正常運作');
```

### 無頭模式執行
```bash
HEADLESS=true node playwright-test.js
```

## 故障排除

### 常見問題

#### 1. 端口被佔用
```
❌ 開發伺服器未運行
```
**解決方案：**
- 確保開發伺服器在 3000 端口運行
- 檢查是否有其他程序佔用端口

#### 2. Playwright 未安裝
```
❌ Playwright 安裝失敗
```
**解決方案：**
```bash
npm install playwright
npx playwright install
```

#### 3. 測試元素找不到
```
❌ TimeoutError: locator not found
```
**解決方案：**
- 檢查應用程式是否正確載入
- 驗證元素選擇器是否正確
- 增加等待時間

#### 4. Firebase 連線問題
```
⚠️ Firebase登入可能使用重定向模式
```
**解決方案：**
- 檢查 Firebase 配置
- 確認網路連線
- 驗證認證設定

### 調試技巧

#### 1. 啟用詳細日誌
```javascript
// 在測試腳本中添加
await page.setViewportSize({ width: 1920, height: 1080 });
await page.screenshot({ path: 'debug.png' });
console.log(await page.content());
```

#### 2. 慢速執行
```javascript
const browser = await chromium.launch({ 
  headless: false, 
  slowMo: 1000  // 每個動作間隔1秒
});
```

#### 3. 保留瀏覽器開啟
```javascript
// 移除 await browser.close(); 
// 讓瀏覽器保持開啟以便調試
```

## 持續整合 (CI/CD)

### GitHub Actions 範例
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npx playwright install
      - run: npm start &
      - run: npm run test:headless
```

## 最佳實踐

### 1. 測試前檢查
- 確保開發伺服器運行
- 檢查網路連線
- 驗證 Firebase 設定

### 2. 定期執行
- 每次代碼變更後
- 部署前
- 每日自動測試

### 3. 測試數據管理
- 使用測試專用數據
- 避免影響生產數據
- 清理測試數據

### 4. 報告分析
- 定期檢查測試報告
- 分析失敗原因
- 改進測試覆蓋率

## 支援與聯絡
如有測試相關問題，請：
1. 檢查本文件的故障排除章節
2. 查看 `TEST_GUIDE.md` 詳細指南
3. 聯絡開發團隊

---

**版本：** v1.0  
**最後更新：** 2025/01/09  
**維護者：** NiceTone 開發團隊 