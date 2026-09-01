export type PaymentMethod =
  | 'Dinheiro'
  | 'PIX'
  | 'Cartão de débito'
  | 'Cartão de crédito'
  | 'Transferência'
  | 'Outro';

export type ExpenseCategory =
  | 'Materiais'
  | 'Embalagens'
  | 'Transporte'
  | 'Marketing'
  | 'Funcionários'
  | 'Equipamentos'
  | 'Fornecedores'
  | 'Impostos'
  | 'Outros';

export type StockStatus = 'normal' | 'baixo' | 'critico';

export type SaleStatus = 'recebida' | 'pendente';

export type StockMovementType = 'entrada' | 'saida';

export interface Settings {
  id: string;
  user_id: string;
  display_name: string | null;
  initial_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  product_id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  average_cost: number;
  total_cost: number;
  created_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  average_cost: number;
  material_cost: number;
  total_cost: number;
  sale_price: number;
  stock_quantity: number;
  minimum_stock: number;
  created_at: string;
  updated_at: string;
  materials?: Material[];
}

export interface Expense {
  id: string;
  user_id: string;
  date: string;
  description: string;
  category: ExpenseCategory;
  payment_method: PaymentMethod;
  amount: number;
  notes: string | null;
  created_at: string;
}

export interface Sale {
  id: string;
  user_id: string;
  date: string;
  total_amount: number;
  total_cost: number;
  profit: number;
  discount: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  notes: string | null;
  created_at: string;
  items?: SaleItem[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  user_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit_cost: number;
  total_cost: number;
  profit: number;
  product?: Product;
}

export interface StockMovement {
  id: string;
  user_id: string;
  product_id: string;
  type: StockMovementType;
  quantity: number;
  reason: string | null;
  created_at: string;
}

export function getStockStatus(product: Pick<Product, 'stock_quantity' | 'minimum_stock'>): StockStatus {
  if (product.stock_quantity <= 0) return 'critico';
  if (product.stock_quantity <= product.minimum_stock) return 'baixo';
  return 'normal';
}
