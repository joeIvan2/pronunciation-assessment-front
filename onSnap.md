# Firestore onSnapshot Usage

This document verifies that only a single Firestore `onSnapshot` listener exists in the source.

## Search command

```bash
git grep -n "onSnapshot" -- '*.ts*'
```

### Output

```text
src/utils/firestoreSync.ts:2:import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, enableNetwork } from 'firebase/firestore';
src/utils/firestoreSync.ts:129:    unsubscribe = onSnapshot(userRef, async snap => {
```

The second line is the only actual listener registration; the first line is merely the import.

### Code snippet

```ts
123  if (unsubscribe) {
124    unsubscribe();
125    unsubscribe = null;
126  }

127  unsubscribe = onSnapshot(userRef, async snap => {
128    if (!snap.exists()) return;
129    const raw = Array.isArray((snap.data() as any)[field])
      ? (snap.data() as any)[field] as T[]
      : [];
130    const { normalized, changed } = normalize(raw);
131    saveLocal(normalized);
132    if (changed) {
133      try {
134        await setDoc(userRef,
          { [field]: normalized, updatedAt: serverTimestamp() },
          { merge: true });
135      } catch (err) {
136        console.error('自動修復缺失ID失敗:', err);
137      }
138    }
139  });
```

No duplicate `onSnapshot` usage was found.
