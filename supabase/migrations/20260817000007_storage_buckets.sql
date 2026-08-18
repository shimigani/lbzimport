-- ============================================================================
-- 0007: Storage buckets + políticas
-- ============================================================================
-- Buckets públicos (lectura) para que los visitantes vean las imágenes.
-- Solo los admins pueden subir/modificar/eliminar archivos.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('store-assets', 'store-assets', true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Bucket: products
-- ---------------------------------------------------------------------------
create policy "products_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'products');

create policy "products_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products' and public.is_admin());

create policy "products_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products' and public.is_admin())
  with check (bucket_id = 'products' and public.is_admin());

create policy "products_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products' and public.is_admin());

-- ---------------------------------------------------------------------------
-- Bucket: store-assets (logo, QR, imagen social)
-- ---------------------------------------------------------------------------
create policy "store_assets_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'store-assets');

create policy "store_assets_insert_admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'store-assets' and public.is_admin());

create policy "store_assets_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'store-assets' and public.is_admin())
  with check (bucket_id = 'store-assets' and public.is_admin());

create policy "store_assets_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'store-assets' and public.is_admin());