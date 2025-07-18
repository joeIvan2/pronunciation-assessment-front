# 🎯 發音評估平台 (Pronunciation Assessment Platform)

一個基於 Microsoft Azure 語音服務的智慧發音評估平台，提供專業的英語發音分析、學習管理和資料分享功能。

![Platform Logo](nicetone.webp)

## ✨ 核心功能

### 🎤 智慧發音評估
- **即時錄音評估**：支援麥克風錄音，立即取得發音評分
- **多維度評分**：提供準確度、流暢度、完整度和韻律評分
- **詳細音素分析**：逐詞逐音素的錯誤偵測和改進建議
- **嚴格模式**：可調整評估標準的嚴格程度

- **串流評估**：後端模式支援錄音串流上傳，獲取即時評分
### 📝 文字輸入與管理
- **多種輸入方式**：支援手動輸入、語音轉文字、圖片文字辨識
- **智慧文字處理**：自動格式化和句子分割
- **字體大小調節**：可調整文字顯示大小，適應不同需求
- **歷史紀錄**：自動儲存評估歷史，支援快速重新載入

### 🔊 語音合成與播放
- **多語音選擇**：支援多種 AI 語音角色
- **語速調節**：可調整播放語速

### ⭐ 收藏與標籤系統
- **智慧收藏**：��鍵收藏練習句子
- **標籤管理**：建立、編輯、刪除自訂標��
- **分類篩選**：按標籤快速篩選收藏內容
- **批次操作**：支援批次匯入和匯出收藏資料

### 🤖 AI 智慧助理
- **學習建議**：基於發音評估結果提供個人化學習建議
- **錯誤分析**：深度分析發音錯誤模式
- **練習推薦**：智慧推薦相關練習內容
- **圖文輸入**：AI藉由分析圖片內容推薦相關練習內容
- **多圖上傳**：一次上傳多張圖片供 AI 分析

### 📊 資料分享與同步
- **雲端分享**：將收藏和標籤資料分享到雲端
- **跨裝置同步**：透過分享連結在不同裝置間同步資料
- **版本控制**：支援資料更新和版本管理
- **隱私保護**：使用加密雜湊保護資料安全

## 🚀 快速開始

### 環境需求
- Node.js 16.0 或更高版本
- npm 或 yarn 套件管理器
- 現代瀏覽器（支援 Web Audio API）

### 安裝步驟

1. **複製專案**
```bash
git clone https://github.com/your-username/pronunciation-assessment-front.git
cd pronunciation-assessment-front
```

2. **安裝相依套件**
```bash
npm install
# 或
yarn install
```

3. **設定 Azure 語音服務**
   - 在 Azure 入口網站建立語音服務資源
   - 取得 API 金鑰和區域資訊
   - 在應用程��中設定 Azure 設定

4. **設定 Firebase 並啟用 Google 登入**
   - 建立 Firebase 專案並在驗證頁啟用 Google Sign-In
   - 在 `.env` 檔案加入下列設定：
     ```
     REACT_APP_FIREBASE_API_KEY=yourKey
      # authDomain 預設會使用當前網域 (window.location.hostname)，可視需要覆蓋
      REACT_APP_FIREBASE_AUTH_DOMAIN=yourApp.firebaseapp.com
      REACT_APP_FIREBASE_PROJECT_ID=yourProjectId
      REACT_APP_FIREBASE_APP_ID=yourAppId
     ```

5. **啟動開發伺服器**
```bash
npm start
```

6. **存取應用程式**
   - 開啟瀏覽器前往 `http://localhost:3000`

## 🛠️ 技術架構

### 前端技術堆疊
- **React 18**：現代化的使用者介面框架
- **TypeScript**：型別安全的 JavaScript 超集
- **CSS3**：響應式設計和 iOS 風格介面
- **Web Audio API**：音訊錄製和處理

### 核心相依套件
- `microsoft-cognitiveservices-speech-sdk`：Azure 語音服務 SDK
- `react-router-dom`：路由管理
- `crypto-js`：資料加密
- `tesseract.js`：OCR 文字辨識
- `ffmpeg`：音訊格式轉換

### 專案結構
```
src/
├── components/          # 可重複使用元件
│   ├── FavoriteList.tsx    # 收藏清單管理
│   ├── TagManager.tsx      # 標籤管理
│   ├── ShareData.tsx       # 資料分享
│   ���── AIDataProcessor.tsx # AI 助理
│   └── ...
├── hooks/              # 自訂 React Hooks
│   ├── useRecorder.ts     # 錄音功能
│   ├── useAzureSpeech.ts  # Azure 語音服務
│   └── useBackendSpeech.ts # 後端 API
├── pages/              # 頁面元件
│   └── PronunciationAssessment.tsx
├── utils/              # 工具函式
│   └── storage.ts         # 本機儲存管理
├── types/              # TypeScript 型別定義
└── styles/             # 樣式檔案
```

### 主要檔案功能 (詳細分析)
- **`src/pages/PronunciationAssessment.tsx` (112.7 KB) - 核心應用程式協調器 (Core Application Orchestrator):**
    此檔案是整個產品的**大腦與心臟**，其設計展現了我們構建複雜、高內聚、可擴展應用的核心技術能力。它不僅僅是一個UI頁面，而是一個精密的**狀態機**與**服務協調器**，負責：
    *   **多維度狀態管理**: 精準管理超過20個獨立的應用狀態，從用戶身份驗證、API設定，到即時的評分結果、學習歷程與UI互動狀態，確保數據流的穩定與一致。
    *   **模組化架構**: 作為總指揮，它優雅地整合了超過15個獨立的功能模組（如AI助理、收藏列表、分享引擎等），實現了高度的功能解���與可維護性，為未來快速的功能擴展奠定了堅實的基礎。
    *   **動態功能路由**: 透過`useEffect`鉤子，實現了基於URL參數的智慧路由功能，能處理自動登入、載入分享教材、啟動AI助理等多種深度連結（Deep Linking）場景，是實現病毒式行銷與用戶無縫引導的关键。
    *   **即時數據同步**: 內建與Firebase的即時監聽器（`onSnapshot`），確保用戶數據在多裝置間的無縫、即時同步，並設計了精巧的數據鏡像機制（`latestUpdateRef`）以防止無限循環更新，保障了系統的穩定性。
    *   **複雜使用者流程處理**: 完整實現了從錄音、串流評估、結果呈現、歷史紀錄儲存到AI分析建議的完整閉環使用者流程，並包含了針對不同瀏覽器環境（如iOS內嵌瀏覽器）的優雅降級與提示方案。
    此檔案的規模與其內部的邏輯複雜度，直接證明了我們團隊在打造企業級、功能豐富的單頁應用（SPA）方面的頂尖實力。

- **`src/components/ShareData.tsx` (41.4 KB) - 協作與病毒式傳播引擎 (Collaboration & Virality Engine):**
    此元件是我們實現**用戶增長**與**社群生態**的關鍵技術。它提供了一套完整的數據分享、匯入、匯出及備份機制，其核心價值在於：
    *   **病毒式傳���迴路**: 允許用戶將個人學習內容（如單字卡、練習句）一鍵��成分享連結，透過社群網路傳播，新用戶可透過連結無縫匯入教材，形成強大的用戶獲取與增長迴路。
    *   **B2B場景賦能**: 為教育機構、企業內訓提供了標準化的教材分發與版本控制方案，教師可輕鬆建立課程包，分發給學生，並透過編輯密碼進行後續更新。
    *   **數據資產保障**: 提供完整的JSON匯出與匯入功能，保障用戶的學習數據資產100%可攜，大幅提升用戶的信任感與長期使用的黏著度。

- **`src/pages/Landing.js` (33.7 KB) - 產品藍圖與市場溝通門戶 (Product Roadmap & Market Communication Portal):**
    此檔案是我們向市場、用戶及潛在投資者展示**產品價值**與**商業藍圖**的戰略門戶。它不僅是靜態介紹，而是系統性地闡述了我們的市場定位、目標客群、核心技術優勢、商業模式及未來3-5年的發展規劃。這證明了我們不僅擁有頂尖的技術，更有清晰的商業策略與市場洞察力，是與資本市場溝通的重要橋樑。

- **`src/components/AIDataProcessor.tsx` (30.9 KB) - 個人化AI學習引擎 (Personalized AI Learning Engine):**
    這是我們實現「**適性化智慧家教**」願景的核心技術模組。它封裝了與��端大型語言模型（LLM）的複雜互動邏輯，能根據用戶的發音歷史���學習目標，甚至上傳的圖片，動態生成高度客製化的學習內容。此引擎的**多模態輸入**（文字、圖片、發音歷史）能力，是我們產品的關鍵差異化優勢，將傳統的單向練習，提升為真正個人化的雙向互動學習體驗。

- **`src/components/FavoriteList.tsx` (30.4 KB) - 使用者學習資產管理系統 (User Learning Asset Management System):**
    我們將用戶的學習內容視為其寶貴的**數位資產**。此元件提供了一套強大的個人化學習庫（Personal Knowledge Base）管理功能，包含智慧收藏、多維度標籤分類、以及高效的即時搜尋篩選機制。它不僅僅是個列表，而是幫助用戶建立、管理並活用其個人知識庫的核心工具，是培養用戶長期學習習慣、提升平台**生命週期價值（LTV）**的關鍵設計。

- **`tests/url-login-test.js` (27.6 KB) - 自動化品質保證框架 (Automated Quality Assurance Framework):**
    此檔案代表了我們對產品品質與穩定性的**高度承諾**。我們採用業界領先的Playwright進行端對端（E2E）自動化測試，涵蓋了從用戶登入到核心功能操作的完整流程。這個可配置的測試框架（`TEST_CHECKLIST`）確保了我們在快速���代新功能的同時，依然能維持**企業級的產品穩定性**，為未來的規��化擴展奠定了堅實的基礎。

- **`src/utils/storage.ts` (27.1 KB) - 客戶端數據持久化與壓縮層 (Client-Side Data Persistence & Compression Layer):**
    此模組為應用程式提供了高效且可靠的本地數據管理方案。它不僅僅是簡單的數據儲存，更包含了一套精巧的**數據壓縮演算法**（將JSON欄位名縮短），能在保障用戶數據隱私的同時，顯著減少本地儲存空間佔用，並優化應用程式的載入速度與離線體驗。

- **`src/hooks/useBackendSpeech.ts` (18.0 KB) - 可擴展的後端語音處理服務鉤子 (Scalable Backend Speech-Processing Service Hook):**
    為了應對未來大規模用戶的計算需求，我們設計了這個與後端API對接的服務層。它支援**即時語音串流（Streaming）評估**，將密集的運算任務轉移至雲端伺服器處理。這種架構設計不僅降低了用戶裝置的性能要求，更為我們未來引入更複雜的AI語音分析模型（如情感分析、語調分析）提供了**無限的可擴展性**。

- **`src/utils/firebaseStorage.ts` (17.3 KB) - 雲端同步與使用者設定檔服務 (Cloud Sync & User Profile Service):**
    此模組是實現**跨裝置無縫體驗**的基石。它深度整合了Firebase/Firestore，負責所有使用者數據（包括學習記錄、偏好設定、收藏內���）的即時雲端同步。我們設計了一套包含**重試機制**與**網路狀態檢查**的強韌（Resilient）數據同步方案，確保用戶無論在哪個裝置、何種網路環境下，都能接續上一次的學習進度，是打造平台生態系不可或缺的一環。

- **`src/hooks/useAzureSpeech.ts` (16.3 KB) - 核心語音分析引擎 (Core Speech Analysis Engine - Microsoft Azure Integration):**
    這是我們產品最核心的**技術護城河**，直接整合了微軟Azure的頂級語音辨識服務。此模組封裝了複雜的SDK互動，將全球領先的語音評估技術轉化為簡單易用的API供前端調用。它提供的**精準音素級別分析**，是我們能夠提供專業級發音回饋的根本，構成了我們產品最難以被複製的技術壁壘。

## 📱 介面設計

### iOS 風格設計
- **深色主題**：護眼的深色介面設計
- **圓角卡片**：現代化的卡片式版面配置
- **流暢動畫**：平滑的轉場效果和互動回饋
- **響應式設計**：適配各種螢幕尺寸

### 使用者體驗
- **直覺操作**：簡潔明瞭的操作流程
- **即時回饋**：即時的狀態提示和錯誤處理
- **快捷功能**：鍵盤快速鍵和手勢支援

## 🔧 設定選項

### Azure 語音服務設定
- **API 金鑰**：Azure 語音服務的訂閱金鑰
- **服務區域**：選擇最近的服務區域以取得最佳效能
- **語言設定**：支援多種語言的發音評估

### 評估參數
- **嚴格模式**：調整評估的嚴格程度
- **評分門檻**：自訂各項評分的及格標準
- **音素分析**：啟用詳細的音素層級分析

## 🧪 自動化測試
1. 安裝 Playwright：`npm install` 並 `npx playwright install`
2. 啟動開發伺服器：`npm start`
3. 在另一個終端執行 `node playwright-test.js` 產生測試報告

## ☁️ Firestore 資料庫設計
- 參考 [FIRESTORE_DESIGN.md](FIRESTORE_DESIGN.md) 了解跨裝置同步與 token 設計
- 已登入的使用者會將「我的最愛」直接同步到 Firestore，可在不同裝置存取
- 未登入使用者僅會看到預設句子，且不再使用 localStorage 儲存任何收藏


## 📈 使用情境

### 個人學習
- **發音練習**：日常英語發音練習和改進
- **學習追蹤**：記錄學習進度和改進軌跡
- **自主學習**：基於 AI 建議的個人化學習

### 教育機構
- **課堂教學**：輔助英語發音教學
- **學生評估**：客觀的發音能力評估
- **作業管理**：發音作業的指派和批改

### 語言培訓
- **專業培訓**：商務英��和專業術語發音
- **考試準備**：雅思、托福等考試的口語準備
- **企業培��**：員工英語能力提升

## 🔒 隱私與安全

### 資料保護
- **本機儲存**：敏感資料優先儲存在本機
- **加密傳輸**：所有網路傳輸使用 HTTPS 加密
- **匿名分享**：資料分享使用匿名雜湊識別

### 隱私政策
- **最小化收集**：僅收集必要的功能資料
- **使用者控制**：使用者完全控制資料的分享和刪除
- **透明度**：清楚說明資料的使用方式



## 🎯 發展藍圖

### 即將推出的功能
- [ ] 多語言介面支援
- [ ] 語音對話練習
- [ ] 社群學習功能
- [ ] 遊戲成就激勵系統
- [ ] AI判定遊戲難易度自動調整黏著度加強系統
- [ ] 增加虛擬化身AVATAR，虛擬化身發音能夠增加真實性，增加使用者黏著度

### 長期規劃
- [ ] 更多語言支援(可學習除了英語之外的額外34種語言，從中文市場進階到全球市場)
- [ ] 企業White Label服務(服務企業內訓或者學習組織)
- [ ] AI客製化24小時PODCAST節目(藉由分析練習內容，得知使用者喜好的主題，由AI即時產製相關音訊內容供隨時聆聽)
- [ ] VR英文學習環境，根據多個USER所添加的語句，藉由VEO3 SORA等AI影像生成服務做出完整的影片片��，讓使用者邊看影片邊學外文(可增加低年齡小朋友學習興趣)


---

**讓發��學習變得更簡單、更有效！** 🚀

如果這個專案對您有幫助，請給我們一個 ⭐ Star！