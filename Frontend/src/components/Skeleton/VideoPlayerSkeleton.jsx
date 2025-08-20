import React from 'react'
import Skeleton, { VideoCardSkeleton } from './Skeleton'

const ActionChip = ({ width = 'w-20' }) => (
  <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-gray-800 ${width}`}>
    <Skeleton width="w-4" height="h-4" rounded="rounded-full" animate={true} />
    <Skeleton width="w-10" height="h-3" rounded="rounded" animate={true} />
  </div>
)

const CommentSkeleton = () => (
  <div className="flex gap-3 py-4">
    <Skeleton width="w-10" height="h-10" rounded="rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton width="w-1/3" height="h-3" />
      <Skeleton width="w-full" height="h-3" />
      <Skeleton width="w-5/6" height="h-3" />
    </div>
  </div>
)

const PlaylistItemSkeleton = () => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a]">
    <div className="relative flex-shrink-0 overflow-hidden rounded bg-gray-800" style={{ width: '106px', height: '64px' }}>
      <Skeleton width="w-full" height="h-full" rounded="rounded" />
      <div className="absolute top-0.5 left-0.5">
        <Skeleton width="w-6" height="h-4" rounded="rounded" />
      </div>
      <div className="absolute bottom-0.5 right-0.5">
        <Skeleton width="w-10" height="h-4" rounded="rounded" />
      </div>
    </div>
    <div className="flex-1 min-w-0 space-y-2">
      <Skeleton width="w-5/6" height="h-3" />
      <Skeleton width="w-1/3" height="h-3" />
      <Skeleton width="w-1/4" height="h-3" />
    </div>
  </div>
)

const VideoPlayerSkeleton = () => {
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 text-white bg-[#0f0f0f] min-h-screen animate-pulse">
      {/* Main Section */}
      <div className="flex-1 max-w-5xl">
        {/* Player */}
        <div className="rounded-lg overflow-hidden bg-black">
          <div className="w-full" style={{ aspectRatio: '16 / 9' }}>
            <Skeleton className="w-full h-full" rounded="rounded-none" />
          </div>
        </div>

        {/* Title */}
        <div className="mt-4 space-y-2">
          <Skeleton height="h-6" className="w-3/4" />
          <Skeleton height="h-4" className="w-1/2" />
        </div>

        {/* Actions row */}
        <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
          <Skeleton height="h-4" className="w-40" />
          <div className="flex gap-2">
            <ActionChip width="w-16" />
            <ActionChip width="w-16" />
            <ActionChip width="w-24" />
            <ActionChip width="w-24" />
            <ActionChip width="w-24" />
          </div>
        </div>

        {/* Channel card */}
        <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg mt-6">
          <div className="flex items-center gap-3">
            <Skeleton width="w-12" height="h-12" rounded="rounded-full" />
            <div className="space-y-2">
              <Skeleton height="h-4" className="w-48" />
              <Skeleton height="h-3" className="w-24" />
            </div>
          </div>
          <Skeleton width="w-28" height="h-8" rounded="rounded-full" />
        </div>

        {/* Description */}
        <div className="bg-gray-900 p-4 rounded-lg mt-6 space-y-2">
          <Skeleton height="h-3" className="w-11/12" />
          <Skeleton height="h-3" className="w-10/12" />
          <Skeleton height="h-3" className="w-9/12" />
        </div>

        {/* Comments */}
        <div className="mt-6">
          <Skeleton height="h-5" className="w-32" />
          <CommentSkeleton />
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-full lg:w-96 lg:min-w-96">
        <div className="space-y-4">
          {/* When playlist exists: header */}
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Skeleton height="h-5" className="w-40" />
              <Skeleton width="w-8" height="h-8" rounded="rounded-full" />
            </div>
            <Skeleton height="h-4" className="w-24" />
            <Skeleton height="h-3" className="w-2/3 mt-2" />
          </div>

          {/* Playlist videos list (replica of list items) */}
          <div className="space-y-2 max-h-[600px] overflow-y-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <PlaylistItemSkeleton key={i} />
            ))}
          </div>

          {/* Or fallback to related videos skeleton grid when no playlist */}
          <div className="hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}

export default VideoPlayerSkeleton


