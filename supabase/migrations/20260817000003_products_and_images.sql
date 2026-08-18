-- ============================================================================
-- 0003: Tablas products y product_images
-- ============================================================================

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  short_description text,
  description text,
  price numeric(10, 2) not null default 0 check (price >= 0),
  compare_price numeric(10, 2) check (compare_price is null or compare_price >= 0),
  cost_price numeric(10, 2) check (cost_price is null or cost_price >= 0),
  sku text unique,
  stock integer not null default 0 check (stock >= 0),
  category_id uuid references public.categories (id) on delete set null,
  image_url text,
  active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Índices (slug y sku ya tienen índice único por las constraints UNIQUE)
create index products_category_id_idx on public.products (category_id);
create index products_active_idx on public.products (active);
create index products_featured_idx on public.products (featured);
create index products_created_at_idx on public.products (created_at);

-- ---------------------------------------------------------------------------
-- product_images: varias imágenes por producto, cascada al eliminar producto
-- ---------------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on public.product_images (product_id);