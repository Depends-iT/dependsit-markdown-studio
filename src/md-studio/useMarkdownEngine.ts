'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { importWithRetry } from './lib/dynamicImport';
import { htmlToMarkdown } from './lib/htmlToMarkdown';
import { logger } from './lib/logger';
import { classifyFile, getExtension, MAX_IMPORT_BYTES, MAX_PDF_PAGES, formatFileSize } from './lib/fileTypes';

type WorkerStatus = 'idle' | 'initializing' | 'ready' | 'error';
type ConversionStatus = 'idle' | 'converting' | 'success' | 'error';

const WORKER_TIMEOUT_MS = 120_000;

export function useMarkdownEngine() {
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>('idle');
  const [conversionStatus, setConversionStatus] = useState<ConversionStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const workerRef = useRef<Worker | null>(null);
  const resolvesRef = useRef<Map<string, (md: string) => void>>(new Map());
  const rejectsRef = useRef<Map<string, (err: Error) => void>>(new Map());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearConversionTimeout = useCallback((id: string) => {
    const timer = timeoutsRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const ensureWorker = useCallback(() => {
    if (workerRef.current) return;
    setWorkerStatus('initializing');
    workerRef.current = new Worker(new URL('./pyodide.worker.ts', import.meta.url));

    workerRef.current.onmessage = (event) => {
      const { type, id, result, error: workerError } = event.data;

      if (type === 'READY' || type === 'ENGINE_INITIALIZED') {
        setWorkerStatus('ready');
      } else if (type === 'ERROR') {
        setWorkerStatus('error');
      } else if (type === 'CONVERT_SUCCESS') {
        clearConversionTimeout(id);
        setConversionStatus('success');
        if (resolvesRef.current.has(id)) {
          resolvesRef.current.get(id)!(result);
          resolvesRef.current.delete(id);
          rejectsRef.current.delete(id);
        }
      } else if (type === 'CONVERT_ERROR') {
        clearConversionTimeout(id);
        setConversionStatus('error');
        if (rejectsRef.current.has(id)) {
          rejectsRef.current.get(id)!(new Error(workerError));
          resolvesRef.current.delete(id);
          rejectsRef.current.delete(id);
        }
      } else if (type === 'CONVERT_PROGRESS') {
        setProgress(result || 50);
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      // Reject any pending conversion promises so callers don't hang until
      // the 120s timeout fires after the component has already unmounted.
      rejectsRef.current.forEach((reject) => {
        reject(new Error('Conversion engine was destroyed.'));
      });
      resolvesRef.current.clear();
      rejectsRef.current.clear();
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current.clear();
      workerRef.current?.terminate();
      workerRef.current = null;
    };
  }, []);

  async function convertPdf(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const pdfjsLib: typeof import('pdfjs-dist') = await importWithRetry(
        () => import('pdfjs-dist'),
      );
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.js',
        import.meta.url,
      ).toString();

      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdfDocument = await loadingTask.promise;

      const totalPages = pdfDocument.numPages;
      const pagesToProcess = Math.min(totalPages, MAX_PDF_PAGES);
      let fullMarkdown = '';

      for (let pageNum = 1; pageNum <= pagesToProcess; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{ str: string; transform: number[] }>;

        if (items.length === 0) continue;

        // Group items into visual lines by y-coordinate.
        const linesMap = new Map<number, typeof items>();
        for (const item of items) {
          const y = Math.round(item.transform[5]);
          const foundKey = Array.from(linesMap.keys()).find((k) => Math.abs(k - y) < 6);
          if (foundKey === undefined) {
            linesMap.set(y, [item]);
          } else {
            linesMap.get(foundKey)!.push(item);
          }
        }

        const sortedBaselines = Array.from(linesMap.keys()).sort((a, b) => b - a);
        let pageMarkdown = '';
        let currentParagraph = '';

        for (const baseline of sortedBaselines) {
          const lineItems = linesMap.get(baseline)!;
          lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

          const lineText = lineItems.map((item) => item.str).join(' ').trim();
          if (!lineText) continue;

          const fontSize = Math.round(lineItems[0].transform[3]);
          const isHeading = fontSize > 14;
          const isSubHeading = fontSize > 12 && fontSize <= 14;

          if (isHeading || isSubHeading) {
            if (currentParagraph) {
              pageMarkdown += currentParagraph.trim() + '\n\n';
              currentParagraph = '';
            }
            pageMarkdown += `${isHeading ? '# ' : '## '}${lineText}\n\n`;
          } else {
            const isList = /^(?:[•\-*]|\d+(?:\.\d+)*\.?|[A-Za-z]\.)\s/.test(lineText);
            const isTOC = lineText.includes('...') || /\.{3,}/.test(lineText);
            if (isList || isTOC) {
              if (currentParagraph) {
                pageMarkdown += currentParagraph.trim() + '\n\n';
                currentParagraph = '';
              }
              pageMarkdown += `${lineText}\n\n`;
            } else {
              currentParagraph += lineText + ' ';
            }
          }
        }

        if (currentParagraph) pageMarkdown += currentParagraph.trim() + '\n\n';
        fullMarkdown += pageMarkdown;
        setProgress(Math.round((pageNum / pagesToProcess) * 100));
        setProgressLabel(`Processing page ${pageNum} of ${pagesToProcess}…`);

        // Yield to the event loop every 10 pages to keep the UI responsive.
        if (pageNum % 10 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      if (totalPages > MAX_PDF_PAGES) {
        fullMarkdown += `\n\n> **Note:** This PDF has ${totalPages} pages. Only the first ${MAX_PDF_PAGES} were processed to prevent the browser from freezing.\n`;
      }

      try { await pdfDocument.cleanup(); } catch { /* ignore */ }
      try { await pdfDocument.destroy(); } catch { /* ignore */ }

      setConversionStatus('success');
      setProgress(100);
      setProgressLabel('');
      return fullMarkdown;
    } catch (e) {
      logger.error('PDF parsing error:', e);
      let errMsg = "Couldn't read this PDF. It may be corrupted or password-protected.";
      if (e instanceof Error) {
        if (e.message.includes('password')) {
          errMsg = 'This PDF is password-protected. Please remove the password and try again.';
        } else if (e.message.includes('Invalid PDF')) {
          errMsg = 'This file is not a valid PDF.';
        }
      }
      setConversionStatus('error');
      setProgressLabel('');
      throw new Error(errMsg);
    }
  }

  async function convertDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const mammothModule: typeof import('mammoth') = await importWithRetry(
        () => import('mammoth'),
      );
      const mammoth = (mammothModule as unknown as { default?: typeof import('mammoth') })
        .default ?? mammothModule;

      setProgress(30);
      setProgressLabel('Extracting content from Word document…');
      const result = await mammoth.convertToHtml({ arrayBuffer });

      setProgress(70);
      setProgressLabel('Converting to Markdown…');
      const markdown = htmlToMarkdown(result.value);

      setProgress(100);
      setProgressLabel('');
      setConversionStatus('success');
      return markdown;
    } catch (e) {
      logger.error('DOCX parsing error:', e);
      let errMsg = "Couldn't read this Word file. It may be corrupted.";
      if (e instanceof Error && e.message.includes('zip')) {
        errMsg = 'This file is not a valid .docx. Make sure it is a Word document, not a .doc.';
      }
      setConversionStatus('error');
      setProgressLabel('');
      throw new Error(errMsg);
    }
  }

  async function convertRtf(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      const raw = new TextDecoder('utf-8').decode(arrayBuffer);
      setProgress(40);

      const bodyStart = raw.indexOf('\\rtf1');
      const body = bodyStart >= 0 ? raw.slice(bodyStart) : raw;

      let text = body;

      text = text.replace(/\\(fonttbl|colortbl|stylesheet|info|header|footer|pict|object|themedata|datastore)\b[^{]*\{[^}]*\}/gi, '');

      text = text.replace(/\\par[d]?\b/gi, '\n\n');
      text = text.replace(/\\line\b/gi, '\n');
      text = text.replace(/\\tab\b/gi, '\t');
      text = text.replace(/\\page\b/gi, '\n\n---\n\n');

      text = text.replace(/\\b\s+([^\\{}]+?)\s*(?:\\b0\b|\})/gi, '**$1**');
      text = text.replace(/\\i\s+([^\\{}]+?)\s*(?:\\i0\b|\})/gi, '*$1*');

      text = text.replace(/\\fs(\d+)\s+([^\\]+?)(?=\\fs\d+|\\par|\{)/g, (_m, sizeStr: string, content: string) => {
        const size = parseInt(sizeStr, 10);
        if (size >= 36) return `\n# ${content}\n\n`;
        if (size >= 28) return `\n## ${content}\n\n`;
        if (size >= 24) return `\n### ${content}\n\n`;
        return content;
      });

      text = text.replace(/\\[a-z]+-?\d*\s?/gi, '');
      text = text.replace(/\\[^a-zA-Z]/g, '');

      text = text.replace(/[{}]/g, '');

      text = text.replace(/\\'([0-9a-f]{2})/gi, (_m, hex: string) => {
        const code = parseInt(hex, 16);
        if (code < 128) return String.fromCharCode(code);
        const win1252: Record<number, string> = {
          0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…',
          0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š',
          0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: '‘', 0x92: '’',
          0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—',
          0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ',
          0x9e: 'ž', 0x9f: 'Ÿ',
        };
        return win1252[code] || String.fromCharCode(code);
      });

      text = text.replace(/\n{3,}/g, '\n\n').trim();

      setProgress(100);
      setProgressLabel('');
      setConversionStatus('success');
      return text;
    } catch (e) {
      logger.error('RTF parsing error:', e);
      setConversionStatus('error');
      setProgressLabel('');
      throw new Error("Couldn't read this RTF file. It may be corrupted or use unsupported features.");
    }
  }

  function convertViaWorker(id: string, arrayBuffer: ArrayBuffer, filename: string): Promise<string> {
    ensureWorker();

    if (!workerRef.current) {
      setConversionStatus('error');
      setProgressLabel('');
      return Promise.reject(
        new Error("Couldn't start the conversion engine. Please reload the page."),
      );
    }

    return new Promise<string>((resolve, reject) => {
      resolvesRef.current.set(id, resolve);
      rejectsRef.current.set(id, reject);

      const timer = setTimeout(() => {
        if (rejectsRef.current.has(id)) {
          rejectsRef.current.get(id)!(
            new Error('Conversion timed out. The engine may be unavailable — check your connection and try again.'),
          );
          resolvesRef.current.delete(id);
          rejectsRef.current.delete(id);
        }
        timeoutsRef.current.delete(id);
      }, WORKER_TIMEOUT_MS);
      timeoutsRef.current.set(id, timer);

      workerRef.current!.postMessage({ id, type: 'CONVERT', file: arrayBuffer, filename });
    });
  }

  const convertFile = useCallback(
    async (file: File): Promise<string> => {
      if (file.size > MAX_IMPORT_BYTES) {
        setConversionStatus('error');
        throw new Error(
          `File is ${formatFileSize(file.size)}. Maximum supported size is ${formatFileSize(MAX_IMPORT_BYTES)}.`,
        );
      }

      if (file.size === 0) {
        setConversionStatus('error');
        throw new Error('This file is empty.');
      }

      setConversionStatus('converting');
      setProgress(10);
      setProgressLabel(`Reading ${file.name}…`);

      const arrayBuffer = await file.arrayBuffer();
      const id = crypto.randomUUID();
      const kind = classifyFile(file.name);

      switch (kind) {
        case 'pdf':
          setProgressLabel('Extracting text from PDF…');
          return convertPdf(arrayBuffer);
        case 'docx':
          setProgressLabel('Converting Word document…');
          return convertDocx(arrayBuffer);
        case 'worker': {
          const ext = getExtension(file.name);
          if (ext === '.rtf') {
            setProgressLabel('Extracting text from RTF…');
            return convertRtf(arrayBuffer);
          }
          setProgressLabel('Starting conversion engine…');
          return convertViaWorker(id, arrayBuffer, file.name);
        }
        case 'text': {
          const text = new TextDecoder('utf-8').decode(arrayBuffer);
          setProgress(100);
          setProgressLabel('');
          setConversionStatus('success');
          return text;
        }
        default:
          setConversionStatus('error');
          throw new Error(
            `Unsupported file type. Supported: Markdown, PDF, Word, PowerPoint, Excel, CSV, HTML, JSON, XML, EPUB, RTF.`,
          );
      }
    },
    [ensureWorker],
  );

  const initializeEngine = useCallback(() => {
    ensureWorker();
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'INIT_ENGINE' });
    }
  }, [ensureWorker]);

  return {
    workerStatus,
    conversionStatus,
    progress,
    progressLabel,
    convertFile,
    initializeEngine,
  };
}
