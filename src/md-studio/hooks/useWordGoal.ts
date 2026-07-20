'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'md-studio-word-goal';
const DEFAULT_GOAL = 0; // 0 = goal disabled

function readStoredGoal(): number {
  if (typeof window === 'undefined') return DEFAULT_GOAL;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const n = parseInt(stored, 10);
      if (!Number.isNaN(n) && n >= 0) return n;
    }
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_GOAL;
}

export function useWordGoal() {
  const [goal, setGoalState] = useState<number>(readStoredGoal);

  const setGoal = useCallback((next: number) => {
    const clamped = Math.max(0, Math.round(next));
    setGoalState(clamped);
    try {
      localStorage.setItem(STORAGE_KEY, String(clamped));
    } catch {
      /* localStorage unavailable */
    }
  }, []);

  const clearGoal = useCallback(() => setGoal(0), [setGoal]);

  return { goal, setGoal, clearGoal };
}
