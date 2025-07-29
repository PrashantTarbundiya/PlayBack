import React from 'react'
import { Volume2, VolumeX, Play, Pause } from 'lucide-react'
import useVideoPreview from '../../hooks/useVideoPreview'
import './VideoPreview.css'

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
      className={`video-preview-container ${className}`}
      onMouseEnter={enablePreview ? handleMouseEnter : undefined}
      onMouseLeave={enablePreview ? handleMouseLeave : undefined}
    >
      {/* Thumbnail */}
      <img
        src={thumbnailUrl}
        alt={alt}
        className={`video-preview-thumbnail ${
          showPreview && previewLoaded ? 'opacity-0' : 'opacity-100'
        }`}
        loading="lazy"
      />
      
      {/* Video Preview */}
      {enablePreview && showPreview && videoUrl && (
        <video
          ref={videoRef}
          src={videoUrl}
          className={`video-preview-video ${
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
        <div className="video-preview-controls">
          <button
            onClick={togglePlayPause}
            className="video-preview-control-btn"
            title={isPlaying ? "Pause preview" : "Play preview"}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            onClick={togglePreviewMute}
            className="video-preview-control-btn"
            title={previewMuted ? "Unmute preview" : "Mute preview"}
          >
            {previewMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      )}
      
      {/* Hover indicator */}
      {enablePreview && isHovering && !showPreview && !previewError && videoUrl && (
        <div className="video-preview-hover-indicator">
          <div className="video-preview-hover-text">
            Hover for preview...
          </div>
        </div>
      )}
      
      {/* Loading indicator */}
      {enablePreview && showPreview && !previewLoaded && !previewError && (
        <div className="video-preview-loading">
          <div className="video-preview-spinner"></div>
        </div>
      )}
      
      {/* Error indicator */}
      {enablePreview && previewError && (
        <div className="video-preview-error">
          <div className="video-preview-error-text">
            Preview unavailable
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoPreview