import { useEffect, useState } from 'react';
import { auth, googleProvider } from '../config/firebaseConfig';
import { loadUserSettings, saveUserSettings } from '../utils/userSettings';
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
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadUserSettings(u.uid);
      }
    });
    
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
      // 先嘗試彈出視窗登入
      await signInWithPopup(auth, googleProvider);
      console.log('彈出視窗登入成功');
    } catch (error: any) {
      console.warn('彈出視窗登入失敗，嘗試重定向登入:', error.message);
      
      // 如果彈出視窗失敗（如 COOP 錯誤），使用重定向登入
      if (error.code === 'auth/popup-blocked' || 
          error.message?.includes('Cross-Origin-Opener-Policy') ||
          error.message?.includes('window.frames')) {
        try {
          await signInWithRedirect(auth, googleProvider);
          console.log('重定向登入已啟動');
        } catch (redirectError) {
          console.error('重定向登入也失敗:', redirectError);
          throw redirectError;
        }
      } else {
        throw error;
      }
    }
  };
  
  const signOutUser = async () => {
    if (user) {
      await saveUserSettings(user.uid).catch((e) => {
        console.error('保存用戶設定失敗:', e);
      });
    }
    await signOut(auth);
  };

  return { user, signInWithGoogle, signOutUser };
};
