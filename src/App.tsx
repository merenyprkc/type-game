// src/App.tsx

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Home from './pages/Home';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
import Leaderboard from './pages/Leaderboard';
import PageTransition from './components/ui/PageTransition';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import { buildCustomThemeVars } from './lib/colorUtils';
import BadgeNotification from './components/ui/BadgeNotification';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/profile" element={<PageTransition><Profile /></PageTransition>} />
        <Route path="/profile/:uid" element={<PageTransition><PublicProfile /></PageTransition>} />
        <Route path="/leaderboard" element={<PageTransition><Leaderboard /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const init = useAuthStore(s => s.init);
  const theme = useThemeStore(s => s.theme);
  const customColors = useThemeStore(s => s.customColors);

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'custom') {
      const vars = buildCustomThemeVars(customColors.accent, customColors.bg);
      Object.entries(vars).forEach(([k, v]) =>
        document.documentElement.style.setProperty(k, v)
      );
    } else {
      document.documentElement.style.cssText = '';
    }
  }, [theme, customColors]);

  return (
    <BrowserRouter>
      <Navbar />
      <BadgeNotification />
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
