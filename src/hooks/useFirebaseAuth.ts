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
      // 檢測是否是移動裝置或有 COOP 限制的環境
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
      
      // 在某些環境下直接使用重定向登入以避免 COOP 問題
      if (isMobile || isFirefox) {
        console.log('檢測到移動裝置或Firefox，使用重定向登入');
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      
      // 先嘗試彈出視窗登入
      await signInWithPopup(auth, googleProvider);
      console.log('彈出視窗登入成功');
    } catch (error: any) {
      console.warn('彈出視窗登入失敗，嘗試重定向登入:', error.message);
      
      // 如果彈出視窗失敗（如 COOP 錯誤），使用重定向登入
      if (error.code === 'auth/popup-blocked' || 
          error.code === 'auth/popup-closed-by-user' ||
          error.message?.includes('Cross-Origin-Opener-Policy') ||
          error.message?.includes('window.closed') ||
          error.message?.includes('window.frames')) {
        try {
          console.log('使用重定向登入作為備用方案');
          await signInWithRedirect(auth, googleProvider);
          console.log('重定向登入已啟動');
        } catch (redirectError) {
          console.error('重定向登入也失敗:', redirectError);
          throw new Error(`登入失敗: ${redirectError instanceof Error ? redirectError.message : String(redirectError)}`);
        }
      } else {
        throw new Error(`登入失敗: ${error.message || String(error)}`);
      }
    }
  };
  
  const signOutUser = () => signOut(auth);

  return { user, signInWithGoogle, signOutUser };
};
