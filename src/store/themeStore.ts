import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'default' | 'dracula' | 'nord' | 'cyberpunk' | 'matrix' | 'custom';

export const THEMES: { id: Theme; name: string; accent: string; bg: string }[] = [
  { id: 'default',   name: 'Default',   accent: '#4d9de0', bg: '#111111' },
  { id: 'dracula',   name: 'Dracula',   accent: '#bd93f9', bg: '#282a36' },
  { id: 'nord',      name: 'Nord',      accent: '#88c0d0', bg: '#2e3440' },
  { id: 'cyberpunk', name: 'Cyberpunk', accent: '#f0e040', bg: '#0d0d0d' },
  { id: 'matrix',    name: 'Matrix',    accent: '#00cc44', bg: '#0a0f0a' },
  { id: 'custom',    name: 'Custom',    accent: '#ff6b6b', bg: '#1a1a2e' },
];

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customColors: { accent: string; bg: string };
  setCustomColors: (colors: { accent: string; bg: string }) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'default',
      setTheme: (theme) => set({ theme }),
      customColors: { accent: '#ff6b6b', bg: '#1a1a2e' },
      setCustomColors: (customColors) => set({ customColors }),
    }),
    { name: 'typra-theme' }
  )
);
