import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Image as ImageIcon, AlertCircle, XCircle } from 'lucide-react'
import { Skeleton } from '../ui/Skeleton'
import type { UploadProgress } from '../../lib/utils'
import { formatBytes, formatSeconds } from '../../lib/utils'

interface PhotoUploadProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, caption: string, opts?: {
    onPreviewReady?: (p: string) => void
    onProgress?: (p: UploadProgress) => void
  }) => Promise<void>
  uploading: boolean
  uploadProgress?: UploadProgress | null
  onCancelUpload?: () => void
}

export function PhotoUpload({
  isOpen,
  onClose,
  onUpload,
  uploading,
  uploadProgress,
  onCancelUpload,
}: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [caption, setCaption] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  /** 组件本地的进度副本，避免依赖父组件时闪烁 */
  const [localProgress, setLocalProgress] = useState<UploadProgress | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  useEffect(() => {
    setLocalProgress(uploadProgress ?? null)
  }, [uploadProgress])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewLoading(true)
      setUploadError(null)
      setLocalProgress(null)
      const newPreviewUrl = URL.createObjectURL(file)
      setSelectedFile(file)
      setPreviewUrl(newPreviewUrl)
    }
  }

  const handleImageLoad = () => {
    setPreviewLoading(false)
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    setUploadError(null)
    setLocalProgress(null)
    try {
      await onUpload(selectedFile, caption, {
        onProgress: (p) => setLocalProgress(p),
      })
      setSelectedFile(null)
      setPreviewUrl(null)
      setCaption('')
      setLocalProgress(null)
      onClose()
    } catch (e: any) {
      setUploadError(e?.message || '上传失败，请重试')
      setLocalProgress(null)
    }
  }

  const handleClose = () => {
    if (uploading) {
      onCancelUpload?.()
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    setUploadError(null)
    setLocalProgress(null)
    onClose()
  }

  const progress = localProgress
  const showProgressBar = uploading && progress

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-700">上传照片</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="关闭"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-sakura rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-sakura-light/50 transition-colors"
              >
                <ImageIcon className="w-12 h-12 text-sakura mb-4" />
                <p className="text-gray-600 mb-2">点击选择照片</p>
                <p className="text-sm text-gray-400">支持 JPG、PNG、GIF 等格式，自动压缩为 WebP</p>
                <p className="text-xs text-gray-300 mt-1">超过 2MB 自动显示上传进度</p>
              </div>
            ) : (
              <div className="mb-6">
                <div className="relative rounded-2xl overflow-hidden mb-4 bg-sakura-light/20">
                  {previewLoading && (
                    <Skeleton className="w-full h-64" />
                  )}
                  <img
                    src={previewUrl}
                    alt="预览"
                    loading="eager"
                    decoding="async"
                    className={`w-full h-auto max-h-64 object-contain ${previewLoading ? 'hidden' : 'block'}`}
                    onLoad={handleImageLoad}
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                      setPreviewLoading(false)
                    }}
                    disabled={uploading}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>

                  {/* ==================== 上传进度条区块（新） ==================== */}
                  {showProgressBar && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute left-0 right-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white"
                    >
                      <div className="flex items-center justify-between text-[11px] mb-2 leading-tight">
                        <span className="font-semibold text-sakura-light">
                          {progress.percent >= 100 ? '✅ 上传完成'
                            : progress.percent < 15 ? '📷 准备上传...'
                            : progress.percent < 100 ? '☁️ 上传到云端中...'
                            : '保存数据中...'}
                        </span>
                        <span className="tabular-nums opacity-90 font-medium">
                          {progress.percent}%
                        </span>
                      </div>

                      <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden mb-2">
                        <motion.div
                          className="h-full bg-gradient-to-r from-sakura-light via-sakura to-pink-400 rounded-full shadow-[0_0_6px_rgba(255,180,190,0.6)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.percent}%` }}
                          transition={{ duration: 0.18, ease: 'easeOut' }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] opacity-90 leading-tight">
                        <div className="tabular-nums">
                          <span className="mr-3">
                            {formatBytes(progress.loaded)}{' / '}{formatBytes(progress.total)}
                          </span>
                          {progress.speedBps > 0 && (
                            <span className="text-white/90 mr-3">
                              ⚡ {formatBytes(progress.speedBps)}/s
                            </span>
                          )}
                          {progress.etaSec > 0 && progress.percent < 95 && (
                            <span className="text-white/80">
                              预计还剩 {formatSeconds(progress.etaSec)}
                            </span>
                          )}
                          {progress.elapsedSec > 0 && (
                            <span className="ml-3 text-white/60">
                              耗时 {progress.elapsedSec}s
                            </span>
                          )}
                        </div>

                        {onCancelUpload && progress.percent < 95 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onCancelUpload()
                            }}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/25 transition-colors border border-white/15"
                          >
                            <XCircle className="w-3 h-3" />
                            <span>取消</span>
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                  {/* ==================== 进度条区块结束 ==================== */}
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    配文（可选）
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="想说点什么..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none resize-none disabled:opacity-60"
                    rows={3}
                    maxLength={100}
                    disabled={uploading}
                  />
                  <div className="mt-1 text-right">
                    <span className={`text-xs ${
                      caption.length >= 90
                        ? 'text-red-500 font-medium'
                        : caption.length >= 70
                        ? 'text-orange-500'
                        : 'text-gray-400'
                    }`}>
                      {caption.length}/100
                    </span>
                  </div>
                </div>

                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="whitespace-pre-wrap">{uploadError}</span>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="w-full py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium disabled:opacity-60 flex items-center justify-center gap-2 hover:shadow-lg transition-shadow active:scale-[0.98]"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {progress && progress.percent >= 100
                        ? '写入照片墙...'
                        : progress && progress.percent < 15
                        ? '准备上传...'
                        : '上传中...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      上传照片
                    </>
                  )}
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
