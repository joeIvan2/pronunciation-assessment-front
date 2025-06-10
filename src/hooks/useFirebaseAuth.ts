import { useEffect, useState } from 'react';
import { auth, googleProvider } from '../config/firebaseConfig';
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';

export interface AuthResult {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

export const useFirebaseAuth = (): AuthResult => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    
    // 檢查重定向登入結果
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('重定向登入成功:', result.user.email);
        }
      })
      .catch((error) => {
        console.error('重定向登入錯誤:', error);
      });
    
    return unsub;
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    try {
      // 所有設備都優先嘗試彈出視窗登入（回到原本的桌面處理方式）
      console.log('嘗試彈出視窗登入');
      
      try {
        await signInWithPopup(auth, googleProvider);
        console.log('彈出視窗登入成功');
      } catch (popupError: any) {
        console.warn('彈出視窗登入失敗，切換到重定向登入:', popupError.message);
        
        // 彈出視窗失敗時的處理
        if (popupError.code === 'auth/popup-blocked' || 
            popupError.code === 'auth/popup-closed-by-user' ||
            popupError.code === 'auth/cancelled-popup-request' ||
            popupError.message?.includes('Cross-Origin-Opener-Policy') ||
            popupError.message?.includes('window.closed') ||
            popupError.message?.includes('window.frames')) {
          
          console.log('使用重定向登入作為備用方案');
          await signInWithRedirect(auth, googleProvider);
          console.log('重定向登入已啟動');
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error('Google 登入過程中發生錯誤:', error);
      
      // 統一的錯誤處理
      if (error.code === 'auth/popup-blocked') {
        throw new Error('彈出視窗被阻擋，請允許彈出視窗或稍後再試。');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('網絡連接失敗，請檢查網絡連接後重試。');
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('登入嘗試過於頻繁，請稍後再試。');
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('此帳戶已被停用，請聯繫管理員。');
      } else if (error.message?.includes('重定向登入失敗') || error.message?.includes('登入失敗：')) {
        // 已經是格式化的錯誤信息，直接拋出
        throw error;
      } else {
        throw new Error(`登入失敗: ${error.message || String(error)}`);
      }
    }
  };
  
  const signOutUser = () => signOut(auth);

  return { user, signInWithGoogle, signOutUser };
};
