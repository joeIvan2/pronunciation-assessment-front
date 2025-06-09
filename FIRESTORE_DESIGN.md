# Firestore 資料庫規劃

以下設計用於取代現有的 localStorage，確保使用者在不同裝置間仍能存取個人資料與分享紀錄。

## 1. users（集合）
每位登入使用者皆以 Firebase Auth 的 `uid` 作為文件 ID。

欄位範例：
- `displayName`：使用者名稱
- `email`：電子郵件
- `createdAt`：建立時間（`serverTimestamp`）
- `tokens`：剩餘可使用次數
- `shareHistory`：陣列，記錄曾分享的 `shareId` 與 `editPassword`
- `preferences`：物件，儲存字體大小、嚴格模式等設定

### 子集合
- `tags`：自訂標籤，欄位包含 `tagId`、`name`、`color`、`createdAt`
- `favorites`：收藏句子，欄位包含 `id`、`text`、`tagIds`、`createdAt`

## 2. sharedData（集合）
用於分享標籤與收藏，格式已在程式碼中實作。

欄位範例：
- `shareId`（文件 ID）
- `editPassword`
- `tags`
- `favorites`
- `createdAt`
- `updatedAt`

## 3. 使用建議
1. 以雲端資料取代 localStorage，使用 `getDoc` 與 `setDoc` 同步設定。
2. 未登入時僅提供預設內容，不在 localStorage 儲存任何資料。
3. 在 AI 造句或其他服務消耗 token 時，更新 `tokens` 欄位。
4. 對 `users/{uid}/favorites`、`users/{uid}/tags` 建立索引，以加速查詢。
5. 透過 Firestore 安全規則，限制只有本人可讀寫 `users/{uid}` 下的資料。

## 4. 後端請求安全性
AI 相關的 POST 與 GET 請求應一併帶上 `uid`，便於驗證與流量控管，避免遭到大量垃圾攻擊。建議保護的端點包含：
1. `/api/generate`：AI 造句服務，依使用次數扣除 `tokens`。
2. `/api/pronunciation`：發音評分與音素分析。
3. `/api/share`：建立或更新分享資料。
4. 其他可能大量存取的功能（例：OCR、語音轉文字）。

伺服器端應檢查 `uid` 的有效性與使用者剩餘 `tokens`，超過限制時拒絕服務，以避免被塞爆。

此規劃可確保資料在不同裝置間保持一致，並支援後續擴充。 
