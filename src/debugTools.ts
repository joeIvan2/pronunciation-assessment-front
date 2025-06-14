import { auth } from './config/firebaseConfig';

export function hookFirestoreErrors() {
  const origin = console.error;
  console.error = (...args: any[]) => {
    const msg = args.join(' ');
    if (msg.includes('Target ID already exists')) {
      origin('🔥 Target ID duplication!', {
        uid: auth.currentUser?.uid,
        pathname: location.pathname,
        stack: new Error().stack,
      });
    }
    origin(...args);
  };
} 