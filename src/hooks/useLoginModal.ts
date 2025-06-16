import { useState } from 'react';

export interface LoginModalControls {
  showLoginModal: boolean;
  loginModalMessage: string;
  loginModalAction: string;
  check(user: any, actionName: string, customMessage?: string): boolean;
  close(): void;
  login(): Promise<void>;
}

export const useLoginModal = (signInWithGoogle: () => Promise<void>): LoginModalControls => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState('');
  const [loginModalAction, setLoginModalAction] = useState('此功能');

  const check = (user: any, actionName: string, customMessage?: string): boolean => {
    if (!user) {
      setLoginModalAction(actionName);
      setLoginModalMessage(customMessage || '');
      setShowLoginModal(true);
      return false;
    }
    return true;
  };

  const close = () => setShowLoginModal(false);

  const login = async () => {
    try {
      await signInWithGoogle();
      setShowLoginModal(false);
    } catch (err) {
      console.error('登入失敗:', err);
    }
  };

  return { showLoginModal, loginModalMessage, loginModalAction, check, close, login };
};
