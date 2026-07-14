import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage } from '../lib/utils'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import type { Photo, Identity } from '../types'

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPhotos = useCallback(async () => {
    try {
      setLoading(true)

      if (isDemoMode()) {
        await new Promise((r) => setTimeout(r, 300))
        setPhotos(demoStorage.getPhotos())
        return
      }

      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const photosWithUrls = await Promise.all(
        (data || []).map(async (photo: any) => {
          const { data: urlData } = supabase.storage
            .from('photos')
            .getPublicUrl(photo.storage_path)
          return {
            ...photo,
            public_url: urlData.publicUrl,
          }
        })
      )

      setPhotos(photosWithUrls)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
  }, [fetchPhotos])

  const uploadPhoto = useCallback(
    async (file: File, caption: string, uploadedBy: Identity) => {
      try {
        setUploading(true)
        setError(null)

        if (isDemoMode()) {
          await new Promise((r) => setTimeout(r, 500))
          const compressedBlob = await compressImage(file)
          const compressedUrl = await new Promise<string>((resolve) => {
            const reader2 = new FileReader()
            reader2.onload = () => resolve(reader2.result as string)
            reader2.readAsDataURL(compressedBlob)
          })
          const newPhoto = demoStorage.addPhoto(
            `demo/${Date.now()}.jpg`,
            caption,
            uploadedBy,
            compressedUrl
          )
          setPhotos((prev) => [newPhoto, ...prev])
          return
        }

        const compressedBlob = await compressImage(file)
        const fileExt = 'jpg'
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`
        const filePath = `${uploadedBy}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(filePath, compressedBlob, {
            contentType: 'image/jpeg',
          })

        if (uploadError) throw uploadError

        const { error: dbError } = await supabase.from('photos').insert({
          storage_path: filePath,
          caption,
          uploaded_by: uploadedBy,
        })

        if (dbError) throw dbError

        await fetchPhotos()
      } catch (e: any) {
        setError(e.message)
        throw e
      } finally {
        setUploading(false)
      }
    },
    [fetchPhotos]
  )

  const deletePhoto = useCallback(
    async (photo: Photo) => {
      try {
        setError(null)

        if (isDemoMode()) {
          demoStorage.deletePhoto(photo.id)
          setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
          return
        }

        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove([photo.storage_path])

        if (storageError) throw storageError

        const { error: dbError } = await supabase
          .from('photos')
          .delete()
          .eq('id', photo.id)

        if (dbError) throw dbError

        setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  const updateCaption = useCallback(
    async (photoId: number, caption: string) => {
      try {
        setError(null)

        if (isDemoMode()) {
          demoStorage.updatePhotoCaption(photoId, caption)
          setPhotos((prev) =>
            prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
          )
          return
        }

        const { error } = await supabase
          .from('photos')
          .update({ caption })
          .eq('id', photoId)

        if (error) throw error

        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, caption } : p))
        )
      } catch (e: any) {
        setError(e.message)
        throw e
      }
    },
    []
  )

  return {
    photos,
    loading,
    uploading,
    error,
    fetchPhotos,
    uploadPhoto,
    deletePhoto,
    updateCaption,
  }
}
