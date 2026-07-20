'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getContent,
  setContent,
  deleteContent,
  clearAllContent,
} from '../lib/contentStore';
import { DEFAULT_MARKDOWN_CONTENT } from '../defaultContent';
import { logger } from '../lib/logger';

export interface TabMeta {
  id: string;
  name: string;
}

export interface Tab extends TabMeta {
  content: string;
}

const META_KEY = 'markdown-studio-tabs-meta';
const ACTIVE_TAB_KEY = 'markdown-studio-active-tab';
const LEGACY_KEY = 'markdown-studio-tabs';
const WELCOME_VERSION_KEY = 'md-studio-welcome-version';
const WELCOME_VERSION = '2'; // Bump when defaultContent.ts changes to force refresh.

const WELCOME_CONTENT = DEFAULT_MARKDOWN_CONTENT.trim();
const WELCOME_TAB_NAME = 'Getting Started.md';

export function useTabs() {
  const [tabsMeta, setTabsMeta] = useState<TabMeta[]>([
    { id: '', name: 'Getting Started.md' },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('');
  const [activeContent, setActiveContent] = useState<string>('');
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const contentRef = useRef<string>('');
  const savedContentRef = useRef<string>('');
  const activeTabIdRef = useRef<string>('');
  const tabsMetaRef = useRef<TabMeta[]>(tabsMeta);
  const initialized = useRef(false);

  useEffect(() => { tabsMetaRef.current = tabsMeta; }, [tabsMeta]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      let meta: TabMeta[] = [];
      try {
        const stored = localStorage.getItem(META_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            meta = parsed;
          }
        }
        if (meta.length === 0) {
          const legacy = localStorage.getItem(LEGACY_KEY);
          if (legacy) {
            const parsed = JSON.parse(legacy);
            if (Array.isArray(parsed) && parsed.length > 0) {
              meta = parsed.map((t: { id: string; name: string }) => ({
                id: t.id,
                name: t.name,
              }));
              for (const tab of parsed) {
                if (tab.id && tab.content != null) {
                  await setContent(tab.id, tab.content);
                }
              }
              localStorage.removeItem(LEGACY_KEY);
            }
          }
        }
      } catch (e) {
        logger.error('Failed to parse tabs metadata', e);
      }

      if (meta.length === 0) {
        meta = [{ id: crypto.randomUUID(), name: WELCOME_TAB_NAME }];
      }

      // Recover crash-saved content from localStorage fallbacks
      for (const m of meta) {
        const key = `tab-content-${m.id}`;
        const fallback = localStorage.getItem(key);
        if (fallback) {
          await setContent(m.id, fallback);
          localStorage.removeItem(key);
        }
      }

      let activeId = '';
      try {
        const storedActive = localStorage.getItem(ACTIVE_TAB_KEY);
        if (storedActive && meta.some((t) => t.id === storedActive)) {
          activeId = storedActive;
        }
      } catch {
        /* ignore */
      }
      if (!activeId) activeId = meta[0].id;

      setTabsMeta(meta);
      setActiveTabId(activeId);
      activeTabIdRef.current = activeId;
    })();
  }, []);

  useEffect(() => {
    if (!activeTabId) return;
    let cancelled = false;
    activeTabIdRef.current = activeTabId;

    const load = async () => {
      setIsContentLoading(true);
      try {
        let content = await getContent(activeTabId);

        const tabName = tabsMetaRef.current.find((t) => t.id === activeTabId)?.name;

        if (content === null) {
          if (tabName === WELCOME_TAB_NAME) {
            content = WELCOME_CONTENT;
            await setContent(activeTabId, content);
            localStorage.setItem(WELCOME_VERSION_KEY, WELCOME_VERSION);
          } else if (tabName) {
            const { defaultDocs } = await import('../defaultDocs');
            const doc = defaultDocs.find((d) => d.name === tabName);
            if (doc) {
              content = doc.content.trim();
              await setContent(activeTabId, content);
            }
          }
        } else if (tabName === WELCOME_TAB_NAME) {
          // Only refresh the welcome tab if the welcome version has changed.
          // This preserves user edits to the welcome tab across reloads.
          const storedVersion = localStorage.getItem(WELCOME_VERSION_KEY);
          if (storedVersion !== WELCOME_VERSION) {
            content = WELCOME_CONTENT;
            await setContent(activeTabId, content);
            localStorage.setItem(WELCOME_VERSION_KEY, WELCOME_VERSION);
          }
        }

        if (!cancelled) {
          setActiveContent(content ?? '');
          contentRef.current = content ?? '';
          savedContentRef.current = content ?? '';
          setIsDirty(false);
          setIsContentLoading(false);
        }
      } catch {
        if (!cancelled) {
          setActiveContent('');
          contentRef.current = '';
          savedContentRef.current = '';
          setIsDirty(false);
          setIsContentLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [activeTabId]);

  useEffect(() => {
    if (!initialized.current || !activeTabId) return;
    const timer = setTimeout(() => {
      localStorage.setItem(META_KEY, JSON.stringify(tabsMeta));
    }, 300);
    return () => clearTimeout(timer);
  }, [tabsMeta, activeTabId]);

  useEffect(() => {
    contentRef.current = activeContent;
    setIsDirty(activeContent !== savedContentRef.current);
    if (!activeTabIdRef.current) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (activeTabIdRef.current && !cancelled) {
        setContent(activeTabIdRef.current, activeContent).then(() => {
          if (cancelled) return;
          savedContentRef.current = activeContent;
          setLastSavedAt(Date.now());
          setIsDirty(false);
        });
      }
    }, 1000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeContent, activeTabId]);

  useEffect(() => {
    if (activeTabId) {
      localStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
    }
  }, [activeTabId]);

  // Flush to localStorage on unload as IndexedDB writes are unreliable during beforeunload
  useEffect(() => {
    const flush = () => {
      localStorage.setItem(META_KEY, JSON.stringify(tabsMetaRef.current));
      if (activeTabIdRef.current && contentRef.current !== undefined) {
        try {
          localStorage.setItem(
            `tab-content-${activeTabIdRef.current}`,
            contentRef.current
          );
        } catch {
          /* localStorage quota — best effort */
        }
      }
    };
    window.addEventListener('beforeunload', flush);
    return () => window.removeEventListener('beforeunload', flush);
  }, []);

  const addTab = useCallback(
    (name: string = 'Untitled.md', content: string = '') => {
      const id = crypto.randomUUID();
      if (activeTabIdRef.current && contentRef.current !== undefined) {
        setContent(activeTabIdRef.current, contentRef.current);
      }
      setContent(id, content);
      setTabsMeta((prev) => [...prev, { id, name }]);
      setActiveTabId(id);
      activeTabIdRef.current = id;
      setActiveContent(content);
      contentRef.current = content;
      savedContentRef.current = content;
      setIsDirty(false);
      return id;
    },
    []
  );

  const closeTab = useCallback((id: string) => {
    setTabsMeta((prev) => {
      if (prev.length <= 1) {
        const newId = crypto.randomUUID();
        setContent(newId, WELCOME_CONTENT);
        setActiveTabId(newId);
        activeTabIdRef.current = newId;
        setActiveContent(WELCOME_CONTENT);
        contentRef.current = WELCOME_CONTENT;
        deleteContent(id);
        return [{ id: newId, name: WELCOME_TAB_NAME }];
      }

      const newTabs = prev.filter((t) => t.id !== id);
      if (activeTabIdRef.current === id) {
        const index = prev.findIndex((t) => t.id === id);
        const newActive = newTabs[index - 1] || newTabs[0];
        setActiveTabId(newActive.id);
        activeTabIdRef.current = newActive.id;
      }
      deleteContent(id);
      return newTabs;
    });
  }, []);

  const switchTab = useCallback((id: string) => {
    if (activeTabIdRef.current && contentRef.current !== undefined) {
      setContent(activeTabIdRef.current, contentRef.current);
    }
    setActiveTabId(id);
    activeTabIdRef.current = id;
  }, []);

  const duplicateTab = useCallback(
    async (id: string) => {
      const source = tabsMetaRef.current.find((t) => t.id === id);
      if (!source) return;
      const newId = crypto.randomUUID();
      const newName = source.name.replace(/\.md$/i, '') + ' copy.md';
      // Inactive tabs aren't in memory — fetch from IndexedDB.
      const content = id === activeTabIdRef.current
        ? contentRef.current
        : (await getContent(id)) ?? '';
      setContent(newId, content);
      setTabsMeta((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        const next = [...prev];
        next.splice(idx + 1, 0, { id: newId, name: newName });
        return next;
      });
      setActiveTabId(newId);
      activeTabIdRef.current = newId;
      setActiveContent(content);
      contentRef.current = content;
      savedContentRef.current = content;
      setIsDirty(false);
    },
    [],
  );

  const updateTabContent = useCallback(
    (id: string, newContent: string) => {
      if (id === activeTabIdRef.current) {
        setActiveContent(newContent);
        contentRef.current = newContent;
      }
    },
    []
  );

  const renameTab = useCallback((id: string, newName: string) => {
    setTabsMeta((prev) =>
      prev.map((t) => (t.id === id ? { ...t, name: newName } : t))
    );
  }, []);

  const reorderTab = useCallback((fromId: string, toId: string) => {
    setTabsMeta((prev) => {
      const from = prev.findIndex((t) => t.id === fromId);
      const to = prev.findIndex((t) => t.id === toId);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const closeOthers = useCallback((keepId: string) => {
    setTabsMeta((prev) => {
      const toRemove = prev.filter((t) => t.id !== keepId);
      toRemove.forEach((t) => deleteContent(t.id));
      const kept = prev.filter((t) => t.id === keepId);
      if (kept.length === 0) return prev;
      if (activeTabIdRef.current !== keepId) {
        setActiveTabId(keepId);
        activeTabIdRef.current = keepId;
      }
      return kept;
    });
  }, []);

  const closeAllTabs = useCallback(async () => {
    await clearAllContent();
    const newId = crypto.randomUUID();
    await setContent(newId, WELCOME_CONTENT);
    setTabsMeta([{ id: newId, name: WELCOME_TAB_NAME }]);
    setActiveTabId(newId);
    activeTabIdRef.current = newId;
    setActiveContent(WELCOME_CONTENT);
    contentRef.current = WELCOME_CONTENT;
    savedContentRef.current = WELCOME_CONTENT;
    setIsDirty(false);
    localStorage.removeItem(META_KEY);
    localStorage.removeItem(ACTIVE_TAB_KEY);
  }, []);

  // Force an immediate write of the active tab's content to IndexedDB,
  // bypassing the 1s debounce. Used by the Ctrl/Cmd+S shortcut.
  const saveNow = useCallback(async () => {
    if (!activeTabIdRef.current) return;
    await setContent(activeTabIdRef.current, contentRef.current);
    savedContentRef.current = contentRef.current;
    setLastSavedAt(Date.now());
    setIsDirty(false);
  }, []);

  const activeTabMeta =
    tabsMeta.find((t) => t.id === activeTabId) || tabsMeta[0];

  const activeTab: Tab | undefined = activeTabMeta
    ? { ...activeTabMeta, content: activeContent }
    : undefined;

  // Memoize so inactive tab objects keep a stable identity across keystrokes —
  // only the active tab's content changes, so only it gets a new object. This
  // lets the tab bar skip re-rendering inactive tabs.
  const tabs: Tab[] = useMemo(
    () =>
      tabsMeta.map((t) => ({
        ...t,
        content: t.id === activeTabId ? activeContent : '',
      })),
    [tabsMeta, activeTabId, activeContent],
  );

  return {
    tabs,
    activeTabId,
    activeTab,
    addTab,
    closeTab,
    switchTab,
    duplicateTab,
    closeOthers,
    updateTabContent,
    renameTab,
    reorderTab,
    closeAllTabs,
    saveNow,
    isContentLoading,
    lastSavedAt,
    isDirty,
  };
}
