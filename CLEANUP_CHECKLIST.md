# Code Cleanup Checklist

下列檔案與函式目前在專案中未被使用或可能重複，可考慮逐步移除或重構：

## Unused Components / Assets
- [ ] `src/components/ScoreCard.tsx` - component not referenced by any page ⭐
- [ ] `debug-horizontal-scroll.js` - debug script not imported anywhere ⭐
- [ ] `quick-debug.js` - debug script not imported anywhere ⭐
- [ ] `src/assets/logo.webp` - unused image ⭐
- [ ] `src/logo.svg` - unused logo ⭐
- [ ] `src/config/authDomain.ts` - function never imported ⭐
- [ ] `.cursor/rules/pa-front-rules.mdc` - dev rules file ⭐
- [ ] `FIRESTORE_RULES.md` - duplicate of `firestore.rules` ⭐
- [ ] `FIREBASE_AUTH_FIX.md` - temporary troubleshooting notes ⭐
- [ ] `src/docs/streaming-backend-example.md` - example documentation ⭐
- [ ] `src/App.test.js` - default CRA test file ⭐
- [ ] `src/setupTests.js` - Jest config not referenced ⭐
- [ ] `FIREBASE_SETUP.md` - setup steps duplicate README ⭐
- [ ] `SLIDES_README.md` - slide mode instructions ⭐
- [ ] `src/utils/platform.ts` - platform helpers never used ⭐
- [ ] `src/utils/api.ts:downloadAudioAsBlob` - function unused ⭐
- [ ] `src/utils/firebaseStorage.ts:deleteSharedData` - unused removal helper ⭐
- [ ] `src/utils/firebaseStorage.ts:testFirebaseConnection` - unused connection test ⭐

## Unused Utility Functions
- [ ] `generateSpeech` (src/utils/api.ts) ⭐
- [ ] `generateSpeechStream` (src/utils/api.ts) ⭐
- [ ] `getVoiceById` (src/config/voiceConfig.ts) ⭐
- [ ] `getVoicesByGender` (src/config/voiceConfig.ts) ⭐
- [ ] `getVoiceIds` (src/config/voiceConfig.ts) ⭐
- [ ] `isValidVoice` (src/config/voiceConfig.ts) ⭐
- [ ] `getVoiceListString` (src/config/voiceConfig.ts) ⭐

## Unused Storage Helpers
- [ ] `getTextareaHeight` (src/utils/storage.ts) ⭐
- [ ] `saveTextareaHeight` (src/utils/storage.ts) ⭐
- [ ] `saveStrictMode` (src/utils/storage.ts) ⭐
- [ ] `saveHistoryRecords` (src/utils/storage.ts) ⭐
- [ ] `getTTSCache` (src/utils/storage.ts) ⭐
- [ ] `getTTSCacheItem` (src/utils/storage.ts) ⭐
- [ ] `addTTSCacheItem` (src/utils/storage.ts) ⭐

依照上述清單逐項檢查並刪除或整合程式碼，可使專案更加精簡易維護。


## Redundant Pages / Hooks
- [ ] `src/pages/Login.tsx` - replaced by Firebase UI ⭐

## Outdated Configuration
- [ ] `tsconfig.json:paths` - unused path mappings ⭐
- [ ] `package-lock.json` - remove if using yarn ⭐
- [ ] `public/manifest.json` - unused icons and meta fields ⭐
- [ ] `firestore.rules` - replaced by server security rules ⭐

## Temporary / Build Artifacts
- [ ] `build/` - ensure compiled output is not committed ⭐
- [ ] `coverage/` - remove Jest coverage reports ⭐
- [ ] `.env*` - verify sensitive configs remain local ⭐

## Documentation Cleanup
- [ ] `README.md` - update installation steps ⭐
- [ ] `FIREBASE_SETUP.md` - integrate with README ⭐
- [ ] `SLIDES_README.md` - move to wiki ⭐
- [ ] `FIREBASE_AUTH_FIX.md` - condense into issue or note ⭐

## Future Cleanup Steps
1. Re-enable strict TypeScript checks
2. Consolidate `storage.ts` functions into single service
3. Remove inline styles from components
4. Add ESLint/Prettier rules to enforce consistent style
5. Record progress by referencing commits next to each item
