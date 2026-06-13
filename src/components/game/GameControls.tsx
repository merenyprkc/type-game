// src/components/game/GameControls.tsx

import { useState, type ReactElement } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useI18n, type TranslationKey } from '../../store/i18nStore';
import type { GameMode, Language, Difficulty } from '../../lib/wordApi';
import './GameControls.css';

const ClockIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const WordsIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
  </svg>
);

const QuoteIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
  </svg>
);

const PracticeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="4"/>
    <line x1="12" y1="20" x2="12" y2="22"/><line x1="2" y1="12" x2="4" y2="12"/>
    <line x1="20" y1="12" x2="22" y2="12"/>
  </svg>
);

const CustomIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const MODES: { id: GameMode; labelKey: TranslationKey; icon: ReactElement }[] = [
  { id: 'time',     labelKey: 'time',     icon: <ClockIcon /> },
  { id: 'words',    labelKey: 'words',    icon: <WordsIcon /> },
  { id: 'quote',    labelKey: 'quote',    icon: <QuoteIcon /> },
  { id: 'code',     labelKey: 'code',     icon: <CodeIcon /> },
  { id: 'practice', labelKey: 'practice', icon: <PracticeIcon /> },
  { id: 'custom',   labelKey: 'custom',   icon: <CustomIcon /> },
];

const TIME_OPTIONS = [15, 30, 60, 120];
const WORD_OPTIONS = [10, 25, 50, 100];

const DIFFICULTIES: { id: Difficulty; labelKey: TranslationKey }[] = [
  { id: 'easy',   labelKey: 'easy' },
  { id: 'medium', labelKey: 'medium' },
  { id: 'hard',   labelKey: 'hard' },
];

const LANGUAGES: { id: Language; labelKey: TranslationKey; code: string }[] = [
  { id: 'tr', labelKey: 'turkish', code: 'TR' },
  { id: 'en', labelKey: 'english', code: 'EN' },
];

interface GameControlsProps {
  onReset: () => void;
}

export default function GameControls({ onReset }: GameControlsProps) {
  const { settings, setSettings, customText, setCustomText } = useGameStore();
  const { t } = useI18n();
  const { mode, language, difficulty, timeLimit, wordCount } = settings;

  // Local draft for custom text — initialized from persisted customText on mount
  const [draft, setDraft] = useState(customText);

  const handleChange = (key: string, value: unknown) => {
    setSettings({ [key]: value } as Parameters<typeof setSettings>[0]);
    setTimeout(onReset, 0);
  };

  const handleLoadCustom = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setCustomText(trimmed);
    onReset();
  };

  return (
    <div className="game-controls-wrapper">
      <div className="game-controls" id="game-controls">
        {/* Mode */}
        <div className="controls-group">
          {MODES.map(m => (
            <button
              key={m.id}
              id={`mode-${m.id}`}
              className={`control-btn ${mode === m.id ? 'active' : ''}`}
              onClick={() => handleChange('mode', m.id)}
            >
              {m.icon}
              {t(m.labelKey)}
            </button>
          ))}
        </div>

        {/* Time options */}
        {mode === 'time' && (
          <>
            <div className="controls-separator" />
            <div className="controls-group">
              {TIME_OPTIONS.map(n => (
                <button
                  key={n}
                  id={`time-${n}`}
                  className={`control-btn ${timeLimit === n ? 'active' : ''}`}
                  onClick={() => handleChange('timeLimit', n)}
                >
                  {n}s
                </button>
              ))}
            </div>
          </>
        )}

        {/* Word count options */}
        {mode === 'words' && (
          <>
            <div className="controls-separator" />
            <div className="controls-group">
              {WORD_OPTIONS.map(w => (
                <button
                  key={w}
                  id={`words-${w}`}
                  className={`control-btn ${wordCount === w ? 'active' : ''}`}
                  onClick={() => handleChange('wordCount', w)}
                >
                  {w}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Difficulty */}
        {(mode === 'time' || mode === 'words' || mode === 'practice') && (
          <>
            <div className="controls-separator" />
            <div className="controls-group">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  id={`diff-${d.id}`}
                  className={`control-btn ${difficulty === d.id ? 'active' : ''}`}
                  onClick={() => handleChange('difficulty', d.id)}
                >
                  {t(d.labelKey)}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Language */}
        {(mode === 'time' || mode === 'words' || mode === 'practice' || mode === 'quote') && (
          <>
            <div className="controls-separator" />
            <div className="controls-group">
              {LANGUAGES.map(l => (
                <button
                  key={l.id}
                  id={`lang-${l.id}`}
                  className={`control-btn ${language === l.id ? 'active' : ''}`}
                  onClick={() => handleChange('language', l.id)}
                >
                  <GlobeIcon />
                  <span className="lang-code">{l.code}</span>
                  {t(l.labelKey)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Custom text input — shown below controls when mode is custom */}
      {mode === 'custom' && (
        <div className="custom-text-panel">
          <textarea
            className="custom-text-input"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={t('customPlaceholder')}
            rows={4}
            spellCheck={false}
          />
          <button
            className="btn btn-primary custom-load-btn"
            onClick={handleLoadCustom}
            disabled={!draft.trim()}
          >
            {t('loadText')}
          </button>
        </div>
      )}
    </div>
  );
}
