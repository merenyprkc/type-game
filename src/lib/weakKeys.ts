// src/lib/weakKeys.ts
// Analyzes typing history to identify weak keys and generate practice word lists.

import type { TypingResult } from './analytics';
import type { Language, Difficulty } from './wordApi';
import { fetchWords } from './wordApi';

export interface WeakKey {
  key: string;
  errorRate: number;
  errors: number;
  total: number;
}

// Uses last `recentN` games so the analysis reflects current skill level
export function getWeakKeys(history: TypingResult[], topN = 8, recentN = 10): WeakKey[] {
  const recent = history.slice(0, recentN);
  const agg: Record<string, { correct: number; incorrect: number; total: number }> = {};

  for (const result of recent) {
    for (const [k, stats] of Object.entries(result.keyStats)) {
      if (!agg[k]) agg[k] = { correct: 0, incorrect: 0, total: 0 };
      agg[k].correct += stats.correct;
      agg[k].incorrect += stats.incorrect;
      agg[k].total += stats.total;
    }
  }

  return Object.entries(agg)
    .filter(([key, s]) => s.total >= 2 && key !== ' ' && key.length === 1)
    .map(([key, s]) => ({
      key,
      errorRate: s.total > 0 ? s.incorrect / s.total : 0,
      errors: s.incorrect,
      total: s.total,
    }))
    .filter(w => w.errors > 0)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, topN);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function selectPracticeWords(pool: string[], weakKeys: string[], count: number): string[] {
  if (weakKeys.length === 0) return shuffle(pool).slice(0, count);

  const score = (w: string) =>
    weakKeys.reduce((s, k) => s + [...w.toLowerCase()].filter(c => c === k).length, 0);

  const withWeak = pool.filter(w => weakKeys.some(k => w.toLowerCase().includes(k)));
  const without = pool.filter(w => !weakKeys.some(k => w.toLowerCase().includes(k)));

  withWeak.sort((a, b) => score(b) - score(a));

  const weakCount = Math.min(Math.ceil(count * 0.8), withWeak.length);
  const otherCount = count - weakCount;

  return shuffle([
    ...withWeak.slice(0, weakCount),
    ...shuffle(without).slice(0, otherCount),
  ]).slice(0, count);
}

export async function fetchPracticeWords(
  weakKeys: string[],
  language: Language,
  difficulty: Difficulty,
  count = 25,
): Promise<string[]> {
  const pool = await fetchWords(100, language, difficulty);
  return selectPracticeWords(pool, weakKeys, count);
}
