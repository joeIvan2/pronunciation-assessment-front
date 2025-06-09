# Code Cleanup Checklist

下列檔案與函式目前在專案中未被使用或可能重複，可考慮逐步移除或重構：

## Unused Components / Assets
- [ ] `src/components/ScoreCard.tsx` - component not referenced by any page
- [ ] `nicetone.webp` (repo root) - only referenced in README
- [ ] `debug-horizontal-scroll.js` - debug script not imported anywhere
- [ ] `quick-debug.js` - debug script not imported anywhere
- [ ] `src/assets/logo.webp` - unused image
- [ ] `src/logo.svg` - unused logo
- [ ] `public/logo192.png` - manifest icon only
- [ ] `public/logo512.png` - manifest icon only
- [ ] `src/config/authDomain.ts` - function never imported
- [ ] `.cursor/rules/pa-front-rules.mdc` - dev rules file
- [ ] `FIRESTORE_RULES.md` - duplicate of `firestore.rules`
- [ ] `FIREBASE_AUTH_FIX.md` - temporary troubleshooting notes
- [ ] `src/docs/streaming-backend-example.md` - example documentation
- [ ] `src/App.test.js` - default CRA test file
- [ ] `src/setupTests.js` - Jest config not referenced
- [ ] `src/reportWebVitals.js` - performance helper unused
- [ ] `public/favicon.ico` - unused favicon
- [ ] `FIREBASE_SETUP.md` - setup steps duplicate README
- [ ] `SLIDES_README.md` - slide mode instructions
- [ ] `src/utils/platform.ts` - platform helpers never used
- [ ] `src/utils/api.ts:downloadAudioAsBlob` - function unused
- [ ] `src/utils/firebaseStorage.ts:deleteSharedData` - unused removal helper
- [ ] `src/utils/firebaseStorage.ts:testFirebaseConnection` - unused connection test
- [ ] `src/App.css` - default CRA styles

## Unused Utility Functions
- [ ] `generateSpeech` (src/utils/api.ts)
- [ ] `generateSpeechStream` (src/utils/api.ts)
- [ ] `getVoiceById` (src/config/voiceConfig.ts)
- [ ] `getVoicesByGender` (src/config/voiceConfig.ts)
- [ ] `getVoiceIds` (src/config/voiceConfig.ts)
- [ ] `isValidVoice` (src/config/voiceConfig.ts)
- [ ] `getVoiceListString` (src/config/voiceConfig.ts)

## Unused Storage Helpers
- [ ] `getTextareaHeight` (src/utils/storage.ts)
- [ ] `saveTextareaHeight` (src/utils/storage.ts)
- [ ] `saveStrictMode` (src/utils/storage.ts)
- [ ] `saveHistoryRecords` (src/utils/storage.ts)
- [ ] `isValidURL` (src/utils/storage.ts)
- [ ] `getTTSCache` (src/utils/storage.ts)
- [ ] `getTTSCacheItem` (src/utils/storage.ts)
- [ ] `addTTSCacheItem` (src/utils/storage.ts)

依照上述清單逐項檢查並刪除或整合程式碼，可使專案更加精簡易維護。
