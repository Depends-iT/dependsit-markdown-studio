'use client';

import { useEffect, useRef } from 'react';

export interface ShortcutHandlers {
  onSave: () => void;
  onNewTab: () => void;
  onCloseTab: () => void;
  onDuplicateTab: () => void;
  onToggleTheme: () => void;
  onToggleOutline: () => void;
  onToggleZen: () => void;
  onShowShortcuts: () => void;
  onFind: () => void;
  onReplace: () => void;
  onCommandPalette: () => void;
  onShowStats: () => void;
  onPrint: () => void;
  onSwitchTab: (index: number) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || target.isContentEditable;
}

/**
 * Global keyboard shortcuts. Handlers are stored in a ref so the keydown
 * listener binds once (on mount) and always reads the latest callbacks without
 * rebinding on every parent re-render.
 *
 * Shortcut table (also rendered by ShortcutsHelpModal):
 *  Ctrl/Cmd+S          Save now
 *  Ctrl/Cmd+N          New tab
 *  Ctrl/Cmd+W          Close tab
 *  Ctrl/Cmd+J          Cycle theme (light → sepia → dark)
 *  Ctrl/Cmd+Shift+L    Toggle outline
 *  Ctrl/Cmd+Shift+Enter Toggle focus / zen mode
 *  Ctrl/Cmd+F          Find
 *  Ctrl/Cmd+H          Find and replace
 *  Ctrl/Cmd+K          Command palette
 *  Ctrl/Cmd+Shift+S    Document statistics
 *  Ctrl/Cmd+P          Print
 *  Alt+1..9            Switch to tab N
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const h = handlersRef.current;
      const target = e.target;

      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        h.onSave();
        return;
      }

      if (mod && !e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        h.onFind();
        return;
      }
      if (mod && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        h.onReplace();
        return;
      }

      if (mod && !e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        h.onCommandPalette();
        return;
      }

      if (mod && e.shiftKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        h.onShowStats();
        return;
      }

      if (mod && !e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        h.onPrint();
        return;
      }

      if (e.altKey && !mod && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        h.onSwitchTab(parseInt(e.key, 10) - 1);
        return;
      }

      // View/navigation shortcuts work even while typing in the editor —
      // toggling theme, outline, zen mode, and shortcuts help should never
      // require the user to defocus the textarea first.
      if (mod && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        h.onToggleOutline();
        return;
      }
      if (mod && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        h.onToggleZen();
        return;
      }
      if (mod && e.key === '/') {
        e.preventDefault();
        h.onShowShortcuts();
        return;
      }
      if (mod && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        h.onToggleTheme();
        return;
      }

      // Tab-management shortcuts (Ctrl+N, Ctrl+W, Ctrl+Shift+D) are kept
      // outside the editor to avoid hijacking text entry — some browsers
      // also reserve Ctrl+N / Ctrl+W at the OS level.
      if (isEditableTarget(target)) return;

      if (mod && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        h.onNewTab();
      } else if (mod && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        h.onCloseTab();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        h.onDuplicateTab();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}
