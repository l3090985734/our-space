import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import type { Note, Identity } from '../types'

const PAGE_SIZE = 20

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null)
  const [replies, setReplies] = useState<Record<number, Note[]>>({})
  const pageRef = useRef(0)

  const fetchNotes = useCallback(async (page = 0, append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)

      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 300))
        const allNotes = demoStorage.getNotes().filter((n) => n.parent_id === null)
        const start = page * PAGE_SIZE
        const end = start + PAGE_SIZE
        const pageData = allNotes.slice(start, end)
        
        if (pageData.length < PAGE_SIZE) {
          setHasMore(false)
        }

        if (append) {
          setNotes((prev) => [...prev, ...pageData])
        } else {
          setNotes(pageData)
          setHasMore(allNotes.length > PAGE_SIZE)
        }
        pageRef.current = page
        return
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .is('parent_id', null)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (error) throw error

      const notesData = data || []

      if (notesData.length < PAGE_SIZE) {
        setHasMore(false)
      }

      if (append) {
        setNotes((prev) => [...prev, ...notesData])
      } else {
        setNotes(notesData)
        pageRef.current = 0
        setHasMore(notesData.length === PAGE_SIZE)
      }

      pageRef.current = page
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    fetchNotes(0, false)
  }, [fetchNotes])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    fetchNotes(pageRef.current + 1, true)
  }, [loadingMore, hasMore, fetchNotes])

  const createNote = useCallback(
    async (content: string, author: Identity, parentId?: number) => {
      try {
        setError(null)

        if (isDemoMode()) {
          const newNote = demoStorage.addNote(author, content, parentId || null)
          if (parentId) {
            setReplies((prev) => ({
              ...prev,
              [parentId]: [...(prev[parentId] || []), newNote],
            }))
          } else {
            setNotes((prev) => [newNote, ...prev])
          }
          return newNote
        }

        const { data, error } = await supabase
          .from('notes')
          .insert({
            content,
            author,
            parent_id: parentId || null,
          })
          .select()

        if (error) throw error

        if (parentId) {
          setReplies((prev) => ({
            ...prev,
            [parentId]: [...(prev[parentId] || []), ...(data || [])],
          }))
        } else {
          setNotes((prev) => [data?.[0] as Note, ...prev])
        }

        return data?.[0]
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  const fetchReplies = useCallback(async (noteId: number) => {
    try {
      setError(null)

      if (isDemoMode()) {
        const replyList = demoStorage.getNoteReplies(noteId)
        setReplies((prev) => ({
          ...prev,
          [noteId]: replyList,
        }))
        return replyList
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('parent_id', noteId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setReplies((prev) => ({
        ...prev,
        [noteId]: data || [],
      }))

      return data || []
    } catch (e: any) {
      setError(e.message)
      throw e
    }
  }, [])

  const toggleExpand = useCallback(
    async (noteId: number) => {
      if (expandedNoteId === noteId) {
        setExpandedNoteId(null)
      } else {
        setExpandedNoteId(noteId)
        if (!replies[noteId]) {
          await fetchReplies(noteId)
        }
      }
    },
    [expandedNoteId, replies, fetchReplies]
  )

  return {
    notes,
    replies,
    loading,
    loadingMore,
    hasMore,
    error,
    expandedNoteId,
    loadMore,
    createNote,
    toggleExpand,
    refreshNotes: () => fetchNotes(0, false),
  }
}
