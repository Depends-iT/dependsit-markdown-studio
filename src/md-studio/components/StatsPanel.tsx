'use client';

import { useEffect, useMemo } from 'react';
import { X, FileText, Type, Hash, AlignLeft, Heading, ListTree, Link2, ImageIcon, Clock, BookOpen, BarChart3 } from 'lucide-react';
import { computeDocumentStats, readingEaseLabel } from '../lib/documentStats';

interface StatsPanelProps {
  content: string;
  isOpen: boolean;
  onClose: () => void;
}

interface StatRowProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}

function StatRow({ icon, label, value, hint }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-[12px] text-[var(--color-text-medium)]">
        <span className="text-[var(--color-text-low)]" aria-hidden="true">{icon}</span>
        {label}
        {hint && <span className="text-[10px] text-[var(--color-text-low)]">({hint})</span>}
      </div>
      <span className="text-[12px] font-mono tabular-nums text-[var(--color-text-main)]">{value}</span>
    </div>
  );
}

export function StatsPanel({ content, isOpen, onClose }: StatsPanelProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const stats = useMemo(() => computeDocumentStats(content), [content]);

  if (!isOpen) return null;

  const easeColor =
    stats.readingEase >= 60 ? 'text-[var(--color-signal)]' :
    stats.readingEase >= 30 ? 'text-amber-500' : 'text-red-500';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stats-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative w-full max-w-md bg-[var(--color-surface-1)] rounded-xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.2)] overflow-hidden"
        style={{ animation: 'modal-enter 0.15s ease-out' }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="px-6 pt-6 pb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--color-signal)]" />
          <h2 id="stats-title" className="text-base font-semibold text-[var(--color-text-main)] font-body">
            Document statistics
          </h2>
        </div>

        <div className="px-6 pb-6 pt-2 max-h-[70vh] overflow-y-auto">
          <div className="divide-y divide-[var(--color-border)]/40">
            <StatRow icon={<FileText className="w-3.5 h-3.5" />} label="Words" value={stats.words.toLocaleString()} />
            <StatRow icon={<Type className="w-3.5 h-3.5" />} label="Characters" value={stats.chars.toLocaleString()} />
            <StatRow icon={<Type className="w-3.5 h-3.5" />} label="Characters" hint="no spaces" value={stats.charsNoSpaces.toLocaleString()} />
            <StatRow icon={<Hash className="w-3.5 h-3.5" />} label="Lines" value={stats.lines.toLocaleString()} />
            <StatRow icon={<AlignLeft className="w-3.5 h-3.5" />} label="Paragraphs" value={stats.paragraphs.toLocaleString()} />
            <StatRow icon={<AlignLeft className="w-3.5 h-3.5" />} label="Sentences" value={stats.sentences.toLocaleString()} />
            <StatRow icon={<Heading className="w-3.5 h-3.5" />} label="Headings" value={stats.headings.toLocaleString()} />
            <StatRow icon={<ListTree className="w-3.5 h-3.5" />} label="List items" value={stats.lists.toLocaleString()} />
            <StatRow icon={<Link2 className="w-3.5 h-3.5" />} label="Links" value={stats.links.toLocaleString()} />
            <StatRow icon={<ImageIcon className="w-3.5 h-3.5" />} label="Images" value={stats.images.toLocaleString()} />
            <StatRow icon={<Type className="w-3.5 h-3.5" />} label="Code blocks" value={stats.codeBlocks.toLocaleString()} />
          </div>

          <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-low)] mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Readability
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--color-surface-2)]/50 rounded-lg p-3">
                <div className="flex items-center gap-1 text-[10px] text-[var(--color-text-low)] uppercase tracking-wider mb-1">
                  <Clock className="w-3 h-3" /> Reading time
                </div>
                <div className="text-[18px] font-mono font-semibold text-[var(--color-text-main)]">
                  {stats.readingTimeMin}<span className="text-[11px] text-[var(--color-text-low)] ml-1">min</span>
                </div>
              </div>
              <div className="bg-[var(--color-surface-2)]/50 rounded-lg p-3">
                <div className="text-[10px] text-[var(--color-text-low)] uppercase tracking-wider mb-1">Reading ease</div>
                <div className={`text-[18px] font-mono font-semibold ${easeColor}`}>
                  {stats.readingEase}
                </div>
                <div className="text-[10px] text-[var(--color-text-low)]">{readingEaseLabel(stats.readingEase)}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <StatRow icon={<BookOpen className="w-3.5 h-3.5" />} label="Grade level" value={stats.gradeLevel} />
              <StatRow icon={<AlignLeft className="w-3.5 h-3.5" />} label="Longest ¶" hint="words" value={stats.longestParagraphWords} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
