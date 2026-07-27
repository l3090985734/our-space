import type { Identity } from '../../types'
import { cn } from '../../lib/utils'

interface AuthorBadgeProps {
  identity: Identity
  size?: 'xs' | 'sm' | 'md'
  variant?: 'default' | 'record'
  className?: string
}

export function AuthorBadge({
  identity,
  size = 'sm',
  variant = 'default',
  className,
}: AuthorBadgeProps) {
  const isHe = identity === 'he'

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  const text = variant === 'record'
    ? (isHe ? '他记录' : '她记录')
    : (isHe ? '他' : '她')

  return (
    <span
      className={cn(
        'rounded-full font-medium',
        sizeClasses[size],
        isHe
          ? 'bg-blue-100 text-blue-600'
          : 'bg-sakura-light text-sakura-deep',
        className
      )}
    >
      {text}
    </span>
  )
}
