import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Faltan las variables de entorno de Supabase (VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY). Revisa tu archivo .env.',
  )
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)