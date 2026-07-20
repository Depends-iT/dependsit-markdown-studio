'use client';

import { Upload } from 'lucide-react';

interface DropOverlayProps {
  visible: boolean;
}

export function DropOverlay({ visible }: DropOverlayProps) {
  if (!visible) return null;
  return (
    <div className="absolute inset-0 z-50 bg-[var(--color-base)]/90 backdrop-blur-sm flex items-center justify-center pointer-events-none">
      <div className="text-center p-8 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-md w-full mx-4">
        <Upload className="w-16 h-16 text-[var(--color-signal)] mx-auto mb-4 animate-bounce" />
        <h2 className="text-2xl font-heading font-bold mb-2 text-[var(--color-text-main)]">
          Drop your file here
        </h2>
        <p className="text-[var(--color-text-medium)] font-body">
          We&apos;ll convert it to Markdown for you.
        </p>
      </div>
    </div>
  );
}
