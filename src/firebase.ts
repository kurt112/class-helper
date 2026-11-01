import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const env = import.meta.env;
const emulators = env.VITE_USE_EMULATORS === '1';

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-ecr.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'demo-ecr',
  appId: env.VITE_FIREBASE_APP_ID,
});

export const auth = getAuth(app); // keeps the sign-in on the device, so it still works offline
// Offline cache: teachers can keep rating with bad school wifi; writes sync later.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (emulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
