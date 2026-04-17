'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Toaster } from 'sileo';
import 'sileo/styles.css';

type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [loaderVisible, setLoaderVisible] = useState(true);
  const [loaderMounted, setLoaderMounted] = useState(true);

  function applyTheme(t: Theme) {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }

  // Read saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    const preferred =
      saved ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    setTheme(preferred);
    applyTheme(preferred);
    // fade out after 1 second, unmount after transition completes
    setTimeout(() => {
      setLoaderVisible(false);
      setTimeout(() => setLoaderMounted(false), 400);
    }, 1000);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      <Toaster
        position="top-right"
        theme={theme === 'dark' ? 'dark' : 'light'}
        offset={20}
        options={{ roundness: 10, duration: 4000 }}
      />
      {loaderMounted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'var(--bg-canvas, #080705)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 20,
            opacity: loaderVisible ? 1 : 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: loaderVisible ? 'all' : 'none',
          }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--text-muted, #666)' }}>
            <span style={{ color: 'var(--accent, #C87D38)' }}>◆</span>{' '}Pavas Marketplace
          </p>
          <div style={{
            width: 32, height: 32,
            border: '2px solid var(--border, #2a2520)',
            borderTopColor: 'var(--accent, #C87D38)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      )}
    </ThemeContext.Provider>
  );
}
