import type { Expense, Sale } from '@/types/database';

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value ?? 0);
}

export function formatDateBR(dateStr: string): string {
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('pt-BR');
}

/**
 * Valor disponível = Saldo inicial + vendas recebidas - gastos
 */
export function calculateAvailableBalance(params: {
  initialBalance: number;
  receivedSalesTotal: number;
  expensesTotal: number;
}): number {
  return params.initialBalance + params.receivedSalesTotal - params.expensesTotal;
}

/**
 * Lucro = Faturamento - Custo dos produtos vendidos - Gastos
 */
export function calculateProfit(params: {
  revenue: number;
  costOfGoodsSold: number;
  expenses: number;
}): number {
  return params.revenue - params.costOfGoodsSold - params.expenses;
}

export function calculateProfitMargin(profit: number, revenue: number): number {
  if (!revenue) return 0;
  return (profit / revenue) * 100;
}

export function sumExpenses(expenses: Pick<Expense, 'amount'>[]): number {
  return expenses.reduce((acc, e) => acc + Number(e.amount), 0);
}

export function sumSalesRevenue(sales: Pick<Sale, 'total_amount'>[]): number {
  return sales.reduce((acc, s) => acc + Number(s.total_amount), 0);
}

export function sumSalesCost(sales: Pick<Sale, 'total_cost'>[]): number {
  return sales.reduce((acc, s) => acc + Number(s.total_cost), 0);
}

export type PeriodKey = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';

export function getPeriodRange(period: PeriodKey, custom?: { from: string; to: string }) {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  switch (period) {
    case 'hoje': {
      const from = startOfDay(now);
      return { from, to: now };
    }
    case 'semana': {
      const day = now.getDay();
      const from = startOfDay(new Date(now));
      from.setDate(from.getDate() - day);
      return { from, to: now };
    }
    case 'mes': {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now };
    }
    case 'ano': {
      const from = new Date(now.getFullYear(), 0, 1);
      return { from, to: now };
    }
    case 'personalizado': {
      if (!custom) return { from: startOfDay(now), to: now };
      return { from: new Date(custom.from), to: new Date(custom.to) };
    }
  }
}

/**
 * Custo total do material = quantidade * custo médio
 */
export function calculateMaterialTotalCost(quantity: number, averageCost: number): number {
  return Number((quantity * averageCost).toFixed(2));
}

/**
 * Custo total do produto = custo médio do produto + soma dos custos dos materiais
 */
export function calculateProductTotalCost(averageCost: number, materialsTotal: number): number {
  return Number((averageCost + materialsTotal).toFixed(2));
}
