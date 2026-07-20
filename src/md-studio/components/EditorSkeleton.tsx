'use client';

interface EditorSkeletonProps {
  isDarkMode: boolean;
}

export function EditorSkeleton({ isDarkMode }: EditorSkeletonProps) {
  return (
    <div className="flex-1 flex flex-col h-full w-full bg-[var(--color-base)] animate-pulse" data-color-mode={isDarkMode ? 'dark' : 'light'}>
      <div className="h-[39px] bg-[var(--color-surface-1)] border-b border-[var(--color-border)] flex items-center px-4 gap-2 select-none overflow-hidden">
        <div className="w-6 h-6 bg-[var(--color-surface-2)] rounded flex-none" />
        <div className="w-6 h-6 bg-[var(--color-surface-2)] rounded flex-none" />
        <div className="w-6 h-6 bg-[var(--color-surface-2)] rounded flex-none" />
        <div className="border-l border-[var(--color-border)] h-4 mx-1 flex-none" />
        <div className="w-6 h-6 bg-[var(--color-surface-2)] rounded flex-none" />
        <div className="w-6 h-6 bg-[var(--color-surface-2)] rounded flex-none" />
        <div className="w-6 h-6 bg-[var(--color-surface-2)] rounded flex-none" />
        <div className="border-l border-[var(--color-border)] h-4 mx-1 flex-none" />
        <div className="hidden sm:block w-16 h-6 bg-[var(--color-surface-2)] rounded flex-none" />
        <div className="hidden sm:block w-16 h-6 bg-[var(--color-surface-2)] rounded flex-none animate-pulse" />
      </div>
      <div className="flex-1 flex divide-x divide-[var(--color-border)]">
        <div className="flex-1 p-6 space-y-4">
          <div className="h-4 bg-[var(--color-surface-1)] rounded w-3/4" />
          <div className="h-4 bg-[var(--color-surface-1)] rounded w-1/2" />
          <div className="h-4 bg-[var(--color-surface-1)] rounded w-5/6" />
          <div className="h-4 bg-[var(--color-surface-1)] rounded w-2/3" />
        </div>
        <div className="hidden md:block flex-1 p-6 space-y-4 bg-[var(--color-surface-1)]/10">
          <div className="h-6 bg-[var(--color-surface-1)] rounded w-1/3 mb-6" />
          <div className="h-4 bg-[var(--color-surface-1)] rounded w-full" />
          <div className="h-4 bg-[var(--color-surface-1)] rounded w-5/6" />
          <div className="h-4 bg-[var(--color-surface-1)] rounded w-4/5" />
        </div>
      </div>
    </div>
  );
}
