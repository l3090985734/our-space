import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, Calendar, Clock, Sparkles, Gift } from 'lucide-react'

const DRAFT_KEY = 'our-space-capsule-draft'

interface CapsuleDraft {
  title: string
  content: string
  unlockDate: string
  unlockTime: string
}

function loadDraft(): CapsuleDraft | null {
  try {
    const data = localStorage.getItem(DRAFT_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

function saveDraft(draft: CapsuleDraft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  } catch {
    // ignore
  }
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {
    // ignore
  }
}

interface CapsuleEditorProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, content: string, unlockAt: string, imageUrl?: string) => void
  submitting: boolean
}

export function CapsuleEditor({
  isOpen,
  onClose,
  onSubmit,
  submitting,
}: CapsuleEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [unlockDate, setUnlockDate] = useState('')
  const [unlockTime, setUnlockTime] = useState('20:00')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      const draft = loadDraft()
      if (draft) {
        setTitle(draft.title)
        setContent(draft.content)
        setUnlockDate(draft.unlockDate)
        setUnlockTime(draft.unlockTime)
      } else {
        const nextMonth = new Date()
        nextMonth.setMonth(nextMonth.getMonth() + 1)
        setUnlockDate(nextMonth.toISOString().split('T')[0])
        setUnlockTime('20:00')
        setTitle('')
        setContent('')
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && (title || content || unlockDate)) {
      saveDraft({ title, content, unlockDate, unlockTime })
    }
  }, [title, content, unlockDate, unlockTime, isOpen])

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
    if (!title.trim() || !content.trim() || !unlockDate || !unlockTime) return

    const unlockAt = new Date(`${unlockDate}T${unlockTime}:00`).toISOString()
    await onSubmit(title.trim(), content.trim(), unlockAt)
    clearDraft()
    setTitle('')
    setContent('')
    setUnlockDate('')
    setUnlockTime('20:00')
  }

  const handleClose = () => {
    onClose()
  }

  const minDate = new Date()
  minDate.setMinutes(minDate.getMinutes() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const isFormValid = title.trim() && content.trim() && unlockDate && unlockTime

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
          onClick={handleClose}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-white rounded-t-[2rem] w-full max-w-lg max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sakura-light via-sakura-deep to-sakura-light" />

            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-sakura/10 blur-3xl" />
            <div className="absolute top-10 -left-16 w-32 h-32 rounded-full bg-sakura-light/50 blur-3xl" />

            <div className="relative p-6 overflow-y-auto max-h-[90vh] -webkit-overflow-scrolling-touch"
              onTouchMove={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sakura to-sakura-deep flex items-center justify-center shadow-md shadow-sakura/30">
                    <Gift className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-700">
                      封存时间胶囊
                    </h2>
                    <p className="text-xs text-gray-400">
                      给未来的TA一份惊喜
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="space-y-5">
                {(title || content) && (
                  <div className="flex items-center justify-between bg-sakura-light/30 rounded-xl px-4 py-2.5 border border-sakura-light/50">
                    <span className="text-xs text-sakura-deep flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sakura-deep animate-pulse" />
                      已自动保存草稿
                    </span>
                    <button
                      onClick={() => {
                        clearDraft()
                        setTitle('')
                        setContent('')
                        const nextMonth = new Date()
                        nextMonth.setMonth(nextMonth.getMonth() + 1)
                        setUnlockDate(nextMonth.toISOString().split('T')[0])
                        setUnlockTime('20:00')
                      }}
                      className="text-xs text-gray-500 hover:text-red-500 transition-colors"
                    >
                      清除草稿
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sakura-deep" />
                    胶囊标题
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="给胶囊起个名字..."
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-sakura focus:ring-4 focus:ring-sakura/10 outline-none transition-all bg-gray-50/50 focus:bg-white"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sakura-deep" />
                    想说的话
                  </label>
                  <div className="relative">
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="写下想对TA说的话，到时间才能打开哦..."
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-sakura focus:ring-4 focus:ring-sakura/10 outline-none transition-all resize-none min-h-36 bg-gray-50/50 focus:bg-white"
                      maxLength={1000}
                    />
                    <div className="absolute bottom-3 right-4 text-xs text-gray-400">
                      {content.length}/1000
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sakura-deep" />
                      解锁日期
                    </label>
                    <input
                      type="date"
                      value={unlockDate}
                      onChange={(e) => setUnlockDate(e.target.value)}
                      min={minDateStr}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-sakura focus:ring-4 focus:ring-sakura/10 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-sakura-deep" />
                      解锁时间
                    </label>
                    <input
                      type="time"
                      value={unlockTime}
                      onChange={(e) => setUnlockTime(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-sakura focus:ring-4 focus:ring-sakura/10 outline-none transition-all bg-gray-50/50 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="relative bg-gradient-to-br from-sakura-light/50 to-sakura/20 rounded-2xl p-5 border border-sakura-light/50 overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/50 rounded-full blur-xl" />
                  <div className="relative flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/80 flex items-center justify-center flex-shrink-0 shadow-sm">
                      <Sparkles className="w-5 h-5 text-sakura-deep" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-sakura-deep mb-1">
                        小提示
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        胶囊封存后，到解锁时间之前都无法查看内容哦。
                        想想看，TA在未来打开这份惊喜时的表情～ 💕
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  {isFormValid ? '准备好了，封存吧～' : '请填写完整信息'}
                </span>
                <motion.button
                  whileHover={isFormValid ? { scale: 1.02 } : {}}
                  whileTap={isFormValid ? { scale: 0.98 } : {}}
                  onClick={handleSubmit}
                  disabled={!isFormValid || submitting}
                  className={`px-6 py-3 rounded-full font-medium flex items-center gap-2 transition-all ${
                    isFormValid
                      ? 'bg-gradient-to-r from-sakura to-sakura-deep text-white shadow-lg shadow-sakura/30 hover:shadow-xl hover:shadow-sakura/40'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  封存胶囊
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
