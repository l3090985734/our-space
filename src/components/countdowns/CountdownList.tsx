import { useState } from 'react'
import { Plus } from 'lucide-react'
import { CountdownCard } from './CountdownCard'
import { CountdownEditor } from './CountdownEditor'
import { useCountdowns } from '../../hooks/useCountdowns'
import type { Countdown } from '../../types'
import { CountdownSkeleton } from '../ui/PageSkeletons'

export function CountdownList() {
  const { countdowns, loading, createCountdown, updateCountdown, deleteCountdown } =
    useCountdowns()
  const [showEditor, setShowEditor] = useState(false)
  const [editingCountdown, setEditingCountdown] = useState<Countdown | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (title: string, targetDate: string) => {
    setSubmitting(true)
    try {
      if (editingCountdown) {
        await updateCountdown(editingCountdown.id, title, targetDate)
      } else {
        await createCountdown(title, targetDate)
      }
    } finally {
      setSubmitting(false)
      setEditingCountdown(null)
    }
  }

  const handleEdit = (countdown: Countdown) => {
    setEditingCountdown(countdown)
    setShowEditor(true)
  }

  const handleNew = () => {
    setEditingCountdown(null)
    setShowEditor(true)
  }

  if (loading) {
    return <CountdownSkeleton />
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-gray-700">倒计时</h1>
        <button
          onClick={handleNew}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-sakura to-sakura-deep text-white flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {countdowns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-24 h-24 rounded-full bg-sakura-light flex items-center justify-center mb-6">
            <span className="text-4xl">⏳</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">还没有倒计时</h2>
          <p className="text-gray-500 mb-6 text-center">
            添加一个重要的日子，一起期待吧
          </p>
          <button
            onClick={handleNew}
            className="px-8 py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium hover:shadow-lg transition-shadow"
          >
            新建倒计时
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {countdowns.map((countdown) => (
            <CountdownCard
              key={countdown.id}
              countdown={countdown}
              onEdit={() => handleEdit(countdown)}
              onDelete={() => deleteCountdown(countdown.id)}
            />
          ))}
        </div>
      )}

      <CountdownEditor
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false)
          setEditingCountdown(null)
        }}
        onSubmit={handleSubmit}
        editing={editingCountdown}
        submitting={submitting}
      />
    </div>
  )
}
