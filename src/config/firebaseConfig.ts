import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getFirestore, enableIndexedDbPersistence, clearIndexedDbPersistence, terminate, setLogLevel } from 'firebase/firestore';

// Firebase配置
const firebaseConfig = {
  apiKey: "AIzaSyDMuWStNiYSFxIgo3FzKYYLyj8Pl81tby4",
  authDomain: "nicetone-6007b.firebaseapp.com",
  projectId: "nicetone-6007b",
  storageBucket: "nicetone-6007b.firebasestorage.app",
  messagingSenderId: "74723963834",
  appId: "1:74723963834:web:ca70b0d48eb02666e62383",
  measurementId: "G-3BDGQQR6VL"
};

// 單例初始化 Firebase App
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 初始化服務
export const auth = getAuth(app);

// 設置 Auth 實例的配置
auth.useDeviceLanguage(); // 使用設備語言

export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// 配置 Google 登入提供者
googleProvider.setCustomParameters({
  prompt: 'select_account',
  // 添加更多參數以改善兼容性
  'include_granted_scopes': 'true',
  'access_type': 'online'
});

// 設置作用域
googleProvider.addScope('profile');
googleProvider.addScope('email');

// 配置 Facebook 登入提供者
facebookProvider.setCustomParameters({
  'display': 'popup'
});

// 設置 Facebook 作用域
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

// 初始化 Firestore，連接到 nicetone 資料庫
export const db = getFirestore(app, 'nicetone');

// 只啟用一次 IndexedDB 持久化
if (typeof window !== 'undefined' && !(window as any)._persistenceEnabled) {
  (window as any)._persistenceEnabled = true;
  enableIndexedDbPersistence(db).catch(() => {/* tab 衝突可忽略 */});
}

// 添加 Firestore 設置，改善連接穩定性
try {
  // 在開發環境中啟用詳細日誌記錄（僅用於調試）
  if (process.env.NODE_ENV === 'development') {
    setLogLevel('debug');
  }
} catch (error) {
  console.warn('Firestore 配置警告:', error);
}

// 初始化 Analytics（僅在生產環境）
let analytics;
if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics 初始化失敗:', error);
  }
}

console.log('Firebase 配置完成，連接到 nicetone 資料庫');

export { analytics };
export default app;

// 提供全域 debug 快取清除函式
if (typeof window !== 'undefined') {
  (window as any).clearFirestoreCache = async () => {
    try {
      await terminate(db);
      await clearIndexedDbPersistence(db);
      alert('Firestore IndexedDB 快取已清除，將自動重新整理頁面');
      location.reload();
    } catch (e) {
      alert('清除快取失敗：' + (e?.message || e));
    }
  };
}
