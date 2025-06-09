# Code Cleanup Checklist

下列檔案與函式目前在專案中未被使用或可能重複，可考慮逐步移除或重構：

## Unused Components / Assets
- [x] `src/components/ScoreCard.tsx` - component not referenced by any page ⭐
- [x] `debug-horizontal-scroll.js` - debug script not imported anywhere ⭐
- [x] `quick-debug.js` - debug script not imported anywhere ⭐
- [x] `src/assets/logo.webp` - unused image ⭐
- [x] `src/logo.svg` - unused logo ⭐
- [x] `src/config/authDomain.ts` - function never imported ⭐
- [x] `.cursor/rules/pa-front-rules.mdc` - dev rules file ⭐
- [x] `FIRESTORE_RULES.md` - duplicate of `firestore.rules` ⭐
- [x] `FIREBASE_AUTH_FIX.md` - temporary troubleshooting notes ⭐
- [x] `src/docs/streaming-backend-example.md` - example documentation ⭐
- [x] `src/App.test.js` - default CRA test file ⭐
- [x] `src/setupTests.js` - Jest config not referenced ⭐
- [x] `FIREBASE_SETUP.md` - setup steps duplicate README ⭐
- [x] `SLIDES_README.md` - slide mode instructions ⭐
- [x] `src/utils/platform.ts` - platform helpers never used ⭐
- [x] `src/utils/api.ts:downloadAudioAsBlob` - function unused ⭐
- [x] `src/utils/firebaseStorage.ts:deleteSharedData` - unused removal helper ⭐
- [x] `src/utils/firebaseStorage.ts:testFirebaseConnection` - unused connection test ⭐

## Unused Utility Functions
- [x] `generateSpeech` (src/utils/api.ts) ⭐
- [x] `generateSpeechStream` (src/utils/api.ts) ⭐
- [x] `getVoiceById` (src/config/voiceConfig.ts) ⭐
- [x] `getVoicesByGender` (src/config/voiceConfig.ts) ⭐
- [x] `getVoiceIds` (src/config/voiceConfig.ts) ⭐
- [x] `isValidVoice` (src/config/voiceConfig.ts) ⭐
- [x] `getVoiceListString` (src/config/voiceConfig.ts) ⭐

## Unused Storage Helpers
- [x] `getTextareaHeight` (src/utils/storage.ts) ⭐
- [x] `saveTextareaHeight` (src/utils/storage.ts) ⭐
- [x] `saveStrictMode` (src/utils/storage.ts) ⭐
- [x] `saveHistoryRecords` (src/utils/storage.ts) ⭐
- [x] `getTTSCache` (src/utils/storage.ts) ⭐
- [x] `getTTSCacheItem` (src/utils/storage.ts) ⭐
- [x] `addTTSCacheItem` (src/utils/storage.ts) ⭐

依照上述清單逐項檢查並刪除或整合程式碼，可使專案更加精簡易維護。


## Redundant Pages / Hooks
- [x] `src/pages/Login.tsx` - replaced by Firebase UI ⭐

## Outdated Configuration
- [x] `tsconfig.json:paths` - unused path mappings ⭐
- [ ] `package-lock.json` - remove if using yarn ⭐
- [x] `public/manifest.json` - unused icons and meta fields ⭐
- [x] `firestore.rules` - replaced by server security rules ⭐

## Temporary / Build Artifacts
- [ ] `build/` - ensure compiled output is not committed ⭐
- [ ] `coverage/` - remove Jest coverage reports ⭐
- [ ] `.env*` - verify sensitive configs remain local ⭐

## Documentation Cleanup
- [ ] `README.md` - update installation steps ⭐
- [x] `FIREBASE_SETUP.md` - integrate with README ⭐
- [x] `SLIDES_README.md` - move to wiki ⭐
- [x] `FIREBASE_AUTH_FIX.md` - condense into issue or note ⭐

## Future Cleanup Steps
1. Re-enable strict TypeScript checks
2. Consolidate `storage.ts` functions into single service
3. Remove inline styles from components
4. Add ESLint/Prettier rules to enforce consistent style
5. Record progress by referencing commits next to each item
