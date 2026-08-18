import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  generateThumbnail,
  xhrUploadWithProgress,
  type UploadProgress,
} from '../lib/utils'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import { onRefresh } from '../lib/refreshEvent'
import type { Photo, Identity } from '../types'

/** 从文件名推断扩展名；取不到或无扩展名时按 MIME 兜底，最后用 jpg 保底 */
function inferFileExt(file: File): string {
  const dot = file.name.lastIndexOf('.')
  if (dot > 0) {
    const raw = file.name.slice(dot + 1).toLowerCase().slice(0, 8)
    if (raw) return raw.replace(/[^a-z0-9]/g, '')
  }
  switch (file.type) {
    case 'image/png': return 'png'
    case 'image/gif': return 'gif'
    case 'image/webp': return 'webp'
    case 'image/bmp': return 'bmp'
    case 'image/tiff': return 'tiff'
    default: return 'jpg'
  }
}

/** 取上传用的真实 MIME：file.type 可能是空字符串，兜底成 jpeg */
function inferMimeType(file: File): string {
  if (file.type && file.type.startsWith('image/')) return file.type
  const ext = inferFileExt(file)
  if (ext === 'png') return 'image/png'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'webp') return 'image/webp'
  return 'image/jpeg'
}

/** 将 Supabase 英文错误转为中文提示 */
function translateError(message: string): string {
  if (message.includes('schema cache')) {
    return '数据库表结构不匹配，请检查 Supabase 表是否已创建'
  }
  if (message.includes('row-level security') || message.includes('policy')) {
    return '权限不足，请检查 Supabase RLS 策略配置'
  }
  if (message.includes('duplicate') || message.includes('unique')) {
    return '数据重复，请勿重复操作'
  }
  if (message.includes('Aborted') || message.includes('取消')) {
    return '上传已取消'
  }
  return message
}

/** 分段上传体积阈值（单 Blob 超过 2MB 走 xhr 进度；2MB 以下直接用 supabase storage upload） */
const XHR_UPLOAD_THRESHOLD_BYTES = 2 * 1024 * 1024

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const aborterRef = useRef<AbortController | null>(null)

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

      const photosWithUrls = (data || []).map((photo: any) => {
        const { data: urlData } = supabase.storage
          .from('photos')
          .getPublicUrl(photo.storage_path)
        return {
          ...photo,
          public_url: urlData.publicUrl,
        }
      })

      setPhotos(photosWithUrls)
    } catch (e: any) {
      setError(translateError(e.message))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPhotos()
    return onRefresh(fetchPhotos)
  }, [fetchPhotos])

  /**
   * 【无压缩直传版】用户明确要求去掉 canvas 压缩：
   *   阶段 0：URL.createObjectURL(file) 做预览（零 canvas、零 new Image、零阻塞）
   *   阶段 1：generateThumbnail 做 40px 小缩略图；失败给空字符串不阻塞
   *   阶段 2：原始 File Blob 直接上传，保留 >2MB xhr 实时进度
   *   阶段 3：成功 → 替换乐观占位；失败 → 标记 failed + Toast 错误 + 回滚 orphan 文件
   */
  const uploadPhotoWithProgress = useCallback(
    async (
      file: File,
      caption: string,
      uploadedBy: Identity,
      opts?: {
        onPreviewReady?: (localPreviewDataUrl: string) => void
        onProgress?: (p: UploadProgress) => void
        signal?: AbortSignal
      }
    ) => {
      let uploadedPath: string | null = null
      let optimisticId: number | null = null
      const uploadBlob: Blob = file // 直接传原始文件，不压缩
      const uploadMimeType = inferMimeType(file)
      const uploadExt = inferFileExt(file)
      const uploadTotal = uploadBlob.size

      // 阶段 0：直接用浏览器原生 ObjectURL 做预览
      // 100% 不做 canvas/new Image，HEIC/损坏/超大图都不会卡住
      let localPreviewDataUrl = ''
      try {
        localPreviewDataUrl = URL.createObjectURL(file)
      } catch {
        localPreviewDataUrl = ''
      }
      opts?.onPreviewReady?.(localPreviewDataUrl)

      try {
        setUploading(true)
        setError(null)
        // 直接进入上传阶段（跳过压缩 0~20 的区间，从 5% 开始让用户看到"已开始"）
        setUploadProgress({
          percent: 5, loaded: 0, total: uploadTotal,
          speedBps: 0, etaSec: 0, elapsedSec: 0,
        })

        // ============= 乐观插入：用户立刻看到新照片 =============
        optimisticId = -(Date.now() + Math.floor(Math.random() * 10000))
        setPhotos((prev) => [
          {
            id: optimisticId as number,
            storage_path: '__uploading__',
            caption,
            uploaded_by: uploadedBy,
            sort_order: 0,
            created_at: new Date().toISOString(),
            thumbnail: localPreviewDataUrl,
            local_preview_url: localPreviewDataUrl,
            upload_status: 'uploading',
          },
          ...prev,
        ])

        // ============= 阶段 1：生成 40px 缩略图（仅照片墙卡片用，失败不阻塞，兜底空串）=============
        const thumbnail = await generateThumbnail(file, 40, 0.3).catch(() => '')

        // 缩略图完成，进度跳到 10%（进入真正上传阶段）
        setUploadProgress((p) => (p ? { ...p, percent: 10 } : null))
        opts?.onProgress?.({ percent: 10, loaded: 0, total: uploadTotal, speedBps: 0, etaSec: 0, elapsedSec: 0 })

        if (isDemoMode()) {
          // Demo：模拟上传 10%~100%
          let prog = 10
          const demoStartTs = Date.now()
          while (prog < 95) {
            await new Promise((r) => setTimeout(r, 40))
            prog = Math.min(95, prog + 4)
            const loaded = Math.round((prog / 100) * uploadTotal)
            const dt = (Date.now() - demoStartTs) / 1000
            const speed = dt > 0 ? Math.round(loaded / dt) : 0
            const update: UploadProgress = {
              percent: prog, loaded, total: uploadTotal,
              speedBps: speed,
              etaSec: speed > 0 ? Math.round((uploadTotal - loaded) / speed) : 0,
              elapsedSec: Math.round(dt),
            }
            setUploadProgress(update)
            opts?.onProgress?.(update)
          }

          const fileDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(reader.error || new Error('read failed'))
            reader.readAsDataURL(uploadBlob)
          })
          const newPhoto = demoStorage.addPhoto(
            `demo/${Date.now()}.${uploadExt}`,
            caption,
            uploadedBy,
            fileDataUrl,
            thumbnail
          )
          setPhotos((prev) => prev.map((p) => (p.id === optimisticId ? newPhoto : p)))
          setUploadProgress({ percent: 100, loaded: uploadTotal, total: uploadTotal, speedBps: 0, etaSec: 0, elapsedSec: 0 })
          opts?.onProgress?.({ percent: 100, loaded: uploadTotal, total: uploadTotal, speedBps: 0, etaSec: 0, elapsedSec: 0 })
          return
        }

        // ============= 阶段 2：Supabase 上传原始文件（>2MB 走 xhr 进度；<2MB 直接 storage.upload）=============
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${uploadExt}`
        const filePath = `${uploadedBy}/${fileName}`

        if (uploadBlob.size >= XHR_UPLOAD_THRESHOLD_BYTES) {
          const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined
          const sbUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined
          // 路径按段编码：保护"/"目录分隔符，避免"他%2Ffile.webp"存成单个文件名
          const uploadEndpoint = sbUrl && anonKey
            ? `${sbUrl.replace(/\/$/, '')}/storage/v1/object/photos/${filePath.split('/').map(encodeURIComponent).join('/')}`
            : null

          if (uploadEndpoint) {
            aborterRef.current = opts?.signal ? null : new AbortController()
            const signal = opts?.signal ?? aborterRef.current!.signal
            try {
              await xhrUploadWithProgress(
                uploadEndpoint,
                anonKey!,
                uploadBlob,
                uploadMimeType,
                (p) => {
                  // 上传阶段映射到 10%~100%（前面 10% 是缩略图+准备）
                  const blended: UploadProgress = {
                    ...p,
                    percent: 10 + Math.round(p.percent * 0.9),
                  }
                  setUploadProgress(blended)
                  opts?.onProgress?.(blended)
                },
                signal
              )
              uploadedPath = filePath
            } finally {
              aborterRef.current = null
            }
          } else {
            // 没有配置 URL 时回退 storage.upload（无进度）
            const { error: uploadError } = await supabase.storage
              .from('photos')
              .upload(filePath, uploadBlob, { contentType: uploadMimeType })
            if (uploadError) throw uploadError
            uploadedPath = filePath
            setUploadProgress({ percent: 100, loaded: uploadTotal, total: uploadTotal, speedBps: 0, etaSec: 0, elapsedSec: 0 })
          }
        } else {
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, uploadBlob, { contentType: uploadMimeType })
          if (uploadError) throw uploadError
          uploadedPath = filePath
          setUploadProgress({ percent: 95, loaded: uploadTotal, total: uploadTotal, speedBps: 0, etaSec: 0, elapsedSec: 0 })
          opts?.onProgress?.({ percent: 95, loaded: uploadTotal, total: uploadTotal, speedBps: 0, etaSec: 0, elapsedSec: 0 })
        }

        // 写入 DB
        const { error: dbError } = await supabase.from('photos').insert({
          storage_path: filePath,
          caption,
          uploaded_by: uploadedBy,
        })
        if (dbError) throw dbError

        setUploadProgress((p) => (p ? { ...p, percent: 100 } : null))

        // 从 DB 重新 fetch 到最新记录后，把占位的 optimistic 替换掉（保证 id 正确）
        await fetchPhotos()
      } catch (e: any) {
        // 回滚：DB 写失败 → 删 Storage 孤儿文件
        if (uploadedPath && !isDemoMode()) {
          try {
            await supabase.storage.from('photos').remove([uploadedPath])
          } catch (cleanupError) {
            console.error('Failed to clean up orphaned file:', cleanupError)
          }
        }
        // UI 乐观占位标记为失败（保持在列表里让用户能看到"失败"，也方便重试）
        if (optimisticId != null) {
          setPhotos((prev) => prev.map((p) => (p.id === optimisticId ? { ...p, upload_status: 'failed' } : p)))
        }
        const msg = translateError(e?.message || String(e))
        setError(msg)
        setUploadProgress(null)
        throw Object.assign(e instanceof Error ? e : new Error(String(e)), { message: msg })
      } finally {
        setUploading(false)
      }
    },
    [fetchPhotos]
  )

  /** 保留老的 uploadPhoto 接口，内部走带进度的新函数，保证旧代码兼容性 */
  const uploadPhoto = useCallback(
    async (file: File, caption: string, uploadedBy: Identity) => {
      return uploadPhotoWithProgress(file, caption, uploadedBy)
    },
    [uploadPhotoWithProgress]
  )

  /** 取消当前上传 */
  const cancelUpload = useCallback(() => {
    aborterRef.current?.abort()
    aborterRef.current = null
  }, [])

  const deletePhoto = useCallback(
    async (photo: Photo) => {
      try {
        setError(null)

        if (photo.upload_status === 'uploading' || photo.id < 0) {
          // 乐观上传中的照片，直接移除 UI 占位 + 取消上传
          cancelUpload()
          setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
          return
        }

        if (isDemoMode()) {
          demoStorage.deletePhoto(photo.id)
          setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
          return
        }

        const { error: dbError } = await supabase
          .from('photos')
          .delete()
          .eq('id', photo.id)

        if (dbError) throw dbError

        setPhotos((prev) => prev.filter((p) => p.id !== photo.id))

        const { error: storageError } = await supabase.storage
          .from('photos')
          .remove([photo.storage_path])

        if (storageError) {
          console.error('Failed to delete storage file (orphaned):', storageError)
        }
      } catch (e: any) {
        setError(translateError(e.message))
        throw e
      }
    },
    [cancelUpload]
  )

  const updateCaption = useCallback(
    async (photoId: number, caption: string) => {
      try {
        setError(null)

        if (photoId < 0) {
          setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, caption } : p)))
          return
        }

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
        setError(translateError(e.message))
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
    uploadProgress,
    fetchPhotos,
    uploadPhoto,
    uploadPhotoWithProgress,
    cancelUpload,
    deletePhoto,
    updateCaption,
  }
}
