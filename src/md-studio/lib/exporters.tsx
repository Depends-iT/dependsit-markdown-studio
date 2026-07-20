import { importWithRetry } from './dynamicImport';
import { logger } from './logger';

interface TabInfo {
  name: string;
  content: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getBaseName(tab: TabInfo): string {
  return tab.name.replace(/\.md$/, '') || 'document';
}

async function getRenderedHTML(content: string): Promise<string> {
  const previewEl = document.querySelector('.wmde-markdown');
  if (previewEl) {
    // Clone the preview so we can strip find/replace highlights without
    // mutating the live DOM. The <mark data-find> elements are injected by
    // FindReplaceBar and should never appear in exported output.
    const clone = previewEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('mark[data-find]').forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
    return clone.innerHTML;
  }

  const [{ default: ReactMarkdown }, remarkGfm, remarkMath, rehypeKatex, rehypeSanitize, rehypeSlug, deepmerge] =
    await Promise.all([
      importWithRetry(() => import('react-markdown')),
      import('remark-gfm'),
      import('remark-math'),
      import('rehype-katex'),
      import('rehype-sanitize'),
      import('rehype-slug'),
      import('deepmerge'),
    ]);

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.visibility = 'hidden';
  document.body.appendChild(container);

  const { createRoot } = await import('react-dom/client');
  const root = createRoot(container);

  const defaultSchema = (rehypeSanitize as unknown as { defaultSchema: unknown }).defaultSchema;
  const sanitizeSchema = (deepmerge as unknown as <T>(a: T, b: unknown) => T)(defaultSchema, {
    attributes: {
      '*': ['className'],
      div: ['className', 'math'],
      span: ['className', 'math'],
    },
  });

  try {
    await new Promise<void>((resolve) => {
      root.render(
        <ReactMarkdown
          remarkPlugins={[remarkMath.default, remarkGfm.default]}
          rehypePlugins={[
            [rehypeSanitize.default, sanitizeSchema],
            rehypeSlug.default,
            rehypeKatex.default,
          ]}
        >
          {content}
        </ReactMarkdown>,
      );
      requestAnimationFrame(() => resolve());
    });
    return container.innerHTML;
  } finally {
    root.unmount();
    container.remove();
  }
}

export function exportMarkdown(tab: TabInfo) {
  const blob = new Blob([tab.content], { type: 'text/markdown' });
  downloadBlob(blob, tab.name || 'document.md');
}

export async function exportHTML(tab: TabInfo) {
  const escapeHtml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const safeTitle = escapeHtml(getBaseName(tab));
  const innerHTML = await getRenderedHTML(tab.content);
  const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeTitle}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.7; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
    pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
    code { font-family: "Geist Mono", "JetBrains Mono", monospace; }
    .mermaid-rendered { display: flex; justify-content: center; margin: 20px 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; }
    th { background: #f8f8f8; }
    blockquote { border-left: 3px solid #ccc; padding-left: 1rem; color: #666; }
  </style>
</head>
<body>
  <div class="markdown-body">
    ${innerHTML}
  </div>
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: 'text/html' });
  downloadBlob(blob, getBaseName(tab) + '.html');
}

export async function exportTXT(tab: TabInfo) {
  const previewEl = document.querySelector('.wmde-markdown');
  const plainText = previewEl
    ? (previewEl as HTMLElement).innerText
    : tab.content;
  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, getBaseName(tab) + '.txt');
}

export async function exportWord(tab: TabInfo): Promise<void> {
  try {
    const mod = await importWithRetry(() => import('html-docx-js-typescript'));
    const asBlob = mod.asBlob;
    const innerHTML = await getRenderedHTML(tab.content);
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${innerHTML}</body></html>`;
    const blob = await asBlob(fullHtml, { orientation: 'portrait' });
    downloadBlob(blob as Blob, getBaseName(tab) + '.docx');
  } catch (e) {
    logger.error('Word export failed:', e);
    throw new Error('Word export failed. Try HTML export instead.');
  }
}

/**
 * Export to PDF via a hidden iframe with a standalone print document.
 *
 * The previous approach called window.print() on the live app, which printed
 * the split-pane layout (editor on the left, preview on the right) and clipped
 * long content. This instead builds a clean, paginated HTML document containing
 * only the rendered markdown, loads it in an isolated iframe, and triggers the
 * browser's print dialog from there — giving full control over the print layout.
 */
export async function exportPDF(tab: TabInfo): Promise<void> {
  const innerHTML = await getRenderedHTML(tab.content);
  const safeTitle = getBaseName(tab);

  const printHtml = buildPrintDocument(innerHTML, safeTitle);

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('tabindex', '-1');
  document.body.appendChild(iframe);

  const cleanup = () => {
    try {
      iframe.remove();
    } catch {
      // already removed
    }
  };

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Print window timed out.'));
      }, 15_000);

      iframe.onload = () => {
        clearTimeout(timeout);
        resolve();
      };
      iframe.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to open print window.'));
      };

      const doc = iframe.contentDocument;
      if (!doc) {
        clearTimeout(timeout);
        reject(new Error('Print iframe is not accessible.'));
        return;
      }
      doc.open();
      doc.write(printHtml);
      doc.close();
    });

    // Give the iframe a tick to finish layout + font/asset loading before printing.
    await new Promise((r) => setTimeout(r, 300));

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  } catch (e) {
    logger.error('PDF export failed:', e);
    throw new Error('PDF export failed. Try exporting as HTML instead.');
  } finally {
    // Remove the iframe after a short delay so the print dialog has time to open.
    setTimeout(cleanup, 1000);
  }
}

/**
 * Build a self-contained HTML document optimized for printing.
 * Includes KaTeX styles, pagination rules, and page-break controls so long
 * documents flow across pages without clipping.
 */
function buildPrintDocument(innerHTML: string, title: string): string {
  const escapeTitle = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeTitle(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.17.0/dist/katex.min.css">
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #000;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      max-width: 7.5in;
      margin: 0 auto;
      padding: 0.5in 0.75in;
    }
    h1, h2, h3, h4, h5, h6 {
      page-break-after: avoid;
      line-height: 1.3;
    }
    h1 { font-size: 22pt; margin-top: 0; }
    h2 { font-size: 17pt; }
    h3 { font-size: 14pt; }
    p, ul, ol, blockquote, table { page-break-inside: avoid; }
    pre, .mermaid-rendered, img, svg {
      page-break-inside: avoid;
      max-width: 100%;
    }
    pre {
      background: #f5f5f5;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      padding: 12px;
      overflow-x: auto;
      font-size: 10pt;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
    code {
      font-family: "SF Mono", "Geist Mono", "JetBrains Mono", "Consolas", monospace;
      font-size: 10pt;
    }
    p code, li code, td code {
      background: #f0f0f0;
      padding: 1px 4px;
      border-radius: 3px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    th, td {
      border: 1px solid #999;
      padding: 6px 10px;
      text-align: left;
    }
    th { background: #f0f0f0; font-weight: 600; }
    blockquote {
      border-left: 3px solid #bbb;
      margin: 1em 0;
      padding: 0.25em 1em;
      color: #555;
    }
    a { color: #1a1a1a; text-decoration: underline; }
    hr {
      border: none;
      border-top: 1px solid #ccc;
      margin: 1.5em 0;
    }
    .mermaid-rendered {
      display: flex;
      justify-content: center;
      margin: 1em 0;
    }
    .mermaid-rendered svg { max-width: 100%; height: auto; }
    .katex-display {
      overflow-x: auto;
      overflow-y: hidden;
      padding: 4px 0;
    }
    @page {
      size: A4;
      margin: 0.75in 0.5in;
    }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  ${innerHTML}
</body>
</html>`;
}
