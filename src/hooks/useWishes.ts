import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import { onRefresh } from '../lib/refreshEvent'
import type { Wish } from '../types'

export function useWishes() {
  const [wishes, setWishes] = useState<Wish[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWishes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 300))
        setWishes(demoStorage.getWishes())
        return
      }

      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error

      setWishes(data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWishes()
    return onRefresh(fetchWishes)
  }, [fetchWishes])

  const createWish = useCallback(
    async (title: string, description: string, icon: string) => {
      try {
        setError(null)

        if (isDemoMode()) {
          demoStorage.addWish(title, description, icon)
          setWishes(demoStorage.getWishes())
          return
        }

        const { data, error } = await supabase
          .from('wishes')
          .insert({ title, description, icon })
          .select()

        if (error) throw error

        setWishes((prev) => {
          const newList = [...prev, data?.[0] as Wish]
          return newList.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
        })
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  const updateWish = useCallback(
    async (id: number, title: string, description: string, icon: string) => {
      try {
        setError(null)

        if (isDemoMode()) {
          demoStorage.updateWish(id, title, description, icon)
          setWishes(demoStorage.getWishes())
          return
        }

        const { data, error } = await supabase
          .from('wishes')
          .update({ title, description, icon })
          .eq('id', id)
          .select()

        if (error) throw error

        setWishes((prev) => {
          const newList = prev.map((w) =>
            w.id === id ? (data?.[0] as Wish) : w
          )
          return newList.sort((a, b) => {
            if (a.completed !== b.completed) return a.completed ? 1 : -1
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          })
        })
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  const toggleWish = useCallback(async (id: number) => {
    try {
      setError(null)

      if (isDemoMode()) {
        demoStorage.toggleWish(id)
        setWishes(demoStorage.getWishes())
        return
      }

      const wish = wishes.find((w) => w.id === id)
      if (!wish) return

      const newCompleted = !wish.completed
      const { data, error } = await supabase
        .from('wishes')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', id)
        .select()

      if (error) throw error

      setWishes((prev) => {
        const newList = prev.map((w) =>
          w.id === id ? (data?.[0] as Wish) : w
        )
        return newList.sort((a, b) => {
          if (a.completed !== b.completed) return a.completed ? 1 : -1
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      })
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }, [wishes])

  const deleteWish = useCallback(async (id: number) => {
    try {
      setError(null)

      if (isDemoMode()) {
        demoStorage.deleteWish(id)
        setWishes(demoStorage.getWishes())
        return
      }

      const { error } = await supabase.from('wishes').delete().eq('id', id)

      if (error) throw error

      setWishes((prev) => prev.filter((w) => w.id !== id))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }, [])

  return {
    wishes,
    loading,
    error,
    fetchWishes,
    createWish,
    updateWish,
    toggleWish,
    deleteWish,
  }
}
