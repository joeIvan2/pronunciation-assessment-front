import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from "firebase/analytics";

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

// 只在瀏覽器環境中初始化Analytics
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}
export { analytics };
