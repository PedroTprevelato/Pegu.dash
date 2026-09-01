# PEGU — Gestão financeira, vendas e estoque

Aplicação de gestão financeira, vendas e estoque construída com **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, **Supabase** (Auth + Postgres + Storage) e **Recharts**.

## 1. Criar o projeto no Supabase

1. Crie uma conta e um novo projeto em [supabase.com](https://supabase.com).
2. No painel, vá em **SQL Editor** → **New query**, cole todo o conteúdo do arquivo `supabase/schema.sql` deste projeto e execute.
   Isso cria todas as tabelas (`products`, `materials`, `expenses`, `sales`, `sale_items`, `stock_movements`, `settings`), os relacionamentos, as políticas de **Row Level Security** (cada usuário só acessa seus próprios dados), o bucket de Storage para imagens de produtos e um trigger que cria automaticamente a linha de `settings` para cada novo usuário.
3. Em **Authentication → Providers**, confirme que "Email" está habilitado (é o padrão).
4. Em **Authentication → URL Configuration**, adicione a URL do seu domínio (ex: `https://seu-app.vercel.app`) em "Site URL" e "Redirect URLs" quando for fazer o deploy.
5. Em **Project Settings → API**, copie a **Project URL** e a **anon public key**.

## 2. Rodar localmente

```bash
npm install
cp .env.local.example .env.local
# edite .env.local com a URL e a anon key do seu projeto Supabase
npm run dev
```

Acesse `http://localhost:3000`, crie uma conta em "Criar conta" e confirme o e-mail (o Supabase envia automaticamente).

## 3. Deploy em produção (Vercel)

1. Suba este projeto para um repositório no GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório.
3. Em **Environment Variables**, adicione:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Faça o deploy. Depois, volte ao Supabase e atualize "Site URL" / "Redirect URLs" com o domínio final da Vercel.

Nunca coloque a `service_role key` do Supabase no frontend — apenas a `anon public key`, que é protegida pelas políticas de RLS.

## 4. Estrutura do projeto

```
app/
  (auth)/          # login, criar conta, esqueci a senha
  (app)/           # área logada: dashboard, estoque, gastos, vendas, configurações
components/
  layout/          # sidebar responsiva
  dashboard/       # cards de indicadores e gráfico financeiro
  estoque/         # cards de produto, formulário com materiais dinâmicos
  gastos/          # formulário e tabela de gastos
  vendas/          # formulário de venda com múltiplos produtos
  ui/              # modal, toast, confirmação, estado vazio
lib/
  supabase/        # clientes Supabase (browser e servidor)
  services/        # chamadas ao banco (products, expenses, sales, settings)
  utils/finance.ts # todas as fórmulas financeiras (lucro, margem, valor disponível...)
types/database.ts  # tipos de todas as entidades
supabase/schema.sql # schema completo do banco + RLS
middleware.ts        # protege rotas e mantém a sessão
```

## 5. Regras financeiras implementadas

- **Valor disponível** = saldo inicial + vendas recebidas − gastos
- **Lucro** = faturamento − custo dos produtos vendidos − gastos
- **Margem de lucro (%)** = lucro / faturamento × 100
- **Custo total do produto** = custo médio informado + soma dos custos dos materiais
- Toda venda diminui o estoque automaticamente; toda exclusão de venda restaura o estoque; entradas/saídas manuais de estoque ficam registradas em `stock_movements`.

## 6. Próximos módulos

A sidebar e a arquitetura (`components/`, `lib/services/`, `types/`) foram organizadas para receber novos módulos facilmente — basta criar uma nova pasta em `app/(app)/` e um item na sidebar (`components/layout/sidebar.tsx`).
