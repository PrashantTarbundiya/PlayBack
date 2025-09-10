"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Play, Pause, Volume2, VolumeX, X, Maximize2, SkipBack, SkipForward } from "lucide-react"
import { useSyncedVideo } from "../../contexts/SyncedVideoContext"
import { useResponsive } from "../../hooks/useResponsive"
import { useNavigate } from "react-router-dom"

const MiniPlayer = () => {
  const {
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isMiniPlayerActive,
    miniPlayerPosition,
    miniPlayerSize,
    isDragging,
    isResizing,
    miniVideoRef,
    activePlayerRef,      
    togglePlay,
    seekTo,
    setVolumeLevel,
    toggleMute,
    closeMiniPlayer,
    returnToMainPlayer,
    updateMiniPlayerPosition,
    updateMiniPlayerSize,
    resetMiniPlayerPosition,
    setIsDragging,
    setIsResizing,
    handleVideoEnd,
    setActivePlayer,
    updateCurrentTime
  } = useSyncedVideo()
  
  const { isMobile, isTablet } = useResponsive()
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 })
  const [showControls, setShowControls] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const controlsTimeoutRef = useRef(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [showMobileControls, setShowMobileControls] = useState(false)
  const mobileControlsTimeoutRef = useRef(null)
  
  // Determine if this is a big screen (desktop/tablet) or small screen (mobile)
  const isBigScreen = !isMobile
  
  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isBigScreen) {
        setShowControls(false)
      }
    }, 2000)
  }, [isBigScreen])

  // Auto-hide mobile controls
  const resetMobileControlsTimeout = useCallback(() => {
    if (mobileControlsTimeoutRef.current) {
      clearTimeout(mobileControlsTimeoutRef.current)
    }
    mobileControlsTimeoutRef.current = setTimeout(() => {
      if (!isBigScreen) {
        setShowMobileControls(false)
      }
    }, 3000)
  }, [isBigScreen])
  
  // Show controls on mouse enter/move
  const handleMouseEnter = useCallback(() => {
    if (isBigScreen) {
      setShowControls(true)
      resetControlsTimeout()
    }
  }, [isBigScreen, resetControlsTimeout])

  const handleMouseLeave = useCallback(() => {
    if (isBigScreen) {
      setShowControls(false)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isBigScreen])
  
  const handleMouseMove = useCallback(() => {
    if (isBigScreen) {
      setShowControls(true)
      resetControlsTimeout()
    }
  }, [isBigScreen, resetControlsTimeout])

  // Mobile interaction handlers (touch and mouse)
  const handleMobileInteraction = useCallback(() => {
    if (!isBigScreen) {
      setShowMobileControls(true)
      resetMobileControlsTimeout()
    }
  }, [isBigScreen, resetMobileControlsTimeout])

  const handleMobileInteractionEnd = useCallback(() => {
    if (!isBigScreen) {
      resetMobileControlsTimeout()
    }
  }, [isBigScreen, resetMobileControlsTimeout])
  
  // Set this player as active when video is ready and sync play state
  // Sync video play state when isPlaying changes
  useEffect(() => {
    if (miniVideoRef.current && activePlayerRef.current === miniVideoRef.current && isVideoReady) {
      if (isPlaying) {
        // Small delay to ensure video is ready for playback
        setTimeout(() => {
          if (miniVideoRef.current && activePlayerRef.current === miniVideoRef.current) {
            miniVideoRef.current.play().catch(() => {})
          }
        }, 50)
      } else {
        miniVideoRef.current.pause()
      }
    }
  }, [isPlaying, activePlayerRef, isVideoReady])

  useEffect(() => {
    if (isVideoReady && isMiniPlayerActive && miniVideoRef.current) {
      setActivePlayer('mini')
      // Ensure video continues playing when miniplayer becomes active
      setTimeout(() => {
        if (miniVideoRef.current && activePlayerRef.current === miniVideoRef.current && isPlaying) {
          miniVideoRef.current.play().catch(() => {})
        }
      }, 150)
    }
  }, [isVideoReady, isMiniPlayerActive, setActivePlayer, activePlayerRef, isPlaying])

  // Periodic sync to ensure video state matches global state
  useEffect(() => {
    if (!isMiniPlayerActive || !isVideoReady || !miniVideoRef.current) return
    
    const syncInterval = setInterval(() => {
      if (miniVideoRef.current && activePlayerRef.current === miniVideoRef.current) {
        const video = miniVideoRef.current
        const shouldBePlaying = isPlaying
        const isActuallyPlaying = !video.paused
        
        if (shouldBePlaying && !isActuallyPlaying) {
          video.play().catch(() => {})
        } else if (!shouldBePlaying && isActuallyPlaying) {
          video.pause()
        }
      }
    }, 500) // Check every 500ms
    
    return () => clearInterval(syncInterval)
  }, [isMiniPlayerActive, isVideoReady, isPlaying, activePlayerRef])
  
  // Handle drag start
  const handleDragStart = useCallback((e) => {
    if (isMobile || isResizing) return
    
    // Prevent dragging when clicking on buttons inside the drag area
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
      return
    }
    
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY
    
    setIsDragging(true)
    dragStartRef.current = {
      x: clientX - miniPlayerPosition.x,
      y: clientY - miniPlayerPosition.y
    }
    
    // Add smooth transition class for better visual feedback
    if (containerRef.current) {
      containerRef.current.style.transition = 'none'
    }
    
    e.preventDefault()
  }, [isMobile, isResizing, miniPlayerPosition, setIsDragging])
  
  // Handle drag move
  const handleDragMove = useCallback((e) => {
    if (!isDragging || isMobile) return
    
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
    const clientY = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY
    
    const newX = clientX - dragStartRef.current.x
    const newY = clientY - dragStartRef.current.y
    
    // Constrain to viewport
    const container = containerRef.current
    if (!container) return;

    const maxX = window.innerWidth - container.offsetWidth
    const maxY = window.innerHeight - container.offsetHeight
    
    const constrainedX = Math.max(0, Math.min(newX, maxX))
    const constrainedY = Math.max(0, Math.min(newY, maxY))
    
    // Use requestAnimationFrame for smooth dragging
    requestAnimationFrame(() => {
      updateMiniPlayerPosition({ x: constrainedX, y: constrainedY })
    })
  }, [isDragging, isMobile, updateMiniPlayerPosition])
  
  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    
    // Restore smooth transition after dragging
    if (containerRef.current) {
      containerRef.current.style.transition = 'all 300ms ease-out'
    }
  }, [setIsDragging])
  
  // Handle resize start
  const handleResizeStart = useCallback((e) => {
    if (isMobile) return
    
    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX
    const clientY = e.type === 'mousedown' ? e.clientY : e.touches[0].clientY
    
    setIsResizing(true)
    resizeStartRef.current = {
      x: clientX,
      y: clientY,
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight
    }
    
    e.preventDefault()
    e.stopPropagation()
  }, [isMobile, setIsResizing])
  
  // Handle resize move
  const handleResizeMove = useCallback((e) => {
    if (!isResizing || isMobile) return
    
    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX
    
    const deltaX = clientX - resizeStartRef.current.x
    const newWidth = Math.max(280, Math.min(600, resizeStartRef.current.width + deltaX))
    
    // Use requestAnimationFrame for smooth resizing
    requestAnimationFrame(() => {
      updateMiniPlayerSize({ width: newWidth, height: 'auto' })
    })
  }, [isResizing, isMobile, updateMiniPlayerSize])
  
  // Handle resize end
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false)
  }, [setIsResizing])
  
  // Global event listeners for drag and resize
  useEffect(() => {
    if (isDragging) {
      const handleMouseMoveGlobal = (e) => handleDragMove(e)
      const handleMouseUp = () => handleDragEnd()
      const handleTouchMoveGlobal = (e) => handleDragMove(e)
      const handleTouchEnd = () => handleDragEnd()
      
      document.addEventListener('mousemove', handleMouseMoveGlobal)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMoveGlobal, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveGlobal)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMoveGlobal)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isDragging, handleDragMove, handleDragEnd])
  
  useEffect(() => {
    if (isResizing) {
      const handleMouseMoveGlobal = (e) => handleResizeMove(e)
      const handleMouseUp = () => handleResizeEnd()
      const handleTouchMoveGlobal = (e) => handleResizeMove(e)
      const handleTouchEnd = () => handleResizeEnd()
      
      document.addEventListener('mousemove', handleMouseMoveGlobal)
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchmove', handleTouchMoveGlobal, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMoveGlobal)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchmove', handleTouchMoveGlobal)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isResizing, handleResizeMove, handleResizeEnd])
  
  // Video event handlers
  const handleVideoLoadedData = useCallback(() => {
    setIsVideoReady(true)
    if (miniVideoRef.current && activePlayerRef.current === miniVideoRef.current) {
      miniVideoRef.current.currentTime = currentTime
      miniVideoRef.current.volume = volume
      miniVideoRef.current.muted = isMuted
      // Don't auto-play here, let the state management handle it
    }
  }, [currentTime, volume, isMuted, activePlayerRef])
  
  const handleVideoCanPlay = useCallback(() => setIsVideoReady(true), [])
  
  const handleVideoTimeUpdate = useCallback((e) => {
    if (activePlayerRef.current === miniVideoRef.current) {
      const newTime = e.target.currentTime
      const timeDifference = Math.abs(newTime - currentTime)
      if (timeDifference > 0.2) {
        updateCurrentTime(newTime)
      }
    }
  }, [activePlayerRef, currentTime, updateCurrentTime])

  const handleVideoError = useCallback((e) => {
    setIsVideoReady(false)
  }, [])

  const handleVideoPlay = useCallback(() => {
    if (miniVideoRef.current && activePlayerRef.current === miniVideoRef.current) {
      setActivePlayer('mini')
    }
  }, [setActivePlayer, activePlayerRef])

  const handleVideoPause = useCallback(() => {
    // Video paused - sync with global state if this is the active player
    if (miniVideoRef.current && activePlayerRef.current === miniVideoRef.current && isPlaying) {
      // If global state says playing but video paused, try to resume
      setTimeout(() => {
        if (miniVideoRef.current && !miniVideoRef.current.paused && activePlayerRef.current === miniVideoRef.current) {
          miniVideoRef.current.play().catch(() => {})
        }
      }, 100)
    }
  }, [activePlayerRef, isPlaying])
  
  const handleVideoClick = useCallback(() => {
    if (currentVideo) {
      navigate('/')
    }
  }, [currentVideo, navigate])

  const handleTitleClick = useCallback((e) => {
    e.stopPropagation()
    if (currentVideo) {
      navigate('/')
    }
  }, [currentVideo, navigate])

  const handleSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    seekTo(newTime)
  }, [duration, seekTo])

  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value)
    setVolumeLevel(newVolume)
  }, [setVolumeLevel])

  const skip = useCallback((seconds) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    seekTo(newTime)
  }, [currentTime, duration, seekTo])

  // Helper functions
  const formatTime = (time) => {
    if (!time || isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getVideoUrl = () => {
    if (!currentVideo?.videoFile) return null
    const videoFile = currentVideo.videoFile
    if (typeof videoFile === 'string') return videoFile
    return videoFile.url || videoFile.secure_url || videoFile.path || videoFile.src || null
  }

  const getThumbnailUrl = () => {
    if (!currentVideo?.thumbnail) return "/default-thumbnail.jpg"
    const thumbnail = currentVideo.thumbnail
    if (typeof thumbnail === 'string') return thumbnail
    return thumbnail.url || thumbnail.secure_url || "/default-thumbnail.jpg"
  }

  // Listen for close mini player event from video clicks
  useEffect(() => {
    const handleCloseMiniPlayer = () => {
      closeMiniPlayer()
    }

    window.addEventListener('closeMiniPlayer', handleCloseMiniPlayer)
    
    return () => {
      window.removeEventListener('closeMiniPlayer', handleCloseMiniPlayer)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (mobileControlsTimeoutRef.current) {
        clearTimeout(mobileControlsTimeoutRef.current)
      }
    }
  }, [closeMiniPlayer])
  
  if (!isMiniPlayerActive || !currentVideo) {
    return null
  }
  
  const videoUrl = getVideoUrl()
  if (!videoUrl) {
    return null
  }
  
  const handleButtonClick = (e, action) => {
    e.stopPropagation();
    action();
  }
  
  // Desktop styles are now dynamic based on whether height is auto or not
  const desktopStyles = {
    position: 'fixed',
    left: `${miniPlayerPosition.x}px`,
    top: `${miniPlayerPosition.y}px`,
    width: `${miniPlayerSize.width}px`,
    height: miniPlayerSize.height === 'auto' ? 'auto' : `${miniPlayerSize.height}px`,
    zIndex: 9999,
  };
  
  return (
    <div
      ref={containerRef}
      data-mini-player
      className={`bg-black rounded-xl shadow-2xl border border-gray-800 transition-all duration-300 ${
        isDragging ? 'shadow-2xl scale-105 cursor-grabbing' : 'cursor-grab'
      } ${isResizing ? 'border-blue-500 shadow-blue-500/30' : ''} ${isBigScreen ? 'flex flex-col' : ''}`}
      style={{
        ...(isBigScreen ? desktopStyles : {
          position: 'fixed',
          bottom: '80px',
          right: '10px',
          width: '240px',
          height: '135px',
          zIndex: 9999,
        }),
        // Hardware acceleration for smooth dragging
        transform: isDragging ? 'translateZ(0)' : 'none',
        willChange: isDragging || isResizing ? 'transform' : 'auto'
      }}
      onMouseEnter={isBigScreen ? handleMouseEnter : handleMobileInteraction}
      onMouseLeave={isBigScreen ? handleMouseLeave : handleMobileInteractionEnd}
      onMouseMove={isBigScreen ? handleMouseMove : handleMobileInteraction}
      onTouchStart={handleMobileInteraction}
      onTouchEnd={handleMobileInteractionEnd}
    >
      {/* --- BIG SCREEN LAYOUT (VIDEO + CONTROLS SEPARATE) --- */}
      {isBigScreen && (
        <>
          {/* Section 1: Video Player */}
          <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
            <video
              ref={miniVideoRef}
              src={videoUrl}
              poster={getThumbnailUrl()}
              className="w-full h-full object-cover rounded-t-xl"
              controls={false}
              playsInline
              muted={isMuted}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnd}
              onLoadedData={handleVideoLoadedData}
              onCanPlay={handleVideoCanPlay}
              onError={handleVideoError}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onLoadStart={() => setIsVideoReady(false)}
              onClick={handleVideoClick}
              preload="metadata"
            />
            
            {/* YouTube-style overlay controls */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                showControls ? 'opacity-100' : 'opacity-0'
              }`}
              onClick={handleVideoClick}
            >
              {/* Top Controls */}
              <div className="absolute top-2 left-2 right-2 flex justify-between">
                <button
                  onClick={(e) => handleButtonClick(e, returnToMainPlayer)}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
                  title="Expand to main player"
                >
                  <Maximize2 size={16} />
                </button>
                
                <div className="flex gap-1">
                  <button
                    onClick={(e) => handleButtonClick(e, resetMiniPlayerPosition)}
                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
                    title="Reset position to bottom-right"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                      <path d="M3 21v-5h5"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={(e) => handleButtonClick(e, closeMiniPlayer)}
                    className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              
              {/* Bottom center controls - YouTube style */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center gap-2">
                <button
                  onClick={(e) => handleButtonClick(e, () => skip(-10))}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
                  title="Back 10 seconds"
                >
                  <SkipBack size={20} />
                </button>
                
                <button
                  onClick={(e) => handleButtonClick(e, togglePlay)}
                  className="p-3 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
                
                <button
                  onClick={(e) => handleButtonClick(e, () => skip(10))}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all duration-200 backdrop-blur-sm"
                  title="Forward 10 seconds"
                >
                  <SkipForward size={20} />
                </button>
              </div>

              {/* Progress Bar at the bottom of the video */}
              <div className="absolute bottom-0 left-0 right-0 px-2 pb-1">
                <div 
                  className="w-full bg-white/30 rounded-full cursor-pointer h-1 group"
                  onClick={(e) => { e.stopPropagation(); handleSeek(e); }}
                >
                  <div
                    className="h-full bg-red-500 rounded-full relative"
                    style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Info and Controls */}
          <div 
            className="bg-gray-900 p-3 flex items-center justify-between gap-4 rounded-b-xl"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            {/* Left Side: Title & Channel */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-white text-sm font-bold truncate cursor-pointer hover:underline"
                onClick={handleTitleClick}
                title={currentVideo.title}
              >
                {currentVideo.title}
              </h3>
              <p className="text-gray-400 text-xs truncate">
                {currentVideo.owner?.fullName || currentVideo.owner?.username || 'Unknown'}
              </p>
            </div>
            
            {/* Right Side: Empty or additional controls if needed */}
            <div className="flex items-center text-white flex-shrink-0">
              {/* Close button moved to top overlay, this space can be used for other controls */}
            </div>
          </div>
          
          {/* Resize Handle */}
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 cursor-se-resize z-10"
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          />
        </>
      )}

      {/* --- MOBILE LAYOUT (MODIFIED) --- */}
      {!isBigScreen && (
        <div className="relative w-full h-full">
          <video
            ref={miniVideoRef}
            src={videoUrl}
            className="w-full h-full object-cover rounded-xl"
            controls={false}
            playsInline
            muted={isMuted}
            onTimeUpdate={handleVideoTimeUpdate}
            onEnded={handleVideoEnd}
            onLoadedData={handleVideoLoadedData}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoError}
            onPlay={handleVideoPlay}
            onPause={handleVideoPause}
            onLoadStart={() => setIsVideoReady(false)}
            preload="metadata"
          />
          
          {/* Mobile controls overlay - conditionally visible */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              showMobileControls ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top controls */}
            <div className="absolute top-2 left-2 right-2 flex justify-between">
              <button
                onClick={(e) => handleButtonClick(e, returnToMainPlayer)}
                className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm"
                title="Go to main player"
              >
                <Maximize2 size={20} />
              </button>
              
              <button
                onClick={(e) => handleButtonClick(e, closeMiniPlayer)}
                className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Center play/pause button */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <button
                onClick={(e) => handleButtonClick(e, togglePlay)}
                className="p-3 rounded-full bg-black/60 text-white backdrop-blur-sm pointer-events-auto"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </button>
            </div>
            
            {/* Progress bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-xl">
              <div
                className="h-full bg-red-500 rounded-b-xl"
                style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MiniPlayer