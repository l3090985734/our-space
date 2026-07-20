import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import { onRefresh } from '../lib/refreshEvent'
import type { Countdown } from '../types'

export function useCountdowns() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCountdowns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 300))
        setCountdowns(demoStorage.getCountdowns())
        return
      }

      const { data, error } = await supabase
        .from('countdowns')
        .select('*')
        .order('target_date', { ascending: true })

      if (error) throw error

      setCountdowns(data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCountdowns()
    return onRefresh(fetchCountdowns)
  }, [fetchCountdowns])

  const createCountdown = useCallback(
    async (title: string, targetDate: string) => {
      try {
        setError(null)

        if (isDemoMode()) {
          const newCountdown = demoStorage.addCountdown(title, targetDate)
          setCountdowns([...demoStorage.getCountdowns()])
          return newCountdown
        }

        const { data, error } = await supabase
          .from('countdowns')
          .insert({ title, target_date: targetDate })
          .select()

        if (error) throw error

        setCountdowns((prev) => {
          const newList = [...prev, data?.[0] as Countdown]
          return newList.sort(
            (a, b) =>
              new Date(a.target_date).getTime() -
              new Date(b.target_date).getTime()
          )
        })

        return data?.[0]
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  const updateCountdown = useCallback(
    async (id: number, title: string, targetDate: string) => {
      try {
        setError(null)

        if (isDemoMode()) {
          const updated = demoStorage.updateCountdown(id, title, targetDate)
          setCountdowns(demoStorage.getCountdowns())
          return updated
        }

        const { data, error } = await supabase
          .from('countdowns')
          .update({ title, target_date: targetDate })
          .eq('id', id)
          .select()

        if (error) throw error

        setCountdowns((prev) => {
          const newList = prev.map((c) =>
            c.id === id ? (data?.[0] as Countdown) : c
          )
          return newList.sort(
            (a, b) =>
              new Date(a.target_date).getTime() -
              new Date(b.target_date).getTime()
          )
        })

        return data?.[0]
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  const deleteCountdown = useCallback(async (id: number) => {
    try {
      setError(null)

      if (isDemoMode()) {
        demoStorage.deleteCountdown(id)
        setCountdowns(demoStorage.getCountdowns())
        return
      }

      const { error } = await supabase.from('countdowns').delete().eq('id', id)

      if (error) throw error

      setCountdowns((prev) => prev.filter((c) => c.id !== id))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }, [])

  return {
    countdowns,
    loading,
    error,
    fetchCountdowns,
    createCountdown,
    updateCountdown,
    deleteCountdown,
  }
}
