import { useThemeStore, THEMES } from '../../store/themeStore';
import { useSoundStore } from '../../store/soundStore';
import { useI18n } from '../../store/i18nStore';
import './SettingsPanel.css';

interface Props {
  onClose: () => void;
}

export default function SettingsPanel({ onClose }: Props) {
  const { theme, setTheme, customColors, setCustomColors } = useThemeStore();
  const { enabled: soundEnabled, toggle: toggleSound } = useSoundStore();
  const { uiLang } = useI18n();

  const isCustomActive = theme === 'custom';

  function handleColorChange(key: 'accent' | 'bg', value: string) {
    setCustomColors({ ...customColors, [key]: value });
    if (theme !== 'custom') setTheme('custom');
  }

  return (
    <>
      <div className="settings-backdrop" onClick={onClose} />
      <aside className="settings-panel">

        <div className="settings-header">
          <span className="settings-title">
            {uiLang === 'tr' ? 'Ayarlar' : 'Settings'}
          </span>
          <button className="settings-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="settings-body">

          <section className="settings-section">
            <h3 className="settings-section-title">
              {uiLang === 'tr' ? 'Ses Efektleri' : 'Sound Effects'}
            </h3>
            <label className="settings-row" onClick={toggleSound}>
              <span className="settings-row-label">
                {uiLang === 'tr' ? 'Klavye sesleri' : 'Keyboard sounds'}
              </span>
              <span className={`toggle-track ${soundEnabled ? 'on' : ''}`}>
                <span className="toggle-thumb" />
              </span>
            </label>
          </section>

          <section className="settings-section">
            <h3 className="settings-section-title">
              {uiLang === 'tr' ? 'Tema' : 'Theme'}
            </h3>
            <div className="theme-grid">
              {THEMES.map(thm => {
                const accentColor = thm.id === 'custom' ? customColors.accent : thm.accent;
                const bgColor = thm.id === 'custom' ? customColors.bg : thm.bg;
                const isActive = theme === thm.id;
                return (
                  <button
                    key={thm.id}
                    className={`theme-card ${isActive ? 'active' : ''}`}
                    onClick={() => setTheme(thm.id)}
                  >
                    <div
                      className="theme-card-preview"
                      style={{
                        background: bgColor,
                        boxShadow: isActive
                          ? `0 0 0 2.5px ${accentColor}`
                          : '0 0 0 1px rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="theme-card-bar" style={{ background: accentColor }} />
                    </div>
                    <span
                      className="theme-card-name"
                      style={{ color: isActive ? accentColor : undefined }}
                    >
                      {thm.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {isCustomActive && (
              <div className="custom-colors">
                <h4 className="custom-colors-title">
                  {uiLang === 'tr' ? 'Özel Renkler' : 'Custom Colors'}
                </h4>
                <div className="color-row">
                  <label className="color-label">
                    {uiLang === 'tr' ? 'Vurgu Rengi' : 'Accent'}
                  </label>
                  <div className="color-input-wrap">
                    <input
                      type="color"
                      className="color-picker"
                      value={customColors.accent}
                      onChange={e => handleColorChange('accent', e.target.value)}
                    />
                    <span className="color-hex">{customColors.accent}</span>
                  </div>
                </div>
                <div className="color-row">
                  <label className="color-label">
                    {uiLang === 'tr' ? 'Arka Plan' : 'Background'}
                  </label>
                  <div className="color-input-wrap">
                    <input
                      type="color"
                      className="color-picker"
                      value={customColors.bg}
                      onChange={e => handleColorChange('bg', e.target.value)}
                    />
                    <span className="color-hex">{customColors.bg}</span>
                  </div>
                </div>
              </div>
            )}
          </section>

        </div>
      </aside>
    </>
  );
}
