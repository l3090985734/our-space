import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'

interface NoteEditorProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (content: string) => void
  submitting: boolean
}

export function NoteEditor({
  isOpen,
  onClose,
  onSubmit,
  submitting,
}: NoteEditorProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!content.trim()) return
    await onSubmit(content.trim())
    setContent('')
    onClose()
  }

  const handleClose = () => {
    setContent('')
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
            className="bg-white rounded-t-3xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-700">写纸条</h2>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="想说点什么..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none resize-none min-h-32"
              maxLength={500}
            />

            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-400">
                {content.length}/500
              </span>
              <button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
                className="px-6 py-2.5 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium disabled:opacity-50 flex items-center gap-2 hover:shadow-lg transition-shadow"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                发送
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
