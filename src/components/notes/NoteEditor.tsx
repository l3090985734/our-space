import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send } from 'lucide-react'

const NOTE_DRAFT_KEY = 'our-space-note-draft'

function loadNoteDraft(): string {
  try {
    return localStorage.getItem(NOTE_DRAFT_KEY) || ''
  } catch {
    return ''
  }
}

function saveNoteDraft(content: string) {
  try {
    if (content) {
      localStorage.setItem(NOTE_DRAFT_KEY, content)
    } else {
      localStorage.removeItem(NOTE_DRAFT_KEY)
    }
  } catch {
    // ignore
  }
}

function clearNoteDraft() {
  try {
    localStorage.removeItem(NOTE_DRAFT_KEY)
  } catch {
    // ignore
  }
}

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
    if (isOpen) {
      setContent(loadNoteDraft())
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      saveNoteDraft(content)
    }
  }, [content, isOpen])

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleSubmit = async () => {
    if (!content.trim()) return
    await onSubmit(content.trim())
    clearNoteDraft()
    setContent('')
    onClose()
  }

  const handleClose = () => {
    onClose()
  }

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
            className="bg-white rounded-t-3xl w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-700">写纸条</h2>
                {content && (
                  <span className="text-xs text-sakura-deep flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sakura-deep animate-pulse" />
                    草稿已保存
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {content && (
                  <button
                    onClick={() => {
                      clearNoteDraft()
                      setContent('')
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors text-xs text-gray-500 hover:text-red-500"
                  >
                    清除
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
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
