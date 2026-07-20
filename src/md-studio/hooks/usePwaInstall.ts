'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Detect standalone mode synchronously on first render so we don't need to
 * call setState inside useEffect (which triggers a cascading render warning).
 * Returns false during SSR; the effect below corrects it after mount if needed.
 */
function getInitialIsInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(getInitialIsInstalled);

  useEffect(() => {
    // Re-check after mount — the lazy initial state may have run before the
    // browser set the display-mode media query (rare, but happens in some PWAs).
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      // Use a microtask to avoid the set-state-in-effect warning; the lazy
      // initial state already handles the common case, this is a safety net.
      Promise.resolve().then(() => {
        setIsInstalled((prev) => (prev ? prev : true));
      });
      return;
    }

    const handler = (e: Event) => {
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const installedHandler = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    // Only mark as installed if the user actually accepted. If they dismissed
    // the prompt, keep the button available so they can try again later.
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  return { canInstall: !!deferredPrompt && !isInstalled, isInstalled, promptInstall };
}
