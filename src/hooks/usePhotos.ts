import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import {
  compressImage,
  generateThumbnail,
  fastPreview,
  xhrUploadWithProgress,
  type UploadProgress,
  type CompressedImage,
} from '../lib/utils'
import { demoStorage, isDemoMode } from '../lib/mockStorage'
import { onRefresh } from '../lib/refreshEvent'
import type { Photo, Identity } from '../types'

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
   * 【性能优化版上传】
   * 阶段 1（<200ms）：生成 400px 低质量预览图 + 乐观插入照片列表 → 用户立刻看到刚选的照片
   * 阶段 2：后台生成缩略图 + 1080p WebP 压缩 + 上传（超过 2MB 走 xhr 实时进度）
   * 阶段 3：成功后替换为真实 public_url / 失败则标记 failed + Toast 错误 + 回滚逻辑
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
      // 阶段 0：快速预览。fastPreview 失败（浏览器不支持的格式 / 损坏图 / 超时）时
      // 不要直接让整个上传失败，降级为 object URL 让用户能先看到预览；
      // 后面压缩阶段如果还失败会正常抛错走 catch（不会永久卡压缩中）。
      const localPreviewDataUrl = await fastPreview(file, 400).catch(() => {
        try {
          return URL.createObjectURL(file)
        } catch {
          return ''
        }
      })
      opts?.onPreviewReady?.(localPreviewDataUrl)

      try {
        setUploading(true)
        setError(null)
        setUploadProgress({
          percent: 1, loaded: 0, total: file.size,
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

        // ============= 阶段 2：并行生成 thumbnail + 压缩原图（CPU 并行 + requestIdleCallback）=============
        // compressImage 返回 { blob, format, mimeType }：
        //   - Safari 不支持 WebP 会 fallback 成 JPEG，format/mimeType 会相应变化
        //   - 后续扩展名、Content-Type、文件名必须用实际格式，否则会出现"文件后缀 .webp 实际内容 JPEG"的裂图
        const [thumbnail, compressed] = await Promise.all<[Promise<string>, Promise<CompressedImage>]>([
          generateThumbnail(file, 40, 0.3) as Promise<string>,
          compressImage(file, 1280, 0.78, 'webp'),
        ])
        const compressedBlob = compressed.blob
        const compressedFormat = compressed.format // 'webp' 或 'jpeg'（Safari fallback 后）
        const compressedMimeType = compressed.mimeType

        // 压缩完更新进度（20% → 对应"压缩完成"）
        setUploadProgress((p) => (p ? { ...p, percent: 20 } : null))
        opts?.onProgress?.({ percent: 20, loaded: 0, total: compressedBlob.size, speedBps: 0, etaSec: 0, elapsedSec: 0 })

        if (isDemoMode()) {
          // Demo：模拟压缩完成 + 上传 0~100
          const totalDemo = compressedBlob.size
          let prog = 20
          const demoStartTs = Date.now()
          while (prog < 95) {
            await new Promise((r) => setTimeout(r, 40))
            prog = Math.min(95, prog + 5)
            const loaded = Math.round((prog / 100) * totalDemo)
            const dt = (Date.now() - demoStartTs) / 1000
            const speed = dt > 0 ? Math.round(loaded / dt) : 0
            const update: UploadProgress = {
              percent: prog, loaded, total: totalDemo,
              speedBps: speed,
              etaSec: speed > 0 ? Math.round((totalDemo - loaded) / speed) : 0,
              elapsedSec: Math.round(dt),
            }
            setUploadProgress(update)
            opts?.onProgress?.(update)
          }

          const compressedUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(compressedBlob)
          })
          const newPhoto = demoStorage.addPhoto(
            `demo/${Date.now()}.${compressedFormat}`,
            caption,
            uploadedBy,
            compressedUrl,
            thumbnail
          )
          // 替换乐观占位为真实记录
          setPhotos((prev) => prev.map((p) => (p.id === optimisticId ? newPhoto : p)))
          setUploadProgress({ percent: 100, loaded: totalDemo, total: totalDemo, speedBps: 0, etaSec: 0, elapsedSec: 0 })
          opts?.onProgress?.({ percent: 100, loaded: totalDemo, total: totalDemo, speedBps: 0, etaSec: 0, elapsedSec: 0 })
          return
        }

        // ============= 阶段 3：Supabase 上传（>2MB走xhr进度；<2MB直接 storage.upload）=============
        // 扩展名 / contentType 用压缩后的实际格式（可能因 WebP fallback 变成 jpeg）
        const fileExt = compressedFormat
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${uploadedBy}/${fileName}`

        if (compressedBlob.size >= XHR_UPLOAD_THRESHOLD_BYTES) {
          const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined
          const sbUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined
          // Bug 修复：之前 encodeURIComponent(filePath) 把「他/xxx.webp」整个编码成「%E4%BB%96%2Fxxx.webp」，
          // 导致 / 被变成字面量文件名的一部分，Supabase 存的是"他%2Fxxx.webp"单个文件（不是目录结构），
          // 前端 DB 拿的 storage_path 是"他/xxx.webp"，getPublicUrl 找不到 → 裂图 404。
          // 修复：按 / 分段，每一段单独 encodeURIComponent，再用 / 拼回去。
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
                compressedBlob,
                compressedMimeType, // 实际 MIME：image/webp 或 image/jpeg
                (p) => {
                  // 把压缩占用的 20% 比例叠加进来：上传部分映射为 20%~100%
                  const blended: UploadProgress = {
                    ...p,
                    percent: 20 + Math.round(p.percent * 0.8),
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
            // 没有配置 VITE_SUPABASE_URL，回退 storage.upload（无进度）
            const { error: uploadError } = await supabase.storage
              .from('photos')
              .upload(filePath, compressedBlob, {
                contentType: compressedMimeType,
              })
            if (uploadError) throw uploadError
            uploadedPath = filePath
            setUploadProgress({ percent: 100, loaded: compressedBlob.size, total: compressedBlob.size, speedBps: 0, etaSec: 0, elapsedSec: 0 })
          }
        } else {
          const { error: uploadError } = await supabase.storage
            .from('photos')
            .upload(filePath, compressedBlob, {
              contentType: compressedMimeType,
            })
          if (uploadError) throw uploadError
          uploadedPath = filePath
          setUploadProgress({ percent: 95, loaded: compressedBlob.size, total: compressedBlob.size, speedBps: 0, etaSec: 0, elapsedSec: 0 })
          opts?.onProgress?.({ percent: 95, loaded: compressedBlob.size, total: compressedBlob.size, speedBps: 0, etaSec: 0, elapsedSec: 0 })
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
