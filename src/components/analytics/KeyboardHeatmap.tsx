// src/components/analytics/KeyboardHeatmap.tsx
// SVG-based keyboard heatmap showing per-key accuracy

import { getHeatColor, type KeyStats } from '../../lib/analytics';
import { useI18n } from '../../store/i18nStore';
import './KeyboardHeatmap.css';

interface KeyboardHeatmapProps {
  keyStats: Record<string, KeyStats>;
  title?: string;
  layout?: 'en' | 'tr';
}

type KeyDef = {
  key: string;
  label?: string;
  width?: number; // in units (default 1)
};

type KeyRow = KeyDef[];

const EN_ROWS: KeyRow[] = [
  // Row 1 — Numbers
  [
    { key: '`', label: '`' }, { key: '1' }, { key: '2' }, { key: '3' },
    { key: '4' }, { key: '5' }, { key: '6' }, { key: '7' }, { key: '8' },
    { key: '9' }, { key: '0' }, { key: '-' }, { key: '=', label: '=' },
    { key: 'backspace', label: '⌫', width: 2 },
  ],
  // Row 2 — QWERTY
  [
    { key: 'tab', label: 'Tab', width: 1.5 },
    { key: 'q' }, { key: 'w' }, { key: 'e' }, { key: 'r' }, { key: 't' },
    { key: 'y' }, { key: 'u' }, { key: 'i' }, { key: 'o' }, { key: 'p' },
    { key: '[' }, { key: ']' }, { key: '\\', label: '\\', width: 1.5 },
  ],
  // Row 3 — Home row
  [
    { key: 'caps', label: 'Caps', width: 1.8 },
    { key: 'a' }, { key: 's' }, { key: 'd' }, { key: 'f' }, { key: 'g' },
    { key: 'h' }, { key: 'j' }, { key: 'k' }, { key: 'l' }, { key: ';' },
    { key: "'", label: "'" }, { key: 'enter', label: 'Enter', width: 2.2 },
  ],
  // Row 4 — Shift row
  [
    { key: 'shift', label: '⇧', width: 2.3 },
    { key: 'z' }, { key: 'x' }, { key: 'c' }, { key: 'v' }, { key: 'b' },
    { key: 'n' }, { key: 'm' }, { key: ',' }, { key: '.' }, { key: '/' },
    { key: 'rshift', label: '⇧', width: 2.7 },
  ],
  // Row 5 — Space
  [
    { key: 'lctrl', label: 'Ctrl', width: 1.3 },
    { key: 'lwin', label: '⊞', width: 1.2 },
    { key: 'lalt', label: 'Alt', width: 1.2 },
    { key: ' ', label: '', width: 6.2 },
    { key: 'ralt', label: 'Alt', width: 1.2 },
    { key: 'rwin', label: '⊞', width: 1.2 },
    { key: 'rctrl', label: 'Ctrl', width: 1.3 },
  ],
];

// Turkish Q keyboard layout
const TR_ROWS: KeyRow[] = [
  // Row 1 — Numbers (same positions)
  [
    { key: '`', label: '`' }, { key: '1' }, { key: '2' }, { key: '3' },
    { key: '4' }, { key: '5' }, { key: '6' }, { key: '7' }, { key: '8' },
    { key: '9' }, { key: '0' }, { key: '-' }, { key: '=', label: '=' },
    { key: 'backspace', label: '⌫', width: 2 },
  ],
  // Row 2 — QWERTY with TR chars
  [
    { key: 'tab', label: 'Tab', width: 1.5 },
    { key: 'q' }, { key: 'w' }, { key: 'e' }, { key: 'r' }, { key: 't' },
    { key: 'y' }, { key: 'u' }, { key: 'ı', label: 'I' }, { key: 'o' }, { key: 'p' },
    { key: 'ğ', label: 'Ğ' }, { key: 'ü', label: 'Ü' }, { key: '\\', label: '\\', width: 1.5 },
  ],
  // Row 3 — Home row with TR chars
  [
    { key: 'caps', label: 'Caps', width: 1.8 },
    { key: 'a' }, { key: 's' }, { key: 'd' }, { key: 'f' }, { key: 'g' },
    { key: 'h' }, { key: 'j' }, { key: 'k' }, { key: 'l' }, { key: 'ş', label: 'Ş' },
    { key: 'i', label: 'İ' }, { key: 'enter', label: 'Enter', width: 2.2 },
  ],
  // Row 4 — Shift row with TR chars
  [
    { key: 'shift', label: '⇧', width: 2.3 },
    { key: 'z' }, { key: 'x' }, { key: 'c' }, { key: 'v' }, { key: 'b' },
    { key: 'n' }, { key: 'm' }, { key: 'ö', label: 'Ö' }, { key: 'ç', label: 'Ç' }, { key: '.' },
    { key: 'rshift', label: '⇧', width: 2.7 },
  ],
  // Row 5 — Space (same)
  [
    { key: 'lctrl', label: 'Ctrl', width: 1.3 },
    { key: 'lwin', label: '⊞', width: 1.2 },
    { key: 'lalt', label: 'Alt', width: 1.2 },
    { key: ' ', label: '', width: 6.2 },
    { key: 'ralt', label: 'Alt', width: 1.2 },
    { key: 'rwin', label: '⊞', width: 1.2 },
    { key: 'rctrl', label: 'Ctrl', width: 1.3 },
  ],
];

const SPECIAL_KEYS = new Set(['tab', 'caps', 'shift', 'enter', 'backspace', 'lctrl', 'rctrl', 'lwin', 'rwin', 'lalt', 'ralt']);

const KEY_W = 44; // px per unit
const KEY_H = 44;
const GAP = 4;

export default function KeyboardHeatmap({ keyStats, title, layout = 'en' }: KeyboardHeatmapProps) {
  const ROWS = layout === 'tr' ? TR_ROWS : EN_ROWS;
  const { t, uiLang } = useI18n();

  return (
    <div className="keyboard-heatmap">
      {title && <h3 className="heatmap-title">{title}</h3>}

      <div className="keyboard-wrap">
        {ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="kb-row">
            {row.map((keyDef) => {
              const w = keyDef.width ?? 1;
              const keyName = keyDef.key.toLowerCase();
              const stats = keyStats[keyName];
              const isSpecial = SPECIAL_KEYS.has(keyName) || keyName === ' ';
              const accuracy = stats ? (stats.correct / stats.total) * 100 : null;
              const total = stats?.total ?? 0;
              const heatBg = isSpecial ? 'var(--bg-tertiary)' : getHeatColor(accuracy, total);
              const displayLabel = keyDef.label ?? keyDef.key.toUpperCase();
              const textColor = total > 0 && !isSpecial ? '#fff' : 'var(--text-secondary)';

              // Generate localized tooltip
              const tooltip = stats 
                ? uiLang === 'tr'
                  ? `${keyName.toUpperCase()}: ${total} ${t('keysUnit')}, %${Math.round(accuracy ?? 0)} ${t('accuracy').toLowerCase()}`
                  : `${keyName.toUpperCase()}: ${total} ${t('keysUnit')}, ${Math.round(accuracy ?? 0)}% ${t('accuracy').toLowerCase()}`
                : keyName.toUpperCase();

              return (
                <div
                  key={keyDef.key}
                  className={`kb-key ${isSpecial ? 'special' : ''} ${total > 0 ? 'has-data' : ''}`}
                  style={{
                    width: `${w * KEY_W + (w - 1) * GAP}px`,
                    height: `${KEY_H}px`,
                    background: heatBg,
                    color: textColor,
                  }}
                  title={tooltip}
                >
                  <span className="kb-key-label">{displayLabel}</span>
                  {total > 0 && !isSpecial && (
                    <span className="kb-key-acc">{Math.round(accuracy ?? 0)}%</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span className="legend-label">{t('lowAccuracy')}</span>
        <div className="legend-gradient" />
        <span className="legend-label">{t('highAccuracy')}</span>
        <span className="legend-nodata">{t('noDataLegend')}</span>
      </div>
    </div>
  );
}
