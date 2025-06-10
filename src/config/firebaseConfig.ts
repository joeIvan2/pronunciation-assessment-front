import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

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

// 初始化Firebase
const app = initializeApp(firebaseConfig);

// 初始化服務
export const auth = getAuth(app);

// 設置 Auth 實例的配置
auth.useDeviceLanguage(); // 使用設備語言

export const googleProvider = new GoogleAuthProvider();

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

// 初始化 Firestore，連接到 nicetone 資料庫
export const db = getFirestore(app, 'nicetone');

// 添加 Firestore 設置，改善連接穩定性
try {
  // 在開發環境中啟用詳細日誌記錄（僅用於調試）
  if (process.env.NODE_ENV === 'development') {
    // 可以啟用詳細日誌記錄
    // 注意：這可能會在某些瀏覽器中與廣告攔截器衝突
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
