# Firebase Firestore 安全規則設定指南

## 🚨 問題描述
應用程式中出現 `FirebaseError: Missing or insufficient permissions` 錯誤，這是因為 Firestore 資料庫的安全規則不允許讀寫操作。

## 📋 解決方案

### 1. 部署 Firestore 安全規則

我們已經創建了 `firestore.rules` 檔案，現在需要將其部署到 Firebase 專案：

#### 方法一：使用 Firebase Console （推薦）
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇你的專案（nicetone）
3. 點選左側選單的 "Firestore Database"
4. 點選頂部的 "規則" 分頁
5. 將 `firestore.rules` 的內容複製並貼上
6. 點選 "發布" 按鈕

#### 方法二：使用 Firebase CLI
```bash
# 安裝 Firebase CLI (如果尚未安裝)
npm install -g firebase-tools

# 登入 Firebase
firebase login

# 初始化專案 (如果尚未初始化)
firebase init firestore

# 部署規則
firebase deploy --only firestore:rules
```

### 2. 安全規則說明

#### 分享數據 (`sharedData` 集合)
- **讀取**: 任何人都可以讀取分享的數據
- **創建**: 任何人都可以創建新的分享數據
- **更新/刪除**: 需要登入認證

#### 使用者個人數據 (`users` 集合)
- **讀寫**: 只有登入的使用者可以存取自己的數據
- **標籤與收藏欄位**: `tags2`、`favorites2` 直接儲存在文件中

### 3. 測試權限

部署規則後，你可以透過以下方式測試：

1. **未登入狀態**: 
   - ✅ 可以讀取分享數據
   - ❌ 無法存取個人收藏或標籤

2. **已登入狀態**:
   - ✅ 可以讀寫自己的收藏和標籤
   - ✅ 可以創建和讀取分享數據
   - ❌ 無法存取其他使用者的個人數據

### 4. 開發期間的臨時解決方案

如果你需要立即測試而不想設定正式規則，可以暫時使用以下測試模式規則（⚠️ 不安全，僅限開發使用）：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 5. 常見問題

#### Q: 我已經部署規則，但仍然出現權限錯誤
A: 
- 確認使用者已正確登入 Firebase Auth
- 檢查瀏覽器開發者工具的 Network 分頁，確認請求包含正確的認證令牌
- 等待幾分鐘讓規則變更生效

#### Q: 分享功能不工作
A: 
- 確認 `sharedData` 集合的規則已正確設定
- 檢查分享 ID 格式是否正確

#### Q: 我的最愛無法儲存
A: 
- 確認使用者已登入
- 檢查 Firebase Auth 的 `uid` 是否正確傳遞給 Firestore 函式

## 🔄 更新測試腳本

為了測試權限修復效果，建議在自動化測試中增加以下測試項目：

1. **未登入狀態的分享功能測試**
2. **登入後的收藏儲存測試**
3. **權限錯誤的偵測測試**

## 📝 注意事項

- 安全規則變更可能需要幾分鐘才會生效
- 在生產環境中，避免使用過於寬鬆的規則
- 定期檢視和更新安全規則，確保符合應用需求
- 考慮實作更細緻的權限控制（例如：資料驗證、速率限制）

部署規則後，應該就能解決 `Missing or insufficient permissions` 的錯誤了！ 