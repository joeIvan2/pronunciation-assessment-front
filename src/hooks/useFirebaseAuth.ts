import { useEffect, useState } from 'react';
import { auth, googleProvider } from '../config/firebaseConfig';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

export interface AuthResult {
  user: User | null;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

export const useFirebaseAuth = (): AuthResult => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  const signInWithGoogle = () => signInWithPopup(auth, googleProvider).then(() => void 0);
  const signOutUser = () => signOut(auth);

  return { user, signInWithGoogle, signOutUser };
};
