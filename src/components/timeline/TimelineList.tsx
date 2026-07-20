import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit3, Trash2, Heart } from 'lucide-react'
import { TimelineEditor } from './TimelineEditor'
import { useTimeline } from '../../hooks/useTimeline'
import type { TimelineEvent } from '../../types'
import { calculateDaysSince } from '../../lib/utils'
import { TimelineSkeleton } from '../ui/PageSkeletons'

export function TimelineList() {
  const { events, loading, createEvent, updateEvent, deleteEvent } = useTimeline()
  const [showEditor, setShowEditor] = useState(false)
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const handleSubmit = async (title: string, eventDate: string, description: string) => {
    setSubmitting(true)
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, title, eventDate, description)
      } else {
        await createEvent(title, eventDate, description)
      }
    } finally {
      setSubmitting(false)
      setEditingEvent(null)
    }
  }

  const handleEdit = (event: TimelineEvent) => {
    setEditingEvent(event)
    setShowEditor(true)
  }

  const handleNew = () => {
    setEditingEvent(null)
    setShowEditor(true)
  }

  const handleDelete = async (id: number) => {
    await deleteEvent(id)
    setDeleteConfirmId(null)
  }

  if (loading) {
    return <TimelineSkeleton />
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-700">我们的故事</h1>
          <p className="text-sm text-gray-500 mt-1">每一个日子都值得被记住</p>
        </div>
        <button
          onClick={handleNew}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-sakura to-sakura-deep text-white flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-sakura-light flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-sakura fill-sakura" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">还没有故事</h2>
          <p className="text-gray-500 mb-6 text-center">
            记录下你们的第一个重要时刻吧
          </p>
          <button
            onClick={handleNew}
            className="px-8 py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium hover:shadow-lg transition-shadow"
          >
            添加故事
          </button>
        </div>
      ) : (
        <div className="relative pl-6 pb-8">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-sakura via-sakura-light to-transparent" />

          <div className="space-y-6">
            {events.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <div className="absolute -left-[22px] top-5 w-3 h-3 rounded-full bg-sakura border-2 border-white shadow-sm" />

                <div
                  className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleEdit(event)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-700">{event.title}</h3>
                      <p className="text-xs text-sakura-deep font-medium mt-0.5">
                        {event.event_date} · 已经 {calculateDaysSince(event.event_date)} 天
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(event)
                        }}
                        className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <Edit3 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmId(event.id)
                        }}
                        className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {event.description}
                    </p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {deleteConfirmId !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6"
            onClick={() => setDeleteConfirmId(null)}
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
                这个故事确定要删除吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <TimelineEditor
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false)
          setEditingEvent(null)
        }}
        onSubmit={handleSubmit}
        editing={editingEvent}
        submitting={submitting}
      />
    </div>
  )
}
