import GithubSlugger from 'github-slugger';

export interface Heading {
  level: number;
  text: string;
  slug: string;
}

const MAX_HEADING_LEVEL = 6;

export function slugify(text: string): string {
  return new GithubSlugger().slug(text);
}

export function extractHeadings(markdown: string): Heading[] {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, '');
  const lines = withoutCode.split('\n');
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();

  for (const line of lines) {
    const match = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const level = match[1].length;
    if (level > MAX_HEADING_LEVEL) continue;

    const raw = match[2];
    const text = raw
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .trim();

    headings.push({ level, text, slug: slugger.slug(text) });
  }

  return headings;
}

/** Estimate reading time at ~200 words per minute (adult silent reading avg). */
export function estimateReadingTime(words: number): string {
  if (words === 0) return '0 min';
  const minutes = Math.max(1, Math.round(words / 200));
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

/**
 * Generate a Markdown table of contents from the document's headings.
 *
 * Produces a nested bullet list where each entry links to its heading's slug.
 * The minimum heading level becomes the top level (so a doc starting with H2s
 * doesn't get an over-indented TOC). Skips the first heading if it's an H1 —
 * that's usually the document title and shouldn't appear in its own TOC.
 */
export function generateTableOfContents(markdown: string): string {
  const headings = extractHeadings(markdown);
  if (headings.length === 0) return '';

  // Normalize indentation by minimum heading level.
  const minLevel = Math.min(...headings.map((h) => h.level));
  // Skip a leading H1 (document title) from the TOC.
  const filtered = headings.filter((h, i) => !(i === 0 && h.level === 1));

  const lines: string[] = ['## Table of Contents', ''];
  for (const h of filtered) {
    const indent = '  '.repeat(h.level - minLevel);
    lines.push(`${indent}- [${h.text}](#${h.slug})`);
  }
  lines.push('', '---', '');
  return lines.join('\n');
}

