/**
 * Thin logger that only writes in development. Keeps error diagnostics during
 * local development but stays silent in production builds to avoid leaking
 * noise to the browser console. Errors are still surfaced to the user via the
 * in-app error modal rather than console.
 */
const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  error(...args: unknown[]) {
    if (isDev) console.error(...args);
  },
  warn(...args: unknown[]) {
    if (isDev) console.warn(...args);
  },
  log(...args: unknown[]) {
    if (isDev) console.log(...args);
  },
};
