'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type ThemeMode = 'light' | 'sepia' | 'dark';

const STORAGE_KEY = 'md-studio-theme';
const ORDER: ThemeMode[] = ['light', 'sepia', 'dark'];

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const initRef = useRef<ThemeMode | null>(null);

  useEffect(() => {
    let initial: ThemeMode = 'light';
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (stored && ORDER.includes(stored)) {
        initial = stored;
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        initial = 'dark';
      }
    } catch {}
    initRef.current = initial;
    // Apply theme class directly to avoid cascading render.
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
    root.classList.add(`theme-${initial}`);
    root.classList.toggle('dark', initial === 'dark');
    // Sync state on next tick so React catches up without a cascading render.
    if (initial !== 'light') {
      requestAnimationFrame(() => setThemeState(initial));
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-sepia', 'theme-dark');
    root.classList.add(`theme-${theme}`);
    root.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => setThemeState(next), []);
  const cycleTheme = useCallback(
    () => setThemeState((cur) => ORDER[(ORDER.indexOf(cur) + 1) % ORDER.length]),
    [],
  );

  return { theme, setTheme, cycleTheme, isDarkMode: theme === 'dark' };
}
