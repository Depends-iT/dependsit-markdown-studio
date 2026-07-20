# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue. Instead, email contact@dependsit.com or open a private security advisory on [GitHub](https://github.com/Depends-iT/dependsit-markdown-studio/security/advisories/new).

We will acknowledge receipt within 48 hours and provide a fix timeline.

## Security Model

DependsiT Markdown Studio is a **100% client-side application**. All file processing (import, conversion, editing, export) happens in your browser. No data is ever transmitted to a server.

### What's Processed Locally

- File imports (PDF, DOCX, PPTX, etc.) — converted via WebAssembly (Pyodide) or client-side JS libraries
- Document content — stored in IndexedDB and localStorage
- Exports — generated in-browser and downloaded directly

### What We Don't Do

- No analytics or tracking
- No cookies
- No server-side data storage
- No third-party API calls (except CDN-hosted libraries: Pyodide, KaTeX CSS)

### Sanitization

- All rendered Markdown passes through `rehype-sanitize` to strip dangerous HTML
- Mermaid diagrams use `securityLevel: 'strict'`
- SVG output from Mermaid is sanitized (scripts and event handlers stripped)
