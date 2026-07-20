'use client';

import { useEffect, useRef } from 'react';
import { Copy, X, XCircle, Layers, Pencil } from 'lucide-react';

export interface TabContextMenuState {
  tabId: string;
  tabName: string;
  x: number;
  y: number;
}

interface TabContextMenuProps {
  state: TabContextMenuState | null;
  onClose: () => void;
  onDuplicate: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCloseOthers: (id: string) => void;
  onCloseAll: () => void;
  onRename: (id: string) => void;
}

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  divider?: boolean;
}

export function TabContextMenu({
  state,
  onClose,
  onDuplicate,
  onCloseTab,
  onCloseOthers,
  onCloseAll,
  onRename,
}: TabContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!state) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    // Defer registration to avoid immediate close from the opening event.
    const id = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('contextmenu', handleClickOutside);
    }, 0);
    document.addEventListener('keydown', handleKey);

    return () => {
      clearTimeout(id);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('contextmenu', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [state, onClose]);

  if (!state) return null;

  const items: MenuItem[] = [
    { label: 'Duplicate', icon: <Copy className="w-3.5 h-3.5" />, onClick: () => { onDuplicate(state.tabId); onClose(); } },
    { label: 'Rename', icon: <Pencil className="w-3.5 h-3.5" />, onClick: () => { onRename(state.tabId); onClose(); } },
    { label: 'Close', icon: <X className="w-3.5 h-3.5" />, onClick: () => { onCloseTab(state.tabId); onClose(); } },
    { label: 'Close others', icon: <Layers className="w-3.5 h-3.5" />, onClick: () => { onCloseOthers(state.tabId); onClose(); } },
    { label: 'Close all', icon: <XCircle className="w-3.5 h-3.5" />, onClick: () => { onCloseAll(); onClose(); }, danger: true, divider: true },
  ];

  // Position the menu, clamping to the viewport so it never overflows.
  const menuWidth = 160;
  const menuHeight = items.length * 44 + 12;
  const x = Math.min(state.x, window.innerWidth - menuWidth - 8);
  const y = Math.min(state.y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-40 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-lg shadow-[0_8px_30px_-4px_rgba(0,0,0,0.2)] py-1.5 select-none font-body"
      style={{ left: x, top: y, animation: 'modal-enter 0.1s ease-out' }}
      role="menu"
    >
      {items.map((item) => (
        <div key={item.label}>
          {item.divider && <div className="border-t border-[var(--color-border)]/60 my-1 mx-2" />}
          <button
            onClick={item.onClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 sm:py-1.5 min-h-[44px] sm:min-h-0 text-[13px] text-left transition-colors ${
              item.danger
                ? 'text-red-500 hover:bg-red-500/10'
                : 'text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)]'
            }`}
            role="menuitem"
          >
            <span className={item.danger ? 'text-red-500' : 'text-[var(--color-text-low)]'} aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        </div>
      ))}
    </div>
  );
}
