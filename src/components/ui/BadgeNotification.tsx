// src/components/ui/BadgeNotification.tsx
// Toast popup that appears when new badges are earned.

import { useEffect } from 'react';
import { useBadgeStore } from '../../store/badgeStore';
import { useI18n } from '../../store/i18nStore';
import { BADGES } from '../../lib/badges';
import './BadgeNotification.css';

export default function BadgeNotification() {
  const { newlyEarned, clearNewlyEarned } = useBadgeStore();
  const { uiLang } = useI18n();

  useEffect(() => {
    if (newlyEarned.length === 0) return;
    const timer = setTimeout(clearNewlyEarned, 4500);
    return () => clearTimeout(timer);
  }, [newlyEarned, clearNewlyEarned]);

  if (newlyEarned.length === 0) return null;

  const badges = newlyEarned
    .map(id => BADGES.find(b => b.id === id))
    .filter(Boolean) as typeof BADGES;

  return (
    <div className="badge-notification" onClick={clearNewlyEarned}>
      <div className="badge-notif-header">
        🏅 {uiLang === 'tr' ? 'Yeni Rozet!' : 'New Badge!'}
      </div>
      {badges.map(badge => (
        <div key={badge.id} className="badge-notif-item">
          <span className="badge-notif-icon">{badge.icon}</span>
          <div>
            <div className="badge-notif-name">
              {uiLang === 'tr' ? badge.name.tr : badge.name.en}
            </div>
            <div className="badge-notif-desc">
              {uiLang === 'tr' ? badge.desc.tr : badge.desc.en}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
