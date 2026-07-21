import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Sparkles, Heart, Trash2, X } from 'lucide-react'
import type { TimeCapsule, Identity } from '../../types'

interface CapsuleCardProps {
  capsule: TimeCapsule
  isUnlocked: boolean
  currentIdentity: Identity | null
  getNow: () => Date
  onDelete?: (id: number) => void
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  total: number
}

function calculateTimeLeft(unlockAt: string, now: Date): TimeLeft {
  const unlockTime = new Date(unlockAt).getTime()
  const diff = unlockTime - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, total: 0 }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, total: diff }
}

export function CapsuleCard({
  capsule,
  isUnlocked: initialUnlocked,
  currentIdentity,
  getNow,
  onDelete,
}: CapsuleCardProps) {
  const [showContent, setShowContent] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(capsule.unlock_at, getNow())
  )
  const [hasNewUnlocked, setHasNewUnlocked] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isOwn = capsule.created_by === currentIdentity
  const isHe = capsule.created_by === 'he'

  useEffect(() => {
    if (initialUnlocked) {
      const viewed = localStorage.getItem(`capsule_viewed_${capsule.id}`)
      if (!viewed) {
        setHasNewUnlocked(true)
      }
    }
  }, [capsule.id, initialUnlocked])

  useEffect(() => {
    if (initialUnlocked) return

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(capsule.unlock_at, getNow())
      setTimeLeft(newTimeLeft)
    }, 1000 * 30)

    return () => clearInterval(timer)
  }, [capsule.unlock_at, initialUnlocked, getNow])

  const handleClick = () => {
    if (!initialUnlocked) return

    if (!showContent) {
      setIsAnimating(true)
      localStorage.setItem(`capsule_viewed_${capsule.id}`, 'true')
      setHasNewUnlocked(false)
      setTimeout(() => {
        setShowContent(true)
        setIsAnimating(false)
      }, 2000)
    } else {
      setShowContent(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const primaryColor = isHe ? '#3B82F6' : '#F472B6'
  const primaryLight = isHe ? '#DBEAFE' : '#FCE7F3'
  const primaryDeep = isHe ? '#1D4ED8' : '#BE185D'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, y: -2 }}
      className="relative cursor-pointer"
      onClick={handleClick}
    >
      {hasNewUnlocked && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 z-20"
        >
          <span className="relative flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs items-center justify-center font-bold">
              新
            </span>
          </span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!showContent ? (
          <motion.div
            key="locked"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transition-shadow border border-gray-100 group"
          >
            {isOwn && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(true)
                }}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/90 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all opacity-60 hover:opacity-100 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div className="relative p-5">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div
                    className="w-20 h-16 rounded-lg relative overflow-hidden shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${primaryLight} 0%, white 100%)`,
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-8 origin-top"
                      style={{
                        background: `linear-gradient(135deg, ${primaryLight} 0%, white 100%)`,
                        clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                        transform: 'rotateX(0deg)',
                      }}
                    />

                    <div
                      className="absolute top-6 left-0 right-0 bottom-0"
                      style={{
                        background: `linear-gradient(180deg, white 0%, ${primaryLight} 100%)`,
                      }}
                    >
                      <div className="absolute inset-x-2 top-1 h-px bg-gray-200" />
                      <div className="absolute inset-x-2 top-3 h-px bg-gray-100" />
                    </div>

                    <div className="absolute top-5 left-1/2 -translate-x-1/2">
                      <div
                        className="w-6 h-6 rounded-full shadow-md flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Heart className="w-3 h-3 text-white fill-white" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: primaryLight,
                        color: primaryDeep,
                      }}
                    >
                      {isHe ? '他' : '她'}
                    </span>
                    {!isOwn && !initialUnlocked && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        神秘信件
                      </span>
                    )}
                    {!isOwn && initialUnlocked && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: primaryLight, color: primaryDeep }}
                      >
                        给你的信
                      </span>
                    )}
                  </div>

                  {!initialUnlocked && !isOwn ? (
                    <h3 className="text-base font-bold text-gray-400 mb-2 italic">
                      神秘信件
                    </h3>
                  ) : (
                    <h3 className="text-base font-bold text-gray-700 mb-2 truncate">
                      {capsule.title}
                    </h3>
                  )}

                  {initialUnlocked ? (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-1.5 font-medium text-sm"
                      style={{ color: primaryColor }}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>点击拆开信</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                      >
                        ✨
                      </motion.div>
                    </motion.div>
                  ) : (
                    <div>
                      <div className="flex items-baseline gap-0.5 mb-1.5">
                        <div className="text-center min-w-[40px]">
                          <span
                            className="text-2xl font-bold font-mono"
                            style={{ color: primaryColor }}
                          >
                            {timeLeft.days}
                          </span>
                          <p className="text-xs text-gray-400">天</p>
                        </div>
                        <span
                          className="text-lg font-bold pb-2"
                          style={{ color: `${primaryColor}40` }}
                        >
                          :
                        </span>
                        <div className="text-center min-w-[32px]">
                          <span
                            className="text-xl font-bold font-mono"
                            style={{ color: primaryColor }}
                          >
                            {String(timeLeft.hours).padStart(2, '0')}
                          </span>
                          <p className="text-xs text-gray-400">时</p>
                        </div>
                        <span
                          className="text-lg font-bold pb-2"
                          style={{ color: `${primaryColor}40` }}
                        >
                          :
                        </span>
                        <div className="text-center min-w-[32px]">
                          <span
                            className="text-xl font-bold font-mono"
                            style={{ color: primaryColor }}
                          >
                            {String(timeLeft.minutes).padStart(2, '0')}
                          </span>
                          <p className="text-xs text-gray-400">分</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatDate(capsule.unlock_at)} 开启</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {isAnimating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-6"
              >
                <div className="text-center">
                  <motion.div
                    animate={{
                      y: [0, -10, 0],
                      rotate: [0, -2, 2, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="relative w-24 h-20 mx-auto mb-5"
                  >
                    <div
                      className="w-full h-full rounded-lg relative overflow-hidden shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${primaryLight} 0%, white 100%)`,
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-10 origin-bottom"
                        style={{
                          background: `linear-gradient(180deg, ${primaryLight} 0%, white 100%)`,
                          clipPath: 'polygon(0 100%, 100% 100%, 50% 0%)',
                        }}
                      />
                      <div
                        className="absolute top-6 left-1/2 -translate-x-1/2"
                        style={{ color: primaryColor }}
                      >
                        <Heart className="w-5 h-5 fill-current" />
                      </div>
                    </div>
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      className="absolute -inset-3"
                    >
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 text-base">✨</div>
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-sm">💫</div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 text-sm">⭐</div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 text-base">✨</div>
                    </motion.div>
                  </motion.div>
                  <motion.p
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="font-bold text-lg mb-1"
                    style={{ color: primaryDeep }}
                  >
                    正在为你拆信...
                  </motion.p>
                  <p className="text-gray-500 text-sm">
                    来自过去的心意，马上送达
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100"
          >
            {isOwn && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowDeleteConfirm(true)
                }}
                className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <div
              className="h-1.5"
              style={{
                background: `linear-gradient(90deg, ${primaryLight}, ${primaryColor}, ${primaryLight})`,
              }}
            />

            <div className="relative p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: primaryLight,
                      color: primaryDeep,
                    }}
                  >
                    {isHe ? '他' : '她'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(capsule.created_at)} 寄出
                  </span>
                </div>
                <span className="text-lg">💌</span>
              </div>

              <h3
                className="text-lg font-bold mb-4 flex items-center gap-2"
                style={{ color: primaryDeep }}
              >
                {capsule.title}
              </h3>

              {capsule.image_url && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4 rounded-xl overflow-hidden shadow-md"
                >
                  <img
                    src={capsule.image_url}
                    alt={capsule.title}
                    className="w-full h-auto"
                  />
                </motion.div>
              )}

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: `${primaryLight}30`,
                  borderColor: `${primaryLight}80`,
                }}
              >
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                  {capsule.content}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-4 pt-3 border-t border-dashed border-gray-200"
              >
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>🕐 开启时间：{formatDate(capsule.unlock_at)}</span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-4 text-center"
              >
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    background: `linear-gradient(90deg, ${primaryLight}, ${primaryLight}80)`,
                    color: primaryDeep,
                  }}
                >
                  💕 这是一份跨越时间的心意
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center px-6"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">
                  确认删除
                </h3>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-6">
                确定要删除这个时间胶囊吗？删除后无法恢复哦。
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    setDeleting(true)
                    try {
                      await onDelete?.(capsule.id)
                      setShowDeleteConfirm(false)
                    } finally {
                      setDeleting(false)
                    }
                  }}
                  disabled={deleting}
                  className="flex-1 py-2.5 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting ? '删除中...' : '删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
