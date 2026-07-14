import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Edit3, Calendar } from 'lucide-react'
import type { Countdown } from '../../types'
import { calculateDaysLeft } from '../../lib/utils'

interface CountdownCardProps {
  countdown: Countdown
  onEdit: () => void
  onDelete: () => void
}

export function CountdownCard({ countdown, onEdit, onDelete }: CountdownCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const daysLeft = calculateDaysLeft(countdown.target_date)

  const isPast = daysLeft < 0
  const isToday = daysLeft === 0

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-white rounded-2xl p-5 shadow-sm relative overflow-hidden"
        onClick={() => setShowActions(!showActions)}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sakura-light/50 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                {countdown.title}
              </h3>
              <div className="flex items-center gap-1 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                <span>{countdown.target_date}</span>
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={daysLeft}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-5xl font-bold font-mono ${
                  isPast
                    ? 'text-gray-400'
                    : isToday
                    ? 'text-sakura-accent'
                    : 'text-sakura-deep'
                }`}
              >
                {Math.abs(daysLeft)}
              </motion.span>
              <span
                className={`text-lg ${
                  isPast ? 'text-gray-400' : 'text-sakura-deep'
                }`}
              >
                天
              </span>
            </div>

            <p className="text-sm text-gray-500">
              {isPast
                ? '已过去'
                : isToday
                ? '就是今天！'
                : '后到来'}
            </p>
          </div>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                      setShowActions(false)
                    }}
                    className="flex-1 py-2 flex items-center justify-center gap-1.5 text-sm text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    编辑
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(true)
                      setShowActions(false)
                    }}
                    className="flex-1 py-2 flex items-center justify-center gap-1.5 text-sm text-red-500 bg-red-50 rounded-full hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-6"
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
                确定要删除「{countdown.title}」吗？
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    onDelete()
                    setShowDeleteConfirm(false)
                  }}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors"
                >
                  删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
