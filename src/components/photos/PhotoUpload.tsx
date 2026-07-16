import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react'
import type { Identity } from '../../types'

interface PhotoUploadProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, caption: string) => void
  uploading: boolean
  identity: Identity
}

export function PhotoUpload({
  isOpen,
  onClose,
  onUpload,
  uploading,
}: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) return
    setUploadError(null)
    try {
      await onUpload(selectedFile, caption)
      setSelectedFile(null)
      setPreviewUrl(null)
      setCaption('')
      onClose()
    } catch (e: any) {
      setUploadError(e?.message || '上传失败，请重试')
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setCaption('')
    setUploadError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
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
                <p className="text-sm text-gray-400">支持 JPG、PNG 格式</p>
              </div>
            ) : (
              <div className="mb-6">
                <div className="relative rounded-2xl overflow-hidden mb-4">
                  <img
                    src={previewUrl}
                    alt="预览"
                    className="w-full h-auto max-h-64 object-contain"
                  />
                  <button
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    配文（可选）
                  </label>
                  <textarea
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="想说点什么..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none resize-none"
                    rows={3}
                  />
                </div>

                {uploadError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="w-full py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      上传中...
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
