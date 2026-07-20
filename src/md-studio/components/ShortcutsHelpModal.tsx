'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string;
  action: string;
}

const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: 'File',
    items: [
      { keys: 'Ctrl S', action: 'Save now' },
      { keys: 'Ctrl N', action: 'New tab' },
      { keys: 'Ctrl W', action: 'Close tab' },
      { keys: 'Ctrl Shift D', action: 'Duplicate tab' },
      { keys: 'Ctrl K', action: 'Command palette' },
      { keys: 'Ctrl P', action: 'Print preview' },
    ],
  },
  {
    group: 'View',
    items: [
      { keys: 'Ctrl Shift L', action: 'Toggle document outline' },
      { keys: 'Ctrl Shift Enter', action: 'Toggle focus / zen mode' },
      { keys: 'Ctrl Shift S', action: 'Document statistics' },
      { keys: 'Ctrl J', action: 'Cycle theme (light → sepia → dark)' },
    ],
  },
  {
    group: 'Edit',
    items: [
      { keys: 'Ctrl F', action: 'Find' },
      { keys: 'Ctrl H', action: 'Find and replace' },
      { keys: 'Enter', action: 'Next match (in find bar)' },
      { keys: 'Shift Enter', action: 'Previous match (in find bar)' },
    ],
  },
  {
    group: 'Navigation',
    items: [
      { keys: 'Alt 1 – 9', action: 'Switch to tab 1 through 9' },
      { keys: 'Ctrl /', action: 'Show this help' },
      { keys: 'Esc', action: 'Close dialog / bar' },
    ],
  },
  {
    group: 'Editor',
    items: [
      { keys: 'Ctrl B', action: 'Bold' },
      { keys: 'Ctrl I', action: 'Italic' },
      { keys: 'Ctrl Shift X', action: 'Strikethrough' },
      { keys: 'Ctrl L', action: 'Insert link' },
      { keys: 'Ctrl Q', action: 'Blockquote' },
      { keys: 'Ctrl Shift J', action: 'Code block' },
    ],
  },
];

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative w-full max-w-lg bg-[var(--color-surface-1)] rounded-xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.2)] overflow-hidden"
        style={{ animation: 'modal-enter 0.15s ease-out' }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="px-6 pt-6 pb-2">
          <h2
            id="shortcuts-title"
            className="text-base font-semibold text-[var(--color-text-main)] font-body"
          >
            Keyboard shortcuts
          </h2>
          <p className="text-[12px] text-[var(--color-text-medium)] mt-0.5">
            <kbd className="px-1 py-0.5 text-[10px] rounded bg-[var(--color-surface-2)] font-mono">Ctrl</kbd>
            {' '}stands for{' '}
            <kbd className="px-1 py-0.5 text-[10px] rounded bg-[var(--color-surface-2)] font-mono">Cmd</kbd>
            {' '}on macOS.
          </p>
        </div>
        <div className="px-6 pb-6 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((section) => (
            <div key={section.group}>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-low)] mb-2">
                {section.group}
              </h3>
              <ul className="space-y-1.5">
                {section.items.map((item) => (
                  <li key={item.keys} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-[var(--color-text-medium)]">{item.action}</span>
                    <kbd className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-main)] border border-[var(--color-border)]/50 whitespace-nowrap">
                      {item.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
