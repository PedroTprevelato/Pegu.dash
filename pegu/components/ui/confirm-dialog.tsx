'use client';

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Excluir',
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-base-800 border border-base-600/60 rounded-card shadow-soft p-6">
        <h3 className="text-base font-medium text-ink-100 mb-2">{title}</h3>
        <p className="text-sm text-ink-300 mb-6">{description}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-control bg-negative-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-negative-600 disabled:opacity-50"
          >
            {loading ? 'Excluindo...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
