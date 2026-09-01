'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { FinanceChart, ChartMetric, ChartRange } from '@/components/dashboard/finance-chart';
import type { Expense, Product, Sale } from '@/types/database';
import {
  calculateAvailableBalance,
  calculateProfit,
  calculateProfitMargin,
  formatCurrencyBRL,
  formatDateBR,
  getPeriodRange,
  PeriodKey,
  sumExpenses,
  sumSalesCost,
  sumSalesRevenue,
} from '@/lib/utils/finance';
import { getStockStatus } from '@/types/database';

const PERIOD_LABELS: Record<PeriodKey, string> = {
  hoje: 'Hoje',
  semana: 'Esta semana',
  mes: 'Este mês',
  ano: 'Este ano',
  personalizado: 'Personalizado',
};

export default function DashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [initialBalance, setInitialBalance] = useState(0);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [period, setPeriod] = useState<PeriodKey>('mes');
  const [metric, setMetric] = useState<ChartMetric>('faturamento');
  const [range, setRange] = useState<ChartRange>('30d');

  useEffect(() => {
    async function load() {
      const [{ data: settings }, { data: salesData }, { data: expensesData }, { data: productsData }] = await Promise.all([
        supabase.from('settings').select('initial_balance').single(),
        supabase.from('sales').select('*'),
        supabase.from('expenses').select('*'),
        supabase.from('products').select('*'),
      ]);
      setInitialBalance(Number(settings?.initial_balance ?? 0));
      setSales((salesData as Sale[]) ?? []);
      setExpenses((expensesData as Expense[]) ?? []);
      setProducts((productsData as Product[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const { from, to } = getPeriodRange(period);

  const periodSales = useMemo(
    () => sales.filter((s) => { const d = new Date(s.date); return d >= from && d <= to; }),
    [sales, from, to]
  );
  const periodExpenses = useMemo(
    () => expenses.filter((e) => { const d = new Date(e.date); return d >= from && d <= to; }),
    [expenses, from, to]
  );

  const receivedSales = sales.filter((s) => s.status === 'recebida');
  const availableBalance = calculateAvailableBalance({
    initialBalance,
    receivedSalesTotal: sumSalesRevenue(receivedSales),
    expensesTotal: sumExpenses(expenses),
  });

  const revenue = sumSalesRevenue(periodSales);
  const costOfGoods = sumSalesCost(periodSales);
  const expensesTotal = sumExpenses(periodExpenses);
  const profit = calculateProfit({ revenue, costOfGoodsSold: costOfGoods, expenses: expensesTotal });
  const margin = calculateProfitMargin(profit, revenue);

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const lowStockProducts = products.filter((p) => getStockStatus(p) !== 'normal').slice(0, 5);

  const chartData = useMemo(() => buildChartSeries(sales, expenses, metric, range), [sales, expenses, metric, range]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-100">Olá, seja bem-vindo ao PEGU</h1>
          <p className="text-sm text-ink-500 mt-1">Aqui está sua situação financeira.</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as PeriodKey)}
          className="bg-base-900 border border-base-600 rounded-control px-3 py-2 text-sm text-ink-300 outline-none w-fit"
        >
          {(Object.keys(PERIOD_LABELS) as PeriodKey[]).filter((p) => p !== 'personalizado').map((p) => (
            <option key={p} value={p}>{PERIOD_LABELS[p]}</option>
          ))}
        </select>
      </div>

      <KpiCard
        label="Valor disponível"
        value={formatCurrencyBRL(availableBalance)}
        tone={availableBalance >= 0 ? 'positive' : 'negative'}
        sublabel="Saldo inicial + vendas recebidas − gastos"
        variant="hero"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Faturamento" value={formatCurrencyBRL(revenue)} sublabel={PERIOD_LABELS[period]} />
        <KpiCard
          label="Lucro"
          value={formatCurrencyBRL(profit)}
          tone={profit >= 0 ? 'positive' : 'negative'}
          sublabel={`Margem: ${margin.toFixed(1)}%`}
        />
        <KpiCard label="Vendas realizadas" value={`${periodSales.length}`} sublabel={PERIOD_LABELS[period]} />
      </div>

      <FinanceChart data={chartData} metric={metric} onMetricChange={setMetric} range={range} onRangeChange={setRange} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-ink-100">Gastos recentes</h2>
            <Link href="/gastos" className="text-xs text-accent-400 hover:text-accent-300 transition-colors">Ver todos</Link>
          </div>
          {recentExpenses.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">Nenhum gasto cadastrado ainda.</p>
          ) : (
            <div className="space-y-1">
              {recentExpenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between py-2.5 border-b border-base-600/40 last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm text-ink-100 truncate">{e.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-ink-500">{formatDateBR(e.date)}</span>
                      <span className="tag">{e.category}</span>
                    </div>
                  </div>
                  <p className="num text-sm text-negative-400 font-medium shrink-0 pl-3">{formatCurrencyBRL(Number(e.amount))}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-ink-100">Produtos com estoque baixo</h2>
            <Link href="/estoque" className="text-xs text-accent-400 hover:text-accent-300 transition-colors">Ver estoque</Link>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-ink-500 py-6 text-center">Todos os produtos com estoque normal.</p>
          ) : (
            <div className="space-y-1">
              {lowStockProducts.map((p) => {
                const status = getStockStatus(p);
                return (
                  <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-base-600/40 last:border-0">
                    <p className="text-sm text-ink-100">{p.name}</p>
                    <span className={`text-xs font-medium ${status === 'critico' ? 'text-negative-400' : 'text-warning-400'}`}>
                      {p.stock_quantity} unidades
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildChartSeries(sales: Sale[], expenses: Expense[], metric: ChartMetric, range: ChartRange) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '3m' ? 90 : range === '6m' ? 180 : 365;
  const now = new Date();
  const buckets: { label: string; value: number; date: Date }[] = [];

  const bucketCount = days <= 30 ? days : days <= 180 ? Math.ceil(days / 7) : 12;
  const bucketSizeDays = days <= 30 ? 1 : days <= 180 ? 7 : 30;

  for (let i = bucketCount - 1; i >= 0; i--) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * bucketSizeDays);
    buckets.push({
      label: bucketSizeDays === 1 ? end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      value: 0,
      date: end,
    });
  }

  function addToNearestBucket(date: Date, value: number) {
    let closest = buckets[0];
    let minDiff = Infinity;
    for (const b of buckets) {
      const diff = Math.abs(b.date.getTime() - date.getTime());
      if (diff < minDiff) {
        minDiff = diff;
        closest = b;
      }
    }
    closest.value += value;
  }

  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);

  if (metric === 'faturamento') {
    sales.filter((s) => new Date(s.date) >= cutoff).forEach((s) => addToNearestBucket(new Date(s.date), Number(s.total_amount)));
  } else if (metric === 'gastos') {
    expenses.filter((e) => new Date(e.date) >= cutoff).forEach((e) => addToNearestBucket(new Date(e.date), Number(e.amount)));
  } else {
    sales.filter((s) => new Date(s.date) >= cutoff).forEach((s) => addToNearestBucket(new Date(s.date), Number(s.profit)));
    expenses.filter((e) => new Date(e.date) >= cutoff).forEach((e) => addToNearestBucket(new Date(e.date), -Number(e.amount)));
  }

  return buckets.map(({ label, value }) => ({ label, value: Number(value.toFixed(2)) }));
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-7 w-64 bg-base-800 rounded" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-24 bg-base-800 rounded-card" />)}
      </div>
      <div className="h-64 bg-base-800 rounded-card" />
    </div>
  );
}
