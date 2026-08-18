-- ============================================================================
-- 0008: Configuración de pago con QR (campos opcionales en store_settings)
-- ============================================================================
-- Añade campos opcionales para configurar el pago con QR desde /admin/settings:
--   - payment_instructions:    instrucciones de pago mostradas al cliente
--   - payment_account_name:    nombre del titular / cuenta
--   - payment_bank_name:       banco o entidad
--   - payment_account_number:  número de cuenta
--   - payment_account_type:    tipo de cuenta (opcional)
--
-- La URL del QR YA EXISTE como store_settings.qr_payment_url (migración 0005),
-- por lo que NO se crea un campo duplicado (payment_qr_url).
--
-- Seguridad:
--   - Todas las columnas son opcionales (NULL, DEFAULT NULL): no rompen la
--     fila única existente ni requieren datos previos.
--   - La política RLS store_settings_select_public (USING true) ya permite la
--     lectura pública necesaria para mostrar QR e instrucciones en el checkout.
--   - No se modifican migraciones previas, tablas, RLS ni create_order.
--
-- Idempotente: usar "add column if not exists" permite re-aplicar sin errores.
-- ============================================================================

alter table public.store_settings
  add column if not exists payment_instructions text,
  add column if not exists payment_account_name text,
  add column if not exists payment_bank_name text,
  add column if not exists payment_account_number text,
  add column if not exists payment_account_type text;