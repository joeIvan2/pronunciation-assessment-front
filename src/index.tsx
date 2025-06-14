if (process.env.NODE_ENV === 'development') {
  import('./debugTools').then(m => m.hookFirestoreErrors());
}

export {}; 