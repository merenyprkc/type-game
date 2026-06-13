// src/components/layout/Navbar.tsx

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useI18n } from '../../store/i18nStore';
import { useAuthStore } from '../../store/authStore';
import { useStreakStore } from '../../store/streakStore';
import SettingsPanel from '../ui/SettingsPanel';
import './Navbar.css';

const GearIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

export default function Navbar() {
  const { uiLang, setUILang, t } = useI18n();
  const { user, loading, signInWithGoogle, signOut } = useAuthStore();
  const currentStreak = useStreakStore(s => s.currentStreak);
  const navigate = useNavigate();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleProfileClick = () => {
    if (user) navigate(`/profile/${user.uid}`);
  };

  return (
    <>
      <nav className="navbar">
        <div className="container navbar-inner">

          {/* ── Left: Logo ─────────────────────────────────────── */}
          <NavLink to="/" className="navbar-logo">
            <span className="navbar-logo-mark">T</span>
            <span className="navbar-logo-text">TypeGame</span>
          </NavLink>

          {/* ── Center: Nav links ──────────────────────────────── */}
          <div className="navbar-nav">
            <NavLink to="/" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`} end>
              {t('game')}
            </NavLink>
            <NavLink to="/leaderboard" className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}>
              {t('leaderboard')}
            </NavLink>
          </div>

          {/* ── Right: Actions + Auth ──────────────────────────── */}
          <div className="navbar-actions">

            {/* Streak badge */}
            {currentStreak > 0 && (
              <div className="navbar-streak" title={`${currentStreak} günlük seri`}>
                🔥 {currentStreak}
              </div>
            )}

            {/* Settings */}
            <button
              className={`navbar-icon-btn ${settingsOpen ? 'active' : ''}`}
              onClick={() => setSettingsOpen(true)}
              title="Ayarlar"
            >
              <GearIcon />
            </button>

            {/* TR / EN pill */}
            <div className="navbar-lang">
              <button
                className={`navbar-lang-btn ${uiLang === 'tr' ? 'active' : ''}`}
                onClick={() => setUILang('tr')}
              >TR</button>
              <button
                className={`navbar-lang-btn ${uiLang === 'en' ? 'active' : ''}`}
                onClick={() => setUILang('en')}
              >EN</button>
            </div>

            {/* Auth */}
            {!loading && (
              user ? (
                <div className="navbar-auth">
                  <button className="navbar-user" onClick={handleProfileClick} title={t('goToProfile')}>
                    {user.photoURL
                      ? <img src={user.photoURL} className="navbar-avatar" alt="" referrerPolicy="no-referrer" />
                      : <span className="navbar-avatar-fallback">{user.displayName?.[0]?.toUpperCase()}</span>
                    }
                    <span className="navbar-name">{user.displayName?.split(' ')[0]}</span>
                  </button>
                  <button className="navbar-signout" onClick={() => signOut()} title={t('signOut')}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                  </button>
                </div>
              ) : (
                <button className="navbar-signin" onClick={() => signInWithGoogle()}>
                  <GoogleIcon />
                  {t('signIn')}
                </button>
              )
            )}
          </div>

        </div>
      </nav>

      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </>
  );
}
