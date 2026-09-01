'use client';

import { useEffect } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-0 md:p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative w-full ${width} md:my-8 bg-base-800 border border-base-600/60 md:rounded-card shadow-soft min-h-screen md:min-h-0`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-base-600/60 sticky top-0 bg-base-800 md:rounded-t-card">
          <h3 className="text-base font-medium text-ink-100">{title}</h3>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-control hover:bg-base-700/60 text-ink-500"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
