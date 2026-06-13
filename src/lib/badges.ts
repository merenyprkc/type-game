// src/lib/badges.ts
// Badge definitions. check() receives the finished result, full local history
// (including current result), and current streak after update.

import type { TypingResult } from './analytics';

export interface BadgeDef {
  id: string;
  icon: string;
  name: { tr: string; en: string };
  desc: { tr: string; en: string };
  check: (result: TypingResult, history: TypingResult[], streak: number) => boolean;
}

export const BADGES: BadgeDef[] = [
  // ── First steps ─────────────────────────────────────────────────────────────
  {
    id: 'first_game',
    icon: '🎮',
    name: { tr: 'İlk Adım', en: 'First Step' },
    desc: { tr: 'İlk oyunu tamamla', en: 'Complete your first game' },
    check: (_, h) => h.length >= 1,
  },

  // ── WPM milestones ───────────────────────────────────────────────────────────
  {
    id: 'wpm_40',
    icon: '🐢',
    name: { tr: '40 WPM', en: '40 WPM' },
    desc: { tr: 'Bir oyunda 40 WPM\'e ulaş', en: 'Reach 40 WPM in a game' },
    check: (r) => r.wpm >= 40,
  },
  {
    id: 'wpm_60',
    icon: '🏃',
    name: { tr: '60 WPM', en: '60 WPM' },
    desc: { tr: 'Bir oyunda 60 WPM\'e ulaş', en: 'Reach 60 WPM in a game' },
    check: (r) => r.wpm >= 60,
  },
  {
    id: 'wpm_80',
    icon: '⚡',
    name: { tr: '80 WPM', en: '80 WPM' },
    desc: { tr: 'Bir oyunda 80 WPM\'e ulaş', en: 'Reach 80 WPM in a game' },
    check: (r) => r.wpm >= 80,
  },
  {
    id: 'wpm_100',
    icon: '🚀',
    name: { tr: '100 WPM Kulübü', en: '100 WPM Club' },
    desc: { tr: 'Bir oyunda 100 WPM\'e ulaş', en: 'Reach 100 WPM in a game' },
    check: (r) => r.wpm >= 100,
  },
  {
    id: 'wpm_130',
    icon: '💫',
    name: { tr: 'Efsane', en: 'Legend' },
    desc: { tr: 'Bir oyunda 130 WPM\'e ulaş', en: 'Reach 130 WPM in a game' },
    check: (r) => r.wpm >= 130,
  },

  // ── Accuracy ─────────────────────────────────────────────────────────────────
  {
    id: 'perfect_acc',
    icon: '🎯',
    name: { tr: 'Mükemmel', en: 'Perfect' },
    desc: { tr: 'Bir oyunu %100 doğrulukla bitir', en: 'Finish a game with 100% accuracy' },
    check: (r) => r.accuracy === 100,
  },
  {
    id: 'consistent',
    icon: '✨',
    name: { tr: 'Tutarlı', en: 'Consistent' },
    desc: { tr: '10 oyunu arka arkaya %95+ doğrulukla bitir', en: 'Finish 10 games with 95%+ accuracy' },
    check: (_, h) => h.filter(r => r.accuracy >= 95).length >= 10,
  },

  // ── Game count ───────────────────────────────────────────────────────────────
  {
    id: 'games_10',
    icon: '🎖️',
    name: { tr: 'On Oyun', en: 'Ten Games' },
    desc: { tr: '10 oyun tamamla', en: 'Complete 10 games' },
    check: (_, h) => h.length >= 10,
  },
  {
    id: 'games_50',
    icon: '🏆',
    name: { tr: 'Elli Oyun', en: 'Fifty Games' },
    desc: { tr: '50 oyun tamamla', en: 'Complete 50 games' },
    check: (_, h) => h.length >= 50,
  },
  {
    id: 'games_100',
    icon: '👑',
    name: { tr: 'Yüz Oyun', en: 'Hundred Games' },
    desc: { tr: '100 oyun tamamla', en: 'Complete 100 games' },
    check: (_, h) => h.length >= 100,
  },

  // ── Streaks ──────────────────────────────────────────────────────────────────
  {
    id: 'streak_3',
    icon: '🔥',
    name: { tr: 'Kararlı', en: 'Determined' },
    desc: { tr: '3 günlük seri yap', en: 'Maintain a 3-day streak' },
    check: (_, __, s) => s >= 3,
  },
  {
    id: 'streak_7',
    icon: '🔥',
    name: { tr: 'Haftalık Seri', en: 'Weekly Streak' },
    desc: { tr: '7 günlük seri yap', en: 'Maintain a 7-day streak' },
    check: (_, __, s) => s >= 7,
  },
  {
    id: 'streak_30',
    icon: '🔥',
    name: { tr: 'Aylık Seri', en: 'Monthly Streak' },
    desc: { tr: '30 günlük seri yap', en: 'Maintain a 30-day streak' },
    check: (_, __, s) => s >= 30,
  },

  // ── Mode-specific ────────────────────────────────────────────────────────────
  {
    id: 'word_master',
    icon: '📝',
    name: { tr: 'Kelime Ustası', en: 'Word Master' },
    desc: { tr: 'Kelime modunda 70 WPM\'e ulaş', en: 'Reach 70 WPM in word mode' },
    check: (r) => r.mode === 'words' && r.wpm >= 70,
  },
  {
    id: 'code_writer',
    icon: '💻',
    name: { tr: 'Kod Yazarı', en: 'Code Writer' },
    desc: { tr: 'Kod modunda bir oyunu bitir', en: 'Finish a game in code mode' },
    check: (r) => r.mode === 'code',
  },
  {
    id: 'storyteller',
    icon: '📖',
    name: { tr: 'Hikayeci', en: 'Storyteller' },
    desc: { tr: 'Alıntı modunda 5 oyun tamamla', en: 'Complete 5 games in quote mode' },
    check: (_, h) => h.filter(r => r.mode === 'quote').length >= 5,
  },
];
