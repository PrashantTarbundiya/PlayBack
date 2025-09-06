"use client"

import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings, Minimize, RotateCcw, Gauge, PlayCircle } from "lucide-react"

const VideoPlayer = forwardRef(({ src, poster, onVideoEnd, nextVideoSrc }, ref) => {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const mouseHoldTimeoutRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [settingsView, setSettingsView] = useState('main') // 'main', 'speed', 'quality', 'subtitles'
  const [isMouseHolding, setIsMouseHolding] = useState(false)
  const [originalSpeed, setOriginalSpeed] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isLoop, setIsLoop] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('Auto (1080p)')
  const [selectedSubtitle, setSelectedSubtitle] = useState('Off')
  const [autoplayNext, setAutoplayNext] = useState(true)
  const [isSeeking, setIsSeeking] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isTouched, setIsTouched] = useState(false)

  // Expose the video element to parent component
  useImperativeHandle(ref, () => videoRef.current, [])

  // Speed options
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    const timeout = 3000 // Always 3 seconds for consistency
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying && !isHovering && !isTouched) {
        setShowControls(false)
      }
    }, timeout)
  }, [isPlaying, isHovering, isTouched])

  // Helper functions
  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    
    if (isPlaying) {
      video.pause()
    } else {
      // Ensure audio is properly initialized before playing
      video.muted = isMuted
      video.volume = volume
      video.play().catch((error) => {
        // Handle autoplay policy restrictions
        if (error.name === 'NotAllowedError') {
          // Video must be started by user interaction
          return
        }
      })
    }
    setShowControls(true)
    resetControlsTimeout()
  }, [isPlaying, resetControlsTimeout, isMuted, volume])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    
    if (isMuted) {
      video.muted = false
      video.volume = volume
      setIsMuted(false)
    } else {
      video.muted = true
      setIsMuted(true)
    }
    setShowControls(true)
    resetControlsTimeout()
  }, [isMuted, volume, resetControlsTimeout])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }, [])

  const skip = useCallback((seconds) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(Math.max(0, video.currentTime + seconds), duration)
    setShowControls(true)
    resetControlsTimeout()
  }, [duration, resetControlsTimeout])

  const seekToPercentage = useCallback((percentage) => {
    const video = videoRef.current
    if (!video || !duration) return
    video.currentTime = (percentage / 100) * duration
    setShowControls(true)
    resetControlsTimeout()
  }, [duration, resetControlsTimeout])

  const changeVolume = useCallback((delta) => {
    const video = videoRef.current
    if (!video) return
    const newVolume = Math.min(Math.max(0, volume + delta), 1)
    setVolume(newVolume)
    video.volume = newVolume
    video.muted = newVolume === 0
    setIsMuted(newVolume === 0)
    setShowControls(true)
    resetControlsTimeout()
  }, [volume, resetControlsTimeout])

  const changeSpeed = useCallback((delta) => {
    const newSpeed = Math.min(Math.max(0.25, playbackRate + delta), 2)
    setPlaybackRate(newSpeed)
    setOriginalSpeed(newSpeed)
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed
    }
    setShowControls(true)
    resetControlsTimeout()
  }, [playbackRate, resetControlsTimeout])

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e) => {
    const video = videoRef.current
    if (!video) return

    // Check if we're typing in an input field or if any button is focused
    const activeElement = document.activeElement
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'BUTTON' ||
      activeElement.contentEditable === 'true'
    )

    if (isInputFocused) {
      return
    }

    // Prevent default for handled keys
    const handledKeys = [
      'Space', 'KeyK', 'KeyM', 'KeyF', 'ArrowLeft', 'ArrowRight', 
      'ArrowUp', 'ArrowDown', 'Digit0', 'Digit1', 'Digit2', 'Digit3', 
      'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 
      'KeyJ', 'KeyL', 'Comma', 'Period', 'KeyS', 'KeyC'
    ]
    
    if (handledKeys.includes(e.code)) {
      e.preventDefault()
      e.stopPropagation()
    }

    switch (e.code) {
      case 'Space':
      case 'KeyK':
        togglePlay()
        break
      case 'KeyM':
        toggleMute()
        break
      case 'KeyF':
        toggleFullscreen()
        break
      case 'ArrowLeft':
        skip(-5)
        break
      case 'ArrowRight':
        skip(5)
        break
      case 'KeyJ':
        skip(-10)
        break
      case 'KeyL':
        skip(10)
        break
      case 'ArrowUp':
        changeVolume(0.1)
        break
      case 'ArrowDown':
        changeVolume(-0.1)
        break
      case 'Comma':
        changeSpeed(-0.25)
        break
      case 'Period':
        changeSpeed(0.25)
        break
      case 'KeyS':
        setShowSettingsMenu(prev => !prev)
        break
      case 'KeyC':
        // Toggle captions (placeholder for future implementation)
        break
      case 'Digit0':
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
      case 'Digit6':
      case 'Digit7':
      case 'Digit8':
      case 'Digit9':
        const digit = parseInt(e.code.replace('Digit', ''))
        seekToPercentage(digit * 10)
        break
    }
    
    setShowControls(true)
    resetControlsTimeout()
  }, [togglePlay, toggleMute, toggleFullscreen, skip, changeVolume, changeSpeed, seekToPercentage, resetControlsTimeout])

  // Mouse hold for 2x speed
  const handleMouseDown = useCallback((e) => {
    // Only apply to video area, not controls
    if (e.target !== videoRef.current && e.target !== containerRef.current) {
      return
    }
    
    if (e.button === 0) { // Left mouse button
      setOriginalSpeed(playbackRate)
      mouseHoldTimeoutRef.current = setTimeout(() => {
        setIsMouseHolding(true)
        setPlaybackRate(2)
        if (videoRef.current) {
          videoRef.current.playbackRate = 2
        }
      }, 200) // 200ms delay before activating 2x speed
    }
  }, [playbackRate])

  const handleMouseUp = useCallback((e) => {
    if (mouseHoldTimeoutRef.current) {
      clearTimeout(mouseHoldTimeoutRef.current)
      mouseHoldTimeoutRef.current = null
    }
    if (isMouseHolding) {
      setIsMouseHolding(false)
      setPlaybackRate(originalSpeed)
      if (videoRef.current) {
        videoRef.current.playbackRate = originalSpeed
      }
    }
  }, [isMouseHolding, originalSpeed])

  useEffect(() => {
    const video = videoRef.current
    const container = containerRef.current
    if (!video || !container) return

    // Initialize video audio properties
    video.volume = volume
    video.muted = isMuted

    const updateTime = () => setCurrentTime(video.currentTime)
    const updateDuration = () => setDuration(video.duration)
    const updatePlay = () => setIsPlaying(true)
    const updatePause = () => setIsPlaying(false)
    const updateBuffering = () => setIsBuffering(true)
    const updateBuffered = () => setIsBuffering(false)
    
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    const handleVideoEnd = () => {
      if (isLoop) {
        video.currentTime = 0
        video.play()
      } else if (autoplayNext) {
        // Call parent component's video end handler or play next video
        if (onVideoEnd) {
          onVideoEnd()
        } else if (nextVideoSrc) {
          // Auto-play next video if source is provided
          video.src = nextVideoSrc
          video.currentTime = 0
          video.play()
        }
      }
    }

    // Video event listeners
    video.addEventListener("timeupdate", updateTime)
    video.addEventListener("loadedmetadata", updateDuration)
    video.addEventListener("play", updatePlay)
    video.addEventListener("pause", updatePause)
    video.addEventListener("waiting", updateBuffering)
    video.addEventListener("canplay", updateBuffered)
    video.addEventListener("loadstart", updateBuffering)
    video.addEventListener("loadeddata", updateBuffered)
    video.addEventListener("ended", handleVideoEnd)

    // Keyboard and mouse event listeners
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("mouseup", handleMouseUp)

    // Make container focusable
    container.tabIndex = 0

    return () => {
      video.removeEventListener("timeupdate", updateTime)
      video.removeEventListener("loadedmetadata", updateDuration)
      video.removeEventListener("play", updatePlay)
      video.removeEventListener("pause", updatePause)
      video.removeEventListener("waiting", updateBuffering)
      video.removeEventListener("canplay", updateBuffered)
      video.removeEventListener("loadstart", updateBuffering)
      video.removeEventListener("loadeddata", updateBuffered)
      video.removeEventListener("ended", handleVideoEnd)
      
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("mouseup", handleMouseUp)
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (mouseHoldTimeoutRef.current) {
        clearTimeout(mouseHoldTimeoutRef.current)
      }
    }
  }, [handleKeyDown, handleMouseUp, resetControlsTimeout, isLoop, autoplayNext, volume, isMuted])

  // Initialize video properties when src changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Ensure proper audio initialization
    const initializeVideo = () => {
      video.volume = volume
      video.muted = isMuted
    }

    // Initialize immediately
    initializeVideo()

    // Also initialize when video loads
    video.addEventListener('loadedmetadata', initializeVideo)
    video.addEventListener('canplay', initializeVideo)

    return () => {
      video.removeEventListener('loadedmetadata', initializeVideo)
      video.removeEventListener('canplay', initializeVideo)
    }
  }, [src, volume, isMuted])

  const handleSeek = (e) => {
    const video = videoRef.current
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    video.currentTime = pos * duration
    setShowControls(true)
    resetControlsTimeout()
  }

  const handleSeekStart = useCallback((e) => {
    e.preventDefault()
    setIsSeeking(true)
    handleSeek(e)
  }, [handleSeek])

  const handleSeekMove = useCallback((e) => {
    if (isSeeking) {
      e.preventDefault()
      const progressBar = document.querySelector('.progress-bar')
      if (progressBar) {
        const rect = progressBar.getBoundingClientRect()
        const clientX = e.touches ? e.touches[0].clientX : e.clientX
        const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        const video = videoRef.current
        if (video) {
          video.currentTime = pos * duration
        }
      }
    }
  }, [isSeeking, duration])

  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false)
  }, [])

  // Event listeners for seeking
  useEffect(() => {
    document.addEventListener("mousemove", handleSeekMove)
    document.addEventListener("mouseup", handleSeekEnd)
    document.addEventListener("touchmove", handleSeekMove)
    document.addEventListener("touchend", handleSeekEnd)

    return () => {
      document.removeEventListener("mousemove", handleSeekMove)
      document.removeEventListener("mouseup", handleSeekEnd)
      document.removeEventListener("touchmove", handleSeekMove)
      document.removeEventListener("touchend", handleSeekEnd)
    }
  }, [handleSeekMove, handleSeekEnd])

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    videoRef.current.volume = newVolume
    videoRef.current.muted = newVolume === 0
    setIsMuted(newVolume === 0)
  }

  const handleSpeedSliderChange = (e) => {
    const newSpeed = parseFloat(e.target.value)
    setPlaybackRate(newSpeed)
    setOriginalSpeed(newSpeed)
    if (videoRef.current) {
      videoRef.current.playbackRate = newSpeed
    }
    setShowControls(true)
    resetControlsTimeout()
  }

  const resetSpeed = () => {
    setPlaybackRate(1)
    setOriginalSpeed(1)
    if (videoRef.current) {
      videoRef.current.playbackRate = 1
    }
    setShowControls(true)
    resetControlsTimeout()
  }

  const setSpeed = (speed) => {
    setPlaybackRate(speed)
    setOriginalSpeed(speed)
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
    }
    setShowSpeedMenu(false)
    setShowControls(true)
    resetControlsTimeout()
  }

  const setQuality = (quality) => {
    setSelectedQuality(quality)
    setShowControls(true)
    resetControlsTimeout()
    // Here you would typically trigger a quality change in the video source
  }

  const setSubtitle = (subtitle) => {
    setSelectedSubtitle(subtitle)
    setShowControls(true)
    resetControlsTimeout()
    // Here you would typically enable/disable subtitles
  }

  const toggleAutoplayNext = () => {
    setAutoplayNext(!autoplayNext)
    setShowControls(true)
    resetControlsTimeout()
  }

  const toggleLoop = () => {
    setIsLoop(!isLoop)
    setShowControls(true)
    resetControlsTimeout()
  }

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00"
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handleMouseMove = () => {
    if (!isFullscreen) {
      setShowControls(true)
      resetControlsTimeout()
    }
  }

  const handleMouseEnter = () => {
    if (!isFullscreen) {
      setIsHovering(true)
      setShowControls(true)
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }

  const handleMouseLeave = () => {
    if (!isFullscreen) {
      setIsHovering(false)
      if (isPlaying) {
        resetControlsTimeout()
      }
    }
  }

  const handleTouchStart = () => {
    setIsTouched(true)
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    // Reset touch state after 3 seconds
    setTimeout(() => {
      setIsTouched(false)
      if (isPlaying) {
        resetControlsTimeout()
      }
    }, 3000)
  }

  const handleContainerClick = (e) => {
    // Only toggle play if clicking on the video itself, not controls
    if (e.target === videoRef.current || e.target === containerRef.current) {
      togglePlay()
    }
  }

  const closeAllMenus = () => {
    setShowSpeedMenu(false)
    setShowSettingsMenu(false)
    setSettingsView('main')
  }

  const openSettingsSubmenu = (view) => {
    setSettingsView(view)
  }

  const backToMainSettings = () => {
    setSettingsView('main')
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black rounded-xl overflow-hidden focus:outline-none aspect-video"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onClick={handleContainerClick}
      onMouseDown={handleMouseDown}
      tabIndex={0}
    >
      {/* Demo video source */}
      <video
        ref={videoRef}
        src={src || "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"}
        poster={poster}
        className="w-full h-full block"
        controls={false}
        preload="metadata"
        loop={isLoop}
        playsInline
        autoPlay={false}
        onError={(e) => {
          // Try fallback video if original fails
          if (e.target.src !== "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4") {
            e.target.src = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
          }
        }}
        onLoadStart={() => {
          setIsBuffering(true);
        }}
        onCanPlay={() => {
          setIsBuffering(false);
        }}
      />

      {/* Buffering indicator */}
      {isBuffering && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
        </div>
      )}

      {/* Mouse hold 2x speed indicator */}
      {isMouseHolding && (
        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium">
          2x Speed
        </div>
      )}

      {/* Loop indicator */}
      {isLoop && (
        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-medium flex items-center gap-2">
          <RotateCcw size={16} />
          Loop
        </div>
      )}

      {/* Keyboard shortcuts help */}
      <div className="absolute top-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <div className="bg-black/70 text-white p-2 rounded-lg text-xs max-w-xs">
          <div className="font-semibold mb-1">Keyboard Shortcuts:</div>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span>Space/K: Play/Pause</span>
            <span>M: Mute/Unmute</span>
            <span>F: Fullscreen</span>
            <span>S: Settings</span>
            <span>←/→: Seek ±5s</span>
            <span>J/L: Seek ±10s</span>
            <span>↑/↓: Volume</span>
            <span>,/.: Speed ±0.25x</span>
            <span>0-9: Seek %</span>
          </div>
        </div>
      </div>


      <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-2 sm:p-4 bg-gradient-to-b from-black/60 to-transparent">
          {/* Top Left - Miniplayer Button */}
          <button className="rounded-full text-white transition-colors hover:bg-white/20 p-1.5 sm:p-2 touch-manipulation" aria-label="Miniplayer">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white sm:w-5 sm:h-5">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          
          {/* Top Right - Settings Button */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="rounded-full text-white transition-colors hover:bg-white/20 p-1.5 sm:p-2 touch-manipulation"
              aria-label="Settings"
            >
              <Settings size={18} className="sm:w-5 sm:h-5" />
            </button>
            {showSettingsMenu && (
              <div className={`absolute bg-gray-900/95 backdrop-blur-sm rounded-lg py-1 overflow-y-auto z-20 border border-gray-700/50 shadow-2xl transition-all duration-300 ${
                isFullscreen 
                  ? 'bottom-full right-0 mb-2 min-w-[220px] max-w-[280px] max-h-64' 
                  : 'bottom-0 left-0 right-0 min-w-full max-h-64 rounded-t-lg'
              } sm:bottom-full sm:right-0 sm:mb-2 sm:min-w-[180px] sm:max-w-[220px]`}>
                {settingsView === 'main' && (
                  <>
                    {/* Playback Speed */}
                    <div className={`flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer touch-manipulation ${isFullscreen ? 'px-3 py-2' : 'px-2 py-2'}`}
                         onClick={() => openSettingsSubmenu('speed')}>
                      <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1.5'}`}>
                        <Gauge size={isFullscreen ? 16 : 14} className="text-white" />
                        <span className={`text-white ${isFullscreen ? 'text-sm' : 'text-xs'}`}>Playback speed</span>
                      </div>
                      <div className={`flex items-center ${isFullscreen ? 'gap-1.5' : 'gap-1'}`}>
                        <span className={`text-white/70 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                          {playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
                        </span>
                        <svg width={isFullscreen ? "6" : "5"} height={isFullscreen ? "10" : "8"} viewBox="0 0 6 10" fill="currentColor" className="text-white/70">
                          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {/* Quality */}
                    <div className={`flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer touch-manipulation ${isFullscreen ? 'px-3 py-2' : 'px-2 py-2'}`}
                         onClick={() => openSettingsSubmenu('quality')}>
                      <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1.5'}`}>
                        <div className={`bg-white/60 rounded-sm ${isFullscreen ? 'w-4 h-3' : 'w-3 h-2'}`}></div>
                        <span className={`text-white ${isFullscreen ? 'text-sm' : 'text-xs'}`}>Quality</span>
                      </div>
                      <div className={`flex items-center ${isFullscreen ? 'gap-1.5' : 'gap-1'}`}>
                        <span className={`text-white/70 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>{selectedQuality.split(' ')[0]}</span>
                        <svg width={isFullscreen ? "6" : "5"} height={isFullscreen ? "10" : "8"} viewBox="0 0 6 10" fill="currentColor" className="text-white/70">
                          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {/* Subtitles/CC */}
                    <div className={`flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer touch-manipulation ${isFullscreen ? 'px-3 py-2' : 'px-2 py-2'}`}
                         onClick={() => openSettingsSubmenu('subtitles')}>
                      <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1.5'}`}>
                        <div className={`border border-white/60 rounded-sm ${isFullscreen ? 'w-4 h-3' : 'w-3 h-2'}`}></div>
                        <span className={`text-white ${isFullscreen ? 'text-sm' : 'text-xs'}`}>Subtitles/CC</span>
                      </div>
                      <div className={`flex items-center ${isFullscreen ? 'gap-1.5' : 'gap-1'}`}>
                        <span className={`text-white/70 ${isFullscreen ? 'text-sm' : 'text-xs'}`}>{selectedSubtitle}</span>
                        <svg width={isFullscreen ? "6" : "5"} height={isFullscreen ? "10" : "8"} viewBox="0 0 6 10" fill="currentColor" className="text-white/70">
                          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>

                    {/* Autoplay Next */}
                    <div className="border-t border-gray-700/50 pt-1">
                      <div className={`flex items-center justify-between hover:bg-white/10 transition-colors touch-manipulation ${isFullscreen ? 'px-3 py-2' : 'px-2 py-2'}`}>
                        <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1.5'}`}>
                          <PlayCircle size={isFullscreen ? 16 : 14} className="text-white" />
                          <span className={`text-white ${isFullscreen ? 'text-sm' : 'text-xs'}`}>Autoplay next</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`rounded-full transition-colors ${autoplayNext ? 'bg-red-500' : 'bg-gray-600'} relative cursor-pointer touch-manipulation ${isFullscreen ? 'w-8 h-4' : 'w-7 h-4'}`}
                               onClick={toggleAutoplayNext}>
                            <div className={`rounded-full bg-white absolute top-0.5 transition-transform ${autoplayNext ? (isFullscreen ? 'translate-x-4' : 'translate-x-3') : 'translate-x-0.5'} ${isFullscreen ? 'w-3 h-3' : 'w-3 h-3'}`}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Loop Option */}
                    <div className={`flex items-center justify-between hover:bg-white/10 transition-colors touch-manipulation ${isFullscreen ? 'px-3 py-2' : 'px-2 py-2'}`}>
                      <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1.5'}`}>
                        <RotateCcw size={isFullscreen ? 16 : 14} className="text-white" />
                        <span className={`text-white ${isFullscreen ? 'text-sm' : 'text-xs'}`}>Loop</span>
                      </div>
                      <div className="flex items-center">
                        <div className={`rounded-full transition-colors ${isLoop ? 'bg-red-500' : 'bg-gray-600'} relative cursor-pointer touch-manipulation ${isFullscreen ? 'w-8 h-4' : 'w-7 h-4'}`}
                             onClick={toggleLoop}>
                          <div className={`rounded-full bg-white absolute top-0.5 transition-transform ${isLoop ? (isFullscreen ? 'translate-x-4' : 'translate-x-3') : 'translate-x-0.5'} ${isFullscreen ? 'w-3 h-3' : 'w-3 h-3'}`}></div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Speed Settings Submenu */}
                {settingsView === 'speed' && (
                  <>
                    <div className="flex items-center px-2 py-1.5 border-b border-gray-700/50">
                      <button onClick={backToMainSettings} className="p-0.5 hover:bg-white/10 rounded mr-1">
                        <svg width="5" height="8" viewBox="0 0 6 10" fill="currentColor" className="text-white rotate-180">
                          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <span className="text-white text-xs font-medium">Playback speed</span>
                    </div>
                    
                    <div className="px-2 py-1.5">
                      <div className="mb-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white text-xs font-medium">Custom</span>
                          <span className="text-white/70 text-xs">{playbackRate}x</span>
                        </div>
                        <input
                          type="range"
                          min="0.25"
                          max="2"
                          step="0.01"
                          value={playbackRate}
                          onChange={handleSpeedSliderChange}
                          className="w-full h-1 bg-gray-600 rounded-full outline-none cursor-pointer appearance-none slider"
                          style={{
                            background: `linear-gradient(to right, #fff 0%, #fff ${((playbackRate - 0.25) / 1.75) * 100}%, #4a5568 ${((playbackRate - 0.25) / 1.75) * 100}%, #4a5568 100%)`
                          }}
                        />
                      </div>
                      
                      <div className="space-y-0.5">
                        {speedOptions.map((speed) => (
                          <button
                            key={speed}
                            onClick={() => setSpeed(speed)}
                            className={`block w-full px-2 py-2 text-xs text-left rounded transition-colors touch-manipulation ${
                              speed === playbackRate
                                ? 'bg-white/20 text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {speed}x {speed === 1 ? '(Normal)' : ''}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Quality Settings Submenu */}
                {settingsView === 'quality' && (
                  <>
                    <div className="flex items-center px-2 py-1.5 border-b border-gray-700/50">
                      <button onClick={backToMainSettings} className="p-0.5 hover:bg-white/10 rounded mr-1">
                        <svg width="5" height="8" viewBox="0 0 6 10" fill="currentColor" className="text-white rotate-180">
                          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <span className="text-white text-xs font-medium">Quality</span>
                    </div>
                    
                    <div className="px-2 py-1.5">
                      <div className="space-y-0.5">
                        {['Auto (1080p)', '1080p60 HD', '1080p HD', '720p60', '720p', '480p', '360p', '240p', '144p'].map((quality) => (
                          <button
                            key={quality}
                            onClick={() => setQuality(quality)}
                            className={`block w-full px-2 py-2 text-xs text-left rounded transition-colors touch-manipulation ${
                              quality === selectedQuality
                                ? 'bg-white/20 text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Subtitles Settings Submenu */}
                {settingsView === 'subtitles' && (
                  <>
                    <div className="flex items-center px-2 py-1.5 border-b border-gray-700/50">
                      <button onClick={backToMainSettings} className="p-0.5 hover:bg-white/10 rounded mr-1">
                        <svg width="5" height="8" viewBox="0 0 6 10" fill="currentColor" className="text-white rotate-180">
                          <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <span className="text-white text-xs font-medium">Subtitles/CC</span>
                    </div>
                    
                    <div className="px-2 py-1.5">
                      <div className="space-y-0.5">
                        {['Off', 'English (auto-generated)', 'English', 'Spanish', 'French', 'German'].map((subtitle) => (
                          <button
                            key={subtitle}
                            onClick={() => setSubtitle(subtitle)}
                            className={`block w-full px-2 py-2 text-xs text-left rounded transition-colors touch-manipulation ${
                              subtitle === selectedSubtitle
                                ? 'bg-white/20 text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {subtitle}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Center Play/Pause Button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <button 
            onClick={togglePlay} 
            className="rounded-full text-white transition-colors hover:bg-white/20 p-2 sm:p-4 bg-black/30 backdrop-blur-sm touch-manipulation" 
            aria-label="Play/Pause"
          >
            {isPlaying ? <Pause size={28} className="sm:w-12 sm:h-12" /> : <Play size={28} className="sm:w-12 sm:h-12" />}
          </button>
        </div>

        {/* Left/Right Skip Buttons */}
        <div className="absolute inset-0 flex items-center justify-between px-2 sm:px-4">
          <button 
            onClick={() => skip(-10)} 
            className="rounded-full text-white transition-colors hover:bg-white/20 p-1.5 sm:p-3 bg-black/30 backdrop-blur-sm touch-manipulation" 
            aria-label="Rewind 10s"
          >
            <SkipBack size={18} className="sm:w-6 sm:h-6" />
          </button>
          <button 
            onClick={() => skip(10)} 
            className="rounded-full text-white transition-colors hover:bg-white/20 p-1.5 sm:p-3 bg-black/30 backdrop-blur-sm touch-manipulation" 
            aria-label="Forward 10s"
          >
            <SkipForward size={18} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Bottom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1 sm:p-4">
          {/* Progress Bar */}
          <div className="w-full bg-white/20 cursor-pointer group h-1 sm:h-1.5 mb-2 sm:mb-4 touch-manipulation progress-bar" 
               onMouseDown={handleSeekStart}
               onTouchStart={handleSeekStart}>
            <div
              className="h-full bg-red-500 transition-all duration-100 relative"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity w-2.5 h-2.5 sm:w-3 sm:h-3"></div>
            </div>
          </div>

          {/* Bottom Row - Timer, Volume and Fullscreen */}
          <div className="flex items-center justify-between">
            {/* Bottom Left - Timer + Volume */}
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-white font-medium text-xs sm:text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              <button 
                onClick={toggleMute}
                className="rounded-full text-white transition-colors hover:bg-white/20 p-1 sm:p-2 touch-manipulation" 
                aria-label="Mute/Unmute"
              >
                {isMuted ? <VolumeX size={16} className="sm:w-5 sm:h-5" /> : <Volume2 size={16} className="sm:w-5 sm:h-5" />}
              </button>
            </div>

            {/* Bottom Right - Fullscreen Button */}
            <button 
              onClick={toggleFullscreen} 
              className="rounded-full text-white transition-colors hover:bg-white/20 p-1 sm:p-2 touch-manipulation" 
              aria-label="Fullscreen"
            >
              {isFullscreen ? <Minimize size={16} className="sm:w-5 sm:h-5" /> : <Maximize size={16} className="sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showSpeedMenu || showSettingsMenu) && (
        <div
          className="fixed inset-0 z-10 bg-black/50 sm:bg-transparent"
          onClick={closeAllMenus}
        />
      )}

      {/* Global styles for slider and mobile optimization */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
          }
          .slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #fff;
            cursor: pointer;
            border: none;
            box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
          }
          
          /* Prevent zoom on mobile */
          @media (max-width: 768px) {
            video {
              touch-action: manipulation;
            }
          }
          
          /* Ensure proper touch targets on mobile */
          @media (max-width: 640px) {
            button {
              min-height: 44px;
              min-width: 44px;
            }
          }
        `
      }} />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer