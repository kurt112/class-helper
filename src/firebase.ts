import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const env = import.meta.env;
// Read import.meta.env directly so production builds drop the emulator-only code below entirely.
const emulators = import.meta.env.VITE_USE_EMULATORS === '1';

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

  // Recording tutorial videos (local emulators only, add ?demo to the URL): sign in as a fixed fake
  // teacher so videos never show a real account, and answer "Are you sure?" prompts with yes.
  if (new URLSearchParams(location.search).has('demo')) {
    const email = 'demo.teacher@example.com', password = 'demo-teacher-2026';
    window.confirm = () => true;
    signInWithEmailAndPassword(auth, email, password).catch(() =>
      createUserWithEmailAndPassword(auth, email, password).then((c) => updateProfile(c.user, { displayName: 'Teacher Demo' })),
    );
  }
}
