-- ============================================================================
-- 0006: Políticas de Row Level Security (RLS)
-- ============================================================================
-- Las políticas administrativas usan public.is_admin() (SECURITY DEFINER)
-- para evitar recursión de RLS y centralizar la comprobación de rol.
-- NUNCA se usan políticas con USING (true) para operaciones administrativas.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

-- Un usuario puede leer su propio perfil
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Un admin puede leer todos los perfiles
create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

-- Un usuario puede actualizar su propio perfil (el trigger
-- prevent_role_escalation impide que cambie su propio rol)
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Un admin puede actualizar cualquier perfil
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;

-- Lectura pública: solo categorías activas
create policy "categories_select_public"
  on public.categories for select
  to anon, authenticated
  using (active = true);

-- Administración completa solo para admin
create policy "categories_all_admin"
  on public.categories for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;

-- Lectura pública: solo productos activos
create policy "products_select_public"
  on public.products for select
  to anon, authenticated
  using (active = true);

-- Administración completa solo para admin
create policy "products_all_admin"
  on public.products for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- product_images
-- ---------------------------------------------------------------------------
alter table public.product_images enable row level security;

-- Lectura pública: imágenes de productos activos
create policy "product_images_select_public"
  on public.product_images for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.products p
      where p.id = product_id
        and p.active = true
    )
  );

-- Administración completa solo para admin
create policy "product_images_all_admin"
  on public.product_images for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
alter table public.orders enable row level security;

-- Los visitantes NO pueden crear/modificar pedidos directamente:
-- la creación se hace exclusivamente mediante la función RPC create_order
-- (SECURITY DEFINER). Por eso no existen políticas INSERT/UPDATE/DELETE públicas.

-- Lectura: solo admin
create policy "orders_select_admin"
  on public.orders for select
  to authenticated
  using (public.is_admin());

-- Actualización: solo admin (gestionar estado del pedido)
create policy "orders_update_admin"
  on public.orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Eliminación: solo admin
create policy "orders_delete_admin"
  on public.orders for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
alter table public.order_items enable row level security;

-- Los items se crean mediante create_order (SECURITY DEFINER).
-- Sin políticas públicas de escritura.

-- Acceso total solo para admin
create policy "order_items_all_admin"
  on public.order_items for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- store_settings
-- ---------------------------------------------------------------------------
alter table public.store_settings enable row level security;

-- Lectura pública: la configuración de la tienda es información pública
-- (nombre, WhatsApp, colores, pixel ids que el navegador debe cargar).
create policy "store_settings_select_public"
  on public.store_settings for select
  to anon, authenticated
  using (true);

-- Escritura completa solo para admin
create policy "store_settings_all_admin"
  on public.store_settings for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());