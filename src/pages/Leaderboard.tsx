// src/pages/Leaderboard.tsx
// Real-time global leaderboard — Firestore

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { subscribeLeaderboard, type LeaderboardEntry } from '../lib/firestore';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../store/i18nStore';
import './Leaderboard.css';

const medalLabel = (rank: number) => {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return String(rank);
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { t } = useI18n();

  useEffect(() => {
    const unsubscribe = subscribeLeaderboard((data) => {
      setEntries(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const top3 = entries.slice(0, 3);
  // Ensure podium order: 2nd left, 1st center, 3rd right
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3;
  const podiumHeights = ['140px', '180px', '110px'];
  const podiumPositions = [2, 1, 3];
  const podiumMedals = ['🥈', '🥇', '🥉'];

  return (
    <main className="leaderboard-page">
      <div className="container">
        <div className="leaderboard-header">
          <div>
            <h1 className="leaderboard-title">{t('globalRank')}</h1>
            <p className="leaderboard-subtitle">
              {loading ? t('loading') : `${entries.length} ${t('registeredPlayers')}`}
            </p>
          </div>
          {!user && (
            <div className="badge badge-accent">{t('signInToRank')}</div>
          )}
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="leaderboard-loading">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="leaderboard-skeleton-row" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && entries.length === 0 && (
          <div className="leaderboard-empty">
            <div className="leaderboard-empty-icon">🏆</div>
            <h2>{t('noOneYet')}</h2>
            <p>{t('firstPlaceHint')}</p>
          </div>
        )}

        {/* Podium — only if 3+ entries */}
        {!loading && entries.length >= 3 && (
          <div className="podium">
            {podiumOrder.map((entry, i) => (
              <div key={entry.uid} className={`podium-place rank-${podiumPositions[i]}`}>
                <Link to={`/profile/${entry.uid}`} className="podium-name">
                  {entry.photoURL && (
                    <img
                      src={entry.photoURL}
                      className="podium-avatar"
                      alt={entry.displayName}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {entry.displayName}
                </Link>
                <div className="podium-wpm">{entry.bestWpm} <span>WPM</span></div>
                <div className="podium-medal">{podiumMedals[i]}</div>
                <div className="podium-stand" style={{ height: podiumHeights[i] }}>
                  <span className="podium-rank">{podiumPositions[i]}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {!loading && entries.length > 0 && (
          <div className="leaderboard-table-wrapper">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t('user')}</th>
                  <th>{t('wpm')}</th>
                  <th>{t('accuracy')}</th>
                  <th>{t('lang')}</th>
                  <th>{t('mode')}</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => {
                  const rank = i + 1;
                  const isMe = user?.uid === entry.uid;
                  return (
                    <tr key={entry.uid} className={`${rank <= 3 ? 'top-three' : ''} ${isMe ? 'my-row' : ''}`}>
                      <td className="rank-cell">{medalLabel(rank)}</td>
                      <td className="name-cell">
                        <Link to={`/profile/${entry.uid}`} className="leaderboard-user-link">
                          {entry.photoURL && (
                            <img
                              src={entry.photoURL}
                              className="table-avatar"
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {entry.displayName}
                        </Link>
                        {isMe && <span className="badge-me">{t('you')}</span>}
                      </td>
                      <td className="wpm-cell">{entry.bestWpm}</td>
                      <td
                        className="acc-cell"
                        style={{
                          color: entry.accuracy >= 99
                            ? 'var(--success)'
                            : entry.accuracy >= 95
                            ? 'var(--text-primary)'
                            : 'var(--text-secondary)',
                        }}
                      >
                        {entry.accuracy}%
                      </td>
                      <td className="lang-cell">{entry.language?.toUpperCase()}</td>
                      <td className="mode-cell capitalize">{t(entry.mode as any) || entry.mode}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

