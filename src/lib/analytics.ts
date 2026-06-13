// src/lib/analytics.ts
// Typing analytics computation — WPM, accuracy, key heatmap, error maps

export interface KeyStats {
  key: string;
  correct: number;
  incorrect: number;
  total: number;
  accuracy: number;
}

export interface BigramStats {
  bigram: string;
  correct: number;
  incorrect: number;
  accuracy: number;
}

export interface FingerStats {
  finger: string;
  hand: 'left' | 'right';
  keys: string[];
  correct: number;
  incorrect: number;
  accuracy: number;
}

export interface TypingResult {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  durationSeconds: number;
  keyStats: Record<string, KeyStats>;
  bigramErrors: BigramStats[];
  fingerStats: FingerStats[];
  timestamp: number;
  mode: string;
  language: string;
  difficulty: string;
}

// ─── Finger Mapping ─────────────────────────────────────────────────────────

export const FINGER_MAP: Record<string, { finger: string; hand: 'left' | 'right' }> = {
  // Left pinky
  '`': { finger: 'Sol Serçe', hand: 'left' },
  '1': { finger: 'Sol Serçe', hand: 'left' },
  'q': { finger: 'Sol Serçe', hand: 'left' },
  'a': { finger: 'Sol Serçe', hand: 'left' },
  'z': { finger: 'Sol Serçe', hand: 'left' },
  // Left ring
  '2': { finger: 'Sol Yüzük', hand: 'left' },
  'w': { finger: 'Sol Yüzük', hand: 'left' },
  's': { finger: 'Sol Yüzük', hand: 'left' },
  'x': { finger: 'Sol Yüzük', hand: 'left' },
  // Left middle
  '3': { finger: 'Sol Orta', hand: 'left' },
  'e': { finger: 'Sol Orta', hand: 'left' },
  'd': { finger: 'Sol Orta', hand: 'left' },
  'c': { finger: 'Sol Orta', hand: 'left' },
  // Left index
  '4': { finger: 'Sol İşaret', hand: 'left' },
  '5': { finger: 'Sol İşaret', hand: 'left' },
  'r': { finger: 'Sol İşaret', hand: 'left' },
  't': { finger: 'Sol İşaret', hand: 'left' },
  'f': { finger: 'Sol İşaret', hand: 'left' },
  'g': { finger: 'Sol İşaret', hand: 'left' },
  'v': { finger: 'Sol İşaret', hand: 'left' },
  'b': { finger: 'Sol İşaret', hand: 'left' },
  // Thumbs
  ' ': { finger: 'Baş Parmak', hand: 'left' },
  // Right index
  '6': { finger: 'Sağ İşaret', hand: 'right' },
  '7': { finger: 'Sağ İşaret', hand: 'right' },
  'y': { finger: 'Sağ İşaret', hand: 'right' },
  'u': { finger: 'Sağ İşaret', hand: 'right' },
  'h': { finger: 'Sağ İşaret', hand: 'right' },
  'j': { finger: 'Sağ İşaret', hand: 'right' },
  'n': { finger: 'Sağ İşaret', hand: 'right' },
  'm': { finger: 'Sağ İşaret', hand: 'right' },
  // Right middle
  '8': { finger: 'Sağ Orta', hand: 'right' },
  'i': { finger: 'Sağ Orta', hand: 'right' },
  'k': { finger: 'Sağ Orta', hand: 'right' },
  ',': { finger: 'Sağ Orta', hand: 'right' },
  // Right ring
  '9': { finger: 'Sağ Yüzük', hand: 'right' },
  'o': { finger: 'Sağ Yüzük', hand: 'right' },
  'l': { finger: 'Sağ Yüzük', hand: 'right' },
  '.': { finger: 'Sağ Yüzük', hand: 'right' },
  // Right pinky
  '0': { finger: 'Sağ Serçe', hand: 'right' },
  'p': { finger: 'Sağ Serçe', hand: 'right' },
  ';': { finger: 'Sağ Serçe', hand: 'right' },
  '/': { finger: 'Sağ Serçe', hand: 'right' },
  '-': { finger: 'Sağ Serçe', hand: 'right' },
  '[': { finger: 'Sağ Serçe', hand: 'right' },
  ']': { finger: 'Sağ Serçe', hand: 'right' },
  "'": { finger: 'Sağ Serçe', hand: 'right' },
  // Turkish Q keyboard characters (same physical positions as EN equivalents)
  'ğ': { finger: 'Sağ Serçe', hand: 'right' },   // [ key
  'ü': { finger: 'Sağ Serçe', hand: 'right' },   // ] key
  'ş': { finger: 'Sağ Serçe', hand: 'right' },   // ; key
  'ı': { finger: 'Sağ Orta',  hand: 'right' },   // I key (dotless)
  'ö': { finger: 'Sağ Orta',  hand: 'right' },   // , key
  'ç': { finger: 'Sağ Yüzük', hand: 'right' },   // . key
};

// ─── Computation ─────────────────────────────────────────────────────────────

export function computeWPM(correctChars: number, durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  return Math.round((correctChars / 5) / (durationSeconds / 60));
}

export function computeRawWPM(totalChars: number, durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  return Math.round((totalChars / 5) / (durationSeconds / 60));
}

export function computeAccuracy(correct: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((correct / total) * 100 * 10) / 10;
}

export function computeFingerStats(
  keyStats: Record<string, KeyStats>
): FingerStats[] {
  const fingerMap: Record<string, FingerStats> = {};

  for (const [key, stats] of Object.entries(keyStats)) {
    const mapping = FINGER_MAP[key.toLowerCase()];
    if (!mapping) continue;

    const { finger, hand } = mapping;
    if (!fingerMap[finger]) {
      fingerMap[finger] = {
        finger,
        hand,
        keys: [],
        correct: 0,
        incorrect: 0,
        accuracy: 100,
      };
    }

    fingerMap[finger].keys.push(key);
    fingerMap[finger].correct += stats.correct;
    fingerMap[finger].incorrect += stats.incorrect;
  }

  return Object.values(fingerMap).map(f => ({
    ...f,
    accuracy: computeAccuracy(f.correct, f.correct + f.incorrect),
  }));
}

export function buildTypingResult(params: {
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  durationSeconds: number;
  keyStats: Record<string, KeyStats>;
  bigramErrors: BigramStats[];
  mode: string;
  language: string;
  difficulty: string;
}): TypingResult {
  const fingerStats = computeFingerStats(params.keyStats);

  return {
    wpm: computeWPM(params.correctChars, params.durationSeconds),
    rawWpm: computeRawWPM(params.totalChars, params.durationSeconds),
    accuracy: computeAccuracy(params.correctChars, params.totalChars),
    correctChars: params.correctChars,
    incorrectChars: params.incorrectChars,
    totalChars: params.totalChars,
    durationSeconds: params.durationSeconds,
    keyStats: params.keyStats,
    bigramErrors: params.bigramErrors,
    fingerStats,
    timestamp: Date.now(),
    mode: params.mode,
    language: params.language,
    difficulty: params.difficulty,
  };
}

// ─── Heatmap Color Helper ─────────────────────────────────────────────────────

/**
 * Returns a CSS color representing performance (0–100 accuracy)
 * 100 = green, 0 = red, no data = neutral gray
 */
export function getHeatColor(accuracy: number | null, total: number): string {
  if (total === 0 || accuracy === null) return 'var(--bg-tertiary)';
  const h = accuracy * 1.2; // 0→red, 100→green
  const s = 70;
  const l = 35 + accuracy * 0.15;
  return `hsl(${h}, ${s}%, ${l}%)`;
}
