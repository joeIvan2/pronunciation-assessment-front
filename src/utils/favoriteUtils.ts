import { Favorite } from '../types/speech';

export const getCurrentFavoriteIdKey = (user: any) =>
  user && user.uid ? `currentFavoriteId_${user.uid}` : 'currentFavoriteId_guest';

export const getInitialCurrentFavoriteId = (favorites: Favorite[], user: any) => {
  const key = getCurrentFavoriteIdKey(user);
  const storedId = localStorage.getItem(key);
  if (storedId && favorites.some(f => f.id === storedId)) {
    return storedId;
  }
  if (favorites.length > 0) {
    return favorites.reduce((min, f) => (f.id < min.id ? f : min), favorites[0]).id;
  }
  return null;
};
