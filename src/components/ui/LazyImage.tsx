import { useState, useEffect, useRef } from 'react'
import { cn } from '../../lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: string
  blurPlaceholder?: string
  objectFit?: 'cover' | 'contain' | 'fill'
  onLoad?: () => void
}

export function LazyImage({
  src,
  alt,
  className,
  aspectRatio,
  blurPlaceholder,
  objectFit = 'cover',
  onLoad,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '100px' }
    )

    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  return (
    <div
      ref={imgRef}
      className={cn('relative overflow-hidden bg-gray-100', className)}
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {blurPlaceholder && !isLoaded && (
        <img
          src={blurPlaceholder}
          alt=""
          className={`absolute inset-0 w-full h-full object-${objectFit} scale-110 blur-lg`}
          aria-hidden="true"
        />
      )}

      {!blurPlaceholder && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse" />
      )}

      {isInView && !hasError && (
        <img
          src={src}
          alt={alt}
          className={cn(
            `w-full h-full object-${objectFit} transition-opacity duration-500`,
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-xs text-gray-400">加载失败</span>
        </div>
      )}
    </div>
  )
}
