'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Pencil, Save } from 'lucide-react';
import type { UserSnippet } from '../hooks/useSnippets';

interface SnippetManagerProps {
  isOpen: boolean;
  snippets: UserSnippet[];
  onAdd: (name: string, body: string) => void;
  onUpdate: (id: string, name: string, body: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

interface DraftState {
  id: string | null; // null = new
  name: string;
  body: string;
}

const EMPTY_DRAFT: DraftState = { id: null, name: '', body: '' };

export function SnippetManager({
  isOpen,
  snippets,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}: SnippetManagerProps) {
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const startEdit = (s: UserSnippet) => {
    setDraft({ id: s.id, name: s.name, body: s.body });
    setError('');
  };

  const startNew = () => {
    setDraft(EMPTY_DRAFT);
    setError('');
  };

  const save = () => {
    const name = draft.name.trim();
    const body = draft.body;
    if (!name) {
      setError('Name is required');
      return;
    }
    if (!body) {
      setError('Body cannot be empty');
      return;
    }
    if (draft.id) {
      onUpdate(draft.id, name, body);
    } else {
      onAdd(name, body);
    }
    setDraft(EMPTY_DRAFT);
    setError('');
  };

  const cancel = () => {
    setDraft(EMPTY_DRAFT);
    setError('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="snippets-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div
        className="relative w-full max-w-lg bg-[var(--color-surface-1)] rounded-xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col"
        style={{ animation: 'modal-enter 0.15s ease-out' }}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="px-6 pt-6 pb-3">
          <h2 id="snippets-title" className="text-base font-semibold text-[var(--color-text-main)] font-body">
            Snippet manager
          </h2>
          <p className="text-[12px] text-[var(--color-text-medium)] mt-0.5">
            Custom snippets appear in the command palette. Use{' '}
            <code className="font-mono text-[11px] px-1 rounded bg-[var(--color-surface-2)]">|</code>{' '}
            to mark the caret position.
          </p>
        </div>

        <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto">
          <div className="bg-[var(--color-surface-2)]/40 rounded-lg p-3 mb-4 border border-[var(--color-border)]/50">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="Snippet name (e.g. Signature)"
                className="flex-1 h-8 px-2.5 text-[13px] rounded bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-low)] outline-none focus:border-[var(--color-signal)] transition-colors"
                aria-label="Snippet name"
              />
              <button
                onClick={save}
                className="flex items-center gap-1 px-3 h-8 text-[12px] font-medium rounded bg-[var(--color-signal)]/15 text-[var(--color-signal)] hover:bg-[var(--color-signal)]/25 transition-colors"
              >
                <Save className="w-3 h-3" />
                {draft.id ? 'Update' : 'Add'}
              </button>
              {draft.id && (
                <button
                  onClick={cancel}
                  className="px-2 h-8 text-[12px] rounded text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              placeholder={'Snippet body — use | for caret position\n\nExample:\n---\nWritten by Jane Doe\n|'}
              rows={4}
              className="w-full px-2.5 py-2 text-[12px] font-mono rounded bg-[var(--color-base)] border border-[var(--color-border)] text-[var(--color-text-main)] placeholder:text-[var(--color-text-low)] outline-none focus:border-[var(--color-signal)] transition-colors resize-y"
              aria-label="Snippet body"
            />
            {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
          </div>

          {snippets.length === 0 ? (
            <div className="text-center py-8 text-[13px] text-[var(--color-text-low)]">
              No custom snippets yet. Create one above to get started.
            </div>
          ) : (
            <ul className="space-y-1.5">
              {snippets.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-surface-2)]/30 border border-[var(--color-border)]/30 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-[var(--color-text-main)] truncate">
                      {s.name}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-low)] font-mono truncate">
                      {s.body.replace(/\|/g, '¦').slice(0, 60) || '(empty)'}
                    </div>
                  </div>
                  <button
                    onClick={() => startEdit(s)}
                    className="p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Edit ${s.name}`}
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete(s.id)}
                    className="p-2 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded text-[var(--color-text-low)] hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label={`Delete ${s.name}`}
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {snippets.length === 0 && (
            <button
              onClick={startNew}
              className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--color-signal)] hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> New snippet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
