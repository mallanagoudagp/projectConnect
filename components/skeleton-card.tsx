"use client"

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bt-skeleton" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-2/3 rounded-full bt-skeleton" />
          <div className="h-2.5 w-1/3 rounded-full bt-skeleton" />
        </div>
      </div>
      {/* Lines */}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-2.5 rounded-full bt-skeleton"
          style={{ width: `${85 - i * 15}%` }}
        />
      ))}
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bt-skeleton" />
    </div>
  )
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
          <div className="w-8 h-8 rounded-full bt-skeleton flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-1/2 rounded-full bt-skeleton" />
            <div className="h-2.5 w-1/3 rounded-full bt-skeleton" />
          </div>
          <div className="h-6 w-16 rounded-full bt-skeleton" />
        </div>
      ))}
    </div>
  )
}
