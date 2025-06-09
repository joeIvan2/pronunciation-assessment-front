import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

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
export const googleProvider = new GoogleAuthProvider();

// 配置 Google 登入提供者
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// 初始化 Firestore，連接到 nicetone 資料庫
export const db = getFirestore(app, 'nicetone');

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
