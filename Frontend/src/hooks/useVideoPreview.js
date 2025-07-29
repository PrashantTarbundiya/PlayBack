import { useState, useEffect, useRef } from 'react'

const useVideoPreview = (videoUrl, hoverDelay = 2000) => {
  const [isHovering, setIsHovering] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewMuted, setPreviewMuted] = useState(true)
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  
  const hoverTimeoutRef = useRef(null)
  const videoRef = useRef(null)

  // Handle hover preview logic
  useEffect(() => {
    if (isHovering && !showPreview && !previewError && videoUrl) {
      // Start timer for specified delay
      hoverTimeoutRef.current = setTimeout(() => {
        setShowPreview(true)
      }, hoverDelay)
    } else if (!isHovering) {
      // Clear timer and hide preview when not hovering
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      setShowPreview(false)
      setPreviewLoaded(false)
      setIsPlaying(false)
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
    }
  }, [isHovering, showPreview, previewError, videoUrl, hoverDelay])

  // Handle video preview controls
  useEffect(() => {
    if (showPreview && videoRef.current && videoUrl) {
      const video = videoRef.current
      video.currentTime = 0 // Start from beginning
      
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
          })
          .catch(error => {
            // Only log AbortError if it's not due to DOM removal
            if (error.name !== 'AbortError') {
              console.warn("Video autoplay failed:", error)
              setPreviewError(true)
              setShowPreview(false)
            }
          })
      }
    } else if (videoRef.current) {
      const video = videoRef.current
      // Check if video is still in DOM before pausing
      if (video.parentNode) {
        video.pause()
        video.currentTime = 0
      }
      setIsPlaying(false)
    }
  }, [showPreview, videoUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        const video = videoRef.current
        // Pause video safely on unmount
        try {
          video.pause()
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  const handleVideoPreviewError = (error) => {
    // Only show error for actual playback issues, not AbortError
    if (error && error.target && error.target.error) {
      const videoError = error.target.error
      if (videoError.code !== videoError.MEDIA_ERR_ABORTED) {
        setPreviewError(true)
        setShowPreview(false)
        setIsPlaying(false)
      }
    } else {
      setPreviewError(true)
      setShowPreview(false)
      setIsPlaying(false)
    }
  }

  const handleVideoPreviewLoad = () => {
    setPreviewLoaded(true)
  }

  const togglePreviewMute = (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    setPreviewMuted(!previewMuted)
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  const resetPreview = () => {
    setShowPreview(false)
    setPreviewLoaded(false)
    setPreviewError(false)
    setIsPlaying(false)
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
  }

  return {
    // State
    isHovering,
    showPreview,
    previewMuted,
    previewLoaded,
    previewError,
    isPlaying,
    
    // Refs
    videoRef,
    
    // Handlers
    handleMouseEnter,
    handleMouseLeave,
    handleVideoPreviewError,
    handleVideoPreviewLoad,
    togglePreviewMute,
    resetPreview,
    
    // Setters (for external control)
    setPreviewMuted,
    setIsHovering
  }
}

export default useVideoPreview