import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Trash2, Edit3, Check, X, Plus, ZoomIn, } from 'lucide-react'
import { formatTimeAgo } from '../../lib/utils'
import { PhotoUpload } from './PhotoUpload'
import { PhotosSkeleton } from '../ui/PageSkeletons'
import { usePhotos } from '../../hooks/usePhotos'
import { useIdentity } from '../../hooks/useIdentity'

export function PhotoWall() {
  const { photos, loading, uploading, uploadPhoto, deletePhoto, updateCaption } = usePhotos()
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

  // 当外部数据变化导致 currentIndex 越界时自动回退
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

  const handleUpload = (file: File, caption: string) => {
    if (!identity) return
    return uploadPhoto(file, caption, identity)
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
        <PhotoUpload isOpen={showUpload} onClose={() => setShowUpload(false)} onUpload={handleUpload} uploading={uploading} identity={identity || 'he'} />
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
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden bg-sakura-light/20 select-none flex items-center justify-center"
        style={{ minHeight: '300px' }}
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
            className="relative w-full h-full flex items-center justify-center"
          >
            {/* 修改点：移除了 min-h-[300px]，让图片高度自适应 */}
            <img
              src={currentPhoto?.public_url || ''}
              alt={currentPhoto?.caption || '照片'}
              className="w-full h-auto object-contain"
            />
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
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              currentPhoto?.uploaded_by === 'he' ? 'bg-blue-100 text-blue-600' : 'bg-sakura-light text-sakura-deep'
            }`}>
              {currentPhoto?.uploaded_by === 'he' ? '他' : '她'}
            </span>
            <span className="text-xs text-gray-400">
              {currentPhoto && formatTimeAgo(currentPhoto.created_at)}
            </span>
          </div>
          {!editingCaption && (
            <button
              onClick={startEditCaption}
              className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
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
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => setEditingCaption(false)}
              className="px-3 py-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors"
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

      <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-sakura w-6' : 'bg-gray-300 hover:bg-gray-400'
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
              <img
                src={currentPhoto.public_url}
                alt={currentPhoto.caption || '照片'}
                className="max-w-full max-h-[85vh] object-contain"
              />
              {currentPhoto.caption && (
                <p className="text-white text-center mt-4 text-sm opacity-80">
                  {currentPhoto.caption}
                </p>
              )}
            </motion.div>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photos.map((_, index) => (
                <button
                  key={index}
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

      <PhotoUpload isOpen={showUpload} onClose={() => setShowUpload(false)} onUpload={handleUpload} uploading={uploading} identity={identity || 'he'} />
    </div>
  )
}