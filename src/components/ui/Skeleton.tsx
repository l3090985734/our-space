import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 bg-[length:200%_100%]',
        className
      )}
      style={style}
    />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return <Skeleton className={cn('rounded-2xl bg-white shadow-sm', className)} />
}

export function SkeletonAvatar({ size = 12 }: { size?: number }) {
  return (
    <Skeleton
      className="rounded-full"
      style={{ width: size * 4, height: size * 4 }}
    />
  )
}

export function SkeletonText({ lines = 1, className }: { lines?: number } & SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array(lines)
        .fill(0)
        .map((_, i) => (
          <Skeleton
            key={i}
            className={`h-4 rounded-full ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
          />
        ))}
    </div>
  )
}

export function SkeletonCircle({ size = 8 }: { size?: number }) {
  return (
    <Skeleton
      className="rounded-full"
      style={{ width: size * 4, height: size * 4 }}
    />
  )
}

export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton className={cn('h-10 rounded-full', className)} />
}
