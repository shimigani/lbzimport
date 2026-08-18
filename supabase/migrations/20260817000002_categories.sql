-- ============================================================================
-- 0002: Tabla categories
-- ============================================================================

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- Índices
create index categories_active_idx on public.categories (active);
-- slug ya tiene índice único por la constraint UNIQUE.