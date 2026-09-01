'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import type { ExpenseInput } from '@/lib/services/expenses';
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types/database';

const CATEGORIES: ExpenseCategory[] = ['Materiais', 'Embalagens', 'Transporte', 'Marketing', 'Funcionários', 'Equipamentos', 'Fornecedores', 'Impostos', 'Outros'];
const PAYMENT_METHODS: PaymentMethod[] = ['Dinheiro', 'PIX', 'Cartão de débito', 'Cartão de crédito', 'Transferência', 'Outro'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseFormModal({
  open,
  onClose,
  onSubmit,
  initialExpense,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ExpenseInput) => Promise<void>;
  initialExpense?: Expense | null;
  saving: boolean;
}) {
  const [date, setDate] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Materiais');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PIX');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDate(initialExpense?.date ?? todayISO());
      setDescription(initialExpense?.description ?? '');
      setCategory(initialExpense?.category ?? 'Materiais');
      setPaymentMethod(initialExpense?.payment_method ?? 'PIX');
      setAmount(initialExpense ? String(initialExpense.amount) : '');
      setNotes(initialExpense?.notes ?? '');
      setError(null);
    }
  }, [open, initialExpense]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!description.trim()) { setError('Informe a descrição do gasto.'); return; }
    if (!amount || Number(amount) <= 0) { setError('Informe um valor válido.'); return; }

    await onSubmit({ date, description: description.trim(), category, payment_method: paymentMethod, amount: Number(amount), notes: notes.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title={initialExpense ? 'Editar gasto' : 'Adicionar gasto'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="edate">Data</label>
            <input id="edate" type="date" required className="input-field" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="eamount">Valor (R$)</label>
            <input id="eamount" type="number" step="0.01" min="0.01" className="input-field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="edesc">Descrição</label>
          <input id="edesc" className="input-field" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Compra de embalagens" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="ecat">Categoria</label>
            <select id="ecat" className="input-field" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="epay">Forma de pagamento</label>
            <select id="epay" className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="enotes">Observação (opcional)</label>
          <textarea id="enotes" rows={2} className="input-field resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        {error && <p className="text-sm text-negative-400 bg-negative-500/10 border border-negative-500/20 rounded-control px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Salvando...' : 'Salvar gasto'}</button>
        </div>
      </form>
    </Modal>
  );
}
