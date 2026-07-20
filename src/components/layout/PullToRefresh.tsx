import { useState, useRef, useCallback, type ReactNode } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: ReactNode
}

const THRESHOLD = 70
const MAX_PULL = 120

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef(0)
  const pulling = useRef(false)
  const y = useMotionValue(0)
  const indicatorRotate = useTransform(y, [0, MAX_PULL], [0, 360])
  const indicatorOpacity = useTransform(y, [0, 30], [0, 1])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing) return
    if (window.scrollY > 0) return
    startY.current = e.touches[0].clientY
    pulling.current = true
  }, [refreshing])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling.current || refreshing) return

    const diff = e.touches[0].clientY - startY.current
    if (diff <= 0) {
      y.set(0)
      return
    }

    const damped = Math.min(diff * 0.5, MAX_PULL)
    y.set(damped)
  }, [refreshing, y])

  const handleTouchEnd = useCallback(async () => {
    if (!pulling.current || refreshing) {
      pulling.current = false
      return
    }

    pulling.current = false
    const currentY = y.get()

    if (currentY >= THRESHOLD) {
      animate(y, THRESHOLD, { duration: 0.2 })
      setRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setRefreshing(false)
        animate(y, 0, { duration: 0.3 })
      }
    } else {
      animate(y, 0, { duration: 0.2 })
    }
  }, [refreshing, y, onRefresh])

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center"
        style={{ y: useTransform(y, (v) => v - 50), opacity: indicatorOpacity }}
      >
        <motion.div
          style={{ rotate: refreshing ? undefined : indicatorRotate }}
          animate={refreshing ? { rotate: 360 } : {}}
          transition={refreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
        >
          <RefreshCw className="w-6 h-6 text-sakura" />
        </motion.div>
        <p className="text-xs text-gray-400 mt-1">
          {refreshing ? '刷新中...' : y.get() >= THRESHOLD ? '松手刷新' : '下拉刷新'}
        </p>
      </motion.div>

      <motion.div style={{ y }} className="min-h-full">
        {children}
      </motion.div>
    </div>
  )
}
