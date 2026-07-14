import { useState, useEffect } from 'react'
import type { Identity } from '../types'

const STORAGE_KEY = 'our-space-identity'

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Identity | null
    if (saved === 'he' || saved === 'she') {
      setIdentity(saved)
    }
    setIsLoading(false)
  }, [])

  const selectIdentity = (id: Identity) => {
    localStorage.setItem(STORAGE_KEY, id)
    setIdentity(id)
  }

  const clearIdentity = () => {
    localStorage.removeItem(STORAGE_KEY)
    setIdentity(null)
  }

  return { identity, isLoading, selectIdentity, clearIdentity }
}
