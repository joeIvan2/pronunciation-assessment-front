# File Analysis Log

此紀錄列出近期檢視過的檔案與初步發現，以利後續清理與優化。內容將持續更新。

## 2024-04 檢視摘要
- `src/components/ScoreCard.tsx`：未在任何頁面載入，可移除。
- `debug-horizontal-scroll.js`、`quick-debug.js`：僅供臨時排錯，未在專案使用。
- `src/assets/logo.webp` 與 `src/logo.svg`：資源未於程式引用。
- `src/utils/platform.ts`：未被匯入；其判斷函式重複其他工具庫功能。
- `public` 目錄內的 `logo192.png`、`logo512.png`、`favicon.ico` 同為預設檔案，可視需求清除。
- `src/docs/streaming-backend-example.md`：示範性文件，建議移至 wiki。
- `src/App.test.js` 及 `src/setupTests.js`：CRA 預設測試檔案，若未撰寫測試可刪除。

## 其他待確認項目
- `src/utils/api.ts` 中的語音合成函式目前未使用，但未來功能可能會取用。
- `firebaseStorage.ts` 的刪除與測試相關函式在現行流程未呼叫。
- `FIREBASE_AUTH_FIX.md`、`FIREBASE_SETUP.md` 為先前問題紀錄，可整理後整合至 README。

上述觀察將配合 `CLEANUP_CHECKLIST.md` 逐步處理，以保持程式碼整潔。

## 2025-06 檢視摘要
- `.env.example` 及其他環境設定檔尚未統一管理，應確認忽略規則。
- `coverage/`、`build/` 等產出目錄可由 `.gitignore` 控制，避免誤入版本庫。
- `src/components/ScoreCard.tsx` 仍未於頁面使用，可考慮移除或併入其他元件。
