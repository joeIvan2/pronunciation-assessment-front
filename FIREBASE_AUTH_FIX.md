# Firebase Auth COOP 錯誤修復

## 問題描述
在首頁點擊登入按鈕時出現 `Cross-Origin-Opener-Policy policy would block the window.frames call` 錯誤。

## 修復內容

### 1. Auth Hook 改進 (`src/hooks/useFirebaseAuth.ts`)
- ✅ 添加了重定向登入作為備用方案
- ✅ 彈出視窗登入失敗時自動切換到重定向登入
- ✅ 添加了重定向結果檢查
- ✅ 改善了錯誤處理

### 2. Firebase 配置優化 (`src/config/firebaseConfig.ts`)
- ✅ 添加了設備語言支援
- ✅ 優化了 Google Provider 參數
- ✅ 添加了必要的作用域

### 3. HTML Meta 標籤 (`public/index.html`)
- ✅ 添加了 `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- ✅ 添加了 `Cross-Origin-Embedder-Policy: unsafe-none`

### 4. UI 改進
- ✅ 主頁面登入按鈕添加錯誤處理
- ✅ Login 頁面添加載入狀態和錯誤顯示
- ✅ 更好的用戶體驗和錯誤提示

## 測試步驟

### 測試 1: 主頁面登入
1. 前往 `http://localhost:3000`
2. 點擊右上角的 "登入" 按鈕
3. **預期結果**: 
   - 首先嘗試彈出視窗登入
   - 如果失敗，自動使用重定向登入
   - 不應該再出現 COOP 錯誤

### 測試 2: 專用登入頁面
1. 前往 `http://localhost:3000/login`
2. 點擊 "使用 Google 登入" 按鈕
3. **預期結果**: 
   - 顯示載入狀態
   - 成功登入或顯示明確的錯誤訊息

## 登入流程說明

### 優先順序
1. **彈出視窗登入** - 更快速的用戶體驗
2. **重定向登入** - 作為備用方案，解決 COOP 問題

### 錯誤處理
- 自動檢測 COOP 相關錯誤
- 自動切換到重定向模式
- 用戶友好的錯誤訊息
- 控制台詳細日誌

## 如果問題持續存在

### 檢查清單
- [ ] 確認 Firebase Console 中的授權域名包含 `localhost:3000`
- [ ] 檢查瀏覽器是否有廣告攔截器影響
- [ ] 嘗試在無痕模式下測試
- [ ] 檢查瀏覽器控制台是否有其他錯誤

### 手動切換到重定向模式
如果仍有問題，可以修改 `src/hooks/useFirebaseAuth.ts` 第37行：
```typescript
// 強制使用重定向登入
const signInWithGoogle = async (): Promise<void> => {
  try {
    await signInWithRedirect(auth, googleProvider);
    console.log('重定向登入已啟動');
  } catch (error) {
    console.error('登入失敗:', error);
    throw error;
  }
};
```

## 生產環境部署注意事項
1. 確保在 Firebase Console 中添加生產域名到授權域名列表
2. 考慮移除開發用的寬鬆 COOP 設置
3. 測試所有登入流程在生產環境中的表現 