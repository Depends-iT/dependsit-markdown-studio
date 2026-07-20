'use client';

import { memo, useMemo } from 'react';
import MDEditor from '@uiw/react-md-editor';
import type { Components } from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import deepmerge from 'deepmerge';
import 'katex/dist/katex.css';
import { MermaidCodeBlock } from './MermaidCodeBlock';

interface MarkdownEditorWrapperProps {
  value: string;
  onChange: (value: string) => void;
  isDarkMode: boolean;
}

// Allow className + KaTeX math attributes through the sanitizer.
const sanitizeSchema = deepmerge(defaultSchema, {
  attributes: {
    '*': ['className'],
    div: ['className', 'math'],
    span: ['className', 'math'],
  },
});

const remarkPlugins = [remarkMath, remarkGfm];

// Sanitize → slug (heading ids) → katex (math rendering).
const rehypePlugins: Array<[typeof rehypeSanitize, typeof sanitizeSchema] | typeof rehypeKatex | typeof rehypeSlug> = [
  [rehypeSanitize, sanitizeSchema],
  rehypeSlug,
  rehypeKatex,
];

function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return extractText(
      (children as { props?: { children?: React.ReactNode } }).props?.children,
    );
  }
  return String(children ?? '');
}

function MarkdownEditorWrapper({ value, onChange, isDarkMode }: MarkdownEditorWrapperProps) {
  const components = useMemo<Components>(
    () => ({
      input: (props) => {
        if (props.type === 'checkbox') {
          return <input {...props} aria-label="Task list checkbox" />;
        }
        return <input {...props} />;
      },
      a: ({ children, ...props }) => {
        // Drop empty href to avoid React's "empty string" warning.
        const cleanHref = props.href || undefined;
        const cleanProps = { ...props, href: cleanHref };
        if (!children || (Array.isArray(children) && children.length === 0)) {
          const label = cleanHref
            ? `Link to ${cleanHref.replace(/^#/, '')}`
            : 'Section link';
          return <a {...cleanProps} aria-label={label}>{children}</a>;
        }
        return <a {...cleanProps}>{children}</a>;
      },
      img: ({ src, alt, ...props }) => {
        // Skip rendering <img> with empty src — React warns on `src=""`.
        if (!src) return null;
        return <img src={src} alt={alt || ''} {...props} />;
      },
      code: ({ className, children, ...props }) => {
        const match = /language-(\w+)/.exec(className || '');
        const code = extractText(children).replace(/\n$/, '');
        // Only block code fences carry a language class. A mermaid fence is
        // swapped out for the rendered diagram; everything else falls through
        // to a normal <code> element.
        if (match && match[1] === 'mermaid') {
          return <MermaidCodeBlock code={code} isDarkMode={isDarkMode} />;
        }
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      },
    }),
    [isDarkMode],
  );

  const previewOptions = useMemo(
    () => ({ remarkPlugins, rehypePlugins, components }),
    [components],
  );

  return (
    <MDEditor
      value={value}
      onChange={(val) => onChange(val ?? '')}
      height="100%"
      className="!border-none !rounded-none !bg-transparent flex-1 h-full editor-container w-full"
      textareaProps={{
        placeholder: 'Start writing, or drop a file to convert…',
        style: {
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        },
      }}
      previewOptions={previewOptions}
    />
  );
}

// Memoized: prevents caret jumps when unrelated parent state changes.
export default memo(MarkdownEditorWrapper);
