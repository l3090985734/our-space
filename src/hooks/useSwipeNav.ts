import { useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const TAB_ORDER = ['/', '/timeline', '/photos', '/notes', '/countdowns']
const SWIPE_THRESHOLD = 60
const EDGE_THRESHOLD = 30

export function useSwipeNav(enabled = true) {
  const navigate = useNavigate()
  const location = useLocation()
  const startXRef = useRef<number | null>(null)
  const startYRef = useRef<number | null>(null)
  const isFromLeftEdgeRef = useRef(false)
  const isFromRightEdgeRef = useRef(false)
  const isHorizontalRef = useRef<boolean | null>(null)

  useEffect(() => {
    if (!enabled) return

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const x = e.touches[0].clientX
      startXRef.current = x
      startYRef.current = e.touches[0].clientY
      isHorizontalRef.current = null

      const screenWidth = window.innerWidth
      isFromLeftEdgeRef.current = x < EDGE_THRESHOLD
      isFromRightEdgeRef.current = x > screenWidth - EDGE_THRESHOLD
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startXRef.current === null || startYRef.current === null) return

      const deltaX = e.touches[0].clientX - startXRef.current
      const deltaY = e.touches[0].clientY - startYRef.current

      if (isHorizontalRef.current === null) {
        isHorizontalRef.current = Math.abs(deltaX) > Math.abs(deltaY)
      }
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (
        startXRef.current === null ||
        isHorizontalRef.current === false ||
        (!isFromLeftEdgeRef.current && !isFromRightEdgeRef.current)
      ) {
        startXRef.current = null
        startYRef.current = null
        isHorizontalRef.current = null
        return
      }

      const deltaX = e.changedTouches[0].clientX - startXRef.current

      startXRef.current = null
      startYRef.current = null
      isHorizontalRef.current = null

      const currentIndex = TAB_ORDER.indexOf(location.pathname)
      if (currentIndex === -1) return

      if (isFromRightEdgeRef.current && deltaX < -SWIPE_THRESHOLD) {
        if (currentIndex < TAB_ORDER.length - 1) {
          navigate(TAB_ORDER[currentIndex + 1])
        }
        return
      }

      if (isFromLeftEdgeRef.current && deltaX > SWIPE_THRESHOLD) {
        if (currentIndex > 0) {
          navigate(TAB_ORDER[currentIndex - 1])
        }
      }
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, location.pathname, navigate])
}
