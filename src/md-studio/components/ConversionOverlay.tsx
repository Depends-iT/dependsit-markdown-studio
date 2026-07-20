'use client';

interface ConversionOverlayProps {
  progress: number;
  label?: string;
}

export function ConversionOverlay({ progress, label }: ConversionOverlayProps) {
  const gettingReady = progress < 95;
  return (
    <div
      className="absolute inset-0 z-50 bg-[var(--color-base)]/90 backdrop-blur-sm flex items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <div className="text-center p-8 bg-[var(--color-surface-1)] border border-[var(--color-border)] rounded-xl shadow-2xl max-w-md w-full mx-4">
        <div
          className="w-full bg-[var(--color-surface-2)] rounded-full h-2 mb-4 overflow-hidden relative"
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="bg-[var(--color-signal)] h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <h2 className="text-lg font-heading font-semibold mb-1.5 text-[var(--color-text-main)]">
          {label || (gettingReady ? 'Getting ready…' : 'Converting…')}
        </h2>
        <p className="text-[13px] text-[var(--color-text-medium)] font-body mb-2 leading-relaxed">
          {gettingReady ? 'This takes a moment the first time.' : 'Almost done…'}
        </p>
        <p className="text-[11px] text-[var(--color-text-low)] font-body border-t border-[var(--color-border)]/50 pt-2 mt-2 leading-relaxed flex items-center justify-center gap-1.5">
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Everything stays on your device — nothing is uploaded
        </p>
        <p className="text-[10px] text-[var(--color-text-low)]/80 font-mono mt-3">
          {progress}% Complete
        </p>
      </div>
    </div>
  );
}
