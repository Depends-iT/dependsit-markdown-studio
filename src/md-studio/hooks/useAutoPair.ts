'use client';

import { useEffect } from 'react';

const PAIRS: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
};

const ASTERISK_PAIR = '*';

function invert(ch: string): string | undefined {
  if (ch === ')') return '(';
  if (ch === ']') return '[';
  if (ch === '}') return '{';
  if (ch === '`') return '`';
  if (ch === '*') return '*';
  return undefined;
}

export function useAutoPair(activeTabId: string | null, editorReady: boolean) {
  // Re-subscribe when the active tab or editor mount state changes — the
  // textarea element is recreated on tab switch, so the old listener would
  // point at a detached node. Avoids re-binding on every keystroke.
  useEffect(() => {
    if (!editorReady) return;
    const textarea = document.querySelector<HTMLTextAreaElement>('.w-md-editor-text-input');
    if (!textarea) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const { selectionStart: start, selectionEnd: end } = textarea;
      const hasSelection = start !== end;
      const before = textarea.value.slice(0, start);
      const after = textarea.value.slice(end);
      const charAfter = after[0];

      if (hasSelection) {
        if (e.key === '(' || e.key === '[' || e.key === '{') {
          const close = PAIRS[e.key];
          const selected = textarea.value.slice(start, end);
          e.preventDefault();
          document.execCommand('insertText', false, e.key + selected + close);
          textarea.setSelectionRange(start + 1, end + 1);
          return;
        }
        if (e.key === '*' || e.key === '`') {
          const selected = textarea.value.slice(start, end);
          e.preventDefault();
          document.execCommand('insertText', false, e.key + selected + e.key);
          textarea.setSelectionRange(start + 1, end + 1);
          return;
        }
      }

      if (!hasSelection && (e.key === ')' || e.key === ']' || e.key === '}' || e.key === '`')) {
        if (charAfter === e.key) {
          e.preventDefault();
          textarea.setSelectionRange(start + 1, start + 1);
          return;
        }
      }

      if (!hasSelection && (e.key === '(' || e.key === '[' || e.key === '{')) {
        const close = PAIRS[e.key];
        if (charAfter === close) return;
        e.preventDefault();
        document.execCommand('insertText', false, e.key + close);
        textarea.setSelectionRange(start + 1, start + 1);
        return;
      }

      if (!hasSelection && e.key === '`') {
        const backtickCount = (before.match(/`/g) || []).length;
        if (backtickCount % 2 === 0 && charAfter !== '`') {
          e.preventDefault();
          document.execCommand('insertText', false, '``');
          textarea.setSelectionRange(start + 1, start + 1);
          return;
        }
      }

      if (!hasSelection && e.key === ASTERISK_PAIR) {
        const lastChar = before[before.length - 1];
        if (lastChar === ASTERISK_PAIR && charAfter !== ASTERISK_PAIR) {
          e.preventDefault();
          // Insert 3 asterisks so the total is 4: the first `*` already in the
          // buffer + `***` inserted = `****`. Caret at start+1 lands between
          // the 2nd and 3rd `*`, giving `**|**` (a balanced bold pair).
          document.execCommand('insertText', false, ASTERISK_PAIR + ASTERISK_PAIR + ASTERISK_PAIR);
          textarea.setSelectionRange(start + 1, start + 1);
          return;
        }
      }

      if (e.key === 'Backspace' && !hasSelection) {
        const lastChar = before[before.length - 1];
        if (charAfter && lastChar && lastChar === invert(charAfter)) {
          e.preventDefault();
          textarea.setSelectionRange(start - 1, end + 1);
          document.execCommand('insertText', false, '');
          return;
        }
      }
    };

    textarea.addEventListener('keydown', onKeyDown);
    return () => textarea.removeEventListener('keydown', onKeyDown);
  }, [activeTabId, editorReady]);
}
