# Firestore onSnapshot Usage

This document lists all occurrences of `onSnapshot` in the project to help verify there are no duplicate listeners.

## Grep results

```text
src/utils/firestoreSync.ts:2:import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, enableNetwork } from 'firebase/firestore';
src/utils/firestoreSync.ts:129:    unsubscribe = onSnapshot(userRef, async snap => {
```

There is only one actual listener created at line 129 of `src/utils/firestoreSync.ts`. The other match is just the import statement.

### Code snippet

```ts
123  if (unsubscribe) {
124    unsubscribe();
125    unsubscribe = null;
126  }

127  unsubscribe = onSnapshot(userRef, async snap => {
128    if (!snap.exists()) return;
129    const raw = Array.isArray((snap.data() as any)[field]) ? (snap.data() as any)[field] as T[] : [];
130    const { normalized, changed } = normalize(raw);
131    saveLocal(normalized);
132    if (changed) {
133      try {
134        await setDoc(userRef, { [field]: normalized, updatedAt: serverTimestamp() }, { merge: true });
135      } catch (err) {
136        console.error('自動修復缺失ID失敗:', err);
137      }
138    }
139  });
```

No conflicting `onSnapshot` calls were found across the project.
