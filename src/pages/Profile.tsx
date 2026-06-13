// src/pages/Profile.tsx
// Gate: redirect logged-in users to their public /profile/:uid
// Everyone sees the same profile page regardless of who's viewing.

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useI18n } from '../store/i18nStore';
import './Profile.css';

export default function Profile() {
  const { user, loading } = useAuthStore();
  const { t } = useI18n();

  if (loading) {
    return (
      <main className="profile-page">
        <div className="container">
          <div className="profile-loading-dots">
            <span /><span /><span />
          </div>
        </div>
      </main>
    );
  }

  if (user) {
    return <Navigate to={`/profile/${user.uid}`} replace />;
  }

  return (
    <main className="profile-page">
      <div className="container">
        <div className="profile-login-gate">
          <div className="profile-empty-icon">👤</div>
          <h2>{t('profilePageGateTitle')}</h2>
          <p>{t('profilePageGateDesc')}</p>
          <p className="gate-hint">{t('profilePageGateHint')}</p>
        </div>
      </div>
    </main>
  );
}

