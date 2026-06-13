// src/hooks/useTypingGame.ts
// Core typing game logic — clean architecture with refs, no stale closures

import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchWords, fetchQuote, getRandomCodeSnippet, type Language, type Difficulty } from '../lib/wordApi';
import { getWeakKeys, selectPracticeWords } from '../lib/weakKeys';
import { computeWPM, computeAccuracy, buildTypingResult, type KeyStats, type BigramStats } from '../lib/analytics';
import { useGameStore } from '../store/gameStore';
import { useAuthStore } from '../store/authStore';
import { useStreakStore } from '../store/streakStore';
import { useBadgeStore } from '../store/badgeStore';
import { saveResult, updateLeaderboard, saveStreak, saveUserBadges } from '../lib/firestore';

export type CharState = 'correct' | 'incorrect' | 'extra' | 'untyped' | 'current';

export interface WordState {
  word: string;
  chars: Array<{ char: string; state: CharState }>;
  isActive: boolean;
  isCompleted: boolean;
  hasError: boolean;
}

interface UseTypingGameReturn {
  words: WordState[];
  typedText: string;
  currentWordIndex: number;
  currentCharIndex: number;
  wpm: number;
  rawWpm: number;
  accuracy: number;
  timeLeft: number;
  timeElapsed: number;
  isLoading: boolean;
  isFinished: boolean;
  isTyping: boolean;
  errors: number;
  progress: number;
  handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  resetGame: () => void;
  quoteAuthor: string;
  codeLanguage: string;
}

function buildWordStates(wordList: string[]): WordState[] {
  return wordList.map((word, i) => ({
    word,
    chars: word.split('').map((char, ci) => ({
      char,
      // Only the very first char of the very first word is the cursor position
      state: (i === 0 && ci === 0 ? 'current' : 'untyped') as CharState,
    })),
    isActive: i === 0,
    isCompleted: false,
    hasError: false,
  }));
}

export function useTypingGame(): UseTypingGameReturn {
  const setStatus = useGameStore(s => s.setStatus);
  const setLastResult = useGameStore(s => s.setLastResult);
  const addToHistory = useGameStore(s => s.addToHistory);
  const settings = useGameStore(s => s.settings);
  const { mode, language, difficulty, timeLimit, wordCount } = settings;

  // Keep store actions in a ref to avoid re-render loops
  const storeActionsRef = useRef({ setStatus, setLastResult, addToHistory });
  storeActionsRef.current = { setStatus, setLastResult, addToHistory };

  // ── React state (UI) ──────────────────────────────────────────────────────
  const [words, setWords] = useState<WordState[]>([]);
  const [typedText, setTypedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('');

  // ── Mutable refs (game engine, no stale closures) ─────────────────────────
  const startTimeRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const keyStatsRef = useRef<Record<string, KeyStats>>({});
  const bigramRef = useRef<Record<string, { correct: number; incorrect: number }>>({});
  const prevCharRef = useRef('');
  const correctCharsRef = useRef(0);
  const totalCharsRef = useRef(0);
  const isFinishedRef = useRef(false);
  const isTypingRef = useRef(false);
  const currentWordIndexRef = useRef(0);
  const totalWordsRef = useRef(0);
  const settingsRef = useRef(settings);
  const prevTypedLengthRef = useRef(0); // track prev input length for backspace detection

  // Reset trigger — increment to reload content
  const [resetKey, setResetKey] = useState(0);
  // Total word count for non-time modes (used for progress bar)
  const [totalWords, setTotalWords] = useState(0);

  // Keep settingsRef current
  settingsRef.current = settings;

  // ── Finish Game ───────────────────────────────────────────────────────────
  const finishGameRef = useRef<() => void>(null!);

  finishGameRef.current = () => {
    if (isFinishedRef.current) return;
    isFinishedRef.current = true;

    if (timerRef.current) clearInterval(timerRef.current);

    const { mode: m, language: l, difficulty: d } = settingsRef.current;
    const elapsed = startTimeRef.current
      ? Math.max(1, (Date.now() - startTimeRef.current) / 1000)
      : 1;

    const bigramErrors: BigramStats[] = Object.entries(bigramRef.current)
      .map(([bigram, stats]) => ({
        bigram,
        correct: stats.correct,
        incorrect: stats.incorrect,
        accuracy: computeAccuracy(stats.correct, stats.correct + stats.incorrect),
      }))
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 20);

    const result = buildTypingResult({
      correctChars: correctCharsRef.current,
      incorrectChars: totalCharsRef.current - correctCharsRef.current,
      totalChars: totalCharsRef.current,
      durationSeconds: elapsed,
      keyStats: keyStatsRef.current,
      bigramErrors,
      mode: m,
      language: l,
      difficulty: d,
    });

    setIsFinished(true);
    setIsTyping(false);
    storeActionsRef.current.setStatus('finished');
    storeActionsRef.current.setLastResult(result);

    // Custom mode is sandboxed — no history, streak, badges, or Firestore writes
    if (m === 'custom') return;

    storeActionsRef.current.addToHistory(result);

    // Update daily streak (local, runs for everyone)
    useStreakStore.getState().updateStreak();

    // Check badges — history already includes current result via addToHistory above
    const { history: localHistory } = useGameStore.getState();
    const { currentStreak } = useStreakStore.getState();
    useBadgeStore.getState().checkAndAward(result, localHistory, currentStreak);

    // Save to Firestore if user is logged in — use getState() to avoid hook rules
    const { user } = useAuthStore.getState();
    if (user) {
      saveResult(user.uid, result).catch(console.error);
      updateLeaderboard(user.uid, user.displayName ?? 'Anonim', user.photoURL ?? '', result).catch(console.error);
      const { currentStreak, longestStreak } = useStreakStore.getState();
      saveStreak(user.uid, currentStreak, longestStreak).catch(console.error);
      const { earned } = useBadgeStore.getState();
      saveUserBadges(user.uid, Object.keys(earned)).catch(console.error);
    }
  };

  // ── Load Content ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Reset all mutable refs
    isFinishedRef.current = false;
    isTypingRef.current = false;
    currentWordIndexRef.current = 0;
    startTimeRef.current = null;
    keyStatsRef.current = {};
    bigramRef.current = {};
    prevCharRef.current = '';
    correctCharsRef.current = 0;
    totalCharsRef.current = 0;
    prevTypedLengthRef.current = 0;

    if (timerRef.current) clearInterval(timerRef.current);

    // Reset React state
    setIsLoading(true);
    setIsFinished(false);
    setIsTyping(false);
    setTypedText('');
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setTimeElapsed(0);
    storeActionsRef.current.setStatus('idle');

    const { mode: m, language: l, difficulty: d, timeLimit: tl, wordCount: wc } = settingsRef.current;
    setTimeLeft(tl);

    let cancelled = false;

    async function load() {
      try {
        let wordList: string[] = [];

        if (m === 'custom') {
          const { customText } = useGameStore.getState();
          if (!customText.trim()) {
            if (!cancelled) setIsLoading(false);
            return;
          }
          wordList = customText.trim().split(/\s+/).filter(Boolean);
          setQuoteAuthor('');
          setCodeLanguage('');
        } else if (m === 'practice') {
          const pool = await fetchWords(100, l as Language, d as Difficulty);
          if (cancelled) return;
          const recent = useGameStore.getState().history.slice(0, 10);
          const wks = getWeakKeys(recent);
          wordList = selectPracticeWords(pool, wks.map(w => w.key), 25);
          setQuoteAuthor('');
          setCodeLanguage('');
        } else if (m === 'quote') {
          const quote = await fetchQuote(l as Language);
          if (cancelled) return;
          wordList = quote.text.split(/\s+/).filter(Boolean);
          setQuoteAuthor(quote.author);
          setCodeLanguage('');
        } else if (m === 'code') {
          const snippet = getRandomCodeSnippet();
          wordList = snippet.code.split(/\n/).flatMap(line => line.trim().split(/\s+/)).filter(Boolean);
          setCodeLanguage(snippet.language);
          setQuoteAuthor('');
        } else {
          const count = m === 'time' ? 80 : wc;
          wordList = await fetchWords(count, l as Language, d as Difficulty);
          if (cancelled) return;
          setQuoteAuthor('');
          setCodeLanguage('');
        }

        if (wordList.length === 0) {
          console.error('Empty word list received');
          setIsLoading(false);
          return;
        }

        totalWordsRef.current = wordList.length;
        setTotalWords(wordList.length);
        setWords(buildWordStates(wordList));
      } catch (err) {
        console.error('Failed to load:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, mode, language, difficulty, timeLimit, wordCount]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetGame = useCallback(() => {
    setResetKey(k => k + 1);
  }, []);

  // ── Timer ─────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const { mode: m, timeLimit: tl } = settingsRef.current;
      const elapsed = (Date.now() - startTimeRef.current!) / 1000;
      setTimeElapsed(Math.floor(elapsed));

      if (m === 'time') {
        const left = Math.max(0, tl - elapsed);
        setTimeLeft(Math.ceil(left));
        if (left <= 0) finishGameRef.current();
      }
    }, 100);
  }, []);

  // ── Track Key ─────────────────────────────────────────────────────────────
  const trackKey = useCallback((key: string, isCorrect: boolean) => {
    const k = key.toLowerCase();
    if (!keyStatsRef.current[k]) {
      keyStatsRef.current[k] = { key: k, correct: 0, incorrect: 0, total: 0, accuracy: 100 };
    }
    keyStatsRef.current[k].total++;
    if (isCorrect) keyStatsRef.current[k].correct++;
    else keyStatsRef.current[k].incorrect++;
    keyStatsRef.current[k].accuracy = computeAccuracy(
      keyStatsRef.current[k].correct, keyStatsRef.current[k].total
    );

    if (prevCharRef.current) {
      const bg = prevCharRef.current + k;
      if (!bigramRef.current[bg]) bigramRef.current[bg] = { correct: 0, incorrect: 0 };
      if (isCorrect) bigramRef.current[bg].correct++;
      else bigramRef.current[bg].incorrect++;
    }

    totalCharsRef.current++;
    if (isCorrect) { correctCharsRef.current++; prevCharRef.current = k; }
  }, []);

  // ── Handle Input ──────────────────────────────────────────────────────────
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinishedRef.current) return;

    const value = e.target.value;
    const { mode: m, wordCount: wc } = settingsRef.current;

    // Start timer on first keystroke
    if (!isTypingRef.current && value.length > 0) {
      isTypingRef.current = true;
      setIsTyping(true);
      storeActionsRef.current.setStatus('typing');
      startTimer();
    }

    // ── Space → advance word ──────────────────────────────────────────────
    if (value.endsWith(' ')) {
      const typed = value.trim();
      // Capture index BEFORE setState — prevents Strict Mode double-invocation
      // from reading the already-mutated ref on the second call
      const wi = currentWordIndexRef.current;
      const nextIdx = wi + 1;
      let capturedMissedChars = 0;

      setWords(prev => {
        const next = [...prev];
        const word = next[wi]; // uses captured wi, constant across invocations

        if (!word) return prev;

        word.isActive = false;
        word.isCompleted = true;
        word.chars = word.word.split('').map((char, i) => ({
          char,
          state: (i < typed.length
            ? (typed[i] === char ? 'correct' : 'incorrect')
            : 'incorrect') as CharState,
        }));
        word.hasError = typed !== word.word;

        // Idempotent computation — safe to run twice
        capturedMissedChars = Math.max(0, word.word.length - typed.length);

        if (nextIdx < next.length) {
          next[nextIdx] = {
            ...next[nextIdx],
            isActive: true,
            chars: next[nextIdx].word.split('').map((char, i) => ({
              char,
              state: (i === 0 ? 'current' : 'untyped') as CharState,
            })),
          };
        }

        // Check finish conditions
        if (m === 'words' && nextIdx >= wc) {
          setTimeout(() => finishGameRef.current(), 0);
        }
        if ((m === 'quote' || m === 'code' || m === 'practice' || m === 'custom') && nextIdx >= totalWordsRef.current) {
          setTimeout(() => finishGameRef.current(), 0);
        }

        return next;
      });

      // All ref mutations OUTSIDE setState — runs exactly once
      currentWordIndexRef.current = nextIdx;
      setCurrentWordIndex(nextIdx);
      if (capturedMissedChars > 0) totalCharsRef.current += capturedMissedChars;
      trackKey(' ', true);

      // Clear the DOM input value immediately — setTypedText('') is async so the
      // browser would otherwise append the next keystroke onto the old word value,
      // causing every subsequent character to be compared with a stale prefix.
      e.target.value = '';
      setTypedText('');
      setCurrentCharIndex(0);
      prevTypedLengthRef.current = 0;
      return;
    }

    // ── Regular typing ────────────────────────────────────────────────────
    setTypedText(value);
    setCurrentCharIndex(value.length);

    setWords(prev => {
      const next = [...prev];
      const wi = currentWordIndexRef.current;
      const word = next[wi];
      if (!word) return prev;

      const chars = word.word.split('').map((char, i) => {
        if (i < value.length) return { char, state: (value[i] === char ? 'correct' : 'incorrect') as CharState };
        if (i === value.length) return { char, state: 'current' as CharState };
        return { char, state: 'untyped' as CharState };
      });

      if (value.length > word.word.length) {
        chars.push(...value.slice(word.word.length).split('').map(char => ({
          char, state: 'extra' as CharState,
        })));
      }

      // Only track when a new character was added (not backspace)
      if (value.length > prevTypedLengthRef.current) {
        const lastTyped = value[value.length - 1];
        if (lastTyped) trackKey(lastTyped, lastTyped === word.word[value.length - 1]);
      }
      prevTypedLengthRef.current = value.length;

      next[wi] = { ...word, chars, hasError: value !== word.word.slice(0, value.length) };
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTimer, trackKey]);

  // ── Handle Key Down ───────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' || e.key === 'Escape') {
      e.preventDefault();
      resetGame();
    }
  }, [resetGame]);

  // ── Live Stats ────────────────────────────────────────────────────────────
  const elapsed = startTimeRef.current
    ? Math.max(1, (Date.now() - startTimeRef.current) / 1000)
    : 1;

  const wpm = isTyping ? computeWPM(correctCharsRef.current, elapsed) : 0;
  const rawWpm = isTyping ? Math.round((totalCharsRef.current / 5) / (elapsed / 60)) : 0;
  const accuracy = computeAccuracy(correctCharsRef.current, totalCharsRef.current);

  const progress = mode === 'time'
    ? ((timeLimit - timeLeft) / timeLimit) * 100
    : mode === 'words'
    ? Math.min(100, (currentWordIndex / Math.max(wordCount, 1)) * 100)
    : Math.min(100, (currentWordIndex / Math.max(totalWords, 1)) * 100);

  return {
    words, typedText, currentWordIndex, currentCharIndex,
    wpm, rawWpm, accuracy, timeLeft, timeElapsed,
    isLoading, isFinished, isTyping,
    errors: 0, progress,
    handleInput, handleKeyDown, resetGame,
    quoteAuthor, codeLanguage,
  };
}
