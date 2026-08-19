import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import type { PhotoComment, Identity } from '../types'

export function usePhotoComments(photoId: number | undefined) {
  const [comments, setComments] = useState<PhotoComment[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    if (photoId === undefined) {
      setComments([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 20))
        setComments(demoStorage.getPhotoComments(photoId))
        return
      }

      const { data, error: fetchError } = await supabase
        .from('photo_comments')
        .select('*')
        .eq('photo_id', photoId)
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError
      setComments(data || [])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [photoId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const createComment = useCallback(
    async (content: string, author: Identity) => {
      if (photoId === undefined) return
      try {
        setSubmitting(true)
        setError(null)

        if (isDemoMode()) {
          const newComment = demoStorage.addPhotoComment(photoId, author, content)
          setComments((prev) => [...prev, newComment])
          return newComment
        }

        const { data, error: insertError } = await supabase
          .from('photo_comments')
          .insert({
            photo_id: photoId,
            author,
            content,
          })
          .select()

        if (insertError) throw insertError
        if (data && data.length > 0) {
          setComments((prev) => [...prev, data[0] as PhotoComment])
        }
        return data?.[0]
      } catch (e: any) {
        setError(e.message)
        throw e
      } finally {
        setSubmitting(false)
      }
    },
    [photoId]
  )

  const deleteComment = useCallback(
    async (commentId: number) => {
      if (photoId === undefined) return
      try {
        setError(null)

        if (isDemoMode()) {
          demoStorage.deletePhotoComment(commentId)
          setComments((prev) => prev.filter((c) => c.id !== commentId))
          return
        }

        const { error: deleteError } = await supabase
          .from('photo_comments')
          .delete()
          .eq('id', commentId)

        if (deleteError) throw deleteError
        setComments((prev) => prev.filter((c) => c.id !== commentId))
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    [photoId]
  )

  return {
    comments,
    loading,
    submitting,
    error,
    fetchComments,
    createComment,
    deleteComment,
  }
}
