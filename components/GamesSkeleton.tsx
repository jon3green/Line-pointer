import { Skeleton } from '@/components/ui/skeleton';

export default function GamesSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card p-6 rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-20" />
          </div>

          {/* Teams */}
          <div className="space-y-4 mb-6">
            {[...Array(2)].map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>

          {/* Betting Options */}
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, k) => (
              <Skeleton key={k} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

