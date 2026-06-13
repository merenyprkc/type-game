// src/store/streakStore.ts
// Tracks daily play streak. Updates once per calendar day.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastPlayedDate: string; // YYYY-MM-DD
  updateStreak: () => void;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayISO() {
  return new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      currentStreak: 0,
      longestStreak: 0,
      lastPlayedDate: '',

      updateStreak: () => {
        const { currentStreak, longestStreak, lastPlayedDate } = get();
        const today = todayISO();

        if (lastPlayedDate === today) return; // already updated today

        const newStreak = lastPlayedDate === yesterdayISO() ? currentStreak + 1 : 1;
        set({
          currentStreak: newStreak,
          longestStreak: Math.max(longestStreak, newStreak),
          lastPlayedDate: today,
        });
      },
    }),
    { name: 'typra-streak' }
  )
);
