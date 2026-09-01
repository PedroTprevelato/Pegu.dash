-- ============================================================
-- PEGU — Schema do banco de dados (Supabase / PostgreSQL)
-- Cole este arquivo inteiro no SQL Editor do seu projeto Supabase
-- ============================================================

-- Extensão para gerar UUIDs
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- settings: 1 linha por usuário (saldo inicial, preferências)
-- ------------------------------------------------------------
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  display_name text,
  initial_balance numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- products: catálogo de produtos do estoque
-- ------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  average_cost numeric(14,2) not null default 0,      -- custo médio informado
  material_cost numeric(14,2) not null default 0,      -- soma dos materiais (calculado)
  total_cost numeric(14,2) not null default 0,          -- average_cost + material_cost (calculado)
  sale_price numeric(14,2) not null default 0,
  stock_quantity numeric(14,2) not null default 0,
  minimum_stock numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_costs_nonneg check (average_cost >= 0 and material_cost >= 0 and sale_price >= 0),
  constraint products_stock_nonneg check (stock_quantity >= 0 and minimum_stock >= 0)
);

-- ------------------------------------------------------------
-- materials: materiais usados em cada produto (1..N por produto)
-- ------------------------------------------------------------
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  quantity numeric(14,3) not null default 0,
  unit text not null default 'unidades',
  average_cost numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0, -- quantity * average_cost (calculado)
  created_at timestamptz not null default now(),
  constraint materials_nonneg check (quantity >= 0 and average_cost >= 0)
);

-- ------------------------------------------------------------
-- expenses: gastos
-- ------------------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  description text not null,
  category text not null,
  payment_method text not null,
  amount numeric(14,2) not null,
  notes text,
  created_at timestamptz not null default now(),
  constraint expenses_amount_positive check (amount > 0)
);

-- ------------------------------------------------------------
-- sales: vendas (cabeçalho)
-- ------------------------------------------------------------
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null default current_date,
  total_amount numeric(14,2) not null default 0,
  total_cost numeric(14,2) not null default 0,
  profit numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  payment_method text not null,
  status text not null default 'recebida', -- 'recebida' | 'pendente'
  notes text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- sale_items: itens de cada venda
-- ------------------------------------------------------------
create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  quantity numeric(14,2) not null,
  unit_price numeric(14,2) not null,
  total_price numeric(14,2) not null,
  unit_cost numeric(14,2) not null,
  total_cost numeric(14,2) not null,
  profit numeric(14,2) not null,
  constraint sale_items_qty_positive check (quantity > 0)
);

-- ------------------------------------------------------------
-- stock_movements: histórico de entradas/saídas de estoque
-- ------------------------------------------------------------
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null, -- 'entrada' | 'saida'
  quantity numeric(14,2) not null,
  reason text,
  created_at timestamptz not null default now(),
  constraint stock_movements_qty_positive check (quantity > 0),
  constraint stock_movements_type_valid check (type in ('entrada', 'saida'))
);

-- ------------------------------------------------------------
-- Índices
-- ------------------------------------------------------------
create index if not exists idx_products_user on public.products(user_id);
create index if not exists idx_materials_product on public.materials(product_id);
create index if not exists idx_materials_user on public.materials(user_id);
create index if not exists idx_expenses_user_date on public.expenses(user_id, date desc);
create index if not exists idx_sales_user_date on public.sales(user_id, date desc);
create index if not exists idx_sale_items_sale on public.sale_items(sale_id);
create index if not exists idx_sale_items_product on public.sale_items(product_id);
create index if not exists idx_stock_movements_product on public.stock_movements(product_id);

-- ------------------------------------------------------------
-- Row Level Security — cada usuário só vê/edita seus próprios dados
-- ------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.products enable row level security;
alter table public.materials enable row level security;
alter table public.expenses enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.stock_movements enable row level security;

create policy "settings_select_own" on public.settings for select using (auth.uid() = user_id);
create policy "settings_insert_own" on public.settings for insert with check (auth.uid() = user_id);
create policy "settings_update_own" on public.settings for update using (auth.uid() = user_id);
create policy "settings_delete_own" on public.settings for delete using (auth.uid() = user_id);

create policy "products_select_own" on public.products for select using (auth.uid() = user_id);
create policy "products_insert_own" on public.products for insert with check (auth.uid() = user_id);
create policy "products_update_own" on public.products for update using (auth.uid() = user_id);
create policy "products_delete_own" on public.products for delete using (auth.uid() = user_id);

create policy "materials_select_own" on public.materials for select using (auth.uid() = user_id);
create policy "materials_insert_own" on public.materials for insert with check (auth.uid() = user_id);
create policy "materials_update_own" on public.materials for update using (auth.uid() = user_id);
create policy "materials_delete_own" on public.materials for delete using (auth.uid() = user_id);

create policy "expenses_select_own" on public.expenses for select using (auth.uid() = user_id);
create policy "expenses_insert_own" on public.expenses for insert with check (auth.uid() = user_id);
create policy "expenses_update_own" on public.expenses for update using (auth.uid() = user_id);
create policy "expenses_delete_own" on public.expenses for delete using (auth.uid() = user_id);

create policy "sales_select_own" on public.sales for select using (auth.uid() = user_id);
create policy "sales_insert_own" on public.sales for insert with check (auth.uid() = user_id);
create policy "sales_update_own" on public.sales for update using (auth.uid() = user_id);
create policy "sales_delete_own" on public.sales for delete using (auth.uid() = user_id);

create policy "sale_items_select_own" on public.sale_items for select using (auth.uid() = user_id);
create policy "sale_items_insert_own" on public.sale_items for insert with check (auth.uid() = user_id);
create policy "sale_items_update_own" on public.sale_items for update using (auth.uid() = user_id);
create policy "sale_items_delete_own" on public.sale_items for delete using (auth.uid() = user_id);

create policy "stock_movements_select_own" on public.stock_movements for select using (auth.uid() = user_id);
create policy "stock_movements_insert_own" on public.stock_movements for insert with check (auth.uid() = user_id);
create policy "stock_movements_update_own" on public.stock_movements for update using (auth.uid() = user_id);
create policy "stock_movements_delete_own" on public.stock_movements for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Trigger: cria uma linha de settings automaticamente ao criar usuário
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.settings (user_id, display_name, initial_balance)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 0);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- Storage bucket para imagens de produtos
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "product_images_owner_insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "product_images_owner_update"
  on storage.objects for update
  using (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "product_images_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and auth.uid()::text = (storage.foldername(name))[1]);
