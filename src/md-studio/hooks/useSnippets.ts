'use client';

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'md-studio-user-snippets';

export interface UserSnippet {
  id: string;
  name: string;
  body: string;
}

function readStored(): UserSnippet[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is UserSnippet =>
        s && typeof s.id === 'string' && typeof s.name === 'string' && typeof s.body === 'string',
    );
  } catch {
    return [];
  }
}

export function useSnippets() {
  const [snippets, setSnippets] = useState<UserSnippet[]>(readStored);

  const persist = useCallback((next: UserSnippet[]) => {
    setSnippets(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* localStorage may be unavailable */
    }
  }, []);

  const addSnippet = useCallback(
    (name: string, body: string) => {
      const snippet: UserSnippet = { id: crypto.randomUUID(), name, body };
      persist([...snippets, snippet]);
      return snippet;
    },
    [snippets, persist],
  );

  const updateSnippet = useCallback(
    (id: string, name: string, body: string) => {
      persist(snippets.map((s) => (s.id === id ? { ...s, name, body } : s)));
    },
    [snippets, persist],
  );

  const deleteSnippet = useCallback(
    (id: string) => {
      persist(snippets.filter((s) => s.id !== id));
    },
    [snippets, persist],
  );

  return { snippets, addSnippet, updateSnippet, deleteSnippet };
}
