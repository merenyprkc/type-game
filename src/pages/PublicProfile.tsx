// src/pages/PublicProfile.tsx
// Universal profile page — /profile/:uid
// Both owner and visitor see the same Firestore data.
// Keyboard heatmap uses local session history for real-time key tracking.
// Email is never shown.

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getPublicProfile, getUserRecentResults, type PublicProfile as TPublicProfile, type UserProfile } from '../lib/firestore';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useI18n } from '../store/i18nStore';
import { useStreakStore } from '../store/streakStore';
import { useBadgeStore } from '../store/badgeStore';
import { BADGES } from '../lib/badges';
import KeyboardHeatmap from '../components/analytics/KeyboardHeatmap';
import EditProfileModal from '../components/profile/EditProfileModal';
import type { TypingResult, KeyStats } from '../lib/analytics';
import './Profile.css';
import './PublicProfile.css';

function aggregateKeyStats(history: TypingResult[]): Record<string, KeyStats> {
  const agg: Record<string, KeyStats> = {};
  for (const result of history) {
    for (const [key, raw] of Object.entries(result.keyStats)) {
      const s = raw as KeyStats;
      if (!agg[key]) agg[key] = { key, correct: 0, incorrect: 0, total: 0, accuracy: 100 };
      agg[key].correct += s.correct;
      agg[key].incorrect += s.incorrect;
      agg[key].total += s.total;
    }
  }
  for (const key of Object.keys(agg)) {
    agg[key].accuracy = agg[key].total > 0
      ? Math.round((agg[key].correct / agg[key].total) * 100 * 10) / 10
      : 100;
  }
  return agg;
}

export default function PublicProfile() {
  const { uid } = useParams<{ uid: string }>();
  const { user, loading: authLoading } = useAuthStore();
  const { t, uiLang } = useI18n();
  // localHistory is only used for the keyboard heatmap (real-time key tracking)
  const { history: localHistory } = useGameStore();

  const isOwner = !!user && user.uid === uid;
  const { currentStreak, longestStreak } = useStreakStore();
  const earnedBadges = useBadgeStore(s => s.earned);

  const [profile, setProfile] = useState<TPublicProfile | null>(null);
  const [firestoreResults, setFirestoreResults] = useState<TypingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [heatmapLayout, setHeatmapLayout] = useState<'en' | 'tr'>('en');
  const [editOpen, setEditOpen] = useState(false);

  const fetchProfile = (silent = false) => {
    if (!uid) return;
    if (!silent) setLoading(true);
    setNotFound(false);
    Promise.all([getPublicProfile(uid), getUserRecentResults(uid, 20)])
      .then(([p, r]) => {
        setFirestoreResults(r);
        if (!p) {
          if (!isOwner) setNotFound(true);
        } else {
          setProfile(p);
        }
      })
      .catch(() => { if (!isOwner) setNotFound(true); })
      .finally(() => { if (!silent) setLoading(false); });
  };

  // Wait for auth to resolve so isOwner is correct on first fetch
  useEffect(() => {
    if (!uid || authLoading) return;
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, isOwner, authLoading]);

  useEffect(() => {
    if (!isOwner || localHistory.length === 0) return;
    const agg = aggregateKeyStats(localHistory);
    const hasTR = Object.keys(agg).some(k => 'ğşçöüı'.includes(k));
    setHeatmapLayout(hasTR ? 'tr' : 'en');
  }, [isOwner, localHistory]);

  // ── Derived display data — both owner and visitor use Firestore ─────────

  const displayName = profile?.displayName ?? (isOwner ? (user?.displayName ?? '') : '');
  const photoURL = profile?.photoURL ?? (isOwner ? (user?.photoURL ?? '') : '');
  const lb = profile?.leaderboard;

  // Single source of truth: Firestore results for everyone
  const displayResults = firestoreResults;

  const bestWpm = lb?.bestWpm
    ?? (firestoreResults.length > 0 ? Math.max(...firestoreResults.map(r => r.wpm)) : null);

  const avgWpm = firestoreResults.length > 0
    ? Math.round(firestoreResults.reduce((s, r) => s + r.wpm, 0) / firestoreResults.length)
    : null;
  const avgAcc = firestoreResults.length > 0
    ? Math.round(firestoreResults.reduce((s, r) => s + r.accuracy, 0) / firestoreResults.length * 10) / 10
    : null;

  const totalTime = isOwner
    ? firestoreResults.reduce((s, r) => s + r.durationSeconds, 0)
    : null;

  // Heatmap: prefer local session data (includes current-session keystrokes),
  // fall back to aggregated Firestore results
  const heatmapSource = localHistory.length > 0 ? localHistory : firestoreResults;
  const ownerKeyStats = isOwner ? aggregateKeyStats(heatmapSource) : null;

  const profileUrl = typeof window !== 'undefined' ? `${window.location.origin}/profile/${uid}` : '';

  // ── Loading ─────────────────────────────────────────────────────────────

  if (authLoading || loading) {
    return (
      <main className="profile-page">
        <div className="container">
          <div className="pub-loading">
            <div className="pub-skel pub-skel-hero" />
            <div className="pub-skel pub-skel-stats" />
            <div className="pub-skel pub-skel-table" />
          </div>
        </div>
      </main>
    );
  }

  // ── Not found (non-owner only) ──────────────────────────────────────────

  if (notFound) {
    return (
      <main className="profile-page">
        <div className="container">
          <div className="profile-empty">
            <div className="profile-empty-icon">👤</div>
            <h2>{t('profileNotFound')}</h2>
            <p>{t('profileNotFoundDesc')}</p>
            <Link to="/leaderboard" className="btn btn-ghost pub-back-btn">
              ← {t('goToLeaderboard')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Profile ─────────────────────────────────────────────────────────────

  const hasNoGames = !bestWpm && displayResults.length === 0;

  return (
    <main className="profile-page">
      <div className="container">

        {/* ── Banner ────────────────────────────────────────────── */}
        {(profile?.bannerUrl || profile?.bannerColor) && (
          <div
            className="pub-banner"
            style={profile.bannerUrl
              ? { backgroundImage: `url(${profile.bannerUrl})` }
              : { background: profile.bannerColor }
            }
          />
        )}

        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="pub-hero">
          {photoURL ? (
            <img src={photoURL} className="pub-avatar" alt={displayName} referrerPolicy="no-referrer" />
          ) : (
            <div className="pub-avatar-fallback">
              {displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div className="pub-hero-info">

            {/* Row 1: name + social links */}
            <div className="pub-name-row">
              <h1 className="pub-name">{displayName || t('anonymous')}</h1>
              {profile?.socialLinks && (
                <div className="pub-social-links">
                  {profile.socialLinks.github && (
                    <a href={`https://github.com/${profile.socialLinks.github}`} className="pub-social-btn" target="_blank" rel="noopener noreferrer" title={`GitHub: ${profile.socialLinks.github}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/></svg>
                    </a>
                  )}
                  {profile.socialLinks.twitter && (
                    <a href={`https://x.com/${profile.socialLinks.twitter}`} className="pub-social-btn" target="_blank" rel="noopener noreferrer" title={`X: @${profile.socialLinks.twitter}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    </a>
                  )}
                  {profile.socialLinks.instagram && (
                    <a href={`https://instagram.com/${profile.socialLinks.instagram}`} className="pub-social-btn" target="_blank" rel="noopener noreferrer" title={`Instagram: @${profile.socialLinks.instagram}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                    </a>
                  )}
                  {profile.socialLinks.discord && (
                    <span className="pub-social-btn pub-social-discord" title={`Discord: ${profile.socialLinks.discord}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Row 2: bio */}
            {profile?.bio && (
              <p className="pub-bio">{profile.bio}</p>
            )}

            {/* Row 3: mode/lang tags + equipment */}
            <div className="pub-meta-row">
              {lb && (
                <div className="pub-badges">
                  <span className="pub-badge">{t(lb.mode as any) || lb.mode}</span>
                  <span className="pub-badge">{lb.language === 'tr' ? 'TR' : 'EN'}</span>
                </div>
              )}
              {profile?.equipment && (profile.equipment.keyboard || profile.equipment.keycap) && (
                <div className="pub-equipment">
                  {profile.equipment.keyboard && (
                    <span className="pub-equipment-item" title="Klavye">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8"/></svg>
                      {profile.equipment.keyboard}
                    </span>
                  )}
                  {profile.equipment.keycap && (
                    <span className="pub-equipment-item" title="Keycap">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                      {profile.equipment.keycap}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Row 4: earned badge emojis (bottom) */}
            {(() => {
              const badgeIds = isOwner
                ? Object.keys(earnedBadges)
                : (profile?.earnedBadges ?? []);
              const earned = BADGES.filter(b => badgeIds.includes(b.id));
              if (earned.length === 0) return null;
              return (
                <div className="pub-earned-emojis">
                  {earned.map(badge => (
                    <span
                      key={badge.id}
                      className="pub-badge-emoji"
                      data-tooltip={`${uiLang === 'tr' ? badge.name.tr : badge.name.en} — ${uiLang === 'tr' ? badge.desc.tr : badge.desc.en}`}
                    >
                      {badge.icon}
                    </span>
                  ))}
                </div>
              );
            })()}

          </div>
          <div className="pub-hero-actions">
            {isOwner && (
              <>
                <button
                  className="pub-edit-btn"
                  onClick={() => setEditOpen(true)}
                  title={t('editProfile')}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  {t('editProfile')}
                </button>
                <button
                  className="pub-share-btn"
                  onClick={() => navigator.clipboard.writeText(profileUrl).then(() => {})}
                  title={t('copyProfileLink')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>
                  {t('share')}
                </button>
                <span className="pub-owner-tag">{t('you')}</span>
              </>
            )}
          </div>
        </div>

        {/* Edit profile modal */}
        {editOpen && isOwner && user && (
          <EditProfileModal
            profile={(profile ?? {
              uid: user.uid,
              displayName: user.displayName ?? '',
              photoURL: user.photoURL ?? '',
            }) as UserProfile}
            onClose={() => setEditOpen(false)}
            onSaved={() => fetchProfile(true)}
          />
        )}

        {/* ── No games yet ──────────────────────────────────────── */}
        {hasNoGames ? (
          <div className="profile-empty" style={{ padding: 'var(--space-12) 0' }}>
            <div className="profile-empty-icon">🎮</div>
            <h2>{isOwner ? t('noGamesRegistered') : t('noGamesPlayer')}</h2>
            <p>
              {isOwner
                ? t('ownerNoGamesDesc')
                : t('visitorNoGamesDesc')}
            </p>
            {isOwner && (
              <Link to="/" className="btn btn-primary" style={{ marginTop: 'var(--space-4)', display: 'inline-block' }}>
                {t('startPlaying')}
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* ── Summary stats ────────────────────────────────── */}
            <div className="profile-summary">
              {bestWpm !== null && (
                <div className="profile-stat-card">
                  <div className="profile-stat-value accent">{bestWpm}</div>
                  <div className="profile-stat-label">{t('bestWpm')}</div>
                </div>
              )}
              {avgWpm !== null && (
                <div className="profile-stat-card">
                  <div className="profile-stat-value">{avgWpm}</div>
                  <div className="profile-stat-label">{t('avgWpm')}</div>
                </div>
              )}
              {avgAcc !== null && (
                <div className="profile-stat-card">
                  <div className="profile-stat-value">{avgAcc}%</div>
                  <div className="profile-stat-label">{t('avgAcc')}</div>
                </div>
              )}
              {isOwner && (
                <div className="profile-stat-card">
                  <div className="profile-stat-value">{firestoreResults.length}</div>
                  <div className="profile-stat-label">{t('totalGames')}</div>
                </div>
              )}
              {isOwner && totalTime !== null && totalTime > 0 && (
                <div className="profile-stat-card">
                  <div className="profile-stat-value">{Math.round(totalTime / 60)}{t('mins')}</div>
                  <div className="profile-stat-label">{t('totalTime')}</div>
                </div>
              )}
              {isOwner && currentStreak > 0 && (
                <div className="profile-stat-card">
                  <div className="profile-stat-value" style={{ color: 'var(--warning, #f59e0b)' }}>
                    {currentStreak}
                  </div>
                  <div className="profile-stat-label">{t('currentStreak')}</div>
                </div>
              )}
              {isOwner && longestStreak > 1 && (
                <div className="profile-stat-card">
                  <div className="profile-stat-value">{longestStreak}</div>
                  <div className="profile-stat-label">{t('longestStreak')}</div>
                </div>
              )}
            </div>

            {/* ── WPM progress chart ───────────────────────────── */}
            {displayResults.length > 1 && (
              <div className="profile-section">
                <h2 className="profile-section-title">{t('last20')}</h2>
                <div className="wpm-chart-recharts">
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart
                      data={displayResults.slice().reverse().map((r, i) => ({
                        n: i + 1,
                        wpm: r.wpm,
                        acc: r.accuracy,
                      }))}
                      margin={{ top: 8, right: 16, left: -8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="n"
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'var(--text-tertiary)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
                        axisLine={false}
                        tickLine={false}
                        width={32}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                        }}
                        labelFormatter={(v) => `#${v}`}
                        formatter={(value, name) => [
                          name === 'acc' ? `${value}%` : value,
                          name === 'wpm' ? t('wpm') : t('accuracy'),
                        ]}
                        itemStyle={{ color: 'var(--text-primary)' }}
                        labelStyle={{ color: 'var(--text-secondary)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="wpm"
                        stroke="var(--accent)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'var(--accent)', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="acc"
                        stroke="var(--success)"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ── Keyboard heatmap (owner only) ────────────────── */}
            {isOwner && ownerKeyStats && Object.keys(ownerKeyStats).length > 0 && (
              <div className="profile-section">
                <div className="profile-section-header">
                  <h2 className="profile-section-title">{t('heatmapLabel')}</h2>
                  <div className="heatmap-layout-toggle">
                    <button className={`heatmap-layout-btn ${heatmapLayout === 'en' ? 'active' : ''}`} onClick={() => setHeatmapLayout('en')}>EN</button>
                    <button className={`heatmap-layout-btn ${heatmapLayout === 'tr' ? 'active' : ''}`} onClick={() => setHeatmapLayout('tr')}>TR</button>
                  </div>
                </div>
                <div className="card">
                  <KeyboardHeatmap keyStats={ownerKeyStats} layout={heatmapLayout} />
                </div>
              </div>
            )}

            {/* ── Game history ──────────────────────────────────── */}
            {displayResults.length > 0 && (
              <div className="profile-section">
                <h2 className="profile-section-title">
                  {isOwner ? t('historyTitle') : t('recentGames')}
                </h2>
                <div className="history-table-wrapper">
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('wpm')}</th>
                        <th>{t('rawCol')}</th>
                        <th>{t('accuracy')}</th>
                        <th>{t('mode')}</th>
                        <th>{t('lang')}</th>
                        <th>{t('duration')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayResults.map((r, i) => (
                        <tr key={i}>
                          <td className="text-secondary">{i + 1}</td>
                          <td className="text-accent font-mono font-bold">{r.wpm}</td>
                          <td className="font-mono text-secondary">{r.rawWpm}</td>
                          <td className="font-mono" style={{ color: r.accuracy >= 95 ? 'var(--success)' : r.accuracy >= 80 ? 'var(--text-primary)' : 'var(--error)' }}>
                            {r.accuracy}%
                          </td>
                          <td className="text-secondary capitalize">{t(r.mode as any) || r.mode}</td>
                          <td className="text-secondary">{r.language === 'tr' ? 'TR' : 'EN'}</td>
                          <td className="font-mono text-secondary">{Math.round(r.durationSeconds)}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div className="pub-footer">
          <Link to="/leaderboard" className="btn btn-ghost">← {t('leaderboard')}</Link>
        </div>
      </div>
    </main>
  );
}

