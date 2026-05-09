import { clsx } from 'clsx'

interface Props { className?: string; lines?: number }

export function SkeletonLine({ className }: { className?: string }) {
  return <div className={clsx('h-3 bg-white/[0.08] rounded-full animate-pulse', className)} />
}

export default function Skeleton({ lines = 3, className }: Props) {
  return (
    <div className={clsx('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} className={i === lines - 1 ? 'w-3/4' : 'w-full'} />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={clsx('bg-white/[0.03] rounded-2xl border border-white/[0.06] p-4 space-y-3', className)}>
      <div className="flex justify-between">
        <SkeletonLine className="w-1/3" />
        <SkeletonLine className="w-1/4" />
      </div>
      <SkeletonLine className="w-full h-4" />
      <SkeletonLine className="w-2/3" />
    </div>
  )
}
