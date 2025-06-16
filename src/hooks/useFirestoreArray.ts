import { useEffect, useRef, useState } from 'react';
import { createArraySync, PatchAction } from '../utils/firestoreSync';

interface HookConfig<T extends { id: string }> {
  user: { uid: string } | null | undefined;
  field: string;
  localKey: string;
  loadLocal: () => T[];
  saveLocal: (items: T[]) => void;
}

export const useFirestoreArray = <T extends { id: string }>(config: HookConfig<T>) => {
  const { user, field, localKey, loadLocal, saveLocal } = config;
  const [items, setItems] = useState<T[]>(() => loadLocal());
  const [loaded, setLoaded] = useState<boolean>(false);
  const syncRef = useRef<ReturnType<typeof createArraySync<T>> | null>(null);

  useEffect(() => {
    if (!user) {
      syncRef.current = null;
      const local = loadLocal();
      setItems(local);
      setLoaded(true);
      return;
    }

    const sync = createArraySync<T>({
      uid: user.uid,
      field,
      localKey,
      setState: (data) => {
        setItems(data);
        saveLocal(data);
      }
    });
    syncRef.current = sync;
    setLoaded(false);
    setLoaded(true);
    const unsub = sync.subscribe();
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!loaded || user) return;
    saveLocal(items);
  }, [items, loaded, user]);

  const localPatch = (arr: T[], action: PatchAction<T>): T[] => {
    if (action.type === 'add') {
      const filtered = arr.filter(i => i.id !== action.item.id);
      return [...filtered, action.item];
    } else if (action.type === 'update') {
      return arr.map(i => (i.id === action.item.id ? action.item : i));
    }
    return arr.filter(i => i.id !== action.id);
  };

  const patch = async (action: PatchAction<T>) => {
    if (user && syncRef.current) {
      try {
        await syncRef.current.patch(action);
      } catch (err) {
        console.error('Firestore patch failed:', err);
      }
    } else {
      const updated = localPatch(items, action);
      setItems(updated);
      saveLocal(updated);
    }
  };

  return { items, loaded, patch };
};
