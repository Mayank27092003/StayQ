import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAluufen67WYeGx_GUEG7x476EZcA8_WUo",
  authDomain: "stay-q.firebaseapp.com",
  projectId: "stay-q",
  storageBucket: "stay-q.firebasestorage.app",
  messagingSenderId: "608570851336",
  appId: "1:608570851336:web:stayq-client",
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Configures Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  RecaptchaVerifier,
  signInWithPhoneNumber,
};
export type { FirebaseUser, ConfirmationResult };
