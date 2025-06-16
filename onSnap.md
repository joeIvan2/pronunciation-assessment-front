# Firestore onSnapshot Usage

This document lists all occurrences of `onSnapshot` in the project to help verify there are no duplicate listeners.

## Grep results

```text
src/utils/firestoreSync.ts:2:import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, enableNetwork } from 'firebase/firestore';
src/utils/firestoreSync.ts:129:    unsubscribe = onSnapshot(userRef, async snap => {
```

There is only one listener created at line 129 of `src/utils/firestoreSync.ts`. The other match is just the import statement. No conflicting `onSnapshot` calls were found.
