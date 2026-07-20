import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import { onRefresh } from '../lib/refreshEvent'
import type { TimelineEvent } from '../types'

export function useTimeline() {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 300))
        setEvents(demoStorage.getTimeline())
        return
      }

      const { data, error } = await supabase
        .from('timeline_events')
        .select('*')
        .order('event_date', { ascending: false })

      if (error) throw error

      setEvents(data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEvents()
    return onRefresh(fetchEvents)
  }, [fetchEvents])

  const createEvent = useCallback(
    async (title: string, eventDate: string, description: string) => {
      try {
        setError(null)

        if (isDemoMode()) {
          const newEvent = demoStorage.addTimelineEvent(title, eventDate, description)
          setEvents(demoStorage.getTimeline())
          return newEvent
        }

        const { data, error } = await supabase
          .from('timeline_events')
          .insert({ title, event_date: eventDate, description })
          .select()

        if (error) throw error

        setEvents((prev) => {
          const newList = [...prev, data?.[0] as TimelineEvent]
          return newList.sort(
            (a, b) =>
              new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
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

  const updateEvent = useCallback(
    async (id: number, title: string, eventDate: string, description: string) => {
      try {
        setError(null)

        if (isDemoMode()) {
          demoStorage.updateTimelineEvent(id, title, eventDate, description)
          setEvents(demoStorage.getTimeline())
          return
        }

        const { data, error } = await supabase
          .from('timeline_events')
          .update({ title, event_date: eventDate, description })
          .eq('id', id)
          .select()

        if (error) throw error

        setEvents((prev) => {
          const newList = prev.map((e) =>
            e.id === id ? (data?.[0] as TimelineEvent) : e
          )
          return newList.sort(
            (a, b) =>
              new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
          )
        })
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  const deleteEvent = useCallback(async (id: number) => {
    try {
      setError(null)

      if (isDemoMode()) {
        demoStorage.deleteTimelineEvent(id)
        setEvents(demoStorage.getTimeline())
        return
      }

      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', id)

      if (error) throw error

      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }, [])

  return {
    events,
    loading,
    error,
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
