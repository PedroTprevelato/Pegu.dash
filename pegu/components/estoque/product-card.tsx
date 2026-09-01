'use client';

import clsx from 'clsx';
import type { Product } from '@/types/database';
import { getStockStatus } from '@/types/database';
import { formatCurrencyBRL } from '@/lib/utils/finance';

const STATUS_CONFIG = {
  normal: { label: 'Estoque normal', dot: 'bg-positive-500', text: 'text-positive-500' },
  baixo: { label: 'Estoque baixo', dot: 'bg-warning-500', text: 'text-warning-400' },
  critico: { label: 'Estoque crítico', dot: 'bg-negative-500', text: 'text-negative-500' },
};

export function ProductCard({
  product,
  onEdit,
  onDelete,
  onMoveStock,
}: {
  product: Product;
  onEdit: () => void;
  onDelete: () => void;
  onMoveStock: (type: 'entrada' | 'saida') => void;
}) {
  const status = getStockStatus(product);
  const config = STATUS_CONFIG[status];
  const profit = Number(product.sale_price) - Number(product.total_cost);
  const margin = product.sale_price > 0 ? (profit / Number(product.sale_price)) * 100 : 0;

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="aspect-[4/3] bg-base-900 flex items-center justify-center overflow-hidden">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-ink-500 text-xs">Sem imagem</span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <div>
          <h3 className="text-sm font-medium text-ink-100 truncate">{product.name}</h3>
          {product.description && <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{product.description}</p>}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <span className="text-ink-500">Custo total</span>
          <span className="num text-ink-300 text-right">{formatCurrencyBRL(Number(product.total_cost))}</span>
          <span className="text-ink-500">Preço de venda</span>
          <span className="num text-ink-100 text-right font-medium">{formatCurrencyBRL(Number(product.sale_price))}</span>
          <span className="text-ink-500">Lucro</span>
          <span className={clsx('num text-right font-medium', profit >= 0 ? 'text-positive-500' : 'text-negative-500')}>
            {formatCurrencyBRL(profit)} ({margin.toFixed(0)}%)
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5">
            <span className={clsx('w-1.5 h-1.5 rounded-full', config.dot)} />
            <span className={clsx('text-xs', config.text)}>{config.label}</span>
          </div>
          <span className="text-xs text-ink-300">{product.stock_quantity} un.</span>
        </div>

        <div className="flex items-center gap-2 pt-2 mt-auto border-t border-base-600/40">
          <button onClick={() => onMoveStock('entrada')} className="flex-1 text-xs py-2 rounded-control border border-base-600 text-ink-300 hover:bg-base-700/60 transition-colors">
            + Entrada
          </button>
          <button onClick={() => onMoveStock('saida')} className="flex-1 text-xs py-2 rounded-control border border-base-600 text-ink-300 hover:bg-base-700/60 transition-colors">
            − Saída
          </button>
          <button onClick={onEdit} aria-label="Editar" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-control border border-base-600 text-ink-300 hover:bg-base-700/60 transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M9 1.5L11.5 4L4 11.5H1.5V9L9 1.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
          </button>
          <button onClick={onDelete} aria-label="Excluir" className="w-8 h-8 shrink-0 flex items-center justify-center rounded-control border border-base-600 text-negative-400 hover:bg-negative-500/10 transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 3.5H11M4.5 3.5V2.2C4.5 1.8 4.8 1.5 5.2 1.5H7.8C8.2 1.5 8.5 1.8 8.5 2.2V3.5M5 6V9.5M8 6V9.5M3 3.5L3.5 10.5C3.5 11 3.9 11.5 4.5 11.5H8.5C9.1 11.5 9.5 11 9.5 10.5L10 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
