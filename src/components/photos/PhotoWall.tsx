import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Trash2, Edit3, Check, X, Plus, ZoomIn, AlertTriangle } from 'lucide-react'
import { formatTimeAgo } from '../../lib/utils'
import { PhotoUpload } from './PhotoUpload'
import { PhotoCommentSection } from './PhotoCommentSection'
import { PhotosSkeleton } from '../ui/PageSkeletons'
import { usePhotos } from '../../hooks/usePhotos'
import { useIdentity } from '../../hooks/useIdentity'
import type { UploadProgress } from '../../lib/utils'

/** 自定义 IntersectionObserver Hook：图片进入视口前 200px 才加载，避免同时请求几十张大图 */
function useLazyLoadWithObserver<T extends HTMLElement = HTMLElement>(
  threshold = 0.05,
  rootMargin = '200px 0px'
) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        })
      },
      { threshold, rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, inView] as const
}

/** 单张带懒加载 + 解码优先级的图片：先显示低质量缩略图（或本地乐观预览），解码完成后过渡到大图 */
function LazyLoadedPhotoImage({
  photo,
  onError,
}: {
  photo: {
    thumbnail?: string
    local_preview_url?: string
    public_url?: string
    caption?: string
  }
  onError?: (src: string) => void
}) {
  const [wrapperRef, inView] = useLazyLoadWithObserver<HTMLDivElement>()
  const [thumbReady, setThumbReady] = useState(false)
  const [fullReady, setFullReady] = useState(false)
  const [errored, setErrored] = useState(false)

  // 预览图（本地/thumbnail）始终显示，因为这些体积极小（<40kb）
  const posterSrc = photo.local_preview_url || photo.thumbnail
  const fullSrc = photo.public_url || ''

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      {/* 骨架/背景渐变（比纯白更有质感，也避免图片延迟加载时闪烁） */}
      <div className="absolute inset-0 bg-gradient-to-br from-sakura-light/60 via-white to-pink-50" />

      {/* 阶段 1：thumbnail / local_preview 先行加载 */}
      {posterSrc && !fullReady && (
        <img
          src={posterSrc}
          alt=""
          decoding="async"
          loading="lazy"
          draggable={false}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            thumbReady && !fullReady ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setThumbReady(true)}
          onError={() => setThumbReady(true)}
        />
      )}

      {/* 阶段 2：进入视口才开始加载大图（public_url），并先 decode 避免主线程抖动 */}
      {inView && fullSrc && !errored && (
        <img
          src={fullSrc}
          alt={photo.caption || '照片'}
          loading="lazy"
          decoding="async"
          draggable={false}
          className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
            fullReady ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => {
            const img = new Image()
            img.decoding = 'async'
            img.src = fullSrc
            img
              .decode()
              .catch(() => void 0)
              .finally(() => setFullReady(true))
          }}
          onError={() => {
            setErrored(true)
            onError?.(fullSrc)
          }}
        />
      )}
    </div>
  )
}

export function PhotoWall() {
  const {
    photos,
    loading,
    uploading,
    uploadPhotoWithProgress,
    uploadProgress,
    cancelUpload,
    deletePhoto,
    updateCaption,
    error: photosError,
  } = usePhotos()
  const { identity } = useIdentity()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showUpload, setShowUpload] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showLightbox, setShowLightbox] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionInput, setCaptionInput] = useState('')
  const [dragStartX, setDragStartX] = useState<number | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const currentPhoto = photos[currentIndex]

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDragStartX(clientX)
    setDragOffset(0)
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (dragStartX === null) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    setDragOffset(clientX - dragStartX)
    if ('touches' in e) {
      e.preventDefault()
    }
  }

  const handleDragEnd = () => {
    if (dragStartX === null) return
    const threshold = 50
    if (dragOffset > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    } else if (dragOffset < -threshold && currentIndex < photos.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
    setDragStartX(null)
    setDragOffset(0)
  }

  useEffect(() => {
    if (photos.length > 0 && currentIndex >= photos.length) {
      setCurrentIndex(photos.length - 1)
    }
  }, [photos.length, currentIndex])

  const handleDelete = () => {
    if (currentPhoto) {
      const willBeLast = currentIndex >= photos.length - 1 && currentIndex > 0
      deletePhoto(currentPhoto)
      setShowDeleteConfirm(false)
      if (willBeLast) {
        setCurrentIndex(currentIndex - 1)
      }
    }
  }

  const startEditCaption = () => {
    if (currentPhoto) {
      setCaptionInput(currentPhoto.caption)
      setEditingCaption(true)
    }
  }

  const saveCaption = async () => {
    if (currentPhoto) {
      await updateCaption(currentPhoto.id, captionInput)
      setEditingCaption(false)
    }
  }

  const handleUpload = (
    file: File,
    caption: string,
    opts?: {
      onPreviewReady?: (p: string) => void
      onProgress?: (p: UploadProgress) => void
    }
  ) => {
    if (!identity) return Promise.resolve()
    return uploadPhotoWithProgress(file, caption, identity, opts)
  }

  if (loading) {
    return <PhotosSkeleton />
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-24 h-24 rounded-full bg-sakura-light flex items-center justify-center mb-6">
          <Plus className="w-12 h-12 text-sakura" />
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">还没有照片</h2>
        <p className="text-gray-500 mb-6 text-center">
          上传第一张照片，记录你们的美好瞬间
        </p>
        <button
          onClick={() => setShowUpload(true)}
          className="px-8 py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium hover:shadow-lg transition-shadow"
        >
          上传照片
        </button>
        <PhotoUpload
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onUpload={handleUpload}
          uploading={uploading}
          uploadProgress={uploadProgress}
          onCancelUpload={cancelUpload}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-700">照片墙</h1>
        <button
          onClick={() => setShowUpload(true)}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-sakura to-sakura-deep text-white flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        共 {photos.length} 张 · 第 {currentIndex + 1} 张
      </p>

      {photosError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="whitespace-pre-wrap">{photosError}</span>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden bg-sakura-light/20 select-none aspect-[4/3] flex items-center justify-center"
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPhoto?.id}
            initial={{ opacity: 0, x: dragOffset > 0 ? -100 : 100 }}
            animate={{ opacity: 1, x: dragOffset }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {currentPhoto?.upload_status === 'uploading' ? (
              <div className="absolute inset-0">
                <LazyLoadedPhotoImage
                  photo={{
                    thumbnail: currentPhoto.thumbnail,
                    local_preview_url: currentPhoto.local_preview_url,
                    caption: currentPhoto.caption,
                  }}
                />
                <div className="absolute left-0 right-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/30 to-transparent text-white">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-sakura-light">⏳ 上传中...乐观展示</span>
                    <span className="tabular-nums">
                      {uploadProgress ? `${uploadProgress.percent}%` : '初始化...'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-sakura-light via-sakura to-pink-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress?.percent ?? 0}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              </div>
            ) : currentPhoto?.upload_status === 'failed' ? (
              <div className="absolute inset-0">
                <LazyLoadedPhotoImage
                  photo={{
                    thumbnail: currentPhoto.thumbnail,
                    local_preview_url: currentPhoto.local_preview_url,
                    caption: currentPhoto.caption,
                  }}
                />
                <div className="absolute inset-0 bg-red-900/40 backdrop-blur-[1px] flex flex-col items-center justify-center px-4 text-white text-center">
                  <AlertTriangle className="w-10 h-10 mb-2 text-red-200" />
                  <p className="font-semibold mb-1">上传失败</p>
                  <p className="text-xs opacity-90 mb-3">
                    {photosError || '请检查网络后，删除这张占位图并重新上传'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-4 py-1.5 rounded-full bg-red-500 hover:bg-red-600 text-xs font-medium shadow"
                    >
                      删除并清理
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0">
                <LazyLoadedPhotoImage
                  photo={currentPhoto ?? {}}
                />
              </div>
            )}

            {currentIndex > 0 && (
              <button
                onClick={goToPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            {currentIndex < photos.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
            <div className="absolute top-3 right-3 flex gap-2">
              <button
                onClick={() => setShowLightbox(true)}
                className="w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-black/50 transition-colors"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-10 h-10 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-red-500/70 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-4 bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              currentPhoto?.uploaded_by === 'he' ? 'bg-blue-100 text-blue-600' : 'bg-sakura-light text-sakura-deep'
            }`}>
              {currentPhoto?.uploaded_by === 'he' ? '他' : '她'}
            </span>
            {currentPhoto?.upload_status === 'uploading' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                ⏳ 上传中
              </span>
            )}
            {currentPhoto?.upload_status === 'failed' && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
                ❌ 上传失败
              </span>
            )}
            <span className="text-xs text-gray-400">
              {currentPhoto && formatTimeAgo(currentPhoto.created_at)}
            </span>
          </div>
          {!editingCaption && (
            <button
              onClick={startEditCaption}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="编辑配文"
            >
              <Edit3 className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        {editingCaption ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              placeholder="写点什么..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none text-sm"
              autoFocus
            />
            <button
              onClick={saveCaption}
              className="px-3 py-2 bg-sakura text-white rounded-xl hover:bg-sakura-deep transition-colors"
              aria-label="保存配文"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingCaption(false)}
              className="px-3 py-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
              aria-label="取消编辑"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <p className="text-gray-700">
            {currentPhoto?.caption || '点击右上角编辑配文 ✏️'}
          </p>
        )}
      </div>

      <PhotoCommentSection photoId={currentPhoto?.id} />

      <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
        {photos.map((_, index) => (
          <button
            key={photos[index].id}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-sakura w-6' : 'bg-gray-300 hover:bg-gray-400'
            } ${
              photos[index].upload_status === 'failed' ? 'ring-2 ring-red-400' : ''
            }`}
          />
        ))}
      </div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                确认删除
              </h3>
              <p className="text-gray-500 mb-6">
                删除后无法恢复，确定要删除这张照片吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLightbox && currentPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
            onClick={() => setShowLightbox(false)}
          >
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors z-10"
              aria-label="关闭"
            >
              <X className="w-6 h-6" />
            </button>
            {currentIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToPrev()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors z-10"
                aria-label="上一张"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {currentIndex < photos.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  goToNext()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors z-10"
                aria-label="下一张"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            <motion.div
              key={currentPhoto.id}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-full max-h-full p-4"
              onClick={(e) => e.stopPropagation()}
            >
              {currentPhoto.upload_status === 'uploading' && currentPhoto.local_preview_url ? (
                <img
                  src={currentPhoto.local_preview_url}
                  alt={currentPhoto.caption || '照片预览'}
                  className="max-w-full max-h-[85vh] object-contain"
                />
              ) : (
                <img
                  src={currentPhoto.public_url}
                  alt={currentPhoto.caption || '照片'}
                  loading="eager"
                  decoding="async"
                  className="max-w-full max-h-[85vh] object-contain"
                />
              )}
              {currentPhoto.caption && (
                <p className="text-white text-center mt-4 text-sm opacity-80">
                  {currentPhoto.caption}
                </p>
              )}
            </motion.div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, index) => (
                <button
                  key={photos[index].id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentIndex(index)
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-white w-6' : 'bg-white/40 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PhotoUpload
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={handleUpload}
        uploading={uploading}
        uploadProgress={uploadProgress}
        onCancelUpload={cancelUpload}
      />
    </div>
  )
}