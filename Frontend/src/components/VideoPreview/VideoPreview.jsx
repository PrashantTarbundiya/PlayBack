import React from 'react'
import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import useVideoPreview from '../../hooks/useVideoPreview'

const VideoPreview = ({ 
  videoUrl, 
  thumbnailUrl, 
  alt = "Video preview", 
  className = "",
  enablePreview = true,
  previewDelay = 2000,
  autoPlay = true,
  showControls = true,
  onPreviewStart,
  onPreviewEnd,
  onPreviewError
}) => {
  const {
    isHovering,
    showPreview,
    previewMuted,
    previewLoaded,
    previewError,
    isPlaying,
    videoRef,
    handleMouseEnter,
    handleMouseLeave,
    handleVideoPreviewError,
    handleVideoPreviewLoad,
    togglePreviewMute,
  } = useVideoPreview(enablePreview ? videoUrl : null, previewDelay)

  // Handle callbacks
  React.useEffect(() => {
    if (showPreview && onPreviewStart) {
      onPreviewStart()
    }
    if (!showPreview && onPreviewEnd) {
      onPreviewEnd()
    }
  }, [showPreview, onPreviewStart, onPreviewEnd])

  React.useEffect(() => {
    if (previewError && onPreviewError) {
      onPreviewError()
    }
  }, [previewError, onPreviewError])

  const handleVideoError = () => {
    handleVideoPreviewError()
  }

  const togglePlayPause = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  return (
    <div 
      className={`relative w-full h-full overflow-hidden rounded-lg bg-black group ${className}`}
      onMouseEnter={enablePreview ? handleMouseEnter : undefined}
      onMouseLeave={enablePreview ? handleMouseLeave : undefined}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={alt}
        className={`absolute top-0 left-0 w-full h-full object-cover z-[1] transition-opacity duration-300 ease-in-out ${
          showPreview && previewLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
      />
      
      {/* Video Preview */}
      {enablePreview && showPreview && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className={`absolute top-0 left-0 w-full h-full object-cover z-[2] transition-opacity duration-300 ease-in-out ${
            previewLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          muted={previewMuted}
          loop
          playsInline
          autoPlay={autoPlay}
          onLoadedData={handleVideoPreviewLoad}
          onError={handleVideoError}
          onCanPlay={handleVideoPreviewLoad}
        />
      )}
      
      {/* Controls */}
      {enablePreview && showPreview && previewLoaded && showControls && (
        <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 hover:opacity-100 transition-opacity duration-200 ease-in-out group-hover:opacity-100">
          <button
            onClick={togglePlayPause}
            className="p-1.5 bg-black/70 hover:bg-black/90 border-none rounded-full text-white cursor-pointer transition-all duration-200 ease-in-out flex items-center justify-center backdrop-blur-sm hover:scale-110 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
            title={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={togglePreviewMute}
            className="p-1.5 bg-black/70 hover:bg-black/90 border-none rounded-full text-white cursor-pointer transition-all duration-200 ease-in-out flex items-center justify-center backdrop-blur-sm hover:scale-110 focus:outline-2 focus:outline-blue-500 focus:outline-offset-2"
            title={previewMuted ? "Unmute preview" : "Mute preview"}
          >
            {previewMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      )}
      
      {/* Hover indicator */}
      {enablePreview && isHovering && !showPreview && !previewError && videoUrl && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/30 flex items-center justify-center z-[5]">
          <div className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-md animate-pulse backdrop-blur-sm">
            Hover for preview...
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {enablePreview && showPreview && !previewLoaded && !previewError && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-[5]">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Error indicator */}
      {enablePreview && previewError && (
        <div className="absolute top-0 left-0 w-full h-full bg-black/60 flex items-center justify-center z-[5]">
          <div className="bg-red-600/80 text-white text-xs px-3 py-1.5 rounded-md backdrop-blur-sm">
            Preview unavailable
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoPreview