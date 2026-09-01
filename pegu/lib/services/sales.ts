import { createClient } from '@/lib/supabase/client';
import type { PaymentMethod, Sale, SaleStatus } from '@/types/database';

export interface SaleItemInput {
  product_id: string;
  quantity: number;
  unit_price: number;
}

export interface SaleInput {
  date: string;
  items: SaleItemInput[];
  discount: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  notes: string;
}

export async function listSales(): Promise<Sale[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('sales')
    .select('*, items:sale_items(*, product:products(name))')
    .order('date', { ascending: false });
  if (error) throw error;
  return data as unknown as Sale[];
}

/**
 * Cria uma venda: valida estoque, calcula custo/lucro por item,
 * grava a venda + itens, e diminui o estoque de cada produto.
 */
export async function createSale(input: SaleInput): Promise<Sale> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  if (input.items.length === 0) {
    throw new Error('Adicione ao menos um produto à venda.');
  }

  // Busca custo e estoque atual de cada produto
  const productIds = input.items.map((i) => i.product_id);
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, total_cost, stock_quantity, name')
    .in('id', productIds);
  if (productsError) throw productsError;

  const productMap = new Map(products!.map((p) => [p.id, p]));

  let subtotal = 0;
  let totalCost = 0;
  const itemsToInsert = input.items.map((item) => {
    const product = productMap.get(item.product_id);
    if (!product) throw new Error('Produto não encontrado.');
    if (item.quantity > Number(product.stock_quantity)) {
      throw new Error(`Estoque insuficiente para "${product.name}" (disponível: ${product.stock_quantity}).`);
    }
    const totalPrice = Number((item.quantity * item.unit_price).toFixed(2));
    const unitCost = Number(product.total_cost);
    const itemTotalCost = Number((item.quantity * unitCost).toFixed(2));
    const itemProfit = Number((totalPrice - itemTotalCost).toFixed(2));

    subtotal += totalPrice;
    totalCost += itemTotalCost;

    return {
      product_id: item.product_id,
      user_id: userId,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: totalPrice,
      unit_cost: unitCost,
      total_cost: itemTotalCost,
      profit: itemProfit,
    };
  });

  const totalAmount = Number((subtotal - input.discount).toFixed(2));
  const profit = Number((totalAmount - totalCost).toFixed(2));

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert({
      user_id: userId,
      date: input.date,
      total_amount: totalAmount,
      total_cost: totalCost,
      profit,
      discount: input.discount,
      payment_method: input.payment_method,
      status: input.status,
      notes: input.notes || null,
    })
    .select()
    .single();
  if (saleError) throw saleError;

  const { error: itemsError } = await supabase
    .from('sale_items')
    .insert(itemsToInsert.map((i) => ({ ...i, sale_id: sale.id })));
  if (itemsError) throw itemsError;

  // Diminui o estoque e registra movimentação
  for (const item of input.items) {
    const product = productMap.get(item.product_id)!;
    const newQty = Number(product.stock_quantity) - item.quantity;
    await supabase.from('products').update({ stock_quantity: newQty, updated_at: new Date().toISOString() }).eq('id', item.product_id);
    await supabase.from('stock_movements').insert({
      user_id: userId,
      product_id: item.product_id,
      type: 'saida',
      quantity: item.quantity,
      reason: 'Venda',
    });
  }

  return sale as Sale;
}

export async function deleteSale(id: string): Promise<void> {
  const supabase = createClient();
  // Restaura o estoque dos itens antes de excluir
  const { data: items } = await supabase.from('sale_items').select('product_id, quantity').eq('sale_id', id);
  if (items) {
    for (const item of items) {
      const { data: product } = await supabase.from('products').select('stock_quantity').eq('id', item.product_id).single();
      if (product) {
        await supabase
          .from('products')
          .update({ stock_quantity: Number(product.stock_quantity) + Number(item.quantity) })
          .eq('id', item.product_id);
      }
    }
  }
  const { error } = await supabase.from('sales').delete().eq('id', id);
  if (error) throw error;
}
