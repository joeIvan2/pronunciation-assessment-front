# Code Cleanup Checklist

下列檔案與函式目前在專案中未被使用或可能重複，可考慮逐步移除或重構：

## Unused Components / Assets
- [ ] `src/components/ScoreCard.tsx` - component not referenced by any page
- [ ] `nicetone.webp` (repo root) - only referenced in README
- [ ] `debug-horizontal-scroll.js` - debug script not imported anywhere
- [ ] `quick-debug.js` - debug script not imported anywhere

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
