'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Expense, ExpenseCategory } from '@/types/database';
import { listExpenses, createExpense, updateExpense, deleteExpense } from '@/lib/services/expenses';
import type { ExpenseInput } from '@/lib/services/expenses';
import { ExpenseFormModal } from '@/components/gastos/expense-form-modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatCurrencyBRL, formatDateBR } from '@/lib/utils/finance';

const CATEGORIES: ExpenseCategory[] = ['Materiais', 'Embalagens', 'Transporte', 'Marketing', 'Funcionários', 'Equipamentos', 'Fornecedores', 'Impostos', 'Outros'];
type SortKey = 'data_desc' | 'data_asc' | 'valor_desc' | 'valor_asc';

export default function GastosPage() {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | 'todas'>('todas');
  const [sort, setSort] = useState<SortKey>('data_desc');

  const [formOpen, setFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setExpenses(await listExpenses());
    } catch {
      showToast('Não foi possível carregar os gastos.', 'error');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = expenses.filter((e) => e.description.toLowerCase().includes(search.toLowerCase()));
    if (category !== 'todas') list = list.filter((e) => e.category === category);
    list = [...list].sort((a, b) => {
      if (sort === 'data_desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sort === 'data_asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sort === 'valor_desc') return Number(b.amount) - Number(a.amount);
      return Number(a.amount) - Number(b.amount);
    });
    return list;
  }, [expenses, search, category, sort]);

  const totalFiltered = filtered.reduce((acc, e) => acc + Number(e.amount), 0);

  async function handleSubmit(input: ExpenseInput) {
    setSaving(true);
    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, input);
        showToast('Gasto atualizado com sucesso.');
      } else {
        await createExpense(input);
        showToast('Gasto adicionado com sucesso.');
      }
      setFormOpen(false);
      setEditingExpense(null);
      await load();
    } catch {
      showToast('Não foi possível salvar o gasto.', 'error');
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deletingExpense) return;
    setDeleting(true);
    try {
      await deleteExpense(deletingExpense.id);
      showToast('Gasto excluído.');
      setDeletingExpense(null);
      await load();
    } catch {
      showToast('Não foi possível excluir o gasto.', 'error');
    }
    setDeleting(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="font-display text-xl font-semibold text-ink-100">Gastos</h1>
        <button onClick={() => { setEditingExpense(null); setFormOpen(true); }} className="btn-primary w-fit">
          + Adicionar gasto
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input className="input-field sm:max-w-xs" placeholder="Buscar gasto..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input-field sm:max-w-[180px]" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory | 'todas')}>
          <option value="todas">Todas as categorias</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="input-field sm:max-w-[180px]" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
          <option value="data_desc">Data (mais recente)</option>
          <option value="data_asc">Data (mais antiga)</option>
          <option value="valor_desc">Valor (maior)</option>
          <option value="valor_asc">Valor (menor)</option>
        </select>
      </div>

      {loading ? (
        <div className="h-64 bg-base-800 rounded-card animate-pulse" />
      ) : filtered.length === 0 ? (
        expenses.length === 0 ? (
          <EmptyState title="Você ainda não possui gastos cadastrados." actionLabel="+ Adicionar gasto" onAction={() => setFormOpen(true)} />
        ) : (
          <EmptyState title="Nenhum gasto encontrado com esses filtros." />
        )
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-base-600/60 text-left text-ink-500">
                  <th className="px-5 py-3 font-normal">Data</th>
                  <th className="px-5 py-3 font-normal">Descrição</th>
                  <th className="px-5 py-3 font-normal">Categoria</th>
                  <th className="px-5 py-3 font-normal">Pagamento</th>
                  <th className="px-5 py-3 font-normal text-right">Valor</th>
                  <th className="px-5 py-3 font-normal text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-base-600/30 last:border-0 hover:bg-base-700/20">
                    <td className="px-5 py-3.5 text-ink-300 whitespace-nowrap">{formatDateBR(e.date)}</td>
                    <td className="px-5 py-3.5 text-ink-100">{e.description}</td>
                    <td className="px-5 py-3.5 text-ink-300">{e.category}</td>
                    <td className="px-5 py-3.5 text-ink-300">{e.payment_method}</td>
                    <td className="num px-5 py-3.5 text-negative-400 font-medium text-right whitespace-nowrap">{formatCurrencyBRL(Number(e.amount))}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditingExpense(e); setFormOpen(true); }} className="text-xs text-ink-500 hover:text-ink-100 px-2 py-1 transition-colors">Editar</button>
                        <button onClick={() => setDeletingExpense(e)} className="text-xs text-negative-400 hover:text-negative-300 px-2 py-1 transition-colors">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3.5 border-t border-base-600/60 flex justify-between text-sm">
            <span className="text-ink-500">{filtered.length} {filtered.length === 1 ? 'gasto' : 'gastos'}</span>
            <span className="num text-ink-100 font-medium">Total: {formatCurrencyBRL(totalFiltered)}</span>
          </div>
        </div>
      )}

      <ExpenseFormModal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingExpense(null); }}
        onSubmit={handleSubmit}
        initialExpense={editingExpense}
        saving={saving}
      />

      <ConfirmDialog
        open={!!deletingExpense}
        title="Excluir gasto"
        description={`Tem certeza que deseja excluir "${deletingExpense?.description}"? Essa ação não pode ser desfeita.`}
        onConfirm={handleDelete}
        onCancel={() => setDeletingExpense(null)}
        loading={deleting}
      />
    </div>
  );
}
