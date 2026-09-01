'use client';

import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import clsx from 'clsx';
import { formatCurrencyBRL } from '@/lib/utils/finance';

export type ChartMetric = 'faturamento' | 'lucro' | 'gastos';
export type ChartRange = '7d' | '30d' | '3m' | '6m' | '12m';

const METRIC_LABELS: Record<ChartMetric, string> = {
  faturamento: 'Faturamento',
  lucro: 'Lucro',
  gastos: 'Gastos',
};

const METRIC_COLORS: Record<ChartMetric, string> = {
  faturamento: '#3D8BD1',
  lucro: '#22C55E',
  gastos: '#EF4444',
};

const RANGE_LABELS: Record<ChartRange, string> = {
  '7d': '7 dias',
  '30d': '30 dias',
  '3m': '3 meses',
  '6m': '6 meses',
  '12m': '12 meses',
};

export function FinanceChart({
  data,
  metric,
  onMetricChange,
  range,
  onRangeChange,
}: {
  data: { label: string; value: number }[];
  metric: ChartMetric;
  onMetricChange: (m: ChartMetric) => void;
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
}) {
  const color = METRIC_COLORS[metric];

  return (
    <div className="card p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-1 bg-base-900 border border-base-600/60 rounded-control p-1 w-fit">
          {(Object.keys(METRIC_LABELS) as ChartMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => onMetricChange(m)}
              className={clsx(
                'px-3 py-1.5 rounded-[7px] text-xs font-medium transition-colors',
                metric === m ? 'bg-base-700 text-ink-100' : 'text-ink-500 hover:text-ink-300'
              )}
            >
              {METRIC_LABELS[m]}
            </button>
          ))}
        </div>
        <select
          value={range}
          onChange={(e) => onRangeChange(e.target.value as ChartRange)}
          className="bg-base-900 border border-base-600 rounded-control px-3 py-1.5 text-xs text-ink-300 outline-none w-fit"
        >
          {(Object.keys(RANGE_LABELS) as ChartRange[]).map((r) => (
            <option key={r} value={r}>{RANGE_LABELS[r]}</option>
          ))}
        </select>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#212832" vertical={false} />
            <XAxis dataKey="label" stroke="#7C8798" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis stroke="#7C8798" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={60}
              tickFormatter={(v) => `R$${Math.round(v / 1000)}k`} />
            <Tooltip
              contentStyle={{ background: '#181D25', border: '1px solid #2B3340', borderRadius: 10, fontSize: 12 }}
              labelStyle={{ color: '#B8C0CC' }}
              formatter={(value: number) => [formatCurrencyBRL(value), METRIC_LABELS[metric]]}
            />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill="url(#chartFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
