const TEXT_EXTENSIONS = new Set(['.md', '.markdown', '.txt', '.text']);

const SUPPORTED_WORKER_EXTENSIONS = new Set([
  '.pptx', '.xlsx', '.csv', '.html', '.htm',
  '.json', '.xml', '.epub', '.rtf',
]);

export type FileKind = 'pdf' | 'docx' | 'worker' | 'text' | 'unsupported';

// Size limits per format — larger files risk freezing the tab.
export const MAX_IMPORT_BYTES = 50 * 1024 * 1024; // 50 MB general limit
export const MAX_PDF_PAGES = 500; // PDF pages before truncation warning

export function getExtension(filename: string): string {
  const lower = filename.toLowerCase();
  const dot = lower.lastIndexOf('.');
  return dot === -1 ? '' : lower.slice(dot);
}

export function classifyFile(filename: string): FileKind {
  const ext = getExtension(filename);
  if (ext === '.pdf') return 'pdf';
  if (ext === '.docx') return 'docx';
  if (SUPPORTED_WORKER_EXTENSIONS.has(ext)) return 'worker';
  if (TEXT_EXTENSIONS.has(ext)) return 'text';
  return 'unsupported';
}

export function toMarkdownFilename(filename: string): string {
  return /\.(md|markdown)$/i.test(filename) ? filename : filename + '.md';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
