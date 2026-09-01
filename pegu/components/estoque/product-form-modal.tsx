'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import type { Product } from '@/types/database';
import type { MaterialInput, ProductInput } from '@/lib/services/products';
import { uploadProductImage } from '@/lib/services/products';
import { calculateMaterialTotalCost, calculateProductTotalCost, formatCurrencyBRL } from '@/lib/utils/finance';

const UNITS = ['unidades', 'g', 'kg', 'ml', 'l', 'm', 'cm', 'pacotes'];

function emptyMaterial(): MaterialInput {
  return { name: '', quantity: 0, unit: 'unidades', average_cost: 0 };
}

export function ProductFormModal({
  open,
  onClose,
  onSubmit,
  initialProduct,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ProductInput) => Promise<void>;
  initialProduct?: Product | null;
  saving: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [averageCost, setAverageCost] = useState('0');
  const [salePrice, setSalePrice] = useState('0');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [minimumStock, setMinimumStock] = useState('0');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [materials, setMaterials] = useState<MaterialInput[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName(initialProduct?.name ?? '');
      setDescription(initialProduct?.description ?? '');
      setAverageCost(String(initialProduct?.average_cost ?? 0));
      setSalePrice(String(initialProduct?.sale_price ?? 0));
      setStockQuantity(String(initialProduct?.stock_quantity ?? 0));
      setMinimumStock(String(initialProduct?.minimum_stock ?? 0));
      setImageUrl(initialProduct?.image_url ?? null);
      setImagePreview(initialProduct?.image_url ?? null);
      setImageFile(null);
      setMaterials(
        initialProduct?.materials?.map((m) => ({
          name: m.name, quantity: Number(m.quantity), unit: m.unit, average_cost: Number(m.average_cost),
        })) ?? []
      );
      setError(null);
    }
  }, [open, initialProduct]);

  const materialsTotal = materials.reduce((acc, m) => acc + calculateMaterialTotalCost(Number(m.quantity) || 0, Number(m.average_cost) || 0), 0);
  const totalCost = calculateProductTotalCost(Number(averageCost) || 0, materialsTotal);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function updateMaterial(index: number, patch: Partial<MaterialInput>) {
    setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }

  function removeMaterial(index: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('Informe o nome do produto.'); return; }
    if (Number(averageCost) < 0 || Number(salePrice) < 0) { setError('Custos e preços não podem ser negativos.'); return; }
    if (Number(stockQuantity) < 0 || Number(minimumStock) < 0) { setError('Quantidades não podem ser negativas.'); return; }

    let finalImageUrl = imageUrl;
    if (imageFile) {
      setUploading(true);
      try {
        finalImageUrl = await uploadProductImage(imageFile);
      } catch {
        setError('Não foi possível enviar a imagem. Tente novamente.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      average_cost: Number(averageCost) || 0,
      sale_price: Number(salePrice) || 0,
      stock_quantity: Number(stockQuantity) || 0,
      minimum_stock: Number(minimumStock) || 0,
      image_url: finalImageUrl,
      materials: materials.filter((m) => m.name.trim()),
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={initialProduct ? 'Editar produto' : 'Adicionar produto'} width="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="label">Imagem do produto</label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-control bg-base-900 border border-base-600 overflow-hidden flex items-center justify-center shrink-0">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Prévia" className="w-full h-full object-cover" />
              ) : (
                <span className="text-ink-500 text-[10px] text-center px-1">Sem imagem</span>
              )}
            </div>
            <label className="btn-secondary cursor-pointer">
              Escolher imagem
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label" htmlFor="pname">Nome do produto</label>
            <input id="pname" className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Vela aromática grande" />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="pdesc">Descrição</label>
            <textarea id="pdesc" rows={2} className="input-field resize-none" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva o produto" />
          </div>
          <div>
            <label className="label" htmlFor="pcost">Custo médio do produto (R$)</label>
            <input id="pcost" type="number" step="0.01" min="0" className="input-field" value={averageCost} onChange={(e) => setAverageCost(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pprice">Preço de venda (R$)</label>
            <input id="pprice" type="number" step="0.01" min="0" className="input-field" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pstock">Quantidade em estoque</label>
            <input id="pstock" type="number" step="1" min="0" className="input-field" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="pmin">Estoque mínimo</label>
            <input id="pmin" type="number" step="1" min="0" className="input-field" value={minimumStock} onChange={(e) => setMinimumStock(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="label mb-0">Materiais utilizados</label>
            <button type="button" onClick={() => setMaterials((prev) => [...prev, emptyMaterial()])} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">
              + Adicionar material
            </button>
          </div>

          {materials.length === 0 ? (
            <p className="text-xs text-ink-500 border border-dashed border-base-600 rounded-control py-4 text-center">Nenhum material adicionado.</p>
          ) : (
            <div className="space-y-3">
              {materials.map((m, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end bg-base-900 border border-base-600/60 rounded-control p-3">
                  <div className="col-span-4">
                    <label className="text-xs text-ink-500 mb-1 block">Material</label>
                    <input className="input-field !py-2 text-sm" value={m.name} onChange={(e) => updateMaterial(i, { name: e.target.value })} placeholder="Ex: Papelão" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-ink-500 mb-1 block">Qtd.</label>
                    <input type="number" step="0.01" min="0" className="input-field !py-2 text-sm" value={m.quantity} onChange={(e) => updateMaterial(i, { quantity: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-ink-500 mb-1 block">Unidade</label>
                    <select className="input-field !py-2 text-sm" value={m.unit} onChange={(e) => updateMaterial(i, { unit: e.target.value })}>
                      {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-ink-500 mb-1 block">Custo médio</label>
                    <input type="number" step="0.01" min="0" className="input-field !py-2 text-sm" value={m.average_cost} onChange={(e) => updateMaterial(i, { average_cost: Number(e.target.value) })} />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-ink-500 mb-1 block">Total</label>
                    <p className="text-sm text-ink-300 py-2">{formatCurrencyBRL(calculateMaterialTotalCost(Number(m.quantity) || 0, Number(m.average_cost) || 0))}</p>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => removeMaterial(i)} aria-label="Remover material" className="w-8 h-8 flex items-center justify-center rounded-control text-negative-400 hover:bg-negative-500/10">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-base-900 border border-base-600/60 rounded-control px-4 py-3">
          <span className="text-sm text-ink-300">Custo total do produto</span>
          <span className="text-sm font-semibold text-ink-100">{formatCurrencyBRL(totalCost)}</span>
        </div>

        {error && <p className="text-sm text-negative-400 bg-negative-500/10 border border-negative-500/20 rounded-control px-3 py-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
          <button type="submit" disabled={saving || uploading} className="btn-primary">
            {saving || uploading ? 'Salvando...' : 'Salvar produto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
