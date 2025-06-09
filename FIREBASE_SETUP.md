# Firebase 連接問題修復指南

## 當前問題
您的應用程式遇到 Firebase Firestore 連接錯誤，主要原因是：
- 資料庫名稱不匹配（使用 `nicetone` 而非預設的 `(default)`）
- Firestore 安全規則需要正確設置

## 修復步驟

### 1. 檢查 Firestore 資料庫
確保您在 Firebase Console 中已創建名為 `nicetone` 的資料庫：

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案 `nicetone-6007b`
3. 點擊 "Firestore Database"
4. 確認左上角顯示的資料庫名稱是 `nicetone`

### 2. 設置 Firestore 安全規則
在 Firebase Console 中設置正確的 Firestore 規則：

1. 在 Firestore Database 頁面
2. 確保選擇了 `nicetone` 資料庫（左上角下拉選單）
3. 前往 "規則" 標籤
4. 將規則更新為以下內容：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 允許對 sharedData 集合的讀寫操作
    match /sharedData/{document} {
      // 允許任何人讀取分享的數據
      allow read: if true;
      
      // 允許任何人創建新的分享數據
      allow create: if true;
      
      // 只允許有正確編輯密碼的用戶更新數據
      allow update: if request.auth != null || 
                       (resource.data.editPassword == request.data.editPassword);
      
      // 只允許有正確編輯密碼的用戶刪除數據
      allow delete: if request.auth != null || 
                       (resource.data.editPassword == request.data.editPassword);
    }
    
    // 允許對 test 集合的讀寫操作（用於連接測試）
    match /test/{document} {
      allow read, write: if true;
    }
    
    // 其他集合的預設規則（拒絕所有操作）
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

5. 點擊 "發布" 按鈕

### 3. 測試連接（臨時開放規則）
如果仍有問題，可以暫時使用完全開放的規則進行測試：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true; // 僅用於測試！
    }
  }
}
```

**重要：測試完成後請立即改回安全的規則！**

### 4. 程式碼配置
應用程式已正確配置為連接到 `nicetone` 資料庫：

```typescript
// src/config/firebaseConfig.ts
export const db = getFirestore(app, 'nicetone');
```

### 5. 瀏覽器控制台測試
在瀏覽器控制台中運行以下測試：

```javascript
// 載入測試腳本
const script = document.createElement('script');
script.src = '/firebase-test.js';
document.head.appendChild(script);

// 運行測試
setTimeout(() => {
  if (window.testFirebaseModern) {
    window.testFirebaseModern();
  }
}, 1000);
```

## 常見問題排除

### 問題：Missing or insufficient permissions
**原因：** Firestore 規則拒絕存取
**解法：** 檢查並更新 Firestore 規則（步驟 2）

### 問題：ERR_BLOCKED_BY_CLIENT
**原因：** 瀏覽器擴充功能（如 AdBlock）阻擋連接
**解法：** 停用相關擴充功能或加入允許清單

### 問題：FIRESTORE INTERNAL ASSERTION FAILED
**原因：** 資料庫名稱錯誤或不存在
**解法：** 確認 `nicetone` 資料庫存在且程式碼正確

## 預期結果
修復後，您應該看到：
- Firebase 狀態顯示為 "✅ Firebase 已連接"
- 控制台顯示 "Firebase 配置完成，連接到資料庫: nicetone"
- 數據分享功能正常運作
- 沒有 400 或權限錯誤

## 相關檔案
- `src/config/firebaseConfig.ts` - Firebase 配置
- `src/utils/firebaseStorage.ts` - Firebase 存儲服務
- `src/components/FirebaseStatus.tsx` - 連接狀態監控
- `public/firebase-test.js` - 連接測試腳本 