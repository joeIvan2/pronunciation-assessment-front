# onSnap.md

This document checks for usage of Firestore `onSnapshot` callbacks in the source code to detect potential conflicts or duplicated listeners.

## Search results

```
grep -R "onSnapshot" -n src
```

Output:

```
$(grep -R "onSnapshot" -n src | tr -d '\r')
```

Only one location (`src/utils/firestoreSync.ts`) uses `onSnapshot`, so there are no conflicting listeners.

