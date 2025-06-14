# Firebase 使用者資料管理指南

## 📋 功能概述

當使用者登入後，系統會自動載入並管理以下資料：

1. **個人收藏** (`favorites2` 欄位)
2. **分享歷史** (`shareHistory` 欄位)
3. **編輯密碼記錄** (包含在分享歷史中)
4. **個人偏好設定** (`preferences` 欄位)

## 🔧 新增的 Firebase 功能

### 1. 載入使用者完整資料
```typescript
import { loadUserProfile } from './utils/firebaseStorage';

const userProfile = await loadUserProfile(uid);
// 回傳：
// {
//   displayName?: string;
//   email?: string;
//   tokens?: number;
//   shareHistory?: Array<{ shareId: string; editPassword: string; createdAt: any }>;
//   preferences?: Record<string, any>;
// }
```

### 2. 分享時自動記錄到使用者歷史
```typescript
import { shareTagsAndFavorites } from './utils/firebaseStorage';

// 傳入使用者 uid 會自動儲存分享記錄
const result = await shareTagsAndFavorites(tags, favorites, uid);
```

### 3. 儲存使用者偏好設定
```typescript
import { saveUserPreferences } from './utils/firebaseStorage';

await saveUserPreferences(uid, {
  fontSize: 'large',
  strictMode: true,
  language: 'zh-TW'
});
```

## 📊 資料結構

### 使用者文檔 (`users/{uid}`)
```javascript
{
  displayName: "使用者名稱",
  email: "user@example.com",
  createdAt: serverTimestamp(),
  tokens: 100,
  shareHistory: [
    {
      shareId: "abc12",
      editPassword: "edit123password",
      createdAt: serverTimestamp()
    }
  ],
  preferences: {
    fontSize: "medium",
    strictMode: false,
    language: "zh-TW"
  },
  favorites2: [
    {
      id: "fav_001",
      text: "Hello, how are you?",
      tagIds: ["tag_001"],
      createdAt: 1640995200000
    }
  ],
  updatedAt: serverTimestamp()
}
```

### 收藏欄位範例
`favorites2` 儲存為 JSON 陣列，每個項目包含 `id`、`text`、`tagIds` 及 `createdAt`。

## 🚀 使用方式

### 在登入成功後載入所有使用者資料
```typescript
const handleUserLogin = async (user: User) => {
  const uid = user.uid;
  
  try {
    // 載入使用者資料（包含分享歷史）
    const userProfile = await loadUserProfile(uid);
    
    // 載入收藏
    const favorites = await loadUserFavorites(uid);
    
    // 更新應用狀態
    setUserProfile(userProfile);
    setFavorites(favorites);
    
    // 顯示分享歷史
    if (userProfile?.shareHistory) {
      console.log('使用者分享歷史:', userProfile.shareHistory);
      setShareHistory(userProfile.shareHistory);
    }
    
  } catch (error) {
    console.error('載入使用者資料失敗:', error);
  }
};
```

### 創建分享時記錄到使用者歷史
```typescript
const handleCreateShare = async () => {
  try {
    const result = await shareTagsAndFavorites(
      tags, 
      favorites, 
      currentUser?.uid // 傳入使用者 ID
    );
    
    console.log('分享成功:', result);
    // 分享記錄會自動儲存到使用者的 shareHistory
    
  } catch (error) {
    console.error('分享失敗:', error);
  }
};
```

## 🔒 權限設定

確保 `firestore.rules` 包含以下規則：

```javascript
// 使用者個人資料規則
match /users/{userId} {
  // 只有該使用者本人可以讀寫自己的文檔
  allow read, write: if request.auth != null && request.auth.uid == userId;
  
}
```

## ✅ 測試檢查清單

- [ ] 登入後能載入使用者資料
- [ ] 收藏功能正常運作（新增、刪除、同步）
- [ ] 分享功能會記錄到使用者歷史
- [ ] 分享歷史包含 shareId 和 editPassword
- [ ] 偏好設定能正確儲存和載入
- [ ] 權限規則正確設定，只有本人能存取自己的資料

## 🐛 除錯提示

如果遇到權限錯誤：
1. 確認已部署正確的 Firestore 規則
2. 檢查使用者是否已正確登入
3. 確認 `uid` 參數正確傳遞
4. 檢查瀏覽器開發者工具的 Network 分頁

如果分享歷史未儲存：
1. 確認 `shareTagsAndFavorites` 呼叫時有傳入 `uid`
2. 檢查 `saveShareToUserHistory` 函式的錯誤訊息
3. 確認使用者文檔的寫入權限 