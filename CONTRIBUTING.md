# Contributing to DependsiT Markdown Studio

Thanks for your interest in contributing! This is a community-driven open-source project.

## Getting Started

```bash
git clone https://github.com/Depends-iT/dependsit-markdown-studio.git
cd dependsit-markdown-studio
npm install
npm run dev
```

The dev server runs on `http://localhost:3000`.

## Development Workflow

1. **Fork** the repo and create a branch: `git checkout -b fix/my-bugfix`
2. **Make changes** — keep code clean and well-typed
3. **Lint**: `npm run lint` — must pass with zero errors
4. **Test manually** — verify your changes work in the browser
5. **Commit** with a clear message: `fix: resolve cursor jump on paste`
6. **Push** and open a Pull Request

## Code Style

- TypeScript throughout, strict mode
- Tailwind CSS 4 for styling — use CSS custom properties (`var(--color-*)`) for theme-aware colors
- No `any` types unless interfacing with untyped third-party libs
- Comments should be concise and explain *why*, not *what*
- Keep components small and focused — extract when a file exceeds ~400 lines

## Project Structure

```
src/app/         — Next.js App Router (layout, page, SEO routes)
src/md-studio/   — The editor application
  components/    — React components
  hooks/         — Custom hooks
  lib/           — Utilities (IndexedDB, exporters, stats, etc.)
public/          — Static assets (icons, manifest, service worker)
docs/            — User guide
```

## Reporting Bugs

Open an [issue](https://github.com/Depends-iT/dependsit-markdown-studio/issues) with:
- Steps to reproduce
- Expected vs actual behavior
- Browser and OS
- Console errors (if any)

## License

By contributing, you agree your contributions are licensed under the MIT License.
