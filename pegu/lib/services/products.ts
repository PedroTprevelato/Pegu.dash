import { createClient } from '@/lib/supabase/client';
import type { Material, Product } from '@/types/database';
import { calculateMaterialTotalCost, calculateProductTotalCost } from '@/lib/utils/finance';

export interface MaterialInput {
  name: string;
  quantity: number;
  unit: string;
  average_cost: number;
}

export interface ProductInput {
  name: string;
  description: string;
  average_cost: number;
  sale_price: number;
  stock_quantity: number;
  minimum_stock: number;
  image_url: string | null;
  materials: MaterialInput[];
}

export async function listProducts(): Promise<Product[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, materials(*)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Product[];
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  const materialsTotal = input.materials.reduce(
    (acc, m) => acc + calculateMaterialTotalCost(m.quantity, m.average_cost),
    0
  );
  const totalCost = calculateProductTotalCost(input.average_cost, materialsTotal);

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || null,
      image_url: input.image_url,
      average_cost: input.average_cost,
      material_cost: materialsTotal,
      total_cost: totalCost,
      sale_price: input.sale_price,
      stock_quantity: input.stock_quantity,
      minimum_stock: input.minimum_stock,
    })
    .select()
    .single();

  if (error) throw error;

  if (input.materials.length > 0) {
    const rows = input.materials.map((m) => ({
      product_id: product.id,
      user_id: userId,
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      average_cost: m.average_cost,
      total_cost: calculateMaterialTotalCost(m.quantity, m.average_cost),
    }));
    const { error: matError } = await supabase.from('materials').insert(rows);
    if (matError) throw matError;
  }

  return product as Product;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  const materialsTotal = input.materials.reduce(
    (acc, m) => acc + calculateMaterialTotalCost(m.quantity, m.average_cost),
    0
  );
  const totalCost = calculateProductTotalCost(input.average_cost, materialsTotal);

  const { data: product, error } = await supabase
    .from('products')
    .update({
      name: input.name,
      description: input.description || null,
      image_url: input.image_url,
      average_cost: input.average_cost,
      material_cost: materialsTotal,
      total_cost: totalCost,
      sale_price: input.sale_price,
      stock_quantity: input.stock_quantity,
      minimum_stock: input.minimum_stock,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from('materials').delete().eq('product_id', id);
  if (input.materials.length > 0) {
    const rows = input.materials.map((m) => ({
      product_id: id,
      user_id: userId,
      name: m.name,
      quantity: m.quantity,
      unit: m.unit,
      average_cost: m.average_cost,
      total_cost: calculateMaterialTotalCost(m.quantity, m.average_cost),
    }));
    const { error: matError } = await supabase.from('materials').insert(rows);
    if (matError) throw matError;
  }

  return product as Product;
}

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

export async function uploadProductImage(file: File): Promise<string> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;
  const ext = file.name.split('.').pop();
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

export async function registerStockMovement(params: {
  productId: string;
  type: 'entrada' | 'saida';
  quantity: number;
  reason?: string;
}): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user!.id;

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', params.productId)
    .single();
  if (productError) throw productError;

  const newQuantity =
    params.type === 'entrada'
      ? Number(product.stock_quantity) + params.quantity
      : Number(product.stock_quantity) - params.quantity;

  if (newQuantity < 0) {
    throw new Error('Quantidade insuficiente em estoque para essa saída.');
  }

  const { error: moveError } = await supabase.from('stock_movements').insert({
    user_id: userId,
    product_id: params.productId,
    type: params.type,
    quantity: params.quantity,
    reason: params.reason || null,
  });
  if (moveError) throw moveError;

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_quantity: newQuantity, updated_at: new Date().toISOString() })
    .eq('id', params.productId);
  if (updateError) throw updateError;
}
