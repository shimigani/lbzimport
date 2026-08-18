-- ============================================================================
-- 0011: Plantillas de mensajes de WhatsApp (store_settings.whatsapp_messages)
-- ============================================================================
-- Añade una única columna JSONB opcional que almacena TODAS las plantillas de
-- mensajes de WhatsApp editables desde Admin -> Configuración -> WhatsApp.
--
-- - No modifica ninguna columna existente.
-- - No modifica tablas, RLS, auth, roles, funciones ni migraciones previas.
-- - La escritura queda restringida a administradores por la política existente
--   store_settings_all_admin (public.is_admin()).
-- - Idempotente: add column if not exists.
-- ============================================================================

alter table public.store_settings
  add column if not exists whatsapp_messages jsonb;