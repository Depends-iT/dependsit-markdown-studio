'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  Download, Upload, Trash2, Moon, Sun, File, Plus, X, ListTree, Keyboard, Check,
  Search, Maximize2, Minimize2, Palette, BarChart3, Command, Bookmark, Printer,
  PanelTopClose, PanelTopOpen, DownloadCloud,
} from 'lucide-react';
import { useMarkdownEngine } from './useMarkdownEngine';
import { useTabs } from './hooks/useTabs';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useWordGoal } from './hooks/useWordGoal';
import { useAutoPair } from './hooks/useAutoPair';
import { useSnippets } from './hooks/useSnippets';
import { usePwaInstall } from './hooks/usePwaInstall';
import { ConfirmationModal } from './components/ConfirmationModal';
import { EditorSkeleton } from './components/EditorSkeleton';
import { StatusBar } from './components/StatusBar';
import { FileMenu } from './components/FileMenu';
import { DropOverlay } from './components/DropOverlay';
import { ConversionOverlay } from './components/ConversionOverlay';
import { Outline } from './components/Outline';
import { ShortcutsHelpModal } from './components/ShortcutsHelpModal';
import { FindReplaceBar, type FindReplaceHandle } from './components/FindReplaceBar';
import { CommandPalette, type CommandAction } from './components/CommandPalette';
import { StatsPanel } from './components/StatsPanel';
import { SnippetManager } from './components/SnippetManager';
import { TabContextMenu, type TabContextMenuState } from './components/TabContextMenu';
import {
  exportMarkdown, exportHTML, exportTXT, exportWord, exportPDF,
} from './lib/exporters';
import { toMarkdownFilename } from './lib/fileTypes';
import { generateTableOfContents } from './lib/headings';
import { logger } from './lib/logger';

const MarkdownEditorWrapper = dynamic(
  () => import('./components/MarkdownEditorWrapper'),
  {
    ssr: false,
    loading: () => <EditorSkeleton isDarkMode={false} />,
  }
);

export default function MarkdownStudio() {
  const { theme, cycleTheme, isDarkMode } = useTheme();

  const [shouldRenderEditor, setShouldRenderEditor] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const findReplaceRef = useRef<FindReplaceHandle>(null);

  useEffect(() => {
    const trigger = () => setShouldRenderEditor(true);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => {
        setTimeout(trigger, 250);
      });
      return () => window.cancelIdleCallback(id as unknown as number);
    } else {
      const timer = setTimeout(trigger, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const { workerStatus, conversionStatus, progress, progressLabel, convertFile, initializeEngine } = useMarkdownEngine();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerImport = useCallback(() => {
    initializeEngine();
    fileInputRef.current?.click();
  }, [initializeEngine]);

  const {
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
  } = useTabs();

  const { goal, setGoal, clearGoal } = useWordGoal();
  const { snippets, addSnippet, updateSnippet, deleteSnippet } = useSnippets();
  const { canInstall, promptInstall } = usePwaInstall();

  const [spellCheck, setSpellCheck] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      const stored = localStorage.getItem('md-studio-spellcheck');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  });

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [tabIdToClose, setTabIdToClose] = useState<string | null>(null);
  const [tabIdToCloseOthers, setTabIdToCloseOthers] = useState<string | null>(null);
  const [isCloseAllModalOpen, setIsCloseAllModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOutlineOpen, setIsOutlineOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem('md-studio-outline-open');
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isSnippetManagerOpen, setIsSnippetManagerOpen] = useState(false);
  const [saveToast, setSaveToast] = useState(false);
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const [dragOverTabId, setDragOverTabId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<TabContextMenuState | null>(null);

  useEffect(() => {
    localStorage.setItem('md-studio-outline-open', String(isOutlineOpen));
  }, [isOutlineOpen]);

  const openDocTab = async (tabName: string) => {
    const existingTab = tabs.find((t) => t.name === tabName);
    if (existingTab) {
      switchTab(existingTab.id);
    } else {
      const { defaultDocs } = await import('./defaultDocs');
      const doc = defaultDocs.find(d => d.name === tabName);
      addTab(tabName, doc?.content.trim() || '');
    }
  };

  const stats = useMemo(() => {
    const content = activeTab?.content || '';
    return {
      chars: content.length,
      lines: content ? content.split('\n').length : 0,
      words: content ? content.trim().split(/\s+/).filter(Boolean).length : 0,
    };
  }, [activeTab?.content]);

  // Must be synchronous — deferring (startTransition) causes caret jumps.
  const handleEditorChange = useCallback(
    (val: string) => {
      if (!activeTabId) return;
      updateTabContent(activeTabId, val);
    },
    [activeTabId, updateTabContent],
  );

  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSave = useCallback(async () => {
    await saveNow();
    setSaveToast(true);
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setSaveToast(false), 1600);
  }, [saveNow]);

  const handleJumpToHeading = useCallback((slug: string) => {
    const preview = document.querySelector('.wmde-markdown');
    if (!preview) return;
    const escaped = CSS.escape(slug);
    const el =
      (preview.querySelector(`#${escaped}`) as HTMLElement | null) ||
      (preview.querySelector(`#user-content-${escaped}`) as HTMLElement | null);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('outline-flash');
      window.setTimeout(() => el.classList.remove('outline-flash'), 1200);
    }
  }, []);

  useAutoPair(activeTabId, shouldRenderEditor);

  useEffect(() => {
    const textarea = document.querySelector<HTMLTextAreaElement>('.w-md-editor-text-input');
    if (textarea) {
      textarea.spellcheck = spellCheck;
      textarea.setAttribute('lang', 'en');
    }
  }, [spellCheck, shouldRenderEditor, activeTabId]);

  useEffect(() => {
    const toolbar = document.querySelector('.w-md-editor-toolbar') as HTMLElement | null;
    if (toolbar) {
      toolbar.style.display = isToolbarVisible ? '' : 'none';
    }
  }, [isToolbarVisible, shouldRenderEditor, activeTabId]);

  const insertSnippet = useCallback((snippet: string) => {
    const textarea = document.querySelector<HTMLTextAreaElement>('.w-md-editor-text-input');
    if (!textarea) return;
    textarea.focus();
    const { selectionStart: start, selectionEnd: end } = textarea;
    const before = textarea.value.slice(0, start);
    const after = textarea.value.slice(end);
    const markerIdx = snippet.indexOf('|');
    const text = snippet.replace(/\|/, '');
    const next = before + text + after;
    const caret = markerIdx >= 0 ? start + markerIdx : start + text.length;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    setter?.call(textarea, next);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.setSelectionRange(caret, caret);
  }, []);

  const handlePrint = useCallback(() => {
    if (activeTab) {
      exportPDF(activeTab).catch((err) => logger.error('Print failed:', err));
    }
  }, [activeTab]);

  useKeyboardShortcuts({
    onSave: handleSave,
    onNewTab: () => addTab(),
    onCloseTab: () => {
      if (!activeTab) return;
      if (!activeTab.content.trim()) {
        closeTab(activeTab.id);
      } else {
        setTabIdToClose(activeTab.id);
      }
    },
    onDuplicateTab: () => activeTabId && duplicateTab(activeTabId),
    onToggleTheme: cycleTheme,
    onToggleOutline: () => setIsOutlineOpen((v) => !v),
    onToggleZen: () => setIsZenMode((v) => !v),
    onShowShortcuts: () => setIsShortcutsOpen(true),
    onFind: () => findReplaceRef.current?.open('find'),
    onReplace: () => findReplaceRef.current?.open('replace'),
    onCommandPalette: () => setIsCommandOpen(true),
    onShowStats: () => setIsStatsOpen(true),
    onPrint: handlePrint,
    onSwitchTab: (index) => {
      const target = tabs[index];
      if (target) switchTab(target.id);
    },
  });

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const tabsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabsContainerRef.current) {
      const activeEl = tabsContainerRef.current.querySelector('.tab-active') as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [activeTabId, tabs.length]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        const result = await convertFile(file);
        if (result) {
          const name = toMarkdownFilename(file.name);
          addTab(name, result);
        }
      } catch (err: unknown) {
        logger.error('File conversion error:', err);
        const message = err instanceof Error ? err.message : '';
        setErrorMessage(message || 'Something went wrong while converting this file. Try a different file or format.');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
      initializeEngine();
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      try {
        const result = await convertFile(file);
        if (result) {
          const name = toMarkdownFilename(file.name);
          addTab(name, result);
        }
      } catch (err: unknown) {
        logger.error('File conversion error:', err);
        const message = err instanceof Error ? err.message : '';
        setErrorMessage(message || 'Something went wrong while converting this file. Try a different file or format.');
      }
    }
  };

  const handleExportWord = async () => {
    if (!activeTab) return;
    try {
      await exportWord(activeTab);
    } catch (err) {
      logger.error('Export to Word failed:', err);
      setErrorMessage('The Word export didn\'t complete. Try exporting as a different format.');
    }
  };

  const handleExportPDF = async () => {
    if (!activeTab) return;
    try {
      await exportPDF(activeTab);
    } catch (err) {
      logger.error('Export to PDF failed:', err);
      setErrorMessage('The PDF export didn\'t complete. Try exporting as HTML instead.');
    }
  };

  const handleExportHTML = async () => {
    if (!activeTab) return;
    try {
      await exportHTML(activeTab);
    } catch (err) {
      logger.error('Export to HTML failed:', err);
      setErrorMessage('The HTML export didn\'t complete. Try exporting as a different format.');
    }
  };

  const handleExportTXT = async () => {
    if (!activeTab) return;
    try {
      await exportTXT(activeTab);
    } catch (err) {
      logger.error('Export to TXT failed:', err);
      setErrorMessage('The plain text export didn\'t complete. Try exporting as a different format.');
    }
  };

  // Command palette actions: app commands + markdown snippets. Declared after
  // the export handlers so all referenced callbacks are already in scope.
  const commandActions = useMemo<CommandAction[]>(() => {
    const actions: CommandAction[] = [
      { id: 'new-tab', label: 'New file', hint: 'Ctrl N', group: 'Actions', keywords: 'new file tab', run: () => addTab() },
      { id: 'import', label: 'Import file', hint: '', group: 'Actions', keywords: 'import upload open', run: triggerImport },
      { id: 'export-md', label: 'Export as Markdown', hint: '.md', group: 'Actions', keywords: 'export markdown download', run: () => activeTab && exportMarkdown(activeTab) },
      { id: 'export-pdf', label: 'Export as PDF', hint: '.pdf', group: 'Actions', keywords: 'export pdf download print', run: handleExportPDF },
      { id: 'export-word', label: 'Export as Word', hint: '.docx', group: 'Actions', keywords: 'export word docx download', run: handleExportWord },
      { id: 'export-html', label: 'Export as HTML', hint: '.html', group: 'Actions', keywords: 'export html download', run: handleExportHTML },
      { id: 'export-txt', label: 'Export as Plain Text', hint: '.txt', group: 'Actions', keywords: 'export txt text plain download', run: handleExportTXT },
      { id: 'toggle-theme', label: 'Cycle theme', hint: 'Ctrl J', group: 'Actions', keywords: 'theme light dark sepia cycle', run: cycleTheme },
      { id: 'toggle-zen', label: 'Toggle focus mode', hint: 'Ctrl Shift Enter', group: 'Actions', keywords: 'zen focus fullscreen distraction', run: () => setIsZenMode((v) => !v) },
      { id: 'toggle-outline', label: 'Toggle outline', hint: 'Ctrl Shift L', group: 'Actions', keywords: 'outline toc headings sidebar', run: () => setIsOutlineOpen((v) => !v) },
      { id: 'find', label: 'Find', hint: 'Ctrl F', group: 'Actions', keywords: 'find search', run: () => findReplaceRef.current?.open('find') },
      { id: 'replace', label: 'Find and replace', hint: 'Ctrl H', group: 'Actions', keywords: 'replace find', run: () => findReplaceRef.current?.open('replace') },
      { id: 'stats', label: 'Document statistics', hint: 'Ctrl Shift S', group: 'Actions', keywords: 'stats statistics word count reading', run: () => setIsStatsOpen(true) },
      { id: 'shortcuts', label: 'Keyboard shortcuts', hint: 'Ctrl /', group: 'Actions', keywords: 'help shortcuts keyboard', run: () => setIsShortcutsOpen(true) },
      // Markdown snippets — `|` marks the caret position after insertion.
      { id: 'snip-h1', label: 'Insert: Heading 1', group: 'Insert', keywords: 'heading h1 title', run: () => insertSnippet('\n# |\n') },
      { id: 'snip-h2', label: 'Insert: Heading 2', group: 'Insert', keywords: 'heading h2 subtitle', run: () => insertSnippet('\n## |\n') },
      { id: 'snip-h3', label: 'Insert: Heading 3', group: 'Insert', keywords: 'heading h3', run: () => insertSnippet('\n### |\n') },
      { id: 'snip-bold', label: 'Insert: Bold', group: 'Insert', keywords: 'bold strong **', run: () => insertSnippet('**|**') },
      { id: 'snip-italic', label: 'Insert: Italic', group: 'Insert', keywords: 'italic emphasize *', run: () => insertSnippet('*|*') },
      { id: 'snip-code', label: 'Insert: Inline code', group: 'Insert', keywords: 'code inline backtick', run: () => insertSnippet('`|`') },
      { id: 'snip-codeblock', label: 'Insert: Code block', group: 'Insert', keywords: 'code block fence', run: () => insertSnippet('\n```\n|\n```\n') },
      { id: 'snip-link', label: 'Insert: Link', group: 'Insert', keywords: 'link url href', run: () => insertSnippet('[|](https://)') },
      { id: 'snip-image', label: 'Insert: Image', group: 'Insert', keywords: 'image picture img', run: () => insertSnippet('![|](https://)') },
      { id: 'snip-quote', label: 'Insert: Blockquote', group: 'Insert', keywords: 'quote blockquote', run: () => insertSnippet('\n> |\n') },
      { id: 'snip-ul', label: 'Insert: Bullet list', group: 'Insert', keywords: 'list bullet unordered ul', run: () => insertSnippet('\n- |\n') },
      { id: 'snip-ol', label: 'Insert: Numbered list', group: 'Insert', keywords: 'list numbered ordered ol', run: () => insertSnippet('\n1. |\n') },
      { id: 'snip-task', label: 'Insert: Task list', group: 'Insert', keywords: 'task checklist todo', run: () => insertSnippet('\n- [ ] |\n') },
      { id: 'snip-table', label: 'Insert: Table', group: 'Insert', keywords: 'table grid', run: () => insertSnippet('\n| Column 1 | Column 2 |\n| --- | --- |\n| | |\n') },
      { id: 'snip-hr', label: 'Insert: Horizontal rule', group: 'Insert', keywords: 'horizontal rule hr divider line', run: () => insertSnippet('\n---\n') },
      { id: 'snip-mermaid', label: 'Insert: Mermaid diagram', group: 'Insert', keywords: 'mermaid diagram flowchart', run: () => insertSnippet('\n```mermaid\ngraph TD\n  A[Start] --> B[End]\n```\n') },
      { id: 'snip-math', label: 'Insert: Math block', group: 'Insert', keywords: 'math katex latex formula', run: () => insertSnippet('\n$$\n|\n$$\n') },
      { id: 'snip-toc', label: 'Insert: Table of contents', group: 'Insert', keywords: 'toc table of contents headings outline', run: () => {
        const toc = generateTableOfContents(activeTab?.content || '');
        insertSnippet(toc || '## Table of Contents\n\n(Add headings to generate a TOC)\n\n---\n');
      } },
      { id: 'manage-snippets', label: 'Manage snippets', group: 'Actions', keywords: 'snippet manager custom template', run: () => setIsSnippetManagerOpen(true) },
      { id: 'print', label: 'Print preview', hint: 'Ctrl P', group: 'Actions', keywords: 'print paper preview', run: handlePrint },
      { id: 'duplicate-tab', label: 'Duplicate current tab', group: 'Actions', keywords: 'duplicate copy tab clone', run: () => activeTabId && duplicateTab(activeTabId) },
      ...snippets.map((s) => ({
        id: `user-snip-${s.id}`,
        label: s.name,
        group: 'My snippets',
        keywords: `snippet custom ${s.name}`,
        run: () => insertSnippet(s.body),
      })),
    ];
    return actions;
  }, [activeTab, activeTabId, addTab, cycleTheme, duplicateTab, handleExportHTML, handleExportPDF, handleExportTXT, handleExportWord, handlePrint, insertSnippet, triggerImport, snippets]);

  useEffect(() => {
    const tabsContainer = tabsContainerRef.current;
    if (tabsContainer) {
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          tabsContainer.scrollLeft += e.deltaY;
        }
      };
      tabsContainer.addEventListener('wheel', handleWheel, { passive: false });
      return () => tabsContainer.removeEventListener('wheel', handleWheel);
    }
  }, []);

  useEffect(() => {
    const fixSvgs = () => {
      const svgs = document.querySelectorAll('svg[role="img"]');
      svgs.forEach((svg) => {
        if (!svg.getAttribute('aria-label') && !svg.querySelector('title')) {
          const button = svg.closest('button');
          const label = button?.getAttribute('aria-label') || button?.getAttribute('title') || 'icon';
          svg.setAttribute('aria-label', label);
        }
      });
    };
    const timer = setTimeout(fixSvgs, 600);
    return () => clearTimeout(timer);
  }, [shouldRenderEditor, activeTabId, isToolbarVisible, isZenMode]);

  // Esc exits zen mode (but not while a find bar or modal is open, since those
  // handle Esc themselves).
  useEffect(() => {
    if (!isZenMode) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const findBarOpen = !!document.querySelector('[role="search"][aria-label="Find and replace"]');
      const modalOpen = !!document.querySelector('[role="dialog"]');
      if (!findBarOpen && !modalOpen) {
        e.preventDefault();
        setIsZenMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isZenMode]);

  return (
    <div
      className={`flex flex-col h-dvh w-full bg-[var(--color-base)] text-[var(--color-text-main)] overflow-hidden relative ${isZenMode ? 'zen-mode' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h2 className="sr-only">DependsiT Markdown Studio Editor</h2>

      <header className={`flex-none flex flex-col border-b border-[var(--color-border)] bg-[var(--color-surface-1)] relative z-40 select-none transition-transform duration-200 ${isZenMode ? '-translate-y-full h-0 overflow-hidden border-b-0' : ''}`}>
        <div className="flex flex-wrap md:flex-nowrap items-stretch md:items-center px-2 lg:px-4 gap-1 relative">
          <div className="flex items-center gap-2 h-12 md:h-10 flex-none">
            <FileMenu
              activeTab={activeTab}
              onNewFile={() => addTab()}
              onImport={triggerImport}
              onExportMarkdown={() => activeTab && exportMarkdown(activeTab)}
              onExportPDF={handleExportPDF}
              onExportWord={handleExportWord}
              onExportHTML={handleExportHTML}
              onExportTXT={handleExportTXT}
            />

            <div className="flex items-center gap-1 border-l border-[var(--color-border)] pl-2 h-full">
              <button
                onClick={triggerImport}
                className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors max-md:min-h-[48px] max-md:min-w-[48px] max-md:flex max-md:items-center max-md:justify-center"
                title="Import file"
                aria-label="Import file"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { if (activeTab) exportMarkdown(activeTab); }}
                className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors max-md:min-h-[48px] max-md:min-w-[48px] max-md:flex max-md:items-center max-md:justify-center"
                title="Quick Export (MD)"
                aria-label="Export as Markdown"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handlePrint}
                className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors max-md:min-h-[48px] max-md:min-w-[48px] max-md:flex max-md:items-center max-md:justify-center"
                title="Print (Ctrl P)"
                aria-label="Print"
              >
                <Printer className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsToolbarVisible((v) => !v)}
                className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors max-md:min-h-[48px] max-md:min-w-[48px] max-md:flex max-md:items-center max-md:justify-center"
                title={isToolbarVisible ? 'Hide formatting toolbar' : 'Show formatting toolbar'}
                aria-label="Toggle formatting toolbar"
                aria-pressed={isToolbarVisible}
              >
                {isToolbarVisible ? <PanelTopClose className="w-3.5 h-3.5" /> : <PanelTopOpen className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Tab bar — takes full width on mobile (its own row), grows on desktop */}
          <div className="order-2 md:order-none w-full md:w-auto md:flex-shrink md:min-w-0 md:flex-1 overflow-hidden flex items-stretch md:mx-1 lg:mx-2 h-12 md:h-10 border-t md:border-t-0 border-[var(--color-border)]/60">
            <div ref={tabsContainerRef} className="flex-1 overflow-x-auto flex items-end gap-0 no-scrollbar h-full relative" role="tablist" aria-label="Open files">
              {tabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  onDragStart={(e) => {
                    setDraggedTabId(tab.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverTabId !== tab.id) setDragOverTabId(tab.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverTabId === tab.id) setDragOverTabId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggedTabId && draggedTabId !== tab.id) {
                      reorderTab(draggedTabId, tab.id);
                    }
                    setDraggedTabId(null);
                    setDragOverTabId(null);
                  }}
                  onDragEnd={() => {
                    setDraggedTabId(null);
                    setDragOverTabId(null);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ tabId: tab.id, tabName: tab.name, x: e.clientX, y: e.clientY });
                  }}
                  draggable
                  role="tab"
                  aria-selected={activeTabId === tab.id}
                  tabIndex={activeTabId === tab.id ? 0 : -1}
                  className={`group flex items-center gap-1.5 px-3 max-w-[160px] min-w-[100px] max-md:min-w-[120px] cursor-pointer select-none transition-colors duration-100 relative h-full max-md:h-12 ${
                    activeTabId === tab.id
                      ? 'bg-[var(--color-base)] text-[var(--color-text-main)] tab-active'
                      : 'bg-transparent text-[var(--color-text-low)] hover:text-[var(--color-text-medium)] hover:bg-[var(--color-surface-2)]/40'
                  } ${draggedTabId === tab.id ? 'opacity-40' : ''} ${
                    dragOverTabId === tab.id && draggedTabId !== tab.id
                      ? 'border-l-2 border-[var(--color-signal)]'
                      : ''
                  }`}
                >
                  {activeTabId === tab.id && (
                    <span className="absolute bottom-0 left-2 right-2 h-[2px] bg-[var(--color-signal)] rounded-full" />
                  )}
                  <File className={`w-3 h-3 flex-none ${activeTabId === tab.id ? 'text-[var(--color-signal)]' : ''}`} />
                  {editingTabId === tab.id ? (
                    <input
                      type="text"
                      value={tab.name}
                      onChange={(e) => renameTab(tab.id, e.target.value)}
                      onBlur={() => setEditingTabId(null)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setEditingTabId(null); }}
                      autoFocus
                      className="bg-transparent border-none outline-none text-xs truncate flex-1 pointer-events-auto w-full text-[inherit]"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => { e.stopPropagation(); setEditingTabId(tab.id); }}
                      className="text-xs truncate flex-1 w-full text-[inherit]"
                    >
                      {tab.name}
                    </span>
                  )}
                  {activeTabId === tab.id && stats.words > 0 && (
                    <span
                      className="hidden sm:inline text-[9px] font-mono tabular-nums px-1 py-0.5 rounded bg-[var(--color-surface-2)]/60 text-[var(--color-text-low)] flex-none"
                      title={`${stats.words} words`}
                    >
                      {stats.words < 1000 ? stats.words : `${(stats.words / 1000).toFixed(1)}k`}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tab.id === activeTabId) {
                        const isEmpty = !activeTab?.content.trim();
                        if (isEmpty) {
                          closeTab(tab.id);
                        } else {
                          setTabIdToClose(tab.id);
                        }
                      } else {
                        setTabIdToClose(tab.id);
                      }
                    }}
                    className="p-1 rounded-sm hover:bg-red-500/15 hover:text-red-500 text-transparent group-hover:text-[var(--color-text-low)] flex-none transition-colors max-md:min-h-[44px] max-md:min-w-[44px] max-md:flex max-md:items-center max-md:justify-center max-md:text-[var(--color-text-low)]"
                    aria-label={`Close tab ${tab.name}`}
                  >
                    <X className="w-4 h-4 md:w-3 md:h-3" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addTab()}
              className="flex items-center justify-center px-2.5 hover:bg-[var(--color-surface-2)]/50 text-[var(--color-text-low)] hover:text-[var(--color-text-main)] flex-none transition-colors h-full max-md:min-w-[48px] bg-[var(--color-surface-1)] z-10"
              title="New File"
              aria-label="New file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="order-3 md:order-none flex flex-wrap md:flex-nowrap items-center justify-end gap-0.5 sm:gap-1 h-auto md:h-10 w-full md:w-auto md:flex-none md:ml-0 pt-1 md:pt-0 pr-1 md:pr-0 border-t md:border-t-0 border-[var(--color-border)]/60">
            <button
              onClick={() => findReplaceRef.current?.open('find')}
              className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Find (Ctrl F)"
              aria-label="Find"
            >
              <Search className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={() => setIsZenMode((v) => !v)}
              className={`p-1 rounded transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center ${
                isZenMode
                  ? 'bg-[var(--color-signal)]/12 text-[var(--color-signal)]'
                  : 'text-[var(--color-text-medium)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-main)]'
              }`}
              title="Focus mode (Ctrl Shift Enter)"
              aria-label="Toggle focus mode"
              aria-pressed={isZenMode}
            >
              {isZenMode ? <Minimize2 className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Maximize2 className="w-4 h-4 md:w-3.5 md:h-3.5" />}
            </button>
            <button
              onClick={() => setIsOutlineOpen((v) => !v)}
              className={`p-1 rounded transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center ${
                isOutlineOpen
                  ? 'bg-[var(--color-signal)]/12 text-[var(--color-signal)]'
                  : 'text-[var(--color-text-medium)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-main)]'
              }`}
              title="Toggle outline (Ctrl Shift L)"
              aria-label="Toggle document outline"
              aria-pressed={isOutlineOpen}
            >
              <ListTree className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={() => setIsStatsOpen(true)}
              className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Document statistics (Ctrl Shift S)"
              aria-label="Document statistics"
            >
              <BarChart3 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={() => setIsSnippetManagerOpen(true)}
              className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Manage snippets"
              aria-label="Manage snippets"
            >
              <Bookmark className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={() => setIsCommandOpen(true)}
              className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Command palette (Ctrl K)"
              aria-label="Command palette"
            >
              <Command className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={() => setIsShortcutsOpen(true)}
              className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Keyboard shortcuts (Ctrl /)"
              aria-label="Keyboard shortcuts"
            >
              <Keyboard className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
            <button
              onClick={cycleTheme}
              className="p-1 hover:bg-[var(--color-surface-2)] rounded text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title={`Theme: ${theme} (Ctrl J to cycle)`}
              aria-label="Cycle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 md:w-3.5 md:h-3.5" /> : theme === 'sepia' ? <Palette className="w-4 h-4 md:w-3.5 md:h-3.5" /> : <Moon className="w-4 h-4 md:w-3.5 md:h-3.5" />}
            </button>
            {canInstall && (
              <button
                onClick={promptInstall}
                className="flex items-center gap-1 px-1.5 py-1 rounded bg-[var(--color-signal)]/12 text-[var(--color-signal)] hover:bg-[var(--color-signal)]/20 transition-colors text-[11px] font-medium min-h-[44px]"
                title="Install as an app"
                aria-label="Install app"
              >
                <DownloadCloud className="w-4 h-4 md:w-3.5 md:h-3.5" />
                <span className="hidden lg:inline">Install</span>
              </button>
            )}
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="p-1 hover:bg-red-500/20 hover:text-red-500 rounded text-[var(--color-text-medium)] transition-colors min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 flex items-center justify-center"
              title="Reset Workspace"
              aria-label="Reset workspace"
            >
              <Trash2 className="w-4 h-4 md:w-3.5 md:h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".md,.markdown,.txt,.text,.pdf,.docx,.pptx,.xlsx,.csv,.html,.htm,.json,.xml,.epub,.rtf"
        className="hidden"
        aria-label="Import file"
        id="file-import-input"
      />

      <main className="flex-1 flex overflow-hidden bg-[var(--color-base)] z-0" data-color-mode={isDarkMode ? 'dark' : 'light'}>
        <div className="flex-1 overflow-hidden flex flex-col">
          <FindReplaceBar
            ref={findReplaceRef}
            value={activeTab?.content || ''}
            onChange={(val) => activeTabId && updateTabContent(activeTabId, val)}
          />
          {shouldRenderEditor ? (
            <MarkdownEditorWrapper
              value={activeTab?.content || ''}
              onChange={handleEditorChange}
              isDarkMode={isDarkMode}
            />
          ) : (
            <EditorSkeleton isDarkMode={isDarkMode} />
          )}
        </div>
        {isOutlineOpen && !isZenMode && (
          <Outline
            content={activeTab?.content || ''}
            onJump={handleJumpToHeading}
            onClose={() => setIsOutlineOpen(false)}
          />
        )}
      </main>

      <div
        className={`transition-all duration-200 overflow-hidden ${isZenMode ? 'h-0 opacity-0' : 'h-auto opacity-100'}`}
      >
        <StatusBar
          workerStatus={workerStatus}
          stats={stats}
          activeTab={activeTab}
          isContentLoading={isContentLoading}
          isDirty={isDirty}
          lastSavedAt={lastSavedAt}
          goal={goal}
          spellCheck={spellCheck}
          onToggleSpellCheck={() => {
            setSpellCheck((v) => {
              const next = !v;
              try { localStorage.setItem('md-studio-spellcheck', String(next)); } catch { /* ignore */ }
              return next;
            });
          }}
          onSetGoal={setGoal}
          onClearGoal={clearGoal}
          onOpenDoc={openDocTab}
          onShowShortcuts={() => setIsShortcutsOpen(true)}
        />
      </div>

      {isZenMode && (
        <button
          onClick={() => setIsZenMode(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full bg-[var(--color-surface-1)] border border-[var(--color-border)] shadow-lg text-[13px] text-[var(--color-text-medium)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors"
          title="Exit focus mode (Esc or Ctrl Shift Enter)"
          aria-label="Exit focus mode"
        >
          <Minimize2 className="w-4 h-4" />
          Exit focus
        </button>
      )}

      <ShortcutsHelpModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      <CommandPalette
        key={`cmd-${isCommandOpen}`}
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        actions={commandActions}
      />

      <StatsPanel
        content={activeTab?.content || ''}
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
      />

      <SnippetManager
        isOpen={isSnippetManagerOpen}
        snippets={snippets}
        onAdd={addSnippet}
        onUpdate={updateSnippet}
        onDelete={deleteSnippet}
        onClose={() => setIsSnippetManagerOpen(false)}
      />

      <TabContextMenu
        state={contextMenu}
        onClose={() => setContextMenu(null)}
        onDuplicate={(id) => duplicateTab(id)}
        onCloseTab={(id) => {
          const tab = tabs.find((t) => t.id === id);
          if (tab && !tab.content.trim()) {
            closeTab(id);
          } else {
            setTabIdToClose(id);
          }
        }}
        onCloseOthers={(id) => {
          const others = tabs.filter((t) => t.id !== id);
          if (others.length > 0) {
            setTabIdToCloseOthers(id);
          }
        }}
        onCloseAll={() => {
          if (tabs.length > 0) {
            setIsCloseAllModalOpen(true);
          } else {
            closeAllTabs();
          }
        }}
        onRename={(id) => setEditingTabId(id)}
      />

      {saveToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-surface-1)] border border-[var(--color-border)] shadow-lg text-[13px] text-[var(--color-text-main)] font-body"
          style={{ animation: 'toast-in 0.2s ease-out', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 56px)' }}
          role="status"
          aria-live="polite"
        >
          <Check className="w-4 h-4 text-[var(--color-signal)]" />
          Saved
        </div>
      )}

      <ConfirmationModal
        isOpen={isResetModalOpen}
        title="Reset workspace"
        message="All your files, snippets, and settings will be deleted and the workspace will be restored to its default state. This can't be undone."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={async () => {
          localStorage.removeItem('md-studio-word-goal');
          localStorage.removeItem('md-studio-user-snippets');
          clearGoal();
          await closeAllTabs();
          setIsResetModalOpen(false);
        }}
        onCancel={() => setIsResetModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={tabIdToClose !== null}
        title="Close file"
        message="The contents of this file will be discarded. This can't be undone."
        confirmLabel="Close"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (tabIdToClose) {
            closeTab(tabIdToClose);
            setTabIdToClose(null);
          }
        }}
        onCancel={() => setTabIdToClose(null)}
      />

      <ConfirmationModal
        isOpen={tabIdToCloseOthers !== null}
        title="Close other files"
        message="All other open files will be closed and their content discarded. This can't be undone."
        confirmLabel="Close others"
        cancelLabel="Cancel"
        onConfirm={() => {
          if (tabIdToCloseOthers) {
            closeOthers(tabIdToCloseOthers);
            setTabIdToCloseOthers(null);
          }
        }}
        onCancel={() => setTabIdToCloseOthers(null)}
      />

      <ConfirmationModal
        isOpen={isCloseAllModalOpen}
        title="Close all files"
        message="All open files will be closed and their content discarded. This can't be undone."
        confirmLabel="Close all"
        cancelLabel="Cancel"
        onConfirm={async () => {
          await closeAllTabs();
          setIsCloseAllModalOpen(false);
        }}
        onCancel={() => setIsCloseAllModalOpen(false)}
      />

      <ConfirmationModal
        isOpen={errorMessage !== null}
        title="Something went wrong"
        message={errorMessage || ''}
        confirmLabel="Dismiss"
        cancelLabel=""
        onConfirm={() => setErrorMessage(null)}
        onCancel={() => setErrorMessage(null)}
      />

      <DropOverlay visible={isDragging} />
      {conversionStatus === 'converting' && !isDragging && (
        <ConversionOverlay progress={progress} label={progressLabel} />
      )}
    </div>
  );
}
