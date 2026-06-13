// src/lib/firestore.ts

import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  query, orderBy, limit, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { TypingResult } from './analytics';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SocialLinks {
  github?: string;
  twitter?: string;
  instagram?: string;
  discord?: string;
}

export interface Equipment {
  keyboard?: string;
  keycap?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  currentStreak?: number;
  longestStreak?: number;
  earnedBadges?: string[];
  bio?: string;
  bannerUrl?: string;
  bannerColor?: string;
  socialLinks?: SocialLinks;
  equipment?: Equipment;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  photoURL: string;
  bestWpm: number;
  accuracy: number;
  mode: string;
  language: string;
  updatedAt: { seconds: number; nanoseconds: number } | null;
}

// Combined profile — always has identity, optionally has best score
export interface PublicProfile extends UserProfile {
  leaderboard: LeaderboardEntry | null;
}

// ─── User profile (written on login, public) ─────────────────────────────────

export async function saveUserProfile(
  uid: string,
  displayName: string,
  photoURL: string,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { uid, displayName: displayName || 'Anonim', photoURL: photoURL || '', updatedAt: serverTimestamp() },
    { merge: true },
  );
}

// ─── Public profile (identity + leaderboard merged) ──────────────────────────

export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const [userSnap, lbSnap] = await Promise.all([
    getDoc(doc(db, 'users', uid)),
    getDoc(doc(db, 'leaderboard', uid)),
  ]);

  if (!userSnap.exists()) return null;

  const userDoc = userSnap.data() as UserProfile;
  const lbDoc = lbSnap.exists()
    ? ({ uid: lbSnap.id, ...(lbSnap.data() as Omit<LeaderboardEntry, 'uid'>) } as LeaderboardEntry)
    : null;

  return {
    uid,
    displayName: userDoc.displayName,
    photoURL: userDoc.photoURL,
    currentStreak: userDoc.currentStreak,
    longestStreak: userDoc.longestStreak,
    earnedBadges: userDoc.earnedBadges,
    bio: userDoc.bio,
    bannerUrl: userDoc.bannerUrl,
    bannerColor: userDoc.bannerColor,
    socialLinks: userDoc.socialLinks,
    equipment: userDoc.equipment,
    leaderboard: lbDoc,
  };
}

// ─── Profile customization ────────────────────────────────────────────────────

export async function saveProfileCustomization(
  uid: string,
  data: Pick<UserProfile, 'bio' | 'bannerUrl' | 'bannerColor' | 'socialLinks' | 'equipment'>,
): Promise<void> {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

// ─── Badges ───────────────────────────────────────────────────────────────────

export async function saveUserBadges(uid: string, badgeIds: string[]): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { earnedBadges: badgeIds },
    { merge: true },
  );
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export async function saveStreak(
  uid: string,
  currentStreak: number,
  longestStreak: number,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { currentStreak, longestStreak },
    { merge: true },
  );
}

// ─── Game results ─────────────────────────────────────────────────────────────

export async function saveResult(uid: string, result: TypingResult): Promise<void> {
  await addDoc(collection(db, 'users', uid, 'results'), {
    ...result,
    uid,
    savedAt: serverTimestamp(),
  });
}

export async function updateLeaderboard(
  uid: string,
  displayName: string,
  photoURL: string,
  result: TypingResult,
): Promise<void> {
  const docRef = doc(db, 'leaderboard', uid);
  const snap = await getDoc(docRef);

  if (snap.exists() && (snap.data() as LeaderboardEntry).bestWpm >= result.wpm) return;

  await setDoc(docRef, {
    uid,
    displayName: displayName || 'Anonim',
    photoURL: photoURL || '',
    bestWpm: result.wpm,
    accuracy: result.accuracy,
    mode: result.mode,
    language: result.language,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserRecentResults(uid: string, limitCount = 20): Promise<TypingResult[]> {
  const q = query(
    collection(db, 'users', uid, 'results'),
    orderBy('timestamp', 'desc'),
    limit(limitCount),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TypingResult);
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export function subscribeLeaderboard(
  callback: (entries: LeaderboardEntry[]) => void,
): () => void {
  const q = query(
    collection(db, 'leaderboard'),
    orderBy('bestWpm', 'desc'),
    limit(50),
  );

  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => ({
      uid: d.id,
      ...(d.data() as Omit<LeaderboardEntry, 'uid'>),
    }));
    callback(entries);
  });
}
