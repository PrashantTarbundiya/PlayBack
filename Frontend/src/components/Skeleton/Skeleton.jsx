import React from 'react'

// Base skeleton component
const Skeleton = ({ 
  className = '', 
  width = 'w-full', 
  height = 'h-4', 
  rounded = 'rounded',
  animate = true 
}) => {
  return (
    <div 
      className={`bg-gray-700 ${width} ${height} ${rounded} ${animate ? 'animate-pulse' : ''} ${className}`}
    />
  )
}

// Video card skeleton
export const VideoCardSkeleton = () => {
  return (
    <div className="bg-[#0f0f0f] text-white w-full max-w-md rounded-lg overflow-hidden border border-[#222]">
      {/* Thumbnail skeleton - larger and more prominent */}
      <div className="relative aspect-video bg-black overflow-hidden">
        <Skeleton className="w-full h-full" rounded="rounded-none" />
        {/* Duration badge skeleton */}
        <div className="absolute bottom-1 right-1">
          <Skeleton width="w-8" height="h-4" rounded="rounded" />
        </div>
      </div>
      
      <div className="flex p-3 gap-3">
        {/* Avatar skeleton */}
        <Skeleton width="w-9" height="h-9" rounded="rounded-full" className="flex-shrink-0" />
        
        <div className="flex-1 overflow-hidden space-y-2">
          {/* Title skeleton - 2 lines */}
          <div className="space-y-1">
            <Skeleton height="h-4" className="w-full" />
            <Skeleton height="h-4" className="w-3/4" />
          </div>
          
          {/* Channel name skeleton */}
          <Skeleton height="h-3" className="w-1/2" />
          
          {/* Views and time skeleton */}
          <div className="flex items-center gap-1">
            <Skeleton height="h-3" className="w-16" />
            <Skeleton height="h-3" className="w-20" />
          </div>
        </div>

        {/* Options button skeleton */}
        <div className="flex-shrink-0">
          <Skeleton width="w-6" height="h-6" rounded="rounded-full" />
        </div>
      </div>
    </div>
  )
}

// Video grid skeleton
export const VideoGridSkeleton = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <VideoCardSkeleton key={index} />
      ))}
    </div>
  )
}


export default Skeleton