// src/store/badgeStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BADGES } from '../lib/badges';
import type { TypingResult } from '../lib/analytics';

interface BadgeState {
  earned: Record<string, number>; // badge id → timestamp earned
  newlyEarned: string[];           // IDs earned in the last game, for notification
  checkAndAward: (result: TypingResult, history: TypingResult[], streak: number) => void;
  clearNewlyEarned: () => void;
}

export const useBadgeStore = create<BadgeState>()(
  persist(
    (set, get) => ({
      earned: {},
      newlyEarned: [],

      checkAndAward: (result, history, streak) => {
        const { earned } = get();
        const newOnes: string[] = [];
        const now = Date.now();

        for (const badge of BADGES) {
          if (earned[badge.id]) continue; // already earned
          if (badge.check(result, history, streak)) {
            newOnes.push(badge.id);
          }
        }

        if (newOnes.length === 0) return;

        const updated = { ...earned };
        for (const id of newOnes) updated[id] = now;
        set({ earned: updated, newlyEarned: newOnes });
      },

      clearNewlyEarned: () => set({ newlyEarned: [] }),
    }),
    {
      name: 'typegame-badges',
      partialize: (s) => ({ earned: s.earned }), // never persist transient notification state
    }
  )
);
