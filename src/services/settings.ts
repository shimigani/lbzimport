import { supabase } from '../lib/supabase'
import type { StoreSettings } from '../types'
import { invalidateSettingsCache } from './store'

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

export async function getSettings(): Promise<StoreSettings | null> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('*')
    .eq('id', SETTINGS_ID)
    .single()

  if (error) return null
  return data as StoreSettings
}

export async function updateSettings(patch: Partial<StoreSettings>): Promise<void> {
  const { error } = await supabase
    .from('store_settings')
    .update(patch)
    .eq('id', SETTINGS_ID)

  if (error) throw new Error(error.message)

  invalidateSettingsCache()
}