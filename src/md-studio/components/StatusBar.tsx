'use client';

import { memo, useEffect, useState } from 'react';
import { Check, Circle, Clock, Keyboard, SpellCheck } from 'lucide-react';
import { estimateReadingTime } from '../lib/headings';
import { GoalProgress } from './GoalProgress';

interface StatusBarProps {
  workerStatus: string;
  stats: { words: number; lines: number; chars: number };
  activeTab: { name: string; content: string } | undefined;
  isContentLoading: boolean;
  isDirty: boolean;
  lastSavedAt: number | null;
  goal: number;
  spellCheck: boolean;
  onToggleSpellCheck: () => void;
  onSetGoal: (n: number) => void;
  onClearGoal: () => void;
  onOpenDoc: (name: string) => void;
  onShowShortcuts: () => void;
}

function timeAgo(ts: number | null): string {
  if (!ts) return 'Not saved';
  const seconds = Math.round((Date.now() - ts) / 1000);
  if (seconds < 5) return 'Saved';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export const StatusBar = memo(function StatusBar({
  workerStatus,
  stats,
  activeTab,
  isContentLoading,
  isDirty,
  lastSavedAt,
  goal,
  spellCheck,
  onToggleSpellCheck,
  onSetGoal,
  onClearGoal,
  onOpenDoc,
  onShowShortcuts,
}: StatusBarProps) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const isReady = workerStatus === 'ready' || workerStatus === 'idle';

  return (
    <footer className="flex-none h-9 sm:h-7 px-3 sm:px-4 pb-safe bg-[var(--color-surface-1)] border-t border-[var(--color-border)] flex items-center justify-between gap-2 text-[11px] text-[var(--color-text-medium)] font-body z-30 select-none overflow-x-auto no-scrollbar">
      {/* Left: status + filename */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="flex items-center gap-1.5 flex-none">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isReady
                ? 'bg-green-500'
                : workerStatus === 'error'
                  ? 'bg-red-500'
                  : 'bg-yellow-500 animate-pulse'
            }`}
            aria-hidden="true"
          />
          {isReady ? 'Ready' : workerStatus === 'error' ? 'Offline' : 'Loading'}
        </span>
        {activeTab && (
          <span className="hidden md:inline text-[var(--color-text-low)] truncate max-w-[140px]">
            {activeTab.name}
          </span>
        )}
      </div>

      {/* Right: stats + indicators + links */}
      <div className="flex items-center gap-2 sm:gap-3 flex-none">
        {activeTab && (
          <span className="flex items-center gap-1.5 text-[var(--color-text-medium)] whitespace-nowrap">
            <span className="tabular-nums">{stats.words}w</span>
            <span className="text-[var(--color-border)] hidden sm:inline">·</span>
            <span className="tabular-nums hidden md:inline">{stats.lines}ln</span>
            <span className="text-[var(--color-border)] hidden md:inline">·</span>
            <span className="flex items-center gap-0.5 tabular-nums whitespace-nowrap hidden sm:inline">
              <Clock className="w-3 h-3 opacity-60 flex-shrink-0" />
              {estimateReadingTime(stats.words)}
            </span>
          </span>
        )}

        <span className="hidden sm:flex items-center gap-1 text-[var(--color-text-low)] whitespace-nowrap">
          {isContentLoading ? (
            <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
          ) : isDirty ? (
            <Circle className="w-2 h-2 text-amber-500 fill-amber-500" />
          ) : (
            <Check className="w-3 h-3 text-green-500" />
          )}
          <span className={isDirty ? 'text-amber-600 dark:text-amber-400' : ''}>
            {isContentLoading ? 'Saving' : isDirty ? 'Unsaved' : timeAgo(lastSavedAt)}
          </span>
        </span>

        <button
          onClick={onToggleSpellCheck}
          className={`flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 px-1 transition-colors ${spellCheck ? 'text-[var(--color-signal)]' : 'text-[var(--color-text-low)] hover:text-[var(--color-text-main)]'}`}
          title={spellCheck ? 'Spell check: on' : 'Spell check: off'}
          aria-label="Toggle spell check"
          aria-pressed={spellCheck}
        >
          <SpellCheck className="w-4 h-4 md:w-3.5 md:h-3.5" />
        </button>

        {activeTab && (
          <GoalProgress
            words={stats.words}
            goal={goal}
            onSetGoal={onSetGoal}
            onClearGoal={onClearGoal}
          />
        )}

        <span className="flex items-center gap-1 sm:gap-2 ml-1 border-l border-[var(--color-border)] pl-2 sm:pl-3">
          <button
            onClick={onShowShortcuts}
            className="flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 hover:text-[var(--color-text-main)] transition-colors"
            title="Keyboard shortcuts (Ctrl /)"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="w-4 h-4 md:w-3 md:h-3" />
          </button>
          <button
            onClick={() => onOpenDoc('About.md')}
            className="hidden md:inline hover:text-[var(--color-text-main)] transition-colors"
          >
            About
          </button>
          <button
            onClick={() => onOpenDoc('Privacy.md')}
            className="hidden md:inline hover:text-[var(--color-text-main)] transition-colors"
          >
            Privacy
          </button>
          <button
            onClick={() => onOpenDoc('FAQ.md')}
            className="hidden lg:inline hover:text-[var(--color-text-main)] transition-colors"
          >
            FAQ
          </button>
          <button
            onClick={() => onOpenDoc('Documentation.md')}
            className="hidden lg:inline hover:text-[var(--color-text-main)] transition-colors"
          >
            Docs
          </button>
          <a
            href="https://github.com/Depends-iT/dependsit-markdown-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 hover:text-[var(--color-text-main)] transition-colors"
            title="Source on GitHub"
            aria-label="Source on GitHub"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </span>
      </div>
    </footer>
  );
});
