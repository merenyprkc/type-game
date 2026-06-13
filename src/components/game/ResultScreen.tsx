// src/components/game/ResultScreen.tsx

import type { TypingResult } from '../../lib/analytics';
import { useI18n, type TranslationKey } from '../../store/i18nStore';
import './ResultScreen.css';

interface ResultScreenProps {
  result: TypingResult;
  onRestart: () => void;
}

function getEvaluationKey(wpm: number): { key: TranslationKey; color: string } {
  if (wpm >= 120) return { key: 'evalAmazing',   color: 'var(--accent)' };
  if (wpm >= 90)  return { key: 'evalExcellent', color: '#a855f7' };
  if (wpm >= 70)  return { key: 'evalGreat',     color: 'var(--success)' };
  if (wpm >= 50)  return { key: 'evalGood',      color: 'var(--info)' };
  if (wpm >= 35)  return { key: 'evalImproving', color: 'var(--accent)' };
  return { key: 'evalPractice', color: 'var(--text-secondary)' };
}

const modeKeys: Record<string, TranslationKey> = {
  time: 'timeMode',
  words: 'wordsMode',
  quote: 'quoteMode',
  code: 'codeMode',
  practice: 'practice',
  custom: 'custom',
};

const RefreshIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
  </svg>
);

const HomeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

export default function ResultScreen({ result, onRestart }: ResultScreenProps) {
  const { t } = useI18n();
  const eval_ = getEvaluationKey(result.wpm);

  const topErrors = Object.values(result.keyStats)
    .filter(k => k.incorrect > 0)
    .sort((a, b) => b.incorrect - a.incorrect)
    .slice(0, 12);

  return (
    <div className="result-screen animate-fade-in">
      {/* Header */}
      <div className="result-header">
        <div
          className="result-eval"
          style={{ background: `${eval_.color}22`, color: eval_.color, border: `1px solid ${eval_.color}44` }}
        >
          {t(eval_.key)}
        </div>
        <p className="result-title">
          {t(modeKeys[result.mode] ?? 'timeMode')} &middot;{' '}
          {result.language === 'tr' ? t('turkish') : t('english')} &middot;{' '}
          {result.difficulty === 'easy' ? t('easy') : result.difficulty === 'medium' ? t('medium') : t('hard')}
        </p>
      </div>

      {/* Main Stats */}
      <div className="result-main-stats">
        <div className="result-stat-secondary">
          <div className="value" style={{ color: result.accuracy >= 95 ? 'var(--success)' : result.accuracy >= 80 ? 'var(--text-primary)' : 'var(--error)' }}>
            {result.accuracy}%
          </div>
          <div className="label">{t('accuracy')}</div>
        </div>

        <div className="result-stat-primary">
          <div className="value">{result.wpm}</div>
          <div className="label">{t('wpm')}</div>
        </div>

        <div className="result-stat-secondary">
          <div className="value">{result.rawWpm}</div>
          <div className="label">{t('rawWpm')}</div>
        </div>
      </div>

      {/* Extra Stats */}
      <div className="result-extra-stats">
        <div className="result-extra-card">
          <div className="value" style={{ color: 'var(--success)' }}>{result.correctChars}</div>
          <div className="label">{t('correctChars')}</div>
        </div>
        <div className="result-extra-card">
          <div className="value" style={{ color: 'var(--error)' }}>{result.incorrectChars}</div>
          <div className="label">{t('incorrectChars')}</div>
        </div>
        <div className="result-extra-card">
          <div className="value">{result.totalChars}</div>
          <div className="label">{t('totalChars')}</div>
        </div>
        <div className="result-extra-card">
          <div className="value">{Math.round(result.durationSeconds)}s</div>
          <div className="label">{t('duration')}</div>
        </div>
      </div>

      {/* Error keys */}
      {topErrors.length > 0 && (
        <div className="result-analytics">
          <div className="analytics-card">
            <h3 className="analytics-card-title">{t('topErrorKeys')}</h3>
            <div className="error-list">
              {topErrors.map(key => (
                <div key={key.key} className="error-item">
                  <span className="error-key">
                    {key.key === ' ' ? '␣' : key.key}
                  </span>
                  <span className="error-count">×{key.incorrect}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="result-actions">
        <button id="result-restart-btn" className="btn btn-primary" onClick={onRestart}>
          <RefreshIcon />
          {t('playAgain')}
        </button>
        <button id="result-home-btn" className="btn btn-ghost" onClick={onRestart}>
          <HomeIcon />
          {t('home')}
        </button>
      </div>
    </div>
  );
}
