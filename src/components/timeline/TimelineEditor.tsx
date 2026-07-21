import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Save } from 'lucide-react'
import type { TimelineEvent } from '../../types'

const TIMELINE_DRAFT_KEY = 'our-space-timeline-draft'

interface TimelineDraft {
  title: string
  eventDate: string
  description: string
}

function loadTimelineDraft(): TimelineDraft {
  try {
    const data = localStorage.getItem(TIMELINE_DRAFT_KEY)
    return data
      ? JSON.parse(data)
      : { title: '', eventDate: '', description: '' }
  } catch {
    return { title: '', eventDate: '', description: '' }
  }
}

function saveTimelineDraft(draft: TimelineDraft) {
  try {
    if (draft.title || draft.eventDate || draft.description) {
      localStorage.setItem(TIMELINE_DRAFT_KEY, JSON.stringify(draft))
    } else {
      localStorage.removeItem(TIMELINE_DRAFT_KEY)
    }
  } catch {
    // ignore
  }
}

function clearTimelineDraft() {
  try {
    localStorage.removeItem(TIMELINE_DRAFT_KEY)
  } catch {
    // ignore
  }
}

interface TimelineEditorProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, eventDate: string, description: string) => void
  editing?: TimelineEvent | null
  submitting: boolean
}

export function TimelineEditor({
  isOpen,
  onClose,
  onSubmit,
  editing,
  submitting,
}: TimelineEditorProps) {
  const [title, setTitle] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!isOpen) return
    if (editing) {
      setTitle(editing.title)
      setEventDate(editing.event_date)
      setDescription(editing.description)
    } else {
      const draft = loadTimelineDraft()
      setTitle(draft.title)
      setEventDate(draft.eventDate)
      setDescription(draft.description)
    }
  }, [editing, isOpen])

  useEffect(() => {
    if (isOpen && !editing) {
      saveTimelineDraft({ title, eventDate, description })
    }
  }, [title, eventDate, description, isOpen, editing])

  const handleSubmit = async () => {
    if (!title.trim() || !eventDate) return
    if (!editing) {
      clearTimelineDraft()
    }
    await onSubmit(title.trim(), eventDate, description.trim())
    onClose()
  }

  const hasDraft = !editing && (title || eventDate || description)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
          onClick={onClose}
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
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-700">
                  {editing ? '编辑故事' : '添加故事'}
                </h2>
                {hasDraft && (
                  <span className="text-xs text-sakura-deep flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sakura-deep animate-pulse" />
                    草稿已保存
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {hasDraft && (
                  <button
                    onClick={() => {
                      clearTimelineDraft()
                      setTitle('')
                      setEventDate('')
                      setDescription('')
                    }}
                    className="px-2 py-1 rounded-full hover:bg-gray-100 transition-colors text-xs text-gray-500 hover:text-red-500"
                  >
                    清除草稿
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="比如：第一次见面"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    日期
                  </span>
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  故事内容
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="写写那天发生了什么..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none resize-none min-h-28"
                  maxLength={500}
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {description.length}/500
                </p>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={!title.trim() || !eventDate || submitting}
              className="w-full mt-6 py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:shadow-lg transition-shadow"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              {editing ? '保存修改' : '添加到时间线'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
