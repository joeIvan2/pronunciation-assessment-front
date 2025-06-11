import { useEffect, useState } from 'react';
import { auth, googleProvider } from '../config/firebaseConfig';
import { 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { isInAppBrowser, showBrowserGuideMessage } from '../utils/browserDetection';

interface UseFirebaseAuthReturn {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
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
      // 檢查是否在內建瀏覽器中
      if (isInAppBrowser()) {
        console.log('檢測到內建瀏覽器，顯示引導訊息');
        showBrowserGuideMessage();
        return;
      }

      // 所有設備都優先嘗試彈出視窗登入（回到原本的桌面處理方式）
      console.log('嘗試彈出視窗登入');
      
      try {
        await signInWithPopup(auth, googleProvider);
        console.log('彈出視窗登入成功');
      } catch (popupError: any) {
        console.warn('彈出視窗登入失敗，切換到重定向登入:', popupError.message);
        
        // 如果彈出視窗失敗，檢查是否為用戶關閉彈出視窗
        if (popupError.code === 'auth/popup-closed-by-user') {
          console.log('用戶關閉了登入彈出視窗');
          return; // 不進行重定向，讓用戶再次嘗試
        }
        
        // 其他錯誤則使用重定向登入
        console.log('使用重定向登入作為備用方案');
        await signInWithRedirect(auth, googleProvider);
        console.log('重定向登入已啟動');
      }
    } catch (error: any) {
      console.error('Google 登入過程中發生錯誤:', error);
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
    signOutUser,
  };
};
