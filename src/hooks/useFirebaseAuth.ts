import { useEffect, useState } from 'react';
import { auth, googleProvider, facebookProvider } from '../config/firebaseConfig';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { isInAppBrowser, showBrowserGuideMessage } from '../utils/browserDetection';

interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithEmailPassword: (email: string, password: string) => Promise<void>;
  createAccountWithEmailPassword: (email: string, password: string) => Promise<void>;
  signOutUser: () => Promise<void>;
}

export const useFirebaseAuth = (): UseFirebaseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 檢查重定向登入結果
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('重定向登入成功:', result.user.email);
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error('重定向登入錯誤:', error);
      });

    // 監聽認證狀態變化
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
      const isAndroid = /android/.test(navigator.userAgent.toLowerCase());
      const isLineInApp = /line/i.test(navigator.userAgent.toLowerCase());
      const isLineOrMessenger = /line|messenger/i.test(navigator.userAgent.toLowerCase());
      const isFacebookInApp = /fban|fbav|fb_iab/i.test(navigator.userAgent.toLowerCase());

      // iOS Facebook 環境特殊處理：顯示tooltip而不是登入
      if (isIOS && isFacebookInApp) {
        console.log('iOS Facebook WebView 檢測到，顯示操作提示');
        // 觸發顯示tooltip的事件，而不是進行登入
        const event = new CustomEvent('showFacebookTooltip');
        window.dispatchEvent(event);
        return;
      }

      // iOS LINE 使用 openExternalBrowser 參數直接跳轉
      if (isIOS && isLineInApp) {
        console.log('iOS LINE WebView 檢測到，使用 openExternalBrowser 參數跳轉進行 Google 登入');
        try {
          const { appendOpenExternalBrowserParam } = await import('../utils/browserDetection');
          const currentUrl = window.location.href;
          const newUrl = appendOpenExternalBrowserParam(currentUrl);
          window.location.href = newUrl;
          return;
        } catch (error) {
          console.warn('openExternalBrowser 跳轉失敗，顯示引導訊息');
          showBrowserGuideMessage();
          return;
        }
      }

      // Android 在 LINE/Messenger WebView 中直接嘗試 intent 跳轉
      if (isAndroid && isLineOrMessenger) {
        console.log('Android LINE/Messenger WebView 檢測到，嘗試 intent 跳轉');
        try {
          // 嘗試使用 intent 跳轉到 Chrome 進行 Google 登入
          const intentUrl = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end;`;
          window.location.href = intentUrl;
          return;
        } catch (error) {
          console.warn('Intent 跳轉失敗，顯示引導訊息');
          showBrowserGuideMessage();
          return;
        }
      }

      // 檢查是否在任何內建瀏覽器中（包括iPhone WebView）
      if (isInAppBrowser()) {
        console.log('檢測到內建瀏覽器，顯示引導訊息');
        showBrowserGuideMessage();
        return;
      }

      // 所有設備都優先嘗試彈出視窗登入（回到原本的桌面處理方式）
      console.log('嘗試 Google 彈出視窗登入');
      
      try {
        await signInWithPopup(auth, googleProvider);
        console.log('Google 彈出視窗登入成功');
      } catch (popupError: any) {
        console.warn('Google 彈出視窗登入失敗，切換到重定向登入:', popupError.message);
        
        // 如果彈出視窗失敗，檢查是否為用戶關閉彈出視窗
        if (popupError.code === 'auth/popup-closed-by-user') {
          console.log('用戶關閉了 Google 登入彈出視窗');
          return; // 不進行重定向，讓用戶再次嘗試
        }
        
        // 其他錯誤則使用重定向登入
        console.log('使用 Google 重定向登入作為備用方案');
        await signInWithRedirect(auth, googleProvider);
        console.log('Google 重定向登入已啟動');
      }
    } catch (error: any) {
      console.error('Google 登入過程中發生錯誤:', error);
      throw error;
    }
  };

  const signInWithFacebook = async (): Promise<void> => {
    try {
      // 在任何webview環境中都顯示引導訊息，要求跳轉到外部瀏覽器
      if (isInAppBrowser()) {
        console.log('檢測到內建瀏覽器，顯示引導訊息');
        showBrowserGuideMessage();
        return;
      }

      console.log('嘗試 Facebook 彈出視窗登入');
      
      try {
        await signInWithPopup(auth, facebookProvider);
        console.log('Facebook 彈出視窗登入成功');
      } catch (popupError: any) {
        console.warn('Facebook 彈出視窗登入失敗，切換到重定向登入:', popupError.message);
        
        // 如果彈出視窗失敗，檢查是否為用戶關閉彈出視窗
        if (popupError.code === 'auth/popup-closed-by-user') {
          console.log('用戶關閉了 Facebook 登入彈出視窗');
          return; // 不進行重定向，讓用戶再次嘗試
        }
        
        // 其他錯誤則使用重定向登入
        console.log('使用 Facebook 重定向登入作為備用方案');
        await signInWithRedirect(auth, facebookProvider);
        console.log('Facebook 重定向登入已啟動');
      }
    } catch (error: any) {
      console.error('Facebook 登入過程中發生錯誤:', error);
      throw error;
    }
  };

  // Email/Password 登入功能
  const signInWithEmailPassword = async (email: string, password: string): Promise<void> => {
    try {
      console.log('嘗試使用 Email/Password 登入:', email);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Email/Password 登入成功:', userCredential.user.email);
    } catch (error: any) {
      console.error('Email/Password 登入失敗:', error);
      throw error;
    }
  };

  // Email/Password 註冊功能
  const createAccountWithEmailPassword = async (email: string, password: string): Promise<void> => {
    try {
      console.log('嘗試使用 Email/Password 創建帳號:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Email/Password 帳號創建成功:', userCredential.user.email);
    } catch (error: any) {
      console.error('Email/Password 帳號創建失敗:', error);
      throw error;
    }
  };

  const signOutUser = async (): Promise<void> => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('登出失敗:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithFacebook,
    signInWithEmailPassword,
    createAccountWithEmailPassword,
    signOutUser,
  };
};
