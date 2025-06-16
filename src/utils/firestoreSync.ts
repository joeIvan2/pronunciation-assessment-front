import { db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, enableNetwork } from 'firebase/firestore';
// We rely on `navigator.onLine` to check connectivity to avoid creating
// additional Firestore reads that may conflict with active listeners.

let networkEnabled = false;
const ensureNetwork = async () => {
  if (networkEnabled) return;
  try {
    await enableNetwork(db);
    networkEnabled = true;
  } catch (err: any) {
    if (err instanceof Error && err.message.includes('already enabled')) {
      networkEnabled = true;
    } else {
      console.warn('啟用網路連接失敗:', err);
    }
  }
};

export type PatchAction<T> =
  | { type: 'add'; item: T }
  | { type: 'update'; item: T }
  | { type: 'delete'; id: string };

export interface SyncConfig<T extends { id: string }> {
  uid: string;
  field: string;
  localKey: string;
  setState(data: T[]): void;
}

export const createArraySync = <T extends { id: string }>({ uid, field, localKey, setState }: SyncConfig<T>) => {
  const userRef = doc(db, 'users', uid);
  const saveLocal = (data: T[]) => {
    localStorage.setItem(localKey, JSON.stringify(data));
    setState(data);
  };

  const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const normalize = (items: T[]): { normalized: T[]; changed: boolean } => {
    const used = new Set<string>();
    let changed = false;
    const normalized = items.map(it => {
      let id = (it as any).id;
      if (!id || typeof id !== 'string') {
        let newId = genId();
        while (used.has(newId)) newId = genId();
        id = newId;
        changed = true;
      }
      used.add(id);
      return { ...it, id };
    });
    return { normalized, changed };
  };

  const fetchRemote = async (): Promise<T[]> => {
    const snap = await getDoc(userRef);
    const raw = snap.exists() && Array.isArray((snap.data() as any)[field])
      ? ((snap.data() as any)[field] as T[])
      : [];
    const { normalized, changed } = normalize(raw);
    if (changed) {
      await setDoc(userRef, { [field]: normalized, updatedAt: serverTimestamp() }, { merge: true });
    }
    return normalized;
  };

  const ensureOnline = async () => {
    await ensureNetwork();
    if (!navigator.onLine) throw new Error('offline');
  };

  const refresh = async () => {
    if (!uid) return;
    await ensureOnline();
    const data = await fetchRemote();
    saveLocal(data);
  };

  const patch = async (action: PatchAction<T>) => {
    if (!uid) return;
    await ensureOnline();
    const remote = await fetchRemote();
    const { normalized: normRemote } = normalize(remote);

    const ensureItemId = (item: T): T => {
      if (!item.id) {
        const { normalized } = normalize([item]);
        return normalized[0];
      }
      return item;
    };

    const updated =
      action.type === 'add'
        ? [...normRemote.filter(r => r.id !== action.item.id), ensureItemId(action.item)]
        : action.type === 'update'
          ? normRemote.map(r => (r.id === action.item.id ? ensureItemId(action.item) : r))
          : normRemote.filter(r => r.id !== action.id);

    await setDoc(userRef, { [field]: updated, updatedAt: serverTimestamp() }, { merge: true });
    saveLocal(updated);
  };

  const subscribe = () => {
    if (!uid) return () => {};
    // ensure network connectivity before subscribing
    ensureNetwork().catch(err => console.warn('啟用網路失敗:', err));
    return onSnapshot(userRef, async snap => {
      if (!snap.exists()) return;
      const raw = Array.isArray((snap.data() as any)[field]) ? (snap.data() as any)[field] as T[] : [];
      const { normalized, changed } = normalize(raw);
      saveLocal(normalized);
      if (changed) {
        try {
          await setDoc(userRef, { [field]: normalized, updatedAt: serverTimestamp() }, { merge: true });
        } catch (err) {
          console.error('自動修復缺失ID失敗:', err);
        }
      }
    });
  };

  return { refresh, patch, subscribe };
};
