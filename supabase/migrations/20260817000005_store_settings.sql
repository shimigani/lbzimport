-- ============================================================================
-- 0005: Tabla store_settings
-- ============================================================================

create table public.store_settings (
  id uuid primary key default '00000000-0000-0000-0000-000000000001',
  store_name text not null default 'Mi Tienda',
  description text,
  logo_url text,
  social_image_url text,
  whatsapp_number text,
  facebook_url text,
  instagram_url text,
  tiktok_url text,
  qr_payment_url text,
  primary_color text not null default '#000000',
  secondary_color text not null default '#ffffff',
  welcome_text text,
  floating_whatsapp_enabled boolean not null default true,
  currency text not null default 'BOB' check (currency in ('BOB', 'USD')),
  tiktok_pixel_id text,
  meta_pixel_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_settings_single_row check (id = '00000000-0000-0000-0000-000000000001')
);

create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

-- Fila única inicial para que la tienda siempre tenga configuración
insert into public.store_settings (id, store_name, currency)
values ('00000000-0000-0000-0000-000000000001', 'Mi Tienda', 'BOB')
on conflict (id) do nothing;