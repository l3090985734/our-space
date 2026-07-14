import { createClient } from '@supabase/supabase-js'
import { isDemoMode } from './mockStorage'

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = isDemoMode()
  ? ({} as any)
  : createClient(supabaseUrl, supabaseAnonKey)
