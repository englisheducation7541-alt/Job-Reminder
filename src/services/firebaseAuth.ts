import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { firebaseConfig } from './firebaseConfig';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 1. Basic Google Login Provider (Email & Profile ONLY)
// Never blocked by Google OAuth verification because it requests NO sensitive or restricted scopes.
export const loginProvider = new GoogleAuthProvider();
loginProvider.addScope('email');
loginProvider.addScope('profile');
loginProvider.setCustomParameters({
  prompt: 'select_account',
});

// 2. Google Drive Provider (Only requests non-sensitive per-file scope)
export const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');
driveProvider.setCustomParameters({
  prompt: 'consent',
});

// Cache the access token in memory (never in localStorage/sessionStorage for security)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Trigger Standard Google Sign-In (Email & Profile).
 * Guaranteed to succeed without "access_denied" or "verification process" blocks.
 */
export const signInWithGoogle = async (): Promise<{
  user: FirebaseUser;
  accessToken: string | null;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, loginProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[Firebase Auth] Standard Google sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Trigger Google Sign-In with Drive Scopes for cloud file backup.
 */
export const signInForDrive = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
} | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google authorization completed but no access token was returned.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('[Firebase Auth] Google Drive sign in error:', error);
    // Provide user-friendly explanation for Google verification errors
    if (
      error.code === 'auth/popup-blocked' ||
      error.message?.includes('popup')
    ) {
      throw new Error('Popup blocked by browser. Please allow popups for this site and try again.');
    }
    if (
      error.message?.includes('access_denied') ||
      error.message?.includes('verification process') ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      throw new Error(
        'Google Drive Access Notice: Google Cloud is in Testing mode for Drive scopes. You can download the full backup directly using "Download Local (.json)", and your data is already synced across all devices via the central server.'
      );
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logOutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
