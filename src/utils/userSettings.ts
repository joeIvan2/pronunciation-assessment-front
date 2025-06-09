import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import * as storage from './storage';

export interface UserSettings {
  strictMode: boolean;
  useBackend: boolean;
  azureSettings: { key: string; region: string };
  voiceSettings: {
    searchTerm: string;
    rate: number;
    voiceName?: string;
    voiceLang?: string;
  };
  referenceText: string;
  fontSize: number;
  historyRecords: storage.HistoryItem[];
}

export const loadUserSettings = async (uid: string): Promise<void> => {
  try {
    const docRef = doc(db, 'userSettings', uid);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<UserSettings>;
      if (data.strictMode !== undefined) storage.saveStrictMode(data.strictMode);
      if (data.useBackend !== undefined) storage.saveUseBackend(data.useBackend);
      if (data.azureSettings)
        storage.saveAzureSettings(data.azureSettings.key, data.azureSettings.region);
      if (data.voiceSettings) storage.saveVoiceSettings(data.voiceSettings);
      if (data.referenceText !== undefined) storage.saveReferenceText(data.referenceText);
      if (data.fontSize !== undefined) storage.saveFontSize(data.fontSize);
      if (data.historyRecords) storage.saveHistoryRecords(data.historyRecords);
    }
  } catch (e) {
    console.error('讀取用戶設定失敗:', e);
  }
};

export const saveUserSettings = async (uid: string): Promise<void> => {
  try {
    const docRef = doc(db, 'userSettings', uid);
    const data: UserSettings = {
      strictMode: storage.getStrictMode(),
      useBackend: storage.getUseBackend(),
      azureSettings: storage.getAzureSettings(),
      voiceSettings: storage.getVoiceSettings(),
      referenceText: storage.getReferenceText(),
      fontSize: storage.getFontSize(),
      historyRecords: storage.getHistoryRecords(),
    };
    await setDoc(docRef, data, { merge: true });
  } catch (e) {
    console.error('保存用戶設定失敗:', e);
  }
};
