/// <reference lib="webworker" />

const ctx: Worker = self as unknown as Worker;

declare const loadPyodide: any;

let pyodide: any = null;
let initPromise: Promise<void> | null = null;

const initPyodide = async (id?: string) => {
  try {
    ctx.postMessage({ id, type: 'CONVERT_PROGRESS', result: 15 });
    (self as any).importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js');

    ctx.postMessage({ id, type: 'CONVERT_PROGRESS', result: 30 });
    pyodide = await loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/',
    });

    ctx.postMessage({ id, type: 'CONVERT_PROGRESS', result: 45 });
    await pyodide.loadPackage(['micropip']);

    ctx.postMessage({ id, type: 'CONVERT_PROGRESS', result: 60 });
    const micropip = pyodide.pyimport('micropip');
    await micropip.install([
      'beautifulsoup4',
      'openpyxl',
      'pandas',
      'python-pptx',
      'python-docx',
      'pathvalidate',
      'requests',
      'charset-normalizer',
      'colorama',
      'lxml',
      'markdownify',
      'defusedxml'
    ]);

    ctx.postMessage({ id, type: 'CONVERT_PROGRESS', result: 85 });

    // Mock native-only deps and install markitdown without pulling them in
    await pyodide.runPythonAsync(`
import sys
from unittest.mock import MagicMock
sys.modules['pypdfium2'] = MagicMock()
sys.modules['onnxruntime'] = MagicMock()
sys.modules['magika'] = MagicMock()
sys.modules['pdfplumber'] = MagicMock()
sys.modules['speech_recognition'] = MagicMock()
sys.modules['pydub'] = MagicMock()
sys.modules['youtube_transcript_api'] = MagicMock()

import micropip
await micropip.install('markitdown', deps=False)
    `);

    ctx.postMessage({ id, type: 'CONVERT_PROGRESS', result: 95 });
    ctx.postMessage({ id, type: 'ENGINE_INITIALIZED' });
  } catch (error) {
    console.error('Pyodide init error:', error);
    ctx.postMessage({ id, type: 'ERROR', error: (error as Error).message });
    initPromise = null;
    throw error;
  }
};

ctx.postMessage({ type: 'READY' });

ctx.onmessage = async (event) => {
  const { id, type, file, filename } = event.data;

  if (type === 'INIT_ENGINE') {
    if (!initPromise) {
      initPromise = initPyodide();
    }
  } else if (type === 'CONVERT') {
    let safeName = '';
    try {
      if (!initPromise) {
        initPromise = initPyodide(id);
      }

      await initPromise;

      if (!pyodide) {
        throw new Error('Pyodide was not initialized properly');
      }

      const uint8Array = new Uint8Array(file);
      // Sanitize the filename before writing to the Pyodide FS. A user-provided
      // filename containing `/` or `..` could write outside the intended CWD.
      safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      pyodide.FS.writeFile(safeName, uint8Array);

      // Pass filename as a Pyodide global to prevent code injection via crafted filenames
      pyodide.globals.set('__convert_filename__', safeName);

      const pythonScript = `
from markitdown import MarkItDown

def convert_file(fname):
    md = MarkItDown()
    result = md.convert(fname)
    return result.text_content

convert_file(__convert_filename__)
      `;

      const markdown = await pyodide.runPythonAsync(pythonScript);
      ctx.postMessage({ id, type: 'CONVERT_SUCCESS', result: markdown });
    } catch (error) {
      console.error('Conversion error:', error);
      ctx.postMessage({ id, type: 'CONVERT_ERROR', error: (error as Error).message });
    } finally {
      try { pyodide?.globals.delete('__convert_filename__'); } catch {}
      if (safeName) {
        try { pyodide?.FS.unlink(safeName); } catch {}
      }
    }
  }
};
