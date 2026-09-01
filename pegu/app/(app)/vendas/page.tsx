'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Product, Sale, PaymentMethod } from '@/types/database';
import { listSales, createSale, deleteSale } from '@/lib/services/sales';
import type { SaleInput } from '@/lib/services/sales';
import { listProducts } from '@/lib/services/products';
import { SaleFormModal } from '@/components/vendas/sale-form-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatCurrencyBRL, formatDateBR } from '@/lib/utils/finance';

const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito', 'Transferência', 'Outro'];

export default function VendasPage() {
  const { showToast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'todas'>('todas');

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [salesData, productsData] = await Promise.all([listSales(), listProducts()]);
      setSales(salesData);
      setProducts(productsData);
    } catch {
      showToast('Não foi possível carregar as vendas.', 'error');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = sales;
    if (paymentFilter !== 'todas') list = list.filter((s) => s.payment_method === paymentFilter);
    if (search) {
      list = list.filter((s) => s.items?.some((it: any) => it.product?.name?.toLowerCase().includes(search.toLowerCase())));
    }
    return list;
  }, [sales, search, paymentFilter]);

  async function handleSubmit(input: SaleInput) {
    setSaving(true);
    try {
      await createSale(input);
      showToast('Venda registrada com sucesso.');
      setFormOpen(false);
      await load();
      setSaving(false);
    } catch (err) {
      setSaving(false);
      throw err;
    }
  }

  async function handleDelete() {
    if (!deletingSale) return;
    setDeleting(true);
    try {
      await deleteSale(deletingSale.id);
      showToast('Venda excluída e estoque restaurado.');
      setDeletingSale(null);
      await load();
    } catch {
      showToast('Não foi possível excluir a venda.', 'error');
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="font-display text-xl font-semibold text-ink-100">Vendas</h1>
        <button
          onClick={() => setFormOpen(true)}
          disabled={products.length === 0}
          className="btn-primary w-fit disabled:opacity-50"
          title={products.length === 0 ? 'Cadastre um produto primeiro' : undefined}
        >
          + Nova venda
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input className="input-field sm:max-w-xs" placeholder="Buscar por produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input-field sm:max-w-[200px]" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as PaymentMethod | 'todas')}>
          <option value="todas">Todas as formas de pagamento</option>
          {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="h-64 bg-base-800 rounded-card animate-pulse" />
      ) : filtered.length === 0 ? (
        sales.length === 0 ? (
          <EmptyState
            title="Você ainda não possui vendas registradas."
            actionLabel={products.length > 0 ? '+ Nova venda' : undefined}
            onAction={products.length > 0 ? () => setFormOpen(true) : undefined}
          />
        ) : (
          <EmptyState title="Nenhuma venda encontrada com esses filtros." />
        )
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-600/60 text-left text-ink-500">
                  <th className="px-5 py-3 font-normal">Data</th>
                  <th className="px-5 py-3 font-normal">Produto(s)</th>
                  <th className="px-5 py-3 font-normal">Pagamento</th>
                  <th className="px-5 py-3 font-normal text-right">Valor</th>
                  <th className="px-5 py-3 font-normal text-right">Custo</th>
                  <th className="px-5 py-3 font-normal text-right">Lucro</th>
                  <th className="px-5 py-3 font-normal text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s: any) => {
                  const productNames = s.items?.map((it: any) => `${it.product?.name ?? 'Produto'} (${it.quantity}x)`).join(', ');
                  return (
                    <tr key={s.id} className="border-b border-base-600/30 last:border-0 hover:bg-base-700/20">
                      <td className="px-5 py-3.5 text-ink-300 whitespace-nowrap">{formatDateBR(s.date)}</td>
                      <td className="px-5 py-3.5 text-ink-100 max-w-[220px] truncate" title={productNames}>{productNames}</td>
                      <td className="px-5 py-3.5 text-ink-300">{s.payment_method}</td>
                      <td className="num px-5 py-3.5 text-ink-100 font-medium text-right whitespace-nowrap">{formatCurrencyBRL(Number(s.total_amount))}</td>
                      <td className="num px-5 py-3.5 text-ink-500 text-right whitespace-nowrap">{formatCurrencyBRL(Number(s.total_cost))}</td>
                      <td className={`num px-5 py-3.5 font-medium text-right whitespace-nowrap ${Number(s.profit) >= 0 ? 'text-positive-500' : 'text-negative-500'}`}>{formatCurrencyBRL(Number(s.profit))}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end">
                          <button onClick={() => setDeletingSale(s)} className="text-xs text-negative-400 hover:text-negative-300 px-2 py-1 transition-colors">Excluir</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <SaleFormModal open={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} products={products} saving={saving} />

      <ConfirmDialog
        open={!!deletingSale}
        title="Excluir venda"
        description="Ao excluir, o estoque dos produtos vendidos será restaurado automaticamente. Essa ação não pode ser desfeita."
        onConfirm={handleDelete}
        onCancel={() => setDeletingSale(null)}
        loading={deleting}
      />
    </div>
  );
}
