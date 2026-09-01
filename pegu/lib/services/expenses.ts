import { createClient } from '@/lib/supabase/client';
import type { Expense, ExpenseCategory, PaymentMethod } from '@/types/database';

export interface ExpenseInput {
  date: string;
  description: string;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  amount: number;
  notes: string;
}

export async function listExpenses(): Promise<Expense[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data as Expense[];
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      date: input.date,
      description: input.description,
      category: input.category,
      payment_method: input.payment_method,
      amount: input.amount,
      notes: input.notes || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<Expense> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('expenses')
    .update({
      date: input.date,
      description: input.description,
      category: input.category,
      payment_method: input.payment_method,
      amount: input.amount,
      notes: input.notes || null,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Expense;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  if (error) throw error;
}
