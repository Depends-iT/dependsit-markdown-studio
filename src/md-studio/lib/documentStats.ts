export interface DocumentStats {
  words: number;
  chars: number;
  charsNoSpaces: number;
  lines: number;
  paragraphs: number;
  sentences: number;
  headings: number;
  codeBlocks: number;
  lists: number;
  links: number;
  images: number;
  readingTimeMin: number;
  /** Flesch reading ease score (0–100, higher = easier). */
  readingEase: number;
  /** Estimated grade level (years of education). */
  gradeLevel: number;
  longestParagraphWords: number;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!word) return 0;
  if (word.length <= 3) return 1;
  // Count vowel groups as a rough syllable estimate.
  const groups = word.match(/[aeiouy]+/g);
  let count = groups ? groups.length : 1;
  // Subtract silent trailing 'e'.
  if (word.endsWith('e') && count > 1) count--;
  return Math.max(1, count);
}

/**
 * Compute a full statistics breakdown from Markdown source. Strips code fences
 * and inline code before prose analysis so syntax doesn't skew readability.
 */
export function computeDocumentStats(markdown: string): DocumentStats {
  const text = markdown || '';

  // Strip fenced code blocks for prose analysis, but count them separately.
  const codeBlocks = (text.match(/```[\s\S]*?```/g) || []).length;
  const withoutCode = text.replace(/```[\s\S]*?```/g, '');
  const withoutInlineCode = withoutCode.replace(/`[^`]*`/g, ' ');

  const words = withoutInlineCode
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const wordCount = words.length;

  const chars = text.length;
  const charsNoSpaces = text.replace(/\s/g, '').length;
  const lines = text ? text.split('\n').length : 0;

  // Paragraphs: non-empty blocks separated by blank lines (ignoring headings/lists).
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p && !/^#{1,6}\s/.test(p) && !/^\s*[-*+]\s/.test(p))
    .length;

  // Sentences: split on terminal punctuation followed by space/uppercase.
  const sentences = (withoutInlineCode.match(/[^.!?]+[.!?]+/g) || []).length;

  const headings = (text.match(/^#{1,6}\s+/gm) || []).length;
  const lists = (text.match(/^\s*(?:[-*+]|\d+\.)\s/gm) || []).length;
  const images = (text.match(/!\[([^\]]*)\]\([^)]+\)/g) || []).length;
  const withoutImages = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  const links = (withoutImages.match(/\[([^\]]+)\]\([^)]+\)/g) || []).length;

  const syllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const readingEase =
    sentences > 0 && wordCount > 0
      ? Math.max(0, Math.min(100, 206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount)))
      : 0;
  const gradeLevel =
    sentences > 0 && wordCount > 0
      ? Math.max(0, 0.39 * (wordCount / sentences) + 11.8 * (syllables / wordCount) - 15.59)
      : 0;

  let longestParagraphWords = 0;
  for (const para of text.split(/\n\s*\n/)) {
    const p = para.trim();
    if (!p || /^#{1,6}\s/.test(p) || /^\s*[-*+]\s/.test(p)) continue;
    const n = p.trim().split(/\s+/).filter(Boolean).length;
    if (n > longestParagraphWords) longestParagraphWords = n;
  }

  return {
    words: wordCount,
    chars,
    charsNoSpaces,
    lines,
    paragraphs,
    sentences,
    headings,
    codeBlocks,
    lists,
    links,
    images,
    readingTimeMin: Math.max(1, Math.round(wordCount / 200)),
    readingEase: Math.round(readingEase),
    gradeLevel: Math.round(gradeLevel * 10) / 10,
    longestParagraphWords,
  };
}

export function readingEaseLabel(score: number): string {
  if (score >= 90) return 'Very easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly difficult';
  if (score >= 30) return 'Difficult';
  return 'Very difficult';
}
