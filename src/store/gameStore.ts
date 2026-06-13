// src/store/gameStore.ts
// Zustand global state for TypeGame

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Difficulty, Language, GameMode } from '../lib/wordApi';
import type { TypingResult } from '../lib/analytics';

export type GameStatus = 'idle' | 'countdown' | 'typing' | 'finished';

interface GameSettings {
  mode: GameMode;
  language: Language;
  difficulty: Difficulty;
  timeLimit: number;     // seconds, for time mode
  wordCount: number;     // for words mode
}

interface GameState {
  // Settings
  settings: GameSettings;
  setSettings: (settings: Partial<GameSettings>) => void;

  // Game state
  status: GameStatus;
  setStatus: (status: GameStatus) => void;

  // Results
  lastResult: TypingResult | null;
  setLastResult: (result: TypingResult) => void;

  // History (local)
  history: TypingResult[];
  addToHistory: (result: TypingResult) => void;
  clearHistory: () => void;

  // Custom text mode
  customText: string;
  setCustomText: (text: string) => void;

  // UI
  isCommandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
      settings: {
        mode: 'time',
        language: 'en',
        difficulty: 'medium',
        timeLimit: 30,
        wordCount: 25,
      },
      setSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      status: 'idle',
      setStatus: (status) => set({ status }),

      lastResult: null,
      setLastResult: (result) => set({ lastResult: result }),

      history: [],
      addToHistory: (result) =>
        set((state) => ({
          history: [result, ...state.history].slice(0, 100), // keep last 100
        })),
      clearHistory: () => set({ history: [] }),

      customText: '',
      setCustomText: (text) => set({ customText: text }),

      isCommandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
    }),
    {
      name: 'typegame-storage',
      partialize: (state) => ({
        settings: state.settings,
        history: state.history,
        customText: state.customText,
      }),
    }
  )
);
