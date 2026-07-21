import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  Image,
  FileText,
  Clock,
  Heart,
  Edit3,
  X,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Star,
  Sparkles,
  Calendar,
} from 'lucide-react'
import { useCountdowns } from '../../hooks/useCountdowns'
import { usePhotos } from '../../hooks/usePhotos'
import { useNotes } from '../../hooks/useNotes'
import { useWishes } from '../../hooks/useWishes'
import { useIdentity } from '../../hooks/useIdentity'
import { useSettings } from '../../hooks/useSettings'
import { calculateDaysLeft, calculateDaysSince, formatTimeAgo } from '../../lib/utils'
import { Skeleton, SkeletonCard } from '../ui/Skeleton'

export function HomePage() {
  const navigate = useNavigate()
  const { countdowns, loading: countdownsLoading } = useCountdowns()
  const { photos, loading: photosLoading } = usePhotos()
  const { notes, loading: notesLoading } = useNotes()
  const { wishes, loading: wishesLoading, toggleWish } = useWishes()
  const { identity } = useIdentity()
  const { settings, updateAnniversary } = useSettings()
  const [showEditor, setShowEditor] = useState(false)
  const [editDate, setEditDate] = useState(settings.anniversary_date)
  const [saving, setSaving] = useState(false)

  const [countdownIndex, setCountdownIndex] = useState(0)
  const [photoStartIndex, setPhotoStartIndex] = useState(0)

  const recentPhotos = photos.slice(0, 6)
  const recentNotes = notes.slice(0, 3)
  const pendingWishes = wishes.filter((w) => !w.completed).slice(0, 3)
  const daysTogether = calculateDaysSince(settings.anniversary_date)
  const daysDigits = String(daysTogether).split('')

  useEffect(() => {
    if (countdowns.length <= 1) return
    const timer = setInterval(() => {
      setCountdownIndex((prev) => (prev + 1) % countdowns.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [countdowns.length])

  useEffect(() => {
    if (recentPhotos.length <= 3) return
    const timer = setInterval(() => {
      setPhotoStartIndex((prev) => {
        const max = recentPhotos.length - 3
        return prev >= max ? 0 : prev + 1
      })
    }, 4000)
    return () => clearInterval(timer)
  }, [recentPhotos.length])

  const handleCountdownPrev = () => {
    if (countdowns.length === 0) return
    setCountdownIndex((prev) => (prev - 1 + countdowns.length) % countdowns.length)
  }

  const handleCountdownNext = () => {
    if (countdowns.length === 0) return
    setCountdownIndex((prev) => (prev + 1) % countdowns.length)
  }

  const handlePhotoPrev = () => {
    if (recentPhotos.length <= 3) return
    setPhotoStartIndex((prev) => Math.max(0, prev - 1))
  }

  const handlePhotoNext = () => {
    if (recentPhotos.length <= 3) return
    setPhotoStartIndex((prev) => Math.min(recentPhotos.length - 3, prev + 1))
  }

  const handleOpenEditor = () => {
    setEditDate(settings.anniversary_date)
    setShowEditor(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateAnniversary(editDate)
      setShowEditor(false)
    } finally {
      setSaving(false)
    }
  }

  const handleWishClick = () => {
    navigate('/countdowns', { state: { tab: 'wishes' } })
  }

  const visiblePhotos = recentPhotos.slice(photoStartIndex, photoStartIndex + 3)

  return (
    <div className="space-y-4 pb-6">
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between pt-1"
      >
        <div>
          <h1 className="text-xl font-bold text-gray-700">
            {identity === 'he' ? '亲爱的 💗' : '亲爱的 💙'}
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">今天也要想我哦 ~</p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Heart className="w-7 h-7 text-sakura-accent fill-sakura-accent" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 300, damping: 25 }}
        onClick={handleOpenEditor}
        className="relative bg-gradient-to-br from-sakura via-sakura-light to-sakura-deep rounded-3xl p-5 shadow-lg shadow-sakura/25 cursor-pointer hover:shadow-xl hover:shadow-sakura/30 transition-all group overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/5 rounded-full -translate-y-1/2" />

        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-80 transition-opacity z-10">
          <Edit3 className="w-4 h-4 text-white" />
        </div>

        <div className="relative text-center text-white">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Sparkles className="w-4 h-4 opacity-80" />
            <span className="text-sm opacity-90 font-medium">认识已经</span>
            <Sparkles className="w-4 h-4 opacity-80" />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-1">
            {daysDigits.map((digit, i) => (
              <motion.span
                key={`${daysTogether}-${i}`}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center justify-center w-10 h-14 bg-black/15 backdrop-blur-sm rounded-xl text-3xl font-bold font-mono text-white shadow-inner border border-white/20"
                style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 10px rgba(255,255,255,0.2)' }}
              >
                {digit}
              </motion.span>
            ))}
            <span className="text-lg font-medium ml-1 opacity-90">天</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-xs opacity-80 mt-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{settings.anniversary_date}</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-200/60 to-pink-200/60 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">重要日子</h2>
          </div>
          <Link
            to="/countdowns"
            className="flex items-center gap-0.5 text-xs text-sakura-deep hover:text-sakura-accent transition-colors font-medium"
          >
            查看全部
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {countdownsLoading ? (
          <SkeletonCard className="h-28 rounded-2xl" />
        ) : countdowns.length > 0 ? (
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={countdownIndex}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                >
                  <Link to="/countdowns" className="block">
                    <div className="bg-gradient-to-br from-rose-400 via-pink-400 to-sakura-deep rounded-2xl p-4 text-white relative overflow-hidden min-h-28">
                      <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                      
                      <div className="relative h-full flex flex-col items-center justify-center">
                        <p className="text-xs opacity-90 mb-1.5">
                          距离 {countdowns[countdownIndex].title}
                        </p>
                        <div className="flex items-center gap-1">
                          {String(calculateDaysLeft(countdowns[countdownIndex].target_date)).split('').map((digit, i) => (
                            <span
                              key={`${countdowns[countdownIndex].id}-${i}`}
                              className="inline-flex items-center justify-center w-9 h-12 bg-black/15 backdrop-blur-sm rounded-lg text-2xl font-bold font-mono text-white border border-white/20"
                              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.3), 0 0 10px rgba(255,255,255,0.2)' }}
                            >
                              {digit}
                            </span>
                          ))}
                          <span className="text-base opacity-90 ml-0.5">天</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </AnimatePresence>
            </div>

            {countdowns.length > 1 && (
              <>
                <button
                  onClick={handleCountdownPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleCountdownNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
                >
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
                <div className="flex justify-center gap-1 mt-2">
                  {countdowns.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCountdownIndex(i)}
                      className={`h-1 rounded-full transition-all ${
                        i === countdownIndex ? 'w-4 bg-rose-400' : 'w-1 bg-rose-200/60'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <Link to="/countdowns" className="block">
            <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-dashed border-sakura-light flex items-center gap-3 min-h-28">
              <div className="w-10 h-10 rounded-xl bg-sakura-light/50 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-sakura-deep" />
              </div>
              <div>
                <p className="font-medium text-gray-700 text-sm">添加倒计时</p>
                <p className="text-xs text-gray-400 mt-0.5">记录重要的日子</p>
              </div>
            </div>
          </Link>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-200/60 to-rose-200/60 flex items-center justify-center">
              <Image className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">最近照片</h2>
          </div>
          <Link
            to="/photos"
            className="flex items-center gap-0.5 text-xs text-sakura-deep hover:text-sakura-accent transition-colors font-medium"
          >
            查看全部
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {photosLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        ) : recentPhotos.length > 0 ? (
          <div className="relative">
            <div className="grid grid-cols-3 gap-2">
              {visiblePhotos.map((photo, i) => (
                <motion.div
                  key={photo.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link to="/photos">
                    <div className="aspect-square rounded-xl overflow-hidden bg-sakura-light/20 flex items-center justify-center hover:ring-2 hover:ring-sakura/40 transition-all">
                      <img
                        src={photo.public_url || ''}
                        alt={photo.caption || '照片'}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </Link>
                </motion.div>
              ))}
              {visiblePhotos.length < 3 &&
                Array(3 - visiblePhotos.length)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="aspect-square rounded-xl bg-sakura-light/15 border-2 border-dashed border-sakura-light/50"
                    />
                  ))}
            </div>

            {recentPhotos.length > 3 && (
              <div className="flex justify-center gap-1.5 mt-2.5">
                <button
                  onClick={handlePhotoPrev}
                  disabled={photoStartIndex === 0}
                  className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: Math.max(1, recentPhotos.length - 2) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoStartIndex(i)}
                    className={`h-1.5 rounded-full transition-all self-center ${
                      i === photoStartIndex ? 'w-4 bg-sakura-deep' : 'w-1.5 bg-sakura-light/60'
                    }`}
                  />
                ))}
                <button
                  onClick={handlePhotoNext}
                  disabled={photoStartIndex >= recentPhotos.length - 3}
                  className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-40"
                >
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/photos" className="block">
            <div className="bg-white rounded-2xl p-4 text-center border-2 border-dashed border-sakura-light">
              <p className="text-gray-500 text-sm">还没有照片，去上传第一张吧</p>
            </div>
          </Link>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-yellow-200/60 to-amber-200/60 flex items-center justify-center">
              <Star className="w-3.5 h-3.5 text-amber-600 fill-amber-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">愿望清单</h2>
            {pendingWishes.length > 0 && (
              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                {pendingWishes.length} 待完成
              </span>
            )}
          </div>
          <button
            onClick={handleWishClick}
            className="flex items-center gap-0.5 text-xs text-amber-600 hover:text-amber-700 transition-colors font-medium"
          >
            全部
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {wishesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        ) : pendingWishes.length > 0 ? (
          <div className="space-y-2">
            {pendingWishes.map((wish, i) => (
              <motion.div
                key={wish.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={handleWishClick}
                className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow flex items-center gap-2.5 border border-gray-50 cursor-pointer"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleWish(wish.id)
                  }}
                  className="w-5 h-5 rounded-full border-2 border-amber-300 flex items-center justify-center flex-shrink-0 hover:border-amber-500 hover:bg-amber-50 transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{wish.icon}</span>
                    <span className="text-sm font-medium text-gray-700 truncate">{wish.title}</span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        ) : (
          <button
            onClick={handleWishClick}
            className="w-full bg-white rounded-2xl p-4 text-center border-2 border-dashed border-amber-200 hover:border-amber-300 hover:bg-amber-50/30 transition-colors"
          >
            <p className="text-gray-500 text-sm">还没有愿望，去添加第一个吧 ✨</p>
          </button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sakura-light/50 to-sakura/30 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-sakura-deep" />
            </div>
            <h2 className="text-sm font-semibold text-gray-700">最新纸条</h2>
          </div>
          <Link
            to="/notes"
            className="flex items-center gap-0.5 text-xs text-sakura-deep hover:text-sakura-accent transition-colors font-medium"
          >
            查看全部
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {notesLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="space-y-2">
            {recentNotes.map((note, i) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to="/notes" className="block">
                  <div className="bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow border border-gray-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          note.author === 'he'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-sakura-light text-sakura-deep'
                        }`}
                      >
                        {note.author === 'he' ? '他' : '她'}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {formatTimeAgo(note.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {note.content}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <Link to="/notes" className="block">
            <div className="bg-white rounded-2xl p-4 text-center border-2 border-dashed border-sakura-light">
              <p className="text-gray-500 text-sm">还没有纸条，去写第一张吧</p>
            </div>
          </Link>
        )}
      </motion.div>

      <AnimatePresence>
        {showEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center px-6"
            onClick={() => setShowEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-700">修改纪念日</h3>
                <button
                  onClick={() => setShowEditor(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">选择你们在一起的日子 💕</p>

              <input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sakura focus:ring-2 focus:ring-sakura/20 outline-none mb-6"
              />

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-gradient-to-r from-sakura to-sakura-deep text-white rounded-full font-medium hover:shadow-md transition-shadow disabled:opacity-50 text-sm"
                >
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
