'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import type { Product, PaymentMethod, SaleStatus } from '@/types/database';
import type { SaleInput, SaleItemInput } from '@/lib/services/sales';
import { formatCurrencyBRL } from '@/lib/utils/finance';

const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito', 'Transferência', 'Outro'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface DraftItem extends SaleItemInput {
  key: string;
}

export function SaleFormModal({
  open,
  onClose,
  onSubmit,
  products,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: SaleInput) => Promise<void>;
  products: Product[];
  saving: boolean;
}) {
  const [date, setDate] = useState(todayISO());
  const [items, setItems] = useState<DraftItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [status, setStatus] = useState<SaleStatus>('recebida');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(todayISO());
      setItems([]);
      setDiscount('0');
      setPaymentMethod('PIX');
      setStatus('recebida');
      setNotes('');
      setError(null);
    }
  }, [open]);

  function addItem() {
    const firstAvailable = products.find((p) => Number(p.stock_quantity) > 0);
    if (!firstAvailable) { setError('Nenhum produto com estoque disponível.'); return; }
    setItems((prev) => [...prev, { key: crypto.randomUUID(), product_id: firstAvailable.id, quantity: 1, unit_price: Number(firstAvailable.sale_price) }]);
  }

  function updateItem(key: string, patch: Partial<SaleItemInput>) {
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((it) => it.key !== key));
  }

  function handleProductChange(key: string, productId: string) {
    const product = products.find((p) => p.id === productId);
    updateItem(key, { product_id: productId, unit_price: product ? Number(product.sale_price) : 0 });
  }

  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0);
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (items.length === 0) { setError('Adicione ao menos um produto.'); return; }
    for (const it of items) {
      const product = products.find((p) => p.id === it.product_id);
      if (!product) continue;
      if (it.quantity <= 0) { setError('Quantidade deve ser maior que zero.'); return; }
      if (it.quantity > Number(product.stock_quantity)) {
        setError(`Estoque insuficiente para "${product.name}" (disponível: ${product.stock_quantity}).`);
        return;
      }
    }

    try {
      await onSubmit({
        date,
        items: items.map(({ key, ...rest }) => rest),
        discount: Number(discount) || 0,
        payment_method: paymentMethod,
        status,
        notes: notes.trim(),
      });
    } catch (err: any) {
      setError(err.message ?? 'Não foi possível registrar a venda.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nova venda" width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="sdate">Data</label>
            <input id="sdate" type="date" required className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="sstatus">Status</label>
            <select id="sstatus" className="input-field" value={status} onChange={(e) => setStatus(e.target.value as SaleStatus)}>
              <option value="recebida">Recebida</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">Produtos</label>
            <button type="button" onClick={addItem} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">+ Adicionar produto</button>
          </div>

          {items.length === 0 ? (
            <p className="text-xs text-ink-500 border border-dashed border-base-600 rounded-control py-4 text-center">Nenhum produto adicionado.</p>
          ) : (
            <div className="space-y-3">
              {items.map((it) => {
                const product = products.find((p) => p.id === it.product_id);
                return (
                  <div key={it.key} className="grid grid-cols-12 gap-2 items-end bg-base-900 border border-base-600/60 rounded-control p-3">
                    <div className="col-span-5">
                      <label className="text-xs text-ink-500 mb-1 block">Produto</label>
                      <select className="input-field !py-2 text-sm" value={it.product_id} onChange={(e) => handleProductChange(it.key, e.target.value)}>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({p.stock_quantity} un.)</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-ink-500 mb-1 block">Qtd.</label>
                      <input type="number" min="1" step="1" max={product?.stock_quantity} className="input-field !py-2 text-sm" value={it.quantity} onChange={(e) => updateItem(it.key, { quantity: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-ink-500 mb-1 block">Preço unit.</label>
                      <input type="number" min="0" step="0.01" className="input-field !py-2 text-sm" value={it.unit_price} onChange={(e) => updateItem(it.key, { unit_price: Number(e.target.value) })} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-ink-500 mb-1 block">Total</label>
                      <p className="text-sm text-ink-100 py-2">{formatCurrencyBRL(it.quantity * it.unit_price)}</p>
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button type="button" onClick={() => removeItem(it.key)} aria-label="Remover" className="w-8 h-8 flex items-center justify-center rounded-control text-negative-400 hover:bg-negative-500/10">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="sdiscount">Desconto (R$)</label>
            <input id="sdiscount" type="number" min="0" step="0.01" className="input-field" value={discount} onChange={(e) => setDiscount(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="spay">Forma de pagamento</label>
            <select id="spay" className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="snotes">Observação (opcional)</label>
          <textarea id="snotes" rows={2} className="input-field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="bg-base-900 border border-base-600/60 rounded-control px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Subtotal</span>
            <span className="text-ink-300">{formatCurrencyBRL(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-500">Desconto</span>
            <span className="text-ink-300">− {formatCurrencyBRL(Number(discount) || 0)}</span>
          </div>
          <div className="flex justify-between text-sm pt-1.5 border-t border-base-600/60">
            <span className="text-ink-100 font-medium">Total da venda</span>
            <span className="text-ink-100 font-semibold">{formatCurrencyBRL(total)}</span>
          </div>
        </div>

        {error && <p className="text-sm text-negative-400 bg-negative-500/10 border border-negative-500/20 rounded-control px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Registrar venda'}</button>
        </div>
      </form>
    </Modal>
  );
}
