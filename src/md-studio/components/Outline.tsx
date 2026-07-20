'use client';

import { memo, useMemo, useEffect, useState } from 'react';
import { ListTree, X } from 'lucide-react';
import { extractHeadings, type Heading } from '../lib/headings';

interface OutlineProps {
  content: string;
  onJump: (slug: string) => void;
  onClose: () => void;
}

/** Indent per heading level, capped so deep nestings don't overflow. */
function indentFor(level: number): string {
  const depth = Math.min(Math.max(level - 1, 0), 4);
  return `${depth * 12}px`;
}

function HeadingRow({
  heading,
  active,
  onJump,
}: {
  heading: Heading;
  active: boolean;
  onJump: (slug: string) => void;
}) {
  return (
    <button
      onClick={() => onJump(heading.slug)}
      className={`block w-full text-left text-[12px] leading-relaxed py-2 sm:py-1 pr-2 min-h-[44px] sm:min-h-0 rounded transition-colors truncate flex items-center ${
        active
          ? 'text-[var(--color-signal)] font-medium bg-[var(--color-signal)]/8'
          : 'text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)]/60'
      }`}
      style={{ paddingLeft: indentFor(heading.level) }}
      title={heading.text}
      aria-current={active ? 'true' : undefined}
    >
      {heading.text}
    </button>
  );
}

export const Outline = memo(function Outline({ content, onJump, onClose }: OutlineProps) {
  const headings = useMemo(() => extractHeadings(content), [content]);

  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    const preview = document.querySelector('.wmde-markdown');
    if (!preview) return;

    const headingEls = Array.from(
      preview.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'),
    );

    if (headingEls.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id;
          if (id) setActiveSlug(id.replace(/^user-content-/, ''));
        }
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    headingEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  const headingList = (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {headings.length === 0 ? (
        <p className="text-[12px] text-[var(--color-text-low)] px-2 py-3 leading-relaxed">
          Add headings (<code className="font-mono text-[11px]">#</code>,{' '}
          <code className="font-mono text-[11px]">##</code>, …) to build a
          table of contents.
        </p>
      ) : (
        <nav className="space-y-0.5">
          {headings.map((h, i) => (
            <HeadingRow
              key={`${h.slug}-${i}`}
              heading={h}
              active={activeSlug === h.slug}
              onJump={onJump}
            />
          ))}
        </nav>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: bottom sheet drawer */}
      <div
        className="md:hidden fixed inset-0 z-40 flex flex-col justify-end"
        role="dialog"
        aria-modal="true"
        aria-label="Document outline"
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
        <aside className="relative bg-[var(--color-surface-1)] rounded-t-xl max-h-[70dvh] flex flex-col pb-safe shadow-2xl">
          <div className="flex items-center justify-between px-4 h-12 border-b border-[var(--color-border)] flex-none">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-low)]">
              <ListTree className="w-4 h-4" />
              Outline
            </div>
            <button
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors"
              aria-label="Close outline"
              title="Close outline (Ctrl Shift L)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {headingList}
        </aside>
      </div>

      {/* Desktop: sidebar */}
      <aside
        className="hidden md:flex flex-none w-56 border-l border-[var(--color-border)] bg-[var(--color-surface-1)]/60 flex-col h-full select-none"
        aria-label="Document outline"
      >
        <div className="flex items-center justify-between px-3 h-9 border-b border-[var(--color-border)] flex-none">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-low)]">
            <ListTree className="w-3.5 h-3.5" />
            Outline
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors"
            aria-label="Close outline"
            title="Close outline (Ctrl Shift L)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {headingList}
      </aside>
    </>
  );
});
