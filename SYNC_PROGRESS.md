# Firestore Sync Progress

This document tracks migration of user array fields to the `firestoreSync` helper.
Each array is verified to contain objects with unique `id` keys. Missing IDs are
generated on refresh, patch, and snapshot updates so multiple devices stay
consistent.

- [x] `promptFavorites` – normalized IDs
- [x] `tags2` – normalized IDs
- [x] `shareHistory` – normalized IDs
- [x] `historyRecords` – normalized IDs
- [x] `favorites2` – normalized IDs
