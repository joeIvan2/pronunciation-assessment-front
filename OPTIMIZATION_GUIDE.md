# Code Optimization Guide

為了提升專案效能與維護性，以下列出與現有程式碼重構相關的重點建議，與 `CLEANUP_CHECKLIST.md` 所列的檔案清理項目互補。

## 1. 抽離共用邏輯
- 建議建立 `useLocalStorage`、`useToggle` 等自定義 Hooks，統一處理 localStorage 與狀態切換邏輯，減少重複程式碼。
- 使用 `useApi` Hook 或服務層 `httpClient` 封裝 `fetch` 請求，集中錯誤處理與逾時設定。

## 2. 組件與樣式整合
- 針對常見的展開/收起區塊，可建立 `CollapsibleSection` 元件並以 `localStorage` 記錄狀態。
- 將分數相關的 `ScoreBar`、`ScoreCard` 整合成單一元件，並統一顏色與格式化邏輯。
- 抽出 `ActionButtons` 元件，處理編輯、刪除等操作按鈕與確認流程。

## 3. 效能最佳化
- 對大量項目（如收藏列表）採用 react-window 等虛擬化方案，降低 DOM 負擔。
- 於頁面及大型元件使用 `React.lazy` 搭配 `Suspense` 進行程式碼分割。
- 透過 `React.memo`、`useMemo` 與 `useCallback` 避免不必要的重新渲染。

## 4. 錯誤處理與回報
- 加入 `ErrorBoundary` 元件捕捉非預期錯誤，避免整個應用崩潰並便於回報。
- 建議集中於 `services` 層記錄與上報錯誤，並提供使用者友善的提示訊息。

## 5. 其他建議
- 以 `DateFormatter` 與 `formatters.ts` 統一時間、分數等格式化函式。
- 設置自動化指令或 CI 流程進行 Lint、型別檢查與效能測試，確保重構後品質。

以上建議可依需求分階段導入，藉此強化專案架構及長期維護性。
