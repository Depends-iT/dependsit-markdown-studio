'use client';

import { useEffect, useRef, memo } from 'react';
import { X, AlertTriangle, Info } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'info';
}

export const ConfirmationModal = memo(function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  variant: explicitVariant,
}: ConfirmationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const variant =
    explicitVariant ??
    (/reset|delete|close|remove/i.test(confirmLabel) ? 'danger' : 'info');

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }

      if (e.key === 'Tab') {
        if (!modalRef.current) return;
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex="0"]'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement =
          focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Focus cancel button to prevent accidental confirms. When there's no
    // cancel button (error modals with only "Dismiss"), focus the confirm
    // button instead so keyboard users aren't stranded on document.body.
    setTimeout(() => {
      if (cancelLabel) {
        cancelButtonRef.current?.focus();
      } else {
        confirmButtonRef.current?.focus();
      }
    }, 50);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel, cancelLabel]);

  if (!isOpen) return null;

  const isDanger = variant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      <div
        ref={modalRef}
        className="relative w-full max-w-[380px] bg-[var(--color-surface-1)] rounded-xl shadow-[0_16px_48px_-8px_rgba(0,0,0,0.2)] overflow-hidden"
        style={{ animation: 'modal-enter 0.15s ease-out' }}
      >
        <button
          onClick={onCancel}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md text-[var(--color-text-low)] hover:text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] transition-colors z-10"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-5">
          <div className="flex items-start gap-3 mb-3">
            <div
              className={`flex-none w-9 h-9 rounded-lg flex items-center justify-center mt-0.5 ${
                isDanger
                  ? 'bg-red-500/10 text-red-500'
                  : 'bg-[var(--color-signal)]/10 text-[var(--color-signal)]'
              }`}
            >
              {isDanger ? (
                <AlertTriangle className="w-[18px] h-[18px]" />
              ) : (
                <Info className="w-[18px] h-[18px]" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h2
                className="text-[15px] font-semibold text-[var(--color-text-main)] font-body leading-snug"
                id="modal-title"
              >
                {title}
              </h2>
            </div>
          </div>

          <p className="text-[13px] text-[var(--color-text-medium)] leading-relaxed pl-12">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 pb-5">
          {cancelLabel && (
            <button
              ref={cancelButtonRef}
              onClick={onCancel}
              className="px-4 py-2.5 sm:px-3.5 sm:py-[7px] min-h-[44px] sm:min-h-0 text-[13px] font-medium text-[var(--color-text-main)] hover:bg-[var(--color-surface-2)] rounded-lg transition-colors"
            >
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className={`px-4 py-2.5 sm:px-3.5 sm:py-[7px] min-h-[44px] sm:min-h-0 text-[13px] font-medium rounded-lg transition-colors ${
              isDanger
                ? 'bg-red-500/12 text-red-600 hover:bg-red-500/20 dark:text-red-400'
                : 'bg-[var(--color-signal)]/12 text-[var(--color-signal)] hover:bg-[var(--color-signal)]/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
});
