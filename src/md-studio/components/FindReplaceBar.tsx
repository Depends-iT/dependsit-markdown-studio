'use client';

import { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useMemo } from 'react';
import { X, ChevronUp, ChevronDown, Replace, CheckCheck, CaseSensitive, Regex } from 'lucide-react';

export interface FindReplaceHandle {
  open: (mode: 'find' | 'replace') => void;
  close: () => void;
}

interface FindReplaceBarProps {
  value: string;
  onChange: (next: string) => void;
}

interface Match {
  start: number;
  end: number;
}

interface SearchOptions {
  caseSensitive: boolean;
  regex: boolean;
  wholeWord: boolean;
}

function FindReplaceBarInner(
  { value, onChange }: FindReplaceBarProps,
  ref: React.Ref<FindReplaceHandle>,
) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'find' | 'replace'>('find');
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    regex: false,
    wholeWord: false,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const queryRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    open: (m) => {
      setMode(m);
      setOpen(true);
      requestAnimationFrame(() => queryRef.current?.focus());
    },
    close: () => setOpen(false),
  }));

  // Compute all matches for the current query + options.
  const matches = useMemo(
    () => computeMatches(value, query, options),
    [value, query, options],
  );

  const safeActiveIndex = matches.length === 0 ? 0 : activeIndex % matches.length;

  // Select the active match in the editor textarea.
  useEffect(() => {
    if (!open || matches.length === 0) return;
    const textarea = document.querySelector<HTMLTextAreaElement>('.w-md-editor-text-input');
    if (!textarea) return;
    const m = matches[safeActiveIndex];
    if (!m) return;
    textarea.focus();
    textarea.setSelectionRange(m.start, m.end);
    const lineHeight = parseFloat(getComputedStyle(textarea).lineHeight) || 20;
    const charBefore = value.slice(0, m.start);
    const lineUpToMatch = charBefore.split('\n').length - 1;
    textarea.scrollTop = Math.max(0, lineUpToMatch * lineHeight - textarea.clientHeight / 2);
  }, [open, matches, safeActiveIndex, value]);

  // Highlight matched text in the preview pane using <mark> elements.
  useEffect(() => {
    const preview = document.querySelector('.wmde-markdown');
    if (!preview) return;

    preview.querySelectorAll('mark[data-find]').forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
      parent.normalize();
    });

    if (!open || !query || matches.length === 0) return;

    // Walk text nodes and wrap matches.
    const walker = document.createTreeWalker(preview, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.tagName === 'SCRIPT' || parent.tagName === 'STYLE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      textNodes.push(current as Text);
      current = walker.nextNode();
    }

    const flags = options.caseSensitive ? 'g' : 'gi';
    let pattern: RegExp;
    try {
      pattern = options.regex
        ? new RegExp(query, flags)
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    } catch {
      return; // Invalid regex — skip highlighting.
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      pattern.lastIndex = 0;
      const fragment = document.createDocumentFragment();
      let lastIdx = 0;
      let match: RegExpExecArray | null;
      let count = 0;
      while ((match = pattern.exec(text)) !== null && count < 100) {
        if (match[0].length === 0) {
          pattern.lastIndex++;
          continue;
        }
        if (match.index > lastIdx) {
          fragment.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
        }
        const mark = document.createElement('mark');
        mark.dataset.find = 'true';
        mark.textContent = match[0];
        mark.className = 'bg-amber-300/50 dark:bg-amber-500/30 rounded px-0.5';
        fragment.appendChild(mark);
        lastIdx = match.index + match[0].length;
        count++;
      }
      if (lastIdx > 0) {
        if (lastIdx < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIdx)));
        }
        textNode.parentNode?.replaceChild(fragment, textNode);
      }
    }

    return () => {
      preview.querySelectorAll('mark[data-find]').forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      });
    };
  }, [open, query, matches, options.caseSensitive, options.regex]);

  const goTo = useCallback(
    (delta: number) => {
      if (matches.length === 0) return;
      setActiveIndex((cur) => (cur + delta + matches.length) % matches.length);
    },
    [matches.length],
  );

  const replaceCurrent = useCallback(() => {
    if (matches.length === 0 || !query) return;
    const m = matches[safeActiveIndex];
    if (!m) return;
    const next = value.slice(0, m.start) + replacement + value.slice(m.end);
    onChange(next);
    // After replacing, the match shrinks/grows; recompute on next render.
    // Keep the active index (it now points to the following match after the
    // list recomputes, because the replaced text no longer matches).
    requestAnimationFrame(() => queryRef.current?.focus());
  }, [matches, safeActiveIndex, query, replacement, value, onChange]);

  const replaceAll = useCallback(() => {
    if (matches.length === 0 || !query) return;
    let next: string;
    if (options.regex) {
      try {
        const flags = options.caseSensitive ? 'g' : 'gi';
        const re = new RegExp(query, flags);
        next = value.replace(re, replacement);
      } catch {
        return;
      }
    } else {
      // Non-regex: do a manual scan so whole-word + case flags are respected.
      const parts: string[] = [];
      let i = 0;
      while (i <= value.length) {
        const m = findAt(value, query, i, options);
        if (!m) {
          parts.push(value.slice(i));
          break;
        }
        parts.push(value.slice(i, m.start));
        parts.push(replacement);
        i = m.end;
      }
      next = parts.join('');
    }
    onChange(next);
  }, [matches.length, query, replacement, value, options, onChange]);

  // Escape closes the bar; Enter goes to next match.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      } else if (e.key === 'Enter' && document.activeElement === queryRef.current) {
        e.preventDefault();
        goTo(e.shiftKey ? -1 : 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, goTo]);

  if (!open) return null;

  const toggleClass = (on: boolean) =>
    on
      ? 'bg-[var(--color-signal)]/15 text-[var(--color-signal)]'
      : 'text-[var(--color-text-low)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-main)]';

  return (
    <div
      className="flex-none border-b border-[var(--color-border)] bg-[var(--color-surface-1)] px-3 py-2 flex flex-wrap items-center gap-2 z-30"
      role="search"
      aria-label="Find and replace"
    >
      <div className="flex items-center gap-1">
        <button
          onClick={() => setMode('find')}
          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
            mode === 'find'
              ? 'bg-[var(--color-surface-2)] text-[var(--color-text-main)]'
              : 'text-[var(--color-text-low)] hover:text-[var(--color-text-main)]'
          }`}
        >
          Find
        </button>
        <button
          onClick={() => setMode('replace')}
          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
            mode === 'replace'
              ? 'bg-[var(--color-surface-2)] text-[var(--color-text-main)]'
              : 'text-[var(--color-text-low)] hover:text-[var(--color-text-main)]'
          }`}
        >
          Replace
        </button>
      </div>

      <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
        <input
          ref={queryRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          placeholder="Find…"
          className="w-full h-9 sm:h-7 px-2 text-[12px] rounded bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-low)] outline-none focus:border-[var(--color-signal)] transition-colors"
          aria-label="Find"
        />
        {mode === 'replace' && (
          <input
            ref={replaceRef}
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replace with…"
            className="w-full h-9 sm:h-7 px-2 text-[12px] rounded bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-low)] outline-none focus:border-[var(--color-signal)] transition-colors"
            aria-label="Replace with"
          />
        )}
      </div>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => setOptions((o) => ({ ...o, caseSensitive: !o.caseSensitive }))}
          className={`p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded transition-colors ${toggleClass(options.caseSensitive)}`}
          title="Match case"
          aria-label="Match case"
          aria-pressed={options.caseSensitive}
        >
          <CaseSensitive className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
        <button
          onClick={() => setOptions((o) => ({ ...o, wholeWord: !o.wholeWord }))}
          className={`p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded transition-colors text-[12px] sm:text-[10px] font-bold ${toggleClass(options.wholeWord)}`}
          title="Whole word"
          aria-label="Whole word"
          aria-pressed={options.wholeWord}
        >
          W
        </button>
        <button
          onClick={() => setOptions((o) => ({ ...o, regex: !o.regex }))}
          className={`p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded transition-colors ${toggleClass(options.regex)}`}
          title="Regular expression"
          aria-label="Regular expression"
          aria-pressed={options.regex}
        >
          <Regex className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      <span className="text-[11px] text-[var(--color-text-low)] font-mono tabular-nums min-w-[64px] text-center">
        {query
          ? matches.length > 0
            ? `${safeActiveIndex + 1} of ${matches.length}`
            : 'No results'
          : ''}
      </span>

      <div className="flex items-center gap-0.5">
        <button
          onClick={() => goTo(-1)}
          disabled={matches.length === 0}
          className="p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded text-[var(--color-text-low)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-main)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Previous match (Shift+Enter)"
          aria-label="Previous match"
        >
          <ChevronUp className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
        <button
          onClick={() => goTo(1)}
          disabled={matches.length === 0}
          className="p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded text-[var(--color-text-low)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-main)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Next match (Enter)"
          aria-label="Next match"
        >
          <ChevronDown className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {mode === 'replace' && (
        <div className="flex items-center gap-0.5">
          <button
            onClick={replaceCurrent}
            disabled={matches.length === 0}
            className="flex items-center justify-center gap-1 px-3 py-2 sm:px-2 sm:py-1 min-h-[44px] sm:min-h-0 text-[11px] rounded bg-[var(--color-surface-2)] text-[var(--color-text-main)] hover:bg-[var(--color-border)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Replace this match"
          >
            <Replace className="w-3.5 h-3.5" />
            Replace
          </button>
          <button
            onClick={replaceAll}
            disabled={matches.length === 0}
            className="flex items-center justify-center gap-1 px-3 py-2 sm:px-2 sm:py-1 min-h-[44px] sm:min-h-0 text-[11px] rounded bg-[var(--color-signal)]/15 text-[var(--color-signal)] hover:bg-[var(--color-signal)]/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title="Replace all matches"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            All
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen(false)}
        className="p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded text-[var(--color-text-low)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-main)] transition-colors ml-1"
        title="Close (Esc)"
        aria-label="Close find bar"
      >
        <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
      </button>
    </div>
  );
}

export const FindReplaceBar = forwardRef(FindReplaceBarInner);

/** Find a single match of `query` at or after `from` in `text`. */
function findAt(text: string, query: string, from: number, opts: SearchOptions): Match | null {
  if (!query) return null;
  if (opts.regex) {
    try {
      const flags = opts.caseSensitive ? 'g' : 'gi';
      const re = new RegExp(query, flags);
      re.lastIndex = from;
      const m = re.exec(text);
      if (!m || m.index === undefined) return null;
      return { start: m.index, end: m.index + m[0].length };
    } catch {
      return null;
    }
  }
  const hay = opts.caseSensitive ? text : text.toLowerCase();
  const needle = opts.caseSensitive ? query : query.toLowerCase();
  const idx = hay.indexOf(needle, from);
  if (idx === -1) return null;
  if (opts.wholeWord) {
    const before = idx > 0 ? text[idx - 1] : ' ';
    const after = idx + needle.length < text.length ? text[idx + needle.length] : ' ';
    if (/\w/.test(before) || /\w/.test(after)) {
      // Not a whole word — keep searching past this point.
      return findAt(text, query, idx + 1, opts);
    }
  }
  return { start: idx, end: idx + needle.length };
}

/** Compute all matches for the whole document. Capped to avoid regex hangs. */
function computeMatches(text: string, query: string, opts: SearchOptions): Match[] {
  if (!query) return [];
  const result: Match[] = [];
  let from = 0;
  let guard = 0;
  while (from <= text.length && guard < 5000) {
    const m = findAt(text, query, from, opts);
    if (!m) break;
    result.push(m);
    from = m.end === from ? m.end + 1 : m.end;
    guard++;
  }
  return result;
}
