# Firestore 連線分析報告

## 即時連線 (Real-time Listeners)

### 1. 身份驗證監聽器
**檔案**: `src/hooks/useFirebaseAuth.ts`
**函數**: `onAuthStateChanged(auth, callback)`
- **說明**: 監聽使用者登入狀態變化
- **影響**: 持續監聽，高流量使用
- **建議**: 改為手動檢查登入狀態

### 2. 使用者資料即時同步
**檔案**: `src/utils/firestoreSync.ts`
**函數**: `createArraySync()`、`useFirestoreArray()`
- 統一管理 `favorites2`、`tags2` 等陣列欄位
- 透過 `onSnapshot` 推播保持多裝置一致

## 高頻率操作

### 高頻率操作
過去各功能在每次新增、編輯或刪除時都直接寫入 Firestore。
改用 `createArraySync` 後，所有陣列欄位透過 `patch()` 方法更新，
並由 `onSnapshot` 即時推播減少重複寫入。

## 建議的REST API改造

### 1. 批次處理策略
- 收集多個變更，定期批次同步
- 使用本地儲存作為主要資料源
- 定期（如每5分鐘）同步到Firestore

### 2. 快取策略
- 使用 localStorage 作為快取
- 僅在必要時（如跨裝置同步）讀取Firestore
- 實作離線優先策略

### 3. 連線優化
- 移除 `onAuthStateChanged` 持續監聽
- 改為登入時檢查一次
- 使用 REST API 端點而非即時監聽器

## 優先處理項目

1. **身份驗證改造** - 移除即時監聽
2. **收藏夾批次同步** - 降低寫入頻率
3. **歷史記錄優化** - 本地優先策略
4. **標籤管理改造** - 批次處理

## 預估流量減少
- 即時監聽移除: -80% 讀取操作
- 批次同步: -70% 寫入操作
- 本地快取: -60% 總體請求數量 