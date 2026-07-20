'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Upload, ChevronDown, FileText, FileType, FileCode, FileOutput,
} from 'lucide-react';
import type { Tab } from '../hooks/useTabs';

interface FileMenuProps {
  activeTab: Tab | undefined;
  onNewFile: () => void;
  onImport: () => void;
  onExportMarkdown: () => void;
  onExportPDF: () => void;
  onExportWord: () => void;
  onExportHTML: () => void;
  onExportTXT: () => void;
}

export function FileMenu({
  activeTab,
  onNewFile,
  onImport,
  onExportMarkdown,
  onExportPDF,
  onExportWord,
  onExportHTML,
  onExportTXT,
}: FileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node) &&
          menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  // Position the menu using fixed coordinates so it escapes all overflow containers.
  // Clamp to viewport so the menu never overflows the right/bottom edges on mobile.
  const openMenu = useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56
      const padding = 8;
      const left = Math.min(rect.left, window.innerWidth - menuWidth - padding);
      const top = Math.min(rect.bottom + 4, window.innerHeight - 340);
      setMenuPos({ top: Math.max(padding, top), left: Math.max(padding, left) });
    }
    setIsOpen(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      const first = menuRef.current?.querySelector<HTMLButtonElement>('button[role="menuitem"]:not([disabled])');
      first?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen]);

  const close = () => setIsOpen(false);
  const run = (fn: () => void) => () => { fn(); close(); };

  const itemClass =
    'w-full text-left px-3 py-2.5 sm:py-[7px] min-h-[44px] sm:min-h-0 text-[13px] hover:bg-[var(--color-surface-2)] focus:bg-[var(--color-surface-2)] focus:outline-none flex items-center gap-2.5 transition-colors text-[var(--color-text-main)] rounded-none';
  const exportItemClass =
    'w-full text-left px-3 py-2.5 sm:py-[6px] min-h-[44px] sm:min-h-0 text-[13px] hover:bg-[var(--color-surface-2)] focus:bg-[var(--color-surface-2)] focus:outline-none flex items-center gap-2.5 transition-colors text-[var(--color-text-main)] rounded-none';
  const iconClass = 'w-4 h-4 text-[var(--color-text-low)]';
  const extClass = 'text-[10px] text-[var(--color-text-low)] font-mono';

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (!menuRef.current) return;
    const items = Array.from(
      menuRef.current.querySelectorAll<HTMLButtonElement>('button[role="menuitem"]:not([disabled])'),
    );
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = currentIndex === -1 ? 0 : (currentIndex + 1) % items.length;
      items[next].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = currentIndex === -1 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
      items[prev].focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      items[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      items[items.length - 1].focus();
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center h-full">
      <button
        ref={triggerRef}
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold hover:bg-[var(--color-surface-2)] rounded transition-colors text-[var(--color-text-main)] flex-none min-h-[44px] sm:min-h-0"
        aria-label="File menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        File <ChevronDown className="w-3 h-3 text-[var(--color-text-medium)]" />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          className="fixed w-56 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-lg shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] z-[9999] py-1.5 select-none font-body"
          style={{ top: menuPos.top, left: menuPos.left, animation: 'modal-enter 0.1s ease-out' }}
          role="menu"
          onKeyDown={onKeyDown}
        >
          <button onClick={run(onNewFile)} className={itemClass} role="menuitem">
            <Plus className={iconClass} /> New File
          </button>
          <button onClick={run(onImport)} className={itemClass} role="menuitem">
            <Upload className={iconClass} /> Import File
          </button>
          <div className="border-t border-[var(--color-border)]/60 my-1.5 mx-3" />
          <div className="px-3 py-1 text-[11px] text-[var(--color-text-low)] font-medium">Export as</div>
          <button
            onClick={run(() => activeTab && onExportMarkdown())}
            className={exportItemClass}
            role="menuitem"
            disabled={!activeTab}
          >
            <FileText className={iconClass} />
            <span className="flex-1">Markdown</span>
            <span className={extClass}>.md</span>
          </button>
          <button
            onClick={run(onExportPDF)}
            className={exportItemClass}
            role="menuitem"
            disabled={!activeTab}
          >
            <FileOutput className={iconClass} />
            <span className="flex-1">PDF</span>
            <span className={extClass}>.pdf</span>
          </button>
          <button
            onClick={run(onExportWord)}
            className={exportItemClass}
            role="menuitem"
            disabled={!activeTab}
          >
            <FileType className={iconClass} />
            <span className="flex-1">Word</span>
            <span className={extClass}>.docx</span>
          </button>
          <button
            onClick={run(() => activeTab && onExportHTML())}
            className={exportItemClass}
            role="menuitem"
            disabled={!activeTab}
          >
            <FileCode className={iconClass} />
            <span className="flex-1">HTML</span>
            <span className={extClass}>.html</span>
          </button>
          <button
            onClick={run(() => activeTab && onExportTXT())}
            className={exportItemClass}
            role="menuitem"
            disabled={!activeTab}
          >
            <FileText className={iconClass} />
            <span className="flex-1">Plain Text</span>
            <span className={extClass}>.txt</span>
          </button>
        </div>
      )}
    </div>
  );
}
