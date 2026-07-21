import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, RefreshCw, Sparkles, Gift } from 'lucide-react'
import { CapsuleCard } from './CapsuleCard'
import { CapsuleEditor } from './CapsuleEditor'
import { useTimeCapsules } from '../../hooks/useTimeCapsules'
import { useIdentity } from '../../hooks/useIdentity'
import { NotesSkeleton } from '../ui/PageSkeletons'

export function CapsuleList() {
  const { capsules, loading, fetchCapsules, createCapsule, deleteCapsule, isUnlocked, getNow } =
    useTimeCapsules()
  const { identity } = useIdentity()
  const [showEditor, setShowEditor] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleCreateCapsule = async (
    title: string,
    content: string,
    unlockAt: string,
    imageUrl?: string
  ) => {
    if (!identity) return
    setSubmitting(true)
    try {
      await createCapsule(title, content, identity, unlockAt, imageUrl)
      setShowEditor(false)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <NotesSkeleton />
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
            <span className="text-2xl">⏳</span>
            时间胶囊
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            给未来的TA，写一封穿越时空的信
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCapsules}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-500" />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEditor(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-sakura to-sakura-deep text-white flex items-center justify-center shadow-md shadow-sakura/30 hover:shadow-lg hover:shadow-sakura/40 transition-shadow"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {capsules.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16"
        >
          <div className="relative w-28 h-28 mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-sakura-light to-sakura/30 rounded-full animate-pulse" />
            <div className="absolute inset-2 bg-gradient-to-br from-sakura-light via-white to-sakura-light/50 rounded-full flex items-center justify-center shadow-inner">
              <span className="text-5xl">🎁</span>
            </div>
            <motion.div
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="absolute -inset-2"
            >
              <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 text-sakura-deep" />
              <Sparkles className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 text-sakura" />
              <Sparkles className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-3 text-sakura-deep/60" />
              <Sparkles className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-sakura/80" />
            </motion.div>
          </div>
          <h2 className="text-xl font-bold text-gray-700 mb-2">
            还没有时间胶囊
          </h2>
          <p className="text-gray-500 mb-6 text-center max-w-xs">
            封存一段当下的心情，在未来的某个时刻
            <br />
            给TA一个惊喜
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEditor(true)}
            className="px-8 py-3 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium shadow-lg shadow-sakura/30 hover:shadow-xl hover:shadow-sakura/40 transition-shadow flex items-center gap-2"
          >
            <Gift className="w-5 h-5" />
            创建第一个胶囊
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-5 pb-8">
          <AnimatePresence>
            {capsules.map((capsule, index) => (
              <motion.div
                key={capsule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <CapsuleCard
                  capsule={capsule}
                  isUnlocked={isUnlocked(capsule)}
                  currentIdentity={identity}
                  getNow={getNow}
                  onDelete={deleteCapsule}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <CapsuleEditor
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSubmit={handleCreateCapsule}
        submitting={submitting}
      />
    </div>
  )
}
