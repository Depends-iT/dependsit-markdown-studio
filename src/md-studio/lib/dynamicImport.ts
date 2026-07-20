import { logger } from './logger';

export async function importWithRetry<T>(importFn: () => Promise<T>, retries = 2, delay = 500): Promise<T> {
  try {
    const result = await importFn();
    // Successful import — reset reload counter
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('import-retry-reloads');
    }
    return result;
  } catch (error) {
    if (retries > 0) {
      logger.warn(`Import failed, retrying in ${delay}ms (${retries} left)`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
      return importWithRetry(importFn, retries - 1, delay);
    }
    logger.error('Import failed after all retries', error);
    // Prevent infinite reload loops: allow max 2 reloads before giving up
    if (typeof window !== 'undefined') {
      const key = 'import-retry-reloads';
      const count = parseInt(sessionStorage.getItem(key) || '0', 10);
      if (count < 2) {
        sessionStorage.setItem(key, String(count + 1));
        window.location.reload();
      }
    }
    throw error;
  }
}
