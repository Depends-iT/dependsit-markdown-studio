'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, CornerDownLeft, Hash } from 'lucide-react';

export interface CommandAction {
  id: string;
  label: string;
  hint?: string;
  group: string;
  keywords?: string;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

function fuzzyMatch(haystack: string, query: string): boolean {
  if (!query) return true;
  const h = haystack.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < h.length && qi < q.length; i++) {
    if (h[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

const GROUP_ORDER = ['Actions', 'Insert', 'My snippets'];

export function CommandPalette({ isOpen, onClose, actions }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const matched = actions.filter((a) => {
      const hay = `${a.label} ${a.group} ${a.keywords || ''} ${a.hint || ''}`;
      return fuzzyMatch(hay, query);
    });
    matched.sort((a, b) => {
      const ga = GROUP_ORDER.indexOf(a.group);
      const gb = GROUP_ORDER.indexOf(b.group);
      if (ga !== gb) return (ga === -1 ? 99 : ga) - (gb === -1 ? 99 : gb);
      return a.label.localeCompare(b.label);
    });
    return matched;
  }, [actions, query]);

  const safeActiveIndex = filtered.length === 0 ? 0 : activeIndex % filtered.length;

  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector<HTMLElement>(`[data-idx="${safeActiveIndex}"]`);
    active?.scrollIntoView({ block: 'nearest' });
  }, [safeActiveIndex]);

  const execute = useCallback(
    (action?: CommandAction) => {
      if (!action) return;
      action.run();
      onClose();
    },
    [onClose],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      execute(filtered[safeActiveIndex]);
    }
  };

  if (!isOpen) return null;

  const grouped: { group: string; items: { action: CommandAction; idx: number }[] }[] = [];
  filtered.forEach((action, idx) => {
    let bucket = grouped.find((g) => g.group === action.group);
    if (!bucket) {
      bucket = { group: action.group, items: [] };
      grouped.push(bucket);
    }
    bucket.items.push({ action, idx });
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative w-full max-w-lg bg-[var(--color-surface-1)] rounded-xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col"
        style={{ animation: 'modal-enter 0.15s ease-out' }}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)]">
          <Search className="w-4 h-4 text-[var(--color-text-low)] flex-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-[var(--color-text-main)] placeholder:text-[var(--color-text-low)]"
            aria-label="Command search"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="text-[10px] text-[var(--color-text-low)] font-mono px-1.5 py-0.5 rounded bg-[var(--color-surface-2)]">
            Esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-[var(--color-text-low)]">
              No commands match &ldquo;{query}&rdquo;
            </div>
          ) : (
            grouped.map((bucket) => (
              <div key={bucket.group} className="mb-1">
                <div className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-low)]">
                  {bucket.group}
                </div>
                {bucket.items.map(({ action, idx }) => (
                  <button
                    key={action.id}
                    data-idx={idx}
                    onClick={() => execute(action)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`w-full flex items-center gap-3 px-4 py-3 sm:py-2 min-h-[44px] text-[13px] text-left transition-colors ${
                      safeActiveIndex === idx
                        ? 'bg-[var(--color-signal)]/12 text-[var(--color-text-main)]'
                        : 'text-[var(--color-text-medium)] hover:bg-[var(--color-surface-2)]/60'
                    }`}
                    role="option"
                    aria-selected={safeActiveIndex === idx}
                  >
                    <Hash className="w-3.5 h-3.5 text-[var(--color-text-low)] flex-none" aria-hidden="true" />
                    <span className="flex-1 truncate">{action.label}</span>
                    {action.hint && (
                      <span className="text-[10px] text-[var(--color-text-low)] font-mono">{action.hint}</span>
                    )}
                    {safeActiveIndex === idx && (
                      <CornerDownLeft className="w-3 h-3 text-[var(--color-signal)] flex-none" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-low)]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="font-mono px-1 rounded bg-[var(--color-surface-2)]">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="font-mono px-1 rounded bg-[var(--color-surface-2)]">↵</kbd> select
            </span>
          </div>
          <span>{filtered.length} command{filtered.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}
