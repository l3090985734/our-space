import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import { onRefresh } from '../lib/refreshEvent'
import type { TimeCapsule, Identity } from '../types'

export function useTimeCapsules() {
  const [capsules, setCapsules] = useState<TimeCapsule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const timeOffsetRef = useRef(0)

  const fetchServerTime = useCallback(async (): Promise<Date> => {
    if (isDemoMode()) {
      return new Date()
    }
    try {
      const { data } = await supabase.rpc('get_server_time')
      if (data) {
        return new Date(data)
      }
    } catch {
      // RPC 不存在的话，使用本地时间
    }
    return new Date()
  }, [])

  const calibrateTime = useCallback(async () => {
    try {
      const serverTime = await fetchServerTime()
      const localTime = new Date()
      timeOffsetRef.current = serverTime.getTime() - localTime.getTime()
    } catch {
      timeOffsetRef.current = 0
    }
  }, [fetchServerTime])

  const getNow = useCallback((): Date => {
    return new Date(Date.now() + timeOffsetRef.current)
  }, [])

  const fetchCapsules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 300))
        setCapsules(demoStorage.getTimeCapsules())
        return
      }

      const { data, error } = await supabase
        .from('time_capsules')
        .select('*')
        .order('unlock_at', { ascending: true })

      if (error) throw error

      setCapsules(data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    calibrateTime()
    fetchCapsules()
    return onRefresh(fetchCapsules)
  }, [calibrateTime, fetchCapsules])

  const createCapsule = useCallback(
    async (
      title: string,
      content: string,
      createdBy: Identity,
      unlockAt: string,
      imageUrl?: string
    ) => {
      try {
        setError(null)

        if (isDemoMode()) {
          demoStorage.addTimeCapsule(title, content, createdBy, unlockAt, imageUrl)
          setCapsules(demoStorage.getTimeCapsules())
          return
        }

        const { data, error } = await supabase
          .from('time_capsules')
          .insert({
            title,
            content,
            image_url: imageUrl,
            created_by: createdBy,
            unlock_at: unlockAt,
          })
          .select()

        if (error) throw error

        setCapsules((prev) => {
          const newList = [...prev, data?.[0] as TimeCapsule]
          return newList.sort(
            (a, b) =>
              new Date(a.unlock_at).getTime() - new Date(b.unlock_at).getTime()
          )
        })
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  const isUnlocked = useCallback(
    (capsule: TimeCapsule): boolean => {
      const now = getNow()
      return new Date(capsule.unlock_at).getTime() <= now.getTime()
    },
    [getNow]
  )

  return {
    capsules,
    loading,
    error,
    fetchCapsules,
    createCapsule,
    isUnlocked,
    getNow,
  }
}
