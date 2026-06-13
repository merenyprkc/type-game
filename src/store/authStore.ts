// src/store/authStore.ts

import { create } from 'zustand';
import {
  type User,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { saveUserProfile } from '../lib/firestore';

interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  init: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  signInWithGoogle: async () => {
    await signInWithPopup(auth, googleProvider);
  },

  signOut: async () => {
    await firebaseSignOut(auth);
  },

  // Call once in App.tsx — returns unsubscribe fn
  init: () => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      set({ user, loading: false });
      // Write/refresh user profile in Firestore so profile page is visible
      // immediately without needing to play a game first
      if (user) {
        saveUserProfile(user.uid, user.displayName ?? '', user.photoURL ?? '')
          .catch(console.error);
      }
    });
    return unsubscribe;
  },
}));
