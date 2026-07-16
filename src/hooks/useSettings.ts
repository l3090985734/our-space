import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import type { AppSettings } from '../types'

const SETTINGS_ID = 1

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    anniversary_date: '2024-01-01',
  })
  const [loading, setLoading] = useState(true)

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true)

      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 200))
        setSettings(demoStorage.getSettings())
        return
      }

      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('app_settings')
            .insert({ id: SETTINGS_ID, anniversary_date: '2024-01-01' })
            .select()
            .single()

          if (insertError) throw insertError
          setSettings(newData as AppSettings)
        } else {
          throw error
        }
      } else {
        setSettings(data as AppSettings)
      }
    } catch (e: any) {
      console.error('Failed to fetch settings:', e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateAnniversary = useCallback(async (date: string) => {
    try {
      if (isDemoMode()) {
        const updated = demoStorage.updateSettings({ anniversary_date: date })
        setSettings(updated)
        return
      }

      const { data, error } = await supabase
        .from('app_settings')
        .update({ anniversary_date: date })
        .eq('id', SETTINGS_ID)
        .select()
        .single()

      if (error) throw error

      setSettings(data as AppSettings)
    } catch (e: any) {
      console.error('Failed to update settings:', e.message)
      throw e
    }
  }, [])

  return {
    settings,
    loading,
    updateAnniversary,
  }
}
