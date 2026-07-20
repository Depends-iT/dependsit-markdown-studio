'use client';

import { useEffect, useState, memo } from 'react';
import { importWithRetry } from '../lib/dynamicImport';

interface MermaidCodeBlockProps {
  code: string;
  isDarkMode: boolean;
}

const SVG_CACHE = new Map<string, string>();
const CACHE_MAX_SIZE = 50;

// Serialize Mermaid theme switches AND console.error suppression to avoid races
// when multiple diagrams render concurrently. Without this, one render's `finally`
// block could restore a `console.error` that another render had already replaced.
let activeTheme: 'default' | 'dark' | null = null;
let initPromise: Promise<void> = Promise.resolve();
let renderQueue: Promise<void> = Promise.resolve();

function getCacheKey(code: string, isDarkMode: boolean): string {
  return `${isDarkMode ? 'dark' : 'light'}:${code}`;
}

async function ensureTheme(mermaid: typeof import('mermaid').default, theme: 'default' | 'dark') {
  if (activeTheme === theme) return;
  const previous = initPromise;
  initPromise = previous.then(() => {
    if (activeTheme === theme) return;
    mermaid.initialize({
      startOnLoad: false,
      theme,
      securityLevel: 'strict',
    });
    activeTheme = theme;
  });
  await initPromise;
}

export const MermaidCodeBlock = memo(function MermaidCodeBlock({ code, isDarkMode }: MermaidCodeBlockProps) {
  const cacheKey = getCacheKey(code, isDarkMode);
  const [svg, setSvg] = useState<string | null>(() => SVG_CACHE.get(cacheKey) ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = SVG_CACHE.get(cacheKey);
    if (cached) {
      setSvg(cached);
      setError(null);
      return;
    }

    let isMounted = true;

    const timer = setTimeout(() => {
      // Queue renders so the console.error suppression can't race between
      // concurrent diagram renders. Each render runs to completion (including
      // its finally block) before the next one starts.
      renderQueue = renderQueue.then(async () => {
        if (!isMounted) return;
        const renderId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;
        try {
          const mermaidModule = await importWithRetry(() => import('mermaid'));
          const mermaid = mermaidModule.default;

          await ensureTheme(mermaid, isDarkMode ? 'dark' : 'default');

          // Suppress Mermaid's internal parse-error logging; we show our own error UI.
          const origError = console.error;
          console.error = (...args: unknown[]) => {
            const first = String(args[0] || '');
            if (first.includes('Parse error') || first.includes('Expecting')) {
              return;
            }
            origError.call(console, ...args);
          };

          let renderedSvg: string;
          try {
            const result = await mermaid.render(renderId, code);
            renderedSvg = result.svg;
          } finally {
            console.error = origError;
          }

          if (!renderedSvg || !renderedSvg.includes('<svg')) {
            throw new Error('Render produced no SVG');
          }

          const sanitized = renderedSvg
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');

          if (SVG_CACHE.size >= CACHE_MAX_SIZE) {
            const oldestKey = SVG_CACHE.keys().next().value;
            if (oldestKey !== undefined) SVG_CACHE.delete(oldestKey);
          }
          SVG_CACHE.set(cacheKey, sanitized);

          if (isMounted) {
            setSvg(sanitized);
            setError(null);
          }
        } catch {
          SVG_CACHE.delete(cacheKey);
          document.getElementById(`d${renderId}`)?.remove();
          document.getElementById(renderId)?.remove();

          if (isMounted) {
            setSvg(null);
            setError('This diagram has a syntax error. Check your Mermaid code and try again.');
          }
        }
      });
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [cacheKey, code, isDarkMode]);

  if (error) {
    return (
      <div className="p-4 bg-[var(--color-surface-1)] border border-red-500/30 rounded-md my-4">
        <div className="text-xs text-red-500 mb-2 font-mono font-semibold">Couldn't render this diagram</div>
        <pre className="text-xs font-mono opacity-80 overflow-auto max-h-48 whitespace-pre-wrap">{code}</pre>
        <div className="text-[10px] text-red-400 mt-2 font-mono">{error.split('\n')[0]}</div>
      </div>
    );
  }

  if (svg) {
    const downloadSvg = () => {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mermaid-diagram-${Date.now()}.svg`;
      a.click();
      URL.revokeObjectURL(url);
    };

    const downloadPng = () => {
      let svgStr = svg;
      if (!/xmlns=/.test(svgStr)) {
        svgStr = svgStr.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      // Strip external references that would taint the canvas.
      svgStr = svgStr.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
      svgStr = svgStr.replace(/@import[^;]+;/g, '');
      const viewBoxMatch = svgStr.match(/viewBox="([\d.\s-]+)"/);
      if (viewBoxMatch) {
        const parts = viewBoxMatch[1].trim().split(/\s+/).map(Number);
        const vbW = parts[2];
        const vbH = parts[3];
        if (vbW > 0 && vbH > 0) {
          svgStr = svgStr.replace(/width="[^"]*"/, `width="${vbW}"`);
          if (!/width=/.test(svgStr)) {
            svgStr = svgStr.replace('<svg', `<svg width="${vbW}"`);
          }
          svgStr = svgStr.replace(/height="[^"]*"/, `height="${vbH}"`);
          if (!/height=/.test(svgStr)) {
            svgStr = svgStr.replace('<svg', `<svg height="${vbH}"`);
          }
        }
      }

      // Use a data URL instead of a blob URL — data URLs are always
      // same-origin and don't taint the canvas.
      const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`;
      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const w = img.naturalWidth || img.width || 400;
        const h = img.naturalHeight || img.height || 300;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        try {
          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              const pngUrl = URL.createObjectURL(pngBlob);
              const a = document.createElement('a');
              a.href = pngUrl;
              a.download = `mermaid-diagram-${Date.now()}.png`;
              a.click();
              URL.revokeObjectURL(pngUrl);
            }
          }, 'image/png');
        } catch {
          // Tainted canvas — fall back to SVG download.
          downloadSvg();
        }
      };
      img.onerror = () => {
        // If the Image fails to load, fall back to SVG.
        downloadSvg();
      };
      img.src = dataUrl;
    };

    return (
      <div className="mermaid-rendered group/diagram relative flex justify-center py-4 bg-[var(--color-surface-1)] rounded-md border border-[var(--color-border)] my-4 overflow-x-auto">
        <div dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover/diagram:opacity-100 transition-opacity">
          <button
            onClick={downloadPng}
            className="p-2.5 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border)] transition-colors"
            title="Download as PNG"
            aria-label="Download diagram as PNG"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </button>
          <button
            onClick={downloadSvg}
            className="p-2.5 sm:p-1.5 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center rounded-md bg-[var(--color-surface-2)] text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-border)] transition-colors"
            title="Download as SVG"
            aria-label="Download diagram as SVG"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 bg-[var(--color-surface-1)] rounded-md border border-[var(--color-border)] my-4 text-xs text-[var(--color-text-medium)] animate-pulse">
      <div>Loading diagram…</div>
    </div>
  );
});
