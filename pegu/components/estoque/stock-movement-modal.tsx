'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import type { Product } from '@/types/database';

export function StockMovementModal({
  open,
  onClose,
  product,
  type,
  onSubmit,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  type: 'entrada' | 'saida';
  onSubmit: (quantity: number, reason: string) => Promise<void>;
  saving: boolean;
}) {
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (!qty || qty <= 0) { setError('Informe uma quantidade válida.'); return; }
    if (type === 'saida' && qty > Number(product!.stock_quantity)) {
      setError(`Estoque disponível: ${product!.stock_quantity} unidades.`);
      return;
    }
    try {
      await onSubmit(qty, reason);
      setQuantity('');
      setReason('');
    } catch (err: any) {
      setError(err.message ?? 'Não foi possível registrar a movimentação.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={type === 'entrada' ? 'Registrar entrada de estoque' : 'Registrar saída de estoque'} width="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink-300">{product.name} · estoque atual: <span className="text-ink-100">{product.stock_quantity} un.</span></p>
        <div>
          <label className="label" htmlFor="qty">Quantidade</label>
          <input id="qty" type="number" min="1" step="1" className="input-field" value={quantity} onChange={(e) => setQuantity(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label" htmlFor="reason">Motivo (opcional)</label>
          <input id="reason" className="input-field" value={reason} onChange={(e) => setReason(e.target.value)} placeholder={type === 'entrada' ? 'Ex: Reposição de fornecedor' : 'Ex: Perda, ajuste'} />
        </div>
        {error && <p className="text-sm text-negative-400 bg-negative-500/10 border border-negative-500/20 rounded-control px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Confirmar'}</button>
        </div>
      </form>
    </Modal>
  );
}
