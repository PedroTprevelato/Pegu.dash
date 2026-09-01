'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Product } from '@/types/database';
import { getStockStatus } from '@/types/database';
import { listProducts, createProduct, updateProduct, deleteProduct, registerStockMovement } from '@/lib/services/products';
import type { ProductInput } from '@/lib/services/products';
import { ProductCard } from '@/components/estoque/product-card';
import { ProductFormModal } from '@/components/estoque/product-form-modal';
import { StockMovementModal } from '@/components/estoque/stock-movement-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';

type SortKey = 'recentes' | 'preco' | 'quantidade';
type StockFilter = 'todos' | 'normal' | 'baixo' | 'critico';

export default function EstoquePage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recentes');
  const [stockFilter, setStockFilter] = useState<StockFilter>('todos');

  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida'>('entrada');
  const [movementSaving, setMovementSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await listProducts();
      setProducts(data);
    } catch {
      showToast('Não foi possível carregar os produtos.', 'error');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (stockFilter !== 'todos') list = list.filter((p) => getStockStatus(p) === stockFilter);
    if (sort === 'preco') list = [...list].sort((a, b) => Number(b.sale_price) - Number(a.sale_price));
    if (sort === 'quantidade') list = [...list].sort((a, b) => Number(b.stock_quantity) - Number(a.stock_quantity));
    return list;
  }, [products, search, sort, stockFilter]);

  async function handleSubmitProduct(input: ProductInput) {
    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, input);
        showToast('Produto atualizado com sucesso.');
      } else {
        await createProduct(input);
        showToast('Produto adicionado com sucesso.');
      }
      setFormOpen(false);
      setEditingProduct(null);
      await load();
    } catch {
      showToast('Não foi possível salvar o produto.', 'error');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deletingProduct) return;
    setDeleting(true);
    try {
      await deleteProduct(deletingProduct.id);
      showToast('Produto excluído.');
      setDeletingProduct(null);
      await load();
    } catch {
      showToast('Não foi possível excluir o produto.', 'error');
    }
    setDeleting(false);
  }

  async function handleMovement(quantity: number, reason: string) {
    if (!movementProduct) return;
    setMovementSaving(true);
    try {
      await registerStockMovement({ productId: movementProduct.id, type: movementType, quantity, reason });
      showToast(movementType === 'entrada' ? 'Entrada registrada.' : 'Saída registrada.');
      setMovementProduct(null);
      await load();
      setMovementSaving(false);
    } catch (err) {
      setMovementSaving(false);
      throw err;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="font-display text-xl font-semibold text-ink-100">Estoque</h1>
        <button onClick={() => { setEditingProduct(null); setFormOpen(true); }} className="btn-primary w-fit">
          + Adicionar produto
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          className="input-field sm:max-w-xs"
          placeholder="Buscar produto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input-field sm:max-w-[180px]" value={stockFilter} onChange={(e) => setStockFilter(e.target.value as StockFilter)}>
          <option value="todos">Todos os status</option>
          <option value="normal">Estoque normal</option>
          <option value="baixo">Estoque baixo</option>
          <option value="critico">Estoque crítico</option>
        </select>
        <select className="input-field sm:max-w-[180px]" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="recentes">Mais recentes</option>
          <option value="preco">Maior preço</option>
          <option value="quantidade">Maior quantidade</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => <div key={i} className="h-80 bg-base-800 rounded-card animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        products.length === 0 ? (
          <EmptyState title="Você ainda não possui produtos cadastrados." actionLabel="+ Adicionar produto" onAction={() => setFormOpen(true)} />
        ) : (
          <EmptyState title="Nenhum produto encontrado com esses filtros." />
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={() => { setEditingProduct(p); setFormOpen(true); }}
              onDelete={() => setDeletingProduct(p)}
              onMoveStock={(type) => { setMovementProduct(p); setMovementType(type); }}
            />
          ))}
        </div>
      )}

      <ProductFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingProduct(null); }}
        onSubmit={handleSubmitProduct}
        initialProduct={editingProduct}
        saving={saving}
      />

      <StockMovementModal
        open={!!movementProduct}
        onClose={() => setMovementProduct(null)}
        product={movementProduct}
        type={movementType}
        onSubmit={handleMovement}
        saving={movementSaving}
      />

      <ConfirmDialog
        open={!!deletingProduct}
        title="Excluir produto"
        description={`Tem certeza que deseja excluir "${deletingProduct?.name}"? Essa ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingProduct(null)}
        loading={deleting}
      />
    </div>
  );
}
