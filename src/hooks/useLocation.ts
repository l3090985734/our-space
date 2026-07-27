import { useState, useEffect, useCallback } from 'react'
import type { Location, Identity } from '../types'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import { supabase } from '../lib/supabase'
import { onRefresh } from '../lib/refreshEvent'

export function useLocation() {
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)

  const fetchLocations = useCallback(async () => {
    setLoading(true)
    try {
      if (isDemoMode()) {
        const data = demoStorage.getLocations()
        setLocations(data)
      } else {
        const { data, error } = await supabase
          .from('locations')
          .select('*')

        if (error) throw error
        setLocations(data || [])
      }
    } catch (e: any) {
      console.error('Failed to fetch locations:', e?.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLocations()
    return onRefresh(fetchLocations)
  }, [fetchLocations])

  const getOtherLocation = useCallback(
    (currentIdentity: Identity | null): Location | null => {
      if (!currentIdentity) return null
      return locations.find((l) => l.identity !== currentIdentity) || null
    },
    [locations]
  )

  const getMyLocation = useCallback(
    (currentIdentity: Identity | null): Location | null => {
      if (!currentIdentity) return null
      return locations.find((l) => l.identity === currentIdentity) || null
    },
    [locations]
  )

  const shareMyLocation = useCallback(
    async (identity: Identity): Promise<{ success: boolean; error?: string }> => {
      setSharing(true)
      try {
        if (!navigator.geolocation) {
          return { success: false, error: '当前环境不支持定位功能，请使用 HTTPS 环境访问' }
        }

        const position = await new Promise<GeolocationPosition>(
          (resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              resolve,
              reject,
              { enableHighAccuracy: false, timeout: 10000 }
            )
          }
        )

        const { latitude, longitude } = position.coords

        if (isDemoMode()) {
          const updated = demoStorage.upsertLocation(identity, latitude, longitude)
          setLocations((prev) => {
            const others = prev.filter((l) => l.identity !== identity)
            return [...others, updated]
          })
        } else {
          const { data: existing } = await supabase
            .from('locations')
            .select('id')
            .eq('identity', identity)
            .single()

          if (existing) {
            const { error } = await supabase
              .from('locations')
              .update({
                latitude,
                longitude,
                updated_at: new Date().toISOString(),
              })
              .eq('identity', identity)

            if (error) throw error
          } else {
            const { error } = await supabase
              .from('locations')
              .insert({
                identity,
                latitude,
                longitude,
              })

            if (error) throw error
          }

          await fetchLocations()
        }

        return { success: true }
      } catch (e: any) {
        console.error('Failed to share location:', e?.message)
        let errorMsg = '位置共享失败'
        if (e?.code === 1) {
          errorMsg = '定位权限被拒绝，请在浏览器设置中允许位置访问'
        } else if (e?.code === 2) {
          errorMsg = '无法获取位置信息，请检查设备定位是否开启'
        } else if (e?.code === 3) {
          errorMsg = '定位超时，请重试'
        } else if (e?.message) {
          errorMsg = e.message
        }
        return { success: false, error: errorMsg }
      } finally {
        setSharing(false)
      }
    },
    [fetchLocations]
  )

  return {
    locations,
    loading,
    sharing,
    fetchLocations,
    getOtherLocation,
    getMyLocation,
    shareMyLocation,
  }
}
