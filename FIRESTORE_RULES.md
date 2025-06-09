# Firestore 安全規則

## 生產環境推薦規則

請在 Firebase Console 中設置以下安全規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 分享數據集合 - 允許讀取和創建，更新和刪除需要密碼驗證
    match /sharedData/{document} {
      // 允許任何人讀取分享的數據
      allow read: if true;
      
      // 允許任何人創建新的分享數據
      allow create: if true;
      
      // 更新需要認證或正確的編輯密碼
      allow update: if request.auth != null || 
                       (resource.data.editPassword == request.data.editPassword);
      
      // 刪除需要認證或正確的編輯密碼
      allow delete: if request.auth != null || 
                       (resource.data.editPassword == request.data.editPassword);
    }
    
    // 用戶個人數據（如果將來需要）
    match /users/{userId} {
      // 只允許已認證的用戶存取自己的數據
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 其他集合預設拒絕存取
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 開發/測試環境規則（僅用於測試）

如果需要進行開發測試，可以暫時使用以下規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // 測試集合 - 完全開放（僅用於開發測試）
    match /test/{document} {
      allow read, write: if true;
    }
    
    // 分享數據集合
    match /sharedData/{document} {
      allow read, write: if true;
    }
    
    // 其他集合拒絕存取
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**⚠️ 重要：測試完成後請立即改回生產環境規則！**

## 規則說明

### sharedData 集合
- **讀取（read）**: 任何人都可以讀取分享的數據
- **創建（create）**: 任何人都可以創建新的分享
- **更新（update）**: 需要 Firebase 認證或提供正確的編輯密碼
- **刪除（delete）**: 需要 Firebase 認證或提供正確的編輯密碼

### 安全特性
1. **密碼保護**: 更新和刪除操作需要編輯密碼驗證
2. **認證用戶**: 已登入的用戶可以管理任何分享數據
3. **讀取開放**: 分享功能需要公開讀取權限
4. **創建開放**: 任何人都可以創建新的分享

### 如何設置
1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 選擇專案 `nicetone-6007b`
3. 點擊 "Firestore Database"
4. 前往 "規則" 標籤
5. 複製上述生產環境規則
6. 點擊 "發布" 按鈕

## 驗證規則
設置完成後，您的應用程式應該能夠：
- ✅ 創建新的分享連結
- ✅ 讀取分享的數據
- ✅ 使用編輯密碼更新分享數據
- ✅ Firebase 狀態顯示 "已連接" 