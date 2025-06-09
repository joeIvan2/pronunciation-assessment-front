import { auth } from '../config/firebaseConfig';

/**
 * Check if a Firebase user is currently logged in.
 */
export const isUserLoggedIn = (): boolean => {
  return !!auth.currentUser;
};
