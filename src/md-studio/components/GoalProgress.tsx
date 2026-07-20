'use client';

import { useState, useRef, useEffect } from 'react';
import { Target, X } from 'lucide-react';

interface GoalProgressProps {
  words: number;
  goal: number;
  onSetGoal: (n: number) => void;
  onClearGoal: () => void;
}

const PRESETS = [100, 250, 500, 750, 1000, 2000];

export function GoalProgress({ words, goal, onSetGoal, onClearGoal }: GoalProgressProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setError(null);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setError(null);
      }
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const pct = goal > 0 ? Math.min(100, Math.round((words / goal) * 100)) : 0;
  const reached = goal > 0 && words >= goal;

  const commit = (val: string) => {
    const n = parseInt(val, 10);
    if (Number.isNaN(n) || n <= 0) {
      setError('Enter a number greater than 0.');
      return;
    }
    if (n > 1000000) {
      setError('Goal must be 1,000,000 or fewer words.');
      return;
    }
    onSetGoal(n);
    setOpen(false);
    setError(null);
  };

  const closePopover = () => {
    setOpen(false);
    setError(null);
  };

  const popover = open && (
    <div
      className="absolute bottom-full right-0 mb-2 w-56 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-lg shadow-[0_8px_30px_-4px_rgba(0,0,0,0.15)] z-50 p-3 select-none font-body"
      style={{ animation: 'modal-enter 0.1s ease-out' }}
      role="dialog"
      aria-label="Word count goal settings"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold text-[var(--color-text-main)]">
          {goal > 0 ? 'Adjust goal' : 'Set word count goal'}
        </span>
        <button
          onClick={closePopover}
          className="p-1 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors"
          aria-label="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-2">
        <input
          ref={inputRef}
          type="number"
          min={1}
          defaultValue={goal || ''}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value);
          }}
          placeholder="e.g. 500"
          className="flex-1 h-9 sm:h-7 px-2 text-[12px] rounded bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-main)] outline-none focus:border-[var(--color-signal)] transition-colors"
          aria-label="Goal word count"
        />
        <button
          onClick={() => {
            if (inputRef.current) commit(inputRef.current.value);
          }}
          className="px-3 h-9 sm:h-7 min-h-[44px] sm:min-h-0 text-[11px] font-medium rounded bg-[var(--color-signal)]/15 text-[var(--color-signal)] hover:bg-[var(--color-signal)]/25 transition-colors"
        >
          Set
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-red-500 mb-2">{error}</p>
      )}

      <div className="flex flex-wrap gap-1 mb-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => commit(String(p))}
            className="px-2.5 py-1.5 sm:px-1.5 sm:py-0.5 min-h-[44px] sm:min-h-0 text-[12px] sm:text-[10px] rounded bg-[var(--color-surface-2)] text-[var(--color-text-medium)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-main)] transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {goal > 0 && (
        <button
          onClick={() => {
            onClearGoal();
            closePopover();
          }}
          className="w-full min-h-[44px] sm:min-h-0 text-[11px] text-[var(--color-text-low)] hover:text-red-500 transition-colors py-1"
        >
          Remove goal
        </button>
      )}

      {reached && (
        <p className="text-[10px] text-[var(--color-signal)] mt-1 text-center font-medium">
          Goal reached!
        </p>
      )}
    </div>
  );

  if (goal === 0) {
    return (
      <div ref={containerRef} className="relative flex items-center">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 px-1 text-[var(--color-text-low)] hover:text-[var(--color-text-main)] transition-colors"
          title="Set a word count goal"
          aria-label="Set word count goal"
          aria-expanded={open}
        >
          <Target className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Set goal</span>
        </button>
        {popover}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 px-1 text-[var(--color-text-low)] hover:text-[var(--color-text-main)] transition-colors"
        title={reached ? 'Goal reached!' : `${pct}% of ${goal} words`}
        aria-label={`Word count goal: ${words} of ${goal} words${reached ? ', reached' : ''}`}
        aria-expanded={open}
      >
        <svg width="14" height="14" viewBox="0 0 12 12" className="flex-none">
          <circle
            cx="6" cy="6" r="5"
            fill="none"
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />
          <circle
            cx="6" cy="6" r="5"
            fill="none"
            stroke={reached ? 'var(--color-signal)' : 'var(--color-text-medium)'}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 31.4} 31.4`}
            transform="rotate(-90 6 6)"
            style={{ transition: 'stroke-dasharray 0.3s ease' }}
          />
        </svg>
        <span className={`tabular-nums text-[11px] ${reached ? 'text-[var(--color-signal)] font-medium' : ''}`}>
          {words}/{goal}
        </span>
      </button>
      {popover}
    </div>
  );
}
