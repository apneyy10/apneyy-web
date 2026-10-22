import { Injectable, NgZone, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { firebase } from '../firebase/firebase';
import { Member } from '../models/member.model';

export interface SessionUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  emailVerified: boolean;
}

const SIGNED_IN_FLAG = 'apneyy_signed_in';

/** Shopper sign-in. Firebase only loads once someone has signed in or opens a sign-in page. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly zone = inject(NgZone);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private started: Promise<void> | null = null;

  readonly user = signal<SessionUser | null>(null);
  readonly member = signal<Member | null>(null);
  /** False until we know whether someone is signed in. */
  readonly ready = signal(false);
  readonly signedIn = computed(() => !!this.user());
  readonly firstName = computed(() => (this.member()?.displayName || this.user()?.displayName || '').split(' ')[0] || 'there');

  /** Called at startup: restores a session only if this browser had one. */
  restore(): void {
    if (!this.browser) return;
    let had = false;
    try {
      had = localStorage.getItem(SIGNED_IN_FLAG) === '1';
    } catch {
      /* storage blocked */
    }
    if (had) void this.start();
    else this.ready.set(true);
  }

  /** Loads Firebase and starts listening for auth changes. */
  start(): Promise<void> {
    if (!this.browser) return Promise.resolve();
    if (!this.started) {
      this.started = firebase().then(({ auth, authMod }) => {
        return new Promise<void>(resolve => {
          authMod.onAuthStateChanged(auth, u => {
            this.zone.run(() => {
              this.user.set(
                u ? { uid: u.uid, displayName: u.displayName || '', email: u.email || '', photoURL: u.photoURL || '', emailVerified: u.emailVerified } : null
              );
              try {
                if (u) localStorage.setItem(SIGNED_IN_FLAG, '1');
                else localStorage.removeItem(SIGNED_IN_FLAG);
              } catch {
                /* ignore */
              }
              if (u) void this.loadMember(u.uid, u.displayName || '', u.email || '', u.photoURL || '');
              else this.member.set(null);
              this.ready.set(true);
              resolve();
            });
          });
        });
      });
    }
    return this.started;
  }

  /** One read per session; creates the profile on first sign-in. */
  private async loadMember(uid: string, displayName: string, email: string, photoURL: string): Promise<void> {
    const { db, fs } = await firebase();
    const ref = fs.doc(db, 'members', uid);
    try {
      const snap = await fs.getDoc(ref);
      if (snap.exists()) {
        const d = snap.data();
        this.zone.run(() =>
          this.member.set({
            displayName: d['displayName'] || displayName,
            email: d['email'] || email,
            photoURL: d['photoURL'] || photoURL,
            savedIds: Array.isArray(d['savedIds']) ? d['savedIds'] : [],
            homeCity: d['homeCity'] || '',
          })
        );
      } else {
        const fresh: Member = { displayName: displayName.slice(0, 80), email: email.slice(0, 254), photoURL: photoURL.slice(0, 500), savedIds: [], homeCity: '' };
        await fs.setDoc(ref, { ...fresh, createdAt: fs.serverTimestamp(), updatedAt: fs.serverTimestamp() });
        this.zone.run(() => this.member.set(fresh));
      }
    } catch (e) {
      console.warn('Profile not loaded', e);
      this.zone.run(() => this.member.set({ displayName, email, photoURL, savedIds: [], homeCity: '' }));
    }
  }

  async updateMember(patch: Partial<Pick<Member, 'displayName' | 'homeCity' | 'savedIds'>>): Promise<void> {
    const u = this.user();
    if (!u) throw new Error('Not signed in');
    const { db, fs, auth, authMod } = await firebase();
    await fs.updateDoc(fs.doc(db, 'members', u.uid), { ...patch, updatedAt: fs.serverTimestamp() });
    if (patch.displayName && auth.currentUser) await authMod.updateProfile(auth.currentUser, { displayName: patch.displayName });
    this.member.update(m => (m ? { ...m, ...patch } : m));
    if (patch.displayName) this.user.update(x => (x ? { ...x, displayName: patch.displayName! } : x));
  }

  async signIn(email: string, password: string): Promise<void> {
    await this.start();
    const { auth, authMod } = await firebase();
    await authMod.signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async signUp(name: string, email: string, password: string): Promise<void> {
    await this.start();
    const { auth, authMod } = await firebase();
    const cred = await authMod.createUserWithEmailAndPassword(auth, email.trim(), password);
    await authMod.updateProfile(cred.user, { displayName: name.trim() });
    this.user.update(u => (u ? { ...u, displayName: name.trim() } : u));
    authMod.sendEmailVerification(cred.user).catch(() => undefined);
    // The auth listener may have created the profile before the name was set.
    await this.loadMember(cred.user.uid, name.trim(), email.trim(), '');
    if (this.member() && !this.member()!.displayName) await this.updateMember({ displayName: name.trim() });
  }

  async signInWithGoogle(): Promise<void> {
    await this.start();
    const { auth, authMod } = await firebase();
    await authMod.signInWithPopup(auth, new authMod.GoogleAuthProvider());
  }

  async resetPassword(email: string): Promise<void> {
    const { auth, authMod } = await firebase();
    await authMod.sendPasswordResetEmail(auth, email.trim());
  }

  async signOut(): Promise<void> {
    const { auth, authMod } = await firebase();
    await authMod.signOut(auth);
  }
}

/** Friendly text for Firebase auth error codes. */
export function authErrorMessage(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'That email and password don’t match. Try again or reset your password.',
    'auth/wrong-password': 'That email and password don’t match. Try again or reset your password.',
    'auth/user-not-found': 'We couldn’t find an account with that email.',
    'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
    'auth/weak-password': 'Please choose a stronger password (at least 8 characters).',
    'auth/invalid-email': 'That email address doesn’t look right.',
    'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
    'auth/popup-closed-by-user': 'The Google window was closed before signing in.',
    'auth/popup-blocked': 'Your browser blocked the Google pop-up. Allow pop-ups and try again.',
    'auth/network-request-failed': 'Network problem. Check your connection and try again.',
  };
  return map[code] ?? 'Something went wrong. Please try again.';
}
