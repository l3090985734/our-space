import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Image, FileText, Clock, Heart } from 'lucide-react'
import { useCountdowns } from '../../hooks/useCountdowns'
import { usePhotos } from '../../hooks/usePhotos'
import { useNotes } from '../../hooks/useNotes'
import { useIdentity } from '../../hooks/useIdentity'
import { calculateDaysLeft, formatTimeAgo } from '../../lib/utils'

export function HomePage() {
  const { countdowns, loading: countdownsLoading } = useCountdowns()
  const { photos, loading: photosLoading } = usePhotos()
  const { notes, loading: notesLoading } = useNotes()
  const { identity } = useIdentity()

  const nearestCountdown = countdowns[0]
  const recentPhotos = photos.slice(0, 3)
  const recentNotes = notes.slice(0, 3)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-semibold text-gray-700">
            {identity === 'he' ? '亲爱的 💗' : '亲爱的 💙'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            今天也要想我哦 ~
          </p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <Heart className="w-8 h-8 text-sakura-accent fill-sakura-accent" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {countdownsLoading ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-sakura/30 border-t-sakura rounded-full animate-spin" />
          </div>
        ) : nearestCountdown ? (
          <Link to="/countdowns" className="block">
            <div className="bg-gradient-to-br from-sakura to-sakura-deep rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm opacity-90">距离 {nearestCountdown.title}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-6xl font-bold font-mono">
                    {calculateDaysLeft(nearestCountdown.target_date)}
                  </span>
                  <span className="text-xl">天</span>
                </div>
                <p className="text-sm opacity-80 mt-2">
                  {nearestCountdown.target_date}
                </p>
              </div>
            </div>
          </Link>
        ) : (
          <Link to="/countdowns" className="block">
            <div className="bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-sakura-light flex flex-col items-center justify-center h-32">
              <Clock className="w-8 h-8 text-sakura mb-2" />
              <p className="text-gray-500 text-sm">添加一个倒计时吧 ~</p>
            </div>
          </Link>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5 text-sakura-deep" />
            <h2 className="text-lg font-semibold text-gray-700">最近照片</h2>
          </div>
          <Link
            to="/photos"
            className="flex items-center gap-1 text-sm text-sakura-deep hover:text-sakura-accent transition-colors"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {photosLoading ? (
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : recentPhotos.length > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {recentPhotos.map((photo) => (
              <Link key={photo.id} to="/photos">
                <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                  <img
                    src={photo.public_url}
                    alt={photo.caption || '照片'}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
            ))}
            {recentPhotos.length < 3 &&
              Array(3 - recentPhotos.length)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-square rounded-xl bg-sakura-light/30 border-2 border-dashed border-sakura-light"
                  />
                ))}
          </div>
        ) : (
          <Link to="/photos" className="block">
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-dashed border-sakura-light">
              <p className="text-gray-500 text-sm">还没有照片，去上传第一张吧</p>
            </div>
          </Link>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sakura-deep" />
            <h2 className="text-lg font-semibold text-gray-700">最新纸条</h2>
          </div>
          <Link
            to="/notes"
            className="flex items-center gap-1 text-sm text-sakura-deep hover:text-sakura-accent transition-colors"
          >
            查看全部
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {notesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 shadow-sm h-20 animate-pulse"
              />
            ))}
          </div>
        ) : recentNotes.length > 0 ? (
          <div className="space-y-3">
            {recentNotes.map((note) => (
              <Link key={note.id} to="/notes" className="block">
                <div className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        note.author === 'he'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-sakura-light text-sakura-deep'
                      }`}
                    >
                      {note.author === 'he' ? '他' : '她'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(note.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {note.content}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <Link to="/notes" className="block">
            <div className="bg-white rounded-2xl p-6 text-center border-2 border-dashed border-sakura-light">
              <p className="text-gray-500 text-sm">还没有纸条，去写第一张吧</p>
            </div>
          </Link>
        )}
      </motion.div>
    </div>
  )
}
