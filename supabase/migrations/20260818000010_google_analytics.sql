-- ============================================================================
-- 0010: Columna google_analytics_id en store_settings (GA4 Measurement ID)
-- ============================================================================
-- Agrega únicamente la columna google_analytics_id (text, nullable, sin
-- default) para guardar el Measurement ID de Google Analytics 4 (G-XXXXXXXXXX).
-- Su presencia (no vacía) activa gtag.js solo cuando esté configurado.
--
-- Idempotente: usa ADD COLUMN IF NOT EXISTS. No toca tablas existentes,
-- no borra datos, no modifica RLS ni funciones (create_order intacta).
-- ============================================================================

alter table public.store_settings
  add column if not exists google_analytics_id text;