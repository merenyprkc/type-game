// src/components/game/TypingArea.tsx

import { useRef, useEffect, useState, useCallback } from 'react';
import type { WordState } from '../../hooks/useTypingGame';
import { useGameStore } from '../../store/gameStore';
import { useI18n } from '../../store/i18nStore';
import { useKeySound } from '../../hooks/useKeySound';
import './TypingArea.css';

interface TypingAreaProps {
  words: WordState[];
  typedText: string;
  currentWordIndex: number;
  wpm: number;
  accuracy: number;
  timeLeft: number;
  isLoading: boolean;
  isTyping: boolean;
  progress: number;
  quoteAuthor: string;
  codeLanguage: string;
  onInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export default function TypingArea({
  words,
  typedText,
  currentWordIndex,
  wpm,
  accuracy,
  timeLeft,
  isLoading,
  isTyping,
  progress,
  quoteAuthor,
  codeLanguage,
  onInput,
  onKeyDown,
}: TypingAreaProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const displayRef = useRef<HTMLDivElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  const { settings } = useGameStore();
  const { mode, timeLimit } = settings;
  const { t } = useI18n();
  const playClick = useKeySound();

  // Auto-focus on mount/reset
  useEffect(() => {
    inputRef.current?.focus();
  }, [words.length > 0 && words[0]?.word]);

  // Scroll active word into view
  useEffect(() => {
    const activeWord = wordRefs.current[currentWordIndex];
    const display = displayRef.current;
    if (!activeWord || !display) return;

    const inner = display.querySelector('.word-display-inner') as HTMLElement;
    if (!inner) return;

    const wordTop = activeWord.offsetTop;
    const lineHeight = parseFloat(getComputedStyle(inner).lineHeight) || 35;
    // Keep active word on the second line (scroll past first row)
    const targetScroll = Math.max(0, wordTop - lineHeight);
    inner.style.transform = `translateY(-${targetScroll}px)`;
  }, [currentWordIndex]);

  // onMouseDown + preventDefault: prevents the browser from blurring the hidden
  // input when user clicks the overlay or any non-input area of the wrapper.
  // onClick alone fires AFTER blur, so the focus call would arrive too late.
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target !== inputRef.current) {
      e.preventDefault();
      inputRef.current?.focus();
    }
  }, []);

  const timerPercent = mode === 'time'
    ? (timeLeft / timeLimit) * 100
    : progress;

  const timerClass = mode === 'time'
    ? timeLeft <= 10 ? 'danger' : timeLeft <= 20 ? 'warning' : ''
    : '';

  return (
    <div
      className={`typing-area-wrapper ${!isFocused ? 'unfocused' : ''}`}
      onMouseDown={handleMouseDown}
    >
      {/* Live Stats */}
      <div className="live-stats">
        {isTyping ? (
          <>
            <div className="live-stat">
              <span className="live-stat-value">{wpm}</span>
              <span className="live-stat-label">{t('wpm')}</span>
            </div>
            <div className="live-stat">
              <span
                className="live-stat-value"
                style={{ color: accuracy >= 95 ? 'var(--success)' : accuracy >= 80 ? 'var(--accent)' : 'var(--error)' }}
              >
                {accuracy}%
              </span>
              <span className="live-stat-label">{t('accuracy')}</span>
            </div>
            {mode === 'time' && (
              <div className="live-stat">
                <span
                  className="live-stat-value"
                  style={{ color: timeLeft <= 10 ? 'var(--error)' : 'var(--text-primary)' }}
                >
                  {timeLeft}
                </span>
                <span className="live-stat-label">{t('seconds')}</span>
              </div>
            )}
          </>
        ) : (
          <div style={{ height: '36px' }} />
        )}
      </div>

      {/* Timer/Progress Bar */}
      <div className="timer-bar-wrapper">
        <div
          className={`timer-bar ${timerClass}`}
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Code language badge */}
      {mode === 'code' && codeLanguage && (
        <div className="code-lang-badge">{codeLanguage}</div>
      )}

      {/* Word Display — blur applied here; overlay is a sibling (not child)
          so it never inherits the filter */}
      <div className="word-display-container">
        <div className="word-display" ref={displayRef}>
          {isLoading ? (
            <div className="typing-loading">
              <div className="loading-dot" />
              <div className="loading-dot" />
              <div className="loading-dot" />
            </div>
          ) : (
            <div className="word-display-inner">
              {words.map((wordState, wordIdx) => (
                <span
                  key={wordIdx}
                  ref={el => { wordRefs.current[wordIdx] = el; }}
                  className={[
                    'word',
                    wordState.isCompleted ? 'completed' : '',
                    wordState.isCompleted && wordState.hasError ? 'has-error' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {wordState.chars.map((charState, charIdx) => (
                    <span key={charIdx} className={`char ${charState.state}`}>
                      {charState.char}
                    </span>
                  ))}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Overlay is OUTSIDE .word-display — filter:blur on parent can't bleed here */}
        {!isFocused && !isLoading && (
          <div className="click-to-focus">{t('clickToFocus')}</div>
        )}
      </div>

      {/* Quote author */}
      {mode === 'quote' && quoteAuthor && (
        <div className="quote-author">— {quoteAuthor}</div>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        id="typing-input"
        className="typing-input"
        type="text"
        value={typedText}
        onChange={onInput}
        onKeyDown={(e) => {
          if (!['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab', 'Escape'].includes(e.key)) {
            playClick(e.key === ' ');
          }
          onKeyDown(e);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        data-lpignore="true"
        aria-label={t('clickToFocus')}
        disabled={isLoading}
      />

      {/* Reset hint */}
      <div className={`reset-hint ${isTyping ? 'visible' : 'hidden'}`}>
        <kbd>Tab</kbd> {t('restartHint')}
      </div>
    </div>
  );
}
