'use client';

import { motion } from 'framer-motion';

// Base skeleton with shimmer effect
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-white/5 rounded ${className}`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        initial={{ x: '-100%' }}
        animate={{ x: '100%' }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Game Card Skeleton
export function GameCardSkeleton() {
  return (
    <div className="glass-premium border border-white/10 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      {/* Teams */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>

        <Skeleton className="h-px w-full" />

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
          </div>
        ))}
      </div>

      {/* Button */}
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

// Stat Card Skeleton
export function StatCardSkeleton() {
  return (
    <div className="glass-premium border border-white/10 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <Skeleton className="h-10 w-32 mb-2" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

// Leaderboard Row Skeleton
export function LeaderboardRowSkeleton() {
  return (
    <div className="glass-premium border border-white/10 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="text-center">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-12 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-12 mx-auto" />
          </div>
          <div className="text-center">
            <Skeleton className="h-4 w-16 mb-1" />
            <Skeleton className="h-5 w-12 mx-auto" />
          </div>
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Parlay Skeleton
export function ParlaySkeleton() {
  return (
    <div className="glass-premium border border-white/10 rounded-xl p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Title */}
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />

      {/* Legs */}
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
          >
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// Comment Skeleton
export function CommentSkeleton() {
  return (
    <div className="flex space-x-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center space-x-4 pt-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 py-3"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// List Skeleton
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Page Loading Skeleton (Full Page)
export function PageLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-12">
      <div className="container mx-auto px-4">
        {/* Page Title */}
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-4" />
          <Skeleton className="h-6 w-96" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <GameCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
