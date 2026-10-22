import { environment } from '../../../environments/environment';

type AppMod = typeof import('firebase/app');
type AuthMod = typeof import('firebase/auth');
type FsMod = typeof import('firebase/firestore');

export interface FirebaseKit {
  app: import('firebase/app').FirebaseApp;
  auth: import('firebase/auth').Auth;
  db: import('firebase/firestore').Firestore;
  authMod: AuthMod;
  fs: FsMod;
}

let kit: Promise<FirebaseKit> | null = null;

/**
 * Loads Firebase on first use, in the browser only. Most visitors never sign in,
 * so the SDK stays out of the initial bundle and off the critical path.
 */
export function firebase(): Promise<FirebaseKit> {
  if (!kit) {
    kit = Promise.all([
      import('firebase/app') as Promise<AppMod>,
      import('firebase/auth') as Promise<AuthMod>,
      import('firebase/firestore') as Promise<FsMod>,
    ]).then(([appMod, authMod, fs]) => {
      const app = appMod.getApps()[0] ?? appMod.initializeApp(environment.firebase);
      const auth = authMod.getAuth(app);
      const db = fs.getFirestore(app);
      return { app, auth, db, authMod, fs };
    });
  }
  return kit;
}
