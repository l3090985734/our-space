import { Skeleton, SkeletonCard, SkeletonText } from './Skeleton'

export function HomeSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32 rounded-full" />
          <Skeleton className="h-4 w-24 rounded-full" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      <SkeletonCard className="h-32" />

      <SkeletonCard className="h-32" />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} className="h-20" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function NotesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28 rounded-full" />
        <div className="flex gap-2">
          <Skeleton className="w-10 h-10 rounded-full" />
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="w-12 h-5 rounded-full" />
              <Skeleton className="w-16 h-3 rounded-full" />
            </div>
            <SkeletonText lines={2} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PhotosSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>

      <Skeleton className="h-4 w-24 rounded-full" />

      <Skeleton className="w-full aspect-[4/3] rounded-2xl" />

      <SkeletonCard className="h-20" />

      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="w-2 h-2 rounded-full" />
        ))}
      </div>
    </div>
  )
}

export function TimelineSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>

      <div className="relative pl-6 pb-8">
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-sakura/30 via-sakura-light/30 to-transparent" />
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[22px] top-4 w-3 h-3 rounded-full bg-sakura/30" />
              <div className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
                <SkeletonText lines={2} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CountdownSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <SkeletonCard key={i} className="h-24" />
        ))}
      </div>
    </div>
  )
}

export function WishesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>

      <SkeletonCard className="h-16" />

      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} className="h-20" />
        ))}
      </div>
    </div>
  )
}
