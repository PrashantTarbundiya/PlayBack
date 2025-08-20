"use client"

import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings, Minimize, RotateCcw, Gauge, PlayCircle, PictureInPicture2 } from "lucide-react"
import { useSyncedVideo } from "../../contexts/SyncedVideoContext"
import { useNavigate } from 'react-router-dom';

const SyncedVideoPlayer = forwardRef(({ src, poster, onVideoEnd, nextVideoSrc, className = "" }, ref) => {
  const {
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isBuffering,
    mainVideoRef,
    activePlayerRef,
    togglePlay,
    seekTo,
    setVolumeLevel,
    toggleMute,
    setPlaybackSpeed,
    setActivePlayer,
    registerMainPlayer,
    unregisterMainPlayer,
    updateCurrentTime,
    setDuration,
    setIsPlaying,
    setIsBuffering,
    activateMiniPlayer
  } = useSyncedVideo()
  
  const containerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const mouseHoldTimeoutRef = useRef(null)
  const eventListenersAttachedRef = useRef(false)

  const [showControls, setShowControls] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [settingsView, setSettingsView] = useState('main')
  const [isMouseHolding, setIsMouseHolding] = useState(false)
  const [originalSpeed, setOriginalSpeed] = useState(1)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isLoop, setIsLoop] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState('Auto (1080p)')
  const [selectedSubtitle, setSelectedSubtitle] = useState('Off')
  const [autoplayNext, setAutoplayNext] = useState(true)

  // Expose the video element to parent component
  useImperativeHandle(ref, () => mainVideoRef.current, [])

  // Speed options
  const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, 3000)
  }, [isPlaying])

  // Register/unregister main player for visibility tracking
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      registerMainPlayer(container)
      return () => unregisterMainPlayer(container)
    }
  }, [registerMainPlayer, unregisterMainPlayer])

  // Set this as active player when component mounts
  useEffect(() => {
    setActivePlayer('main')
  }, [setActivePlayer])

  // Enhanced video event handlers with better sync
  const handleTimeUpdate = useCallback(() => {
    const video = mainVideoRef.current
    if (video && !isNaN(video.currentTime)) {
      // Only update if this is the active player and the difference is significant
      if (activePlayerRef.current === video) {
        const timeDifference = Math.abs(video.currentTime - currentTime)
        
        // Only update if there's a significant difference to prevent micro-updates
        if (timeDifference > 0.2) {
          updateCurrentTime(video.currentTime)
        }
      }
    }
  }, [updateCurrentTime, currentTime, activePlayerRef])

  const handleLoadedMetadata = useCallback(() => {
    const video = mainVideoRef.current
    if (video && !isNaN(video.duration)) {
      setDuration(video.duration)
    }
  }, [setDuration])

  // Ensure duration is captured reliably across browsers
  const handleDurationChange = useCallback(() => {
    const video = mainVideoRef.current
    if (video && !isNaN(video.duration) && video.duration > 0) {
      setDuration(video.duration)
    }
  }, [setDuration])

  const handlePlay = useCallback(() => {
    setIsPlaying(true)
  }, [setIsPlaying])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [setIsPlaying])

  const handleWaiting = useCallback(() => {
    setIsBuffering(true)
  }, [setIsBuffering])

  const handleCanPlay = useCallback(() => {
    setIsBuffering(false)
  }, [setIsBuffering])

  const handleLoadStart = useCallback(() => {
    setIsBuffering(true)
  }, [setIsBuffering])

  const handleLoadedData = useCallback(() => {
    setIsBuffering(false)
  }, [setIsBuffering])

  const handleFullscreenChange = useCallback(() => {
    setIsFullscreen(!!document.fullscreenElement)
  }, [])

  const handleVideoEnd = useCallback(() => {
    if (isLoop) {
      const video = mainVideoRef.current
      if (video) {
        video.currentTime = 0
        video.play().catch(console.warn)
      }
    } else if (autoplayNext) {
      if (onVideoEnd) {
        onVideoEnd()
      } else if (nextVideoSrc) {
        const video = mainVideoRef.current
        if (video) {
          video.src = nextVideoSrc
          video.currentTime = 0
          video.play().catch(console.warn)
        }
      }
    }
  }, [isLoop, autoplayNext, onVideoEnd, nextVideoSrc])

  // Attach/detach video event listeners with improved management
  useEffect(() => {
    const video = mainVideoRef.current
    if (!video || eventListenersAttachedRef.current) return

    // Initialize video properties
    video.volume = volume
    video.muted = isMuted
    video.playbackRate = playbackRate

    // Add event listeners
    video.addEventListener("timeupdate", handleTimeUpdate, { passive: true })
    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    video.addEventListener("durationchange", handleDurationChange)
    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("waiting", handleWaiting)
    video.addEventListener("canplay", handleCanPlay)
    video.addEventListener("loadstart", handleLoadStart)
    video.addEventListener("loadeddata", handleLoadedData)
    video.addEventListener("ended", handleVideoEnd)

    // Fullscreen event listener
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    eventListenersAttachedRef.current = true

    return () => {
      if (video) {
        video.removeEventListener("timeupdate", handleTimeUpdate)
        video.removeEventListener("loadedmetadata", handleLoadedMetadata)
        video.removeEventListener("durationchange", handleDurationChange)
        video.removeEventListener("play", handlePlay)
        video.removeEventListener("pause", handlePause)
        video.removeEventListener("waiting", handleWaiting)
        video.removeEventListener("canplay", handleCanPlay)
        video.removeEventListener("loadstart", handleLoadStart)
        video.removeEventListener("loadeddata", handleLoadedData)
        video.removeEventListener("ended", handleVideoEnd)
      }
      
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      if (mouseHoldTimeoutRef.current) {
        clearTimeout(mouseHoldTimeoutRef.current)
      }

      eventListenersAttachedRef.current = false
    }
  }, [
    volume, isMuted, playbackRate, 
    handleTimeUpdate, handleLoadedMetadata, handlePlay, handlePause,
    handleWaiting, handleCanPlay, handleLoadStart, handleLoadedData, 
    handleVideoEnd, handleFullscreenChange
  ])

  // Sync video properties when they change
  useEffect(() => {
    const video = mainVideoRef.current
    if (!video) return

    // Debounced property sync to avoid excessive updates
    const syncTimeout = setTimeout(() => {
      try {
        // Only sync if this is the active player
        if (activePlayerRef.current === video) {
          if (Math.abs(video.volume - volume) > 0.01) {
            video.volume = volume
          }
          if (video.muted !== isMuted) {
            video.muted = isMuted
          }
          if (Math.abs(video.playbackRate - playbackRate) > 0.01) {
            video.playbackRate = playbackRate
          }
        }
      } catch (error) {
        console.warn('Failed to sync video properties:', error)
      }
    }, 100) // Increased delay for better stability

    return () => clearTimeout(syncTimeout)
  }, [volume, isMuted, playbackRate, activePlayerRef])

  // Initialize video properties when src changes
  useEffect(() => {
    const video = mainVideoRef.current
    if (!video) return

    const initializeVideo = () => {
      try {
        video.volume = volume
        video.muted = isMuted
        video.playbackRate = playbackRate
        // If duration is available now, set it
        if (!isNaN(video.duration) && video.duration > 0) {
          setDuration(video.duration)
        }
      } catch (error) {
        console.warn('Failed to initialize video properties:', error)
      }
    }

    // Initialize immediately and on video ready events
    initializeVideo()
    
    const handleLoadedMetadata = initializeVideo
    const handleCanPlay = initializeVideo

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('canplay', handleCanPlay)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('canplay', handleCanPlay)
    }
  }, [src, volume, isMuted, playbackRate, handleLoadedMetadata, handleDurationChange, handleCanPlay, setDuration])

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(console.warn)
    } else {
      container.requestFullscreen().catch(console.warn)
    }
  }, [])

  const skip = useCallback((seconds) => {
    const newTime = Math.min(Math.max(0, currentTime + seconds), duration)
    seekTo(newTime)
    setShowControls(true)
    resetControlsTimeout()
  }, [currentTime, duration, seekTo, resetControlsTimeout])

  const seekToPercentage = useCallback((percentage) => {
    if (!duration) return
    const newTime = (percentage / 100) * duration
    seekTo(newTime)
    setShowControls(true)
    resetControlsTimeout()
  }, [duration, seekTo, resetControlsTimeout])

  const changeVolume = useCallback((delta) => {
    const newVolume = Math.min(Math.max(0, volume + delta), 1)
    setVolumeLevel(newVolume)
    setShowControls(true)
    resetControlsTimeout()
  }, [volume, setVolumeLevel, resetControlsTimeout])

  const changeSpeed = useCallback((delta) => {
    const newSpeed = Math.min(Math.max(0.25, playbackRate + delta), 2)
    setPlaybackSpeed(newSpeed)
    setOriginalSpeed(newSpeed)
    setShowControls(true)
    resetControlsTimeout()
  }, [playbackRate, setPlaybackSpeed, resetControlsTimeout])

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e) => {
    const video = mainVideoRef.current
    if (!video) return

    const activeElement = document.activeElement
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' || 
      activeElement.tagName === 'TEXTAREA' || 
      activeElement.tagName === 'BUTTON' ||
      activeElement.contentEditable === 'true'
    )

    if (isInputFocused) return

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
        // Toggle captions (placeholder)
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
    if (e.target !== mainVideoRef.current && e.target !== containerRef.current) return
    
    if (e.button === 0) {
      setOriginalSpeed(playbackRate)
      mouseHoldTimeoutRef.current = setTimeout(() => {
        setIsMouseHolding(true)
        setPlaybackSpeed(2)
      }, 200)
    }
  }, [playbackRate, setPlaybackSpeed])

  const handleMouseUp = useCallback((e) => {
    if (mouseHoldTimeoutRef.current) {
      clearTimeout(mouseHoldTimeoutRef.current)
      mouseHoldTimeoutRef.current = null
    }
    if (isMouseHolding) {
      setIsMouseHolding(false)
      setPlaybackSpeed(originalSpeed)
    }
  }, [isMouseHolding, originalSpeed, setPlaybackSpeed])

  // Event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleKeyDown, handleMouseUp])

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const newTime = pos * duration
    seekTo(newTime)
    setShowControls(true)
    resetControlsTimeout()
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolumeLevel(newVolume)
  }

  const handleSpeedSliderChange = (e) => {
    const newSpeed = parseFloat(e.target.value)
    setPlaybackSpeed(newSpeed)
    setOriginalSpeed(newSpeed)
    setShowControls(true)
    resetControlsTimeout()
  }

  const setSpeed = (speed) => {
    setPlaybackSpeed(speed)
    setOriginalSpeed(speed)
    setShowSpeedMenu(false)
    setShowControls(true)
    resetControlsTimeout()
  }

  const setQuality = (quality) => {
    setSelectedQuality(quality)
    setShowControls(true)
    resetControlsTimeout()
  }

  const setSubtitle = (subtitle) => {
    setSelectedSubtitle(subtitle)
    setShowControls(true)
    resetControlsTimeout()
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
    setShowControls(true)
    resetControlsTimeout()
  }

  const handleContainerClick = (e) => {
    if (e.target === mainVideoRef.current || e.target === containerRef.current) {
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

  const navigate = useNavigate();

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-black rounded-xl overflow-hidden focus:outline-none ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => !isPlaying || setShowControls(false)}
      onClick={handleContainerClick}
      onMouseDown={handleMouseDown}
      tabIndex={0}
      data-main-video-player
    >
      {/* Video element */}
      <video
        ref={mainVideoRef}
        src={src || "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"}
        poster={poster}
        className="w-full h-full block"
        controls={false}
        preload="metadata"
        loop={isLoop}
        playsInline
        autoPlay={false}
        onError={(e) => {
          if (e.target.src !== "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4") {
            e.target.src = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
          }
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

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"} ${isFullscreen ? 'pt-12 px-8 pb-8' : 'pt-8 px-4 pb-4'}`}>
        {/* Progress bar */}
        <div className={`w-full bg-white/20 rounded-sm cursor-pointer group ${isFullscreen ? 'h-2 mb-6' : 'h-1.5 mb-4'}`} onClick={handleSeek}>
          <div
            className="h-full bg-red-500 rounded-sm transition-all duration-100 relative"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
          >
            <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${isFullscreen ? 'w-4 h-4' : 'w-3 h-3'}`}></div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1'}`}>
            <button onClick={togglePlay} className={`rounded-full text-white transition-colors hover:bg-white/20 ${isFullscreen ? 'p-3' : 'p-2'}`} aria-label="Play/Pause">
              {isPlaying ? <Pause size={isFullscreen ? 28 : 20} /> : <Play size={isFullscreen ? 28 : 20} />}
            </button>
            <button onClick={() => skip(-10)} className={`rounded-full text-white transition-colors hover:bg-white/20 ${isFullscreen ? 'p-2.5' : 'p-1.5'}`} aria-label="Rewind 10s">
              <SkipBack size={isFullscreen ? 24 : 18} />
            </button>
            <button onClick={() => skip(10)} className={`rounded-full text-white transition-colors hover:bg-white/20 ${isFullscreen ? 'p-2.5' : 'p-1.5'}`} aria-label="Forward 10s">
              <SkipForward size={isFullscreen ? 24 : 18} />
            </button>
            
            {/* Volume controls */}
            <div className={`flex items-center group ${isFullscreen ? 'gap-3' : 'gap-2'}`}>
              <button
                onClick={toggleMute}
                onMouseEnter={() => setShowVolumeSlider(true)}
                className={`rounded-full text-white transition-colors hover:bg-white/20 ${isFullscreen ? 'p-2.5' : 'p-1.5'}`}
                aria-label="Mute/Unmute"
              >
                {isMuted ? <VolumeX size={isFullscreen ? 24 : 18} /> : <Volume2 size={isFullscreen ? 24 : 18} />}
              </button>
              <div
                className={`transition-all duration-200 ${showVolumeSlider ? (isFullscreen ? 'w-32 opacity-100' : 'w-20 opacity-100') : 'w-0 opacity-0'} overflow-hidden`}
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className={`w-full bg-white/30 rounded-sm outline-none cursor-pointer appearance-none slider ${isFullscreen ? 'h-1.5' : 'h-1'}`}
                  style={{
                    background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) 100%)`
                  }}
                  aria-label="Volume"
                />
              </div>
            </div>

            {/* Time display */}
            <span className={`text-white font-medium ${isFullscreen ? 'text-lg ml-4' : 'text-sm ml-2'}`}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right controls */}
          <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1'}`}>
            {/* Settings button */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`rounded-full text-white transition-colors hover:bg-white/20 ${isFullscreen ? 'p-2.5' : 'p-1.5'}`}
                aria-label="Settings"
              >
                <Settings size={isFullscreen ? 24 : 18} />
              </button>
              {showSettingsMenu && (
               <div className={`absolute bottom-full right-0 mb-2 bg-gray-900/95 backdrop-blur-sm rounded-lg py-1 overflow-y-auto z-20 border border-gray-700/50 shadow-2xl ${isFullscreen ? 'min-w-[220px] max-w-[280px] max-h-64' : 'min-w-[180px] max-w-[220px] max-h-56'}`}>
                  {settingsView === 'main' && (
                    <>
                      {/* Playback Speed */}
                      <div className={`flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer ${isFullscreen ? 'px-3 py-2' : 'px-2 py-1.5'}`}
                           onClick={() => openSettingsSubmenu('speed')}>
                        <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1.5'}`}>
                          <Gauge size={isFullscreen ? 16 : 12} className="text-white" />
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
                      <div className={`flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer ${isFullscreen ? 'px-3 py-2' : 'px-2 py-1.5'}`}
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

                      {/* Autoplay Next */}
                      <div className="border-t border-gray-700/50 pt-1">
                        <div className={`flex items-center justify-between hover:bg-white/10 transition-colors ${isFullscreen ? 'px-3 py-2' : 'px-2 py-1.5'}`}>
                          <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1.5'}`}>
                            <PlayCircle size={isFullscreen ? 16 : 12} className="text-white" />
                            <span className={`text-white ${isFullscreen ? 'text-sm' : 'text-xs'}`}>Autoplay next</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`rounded-full transition-colors ${autoplayNext ? 'bg-red-500' : 'bg-gray-600'} relative cursor-pointer ${isFullscreen ? 'w-8 h-4' : 'w-6 h-3'}`}
                                 onClick={toggleAutoplayNext}>
                              <div className={`rounded-full bg-white absolute top-0.5 transition-transform ${autoplayNext ? (isFullscreen ? 'translate-x-4' : 'translate-x-3') : 'translate-x-0.5'} ${isFullscreen ? 'w-3 h-3' : 'w-2 h-2'}`}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Loop Option */}
                      <div className={`flex items-center justify-between hover:bg-white/10 transition-colors ${isFullscreen ? 'px-3 py-2' : 'px-2 py-1.5'}`}>
                        <div className={`flex items-center ${isFullscreen ? 'gap-2' : 'gap-1.5'}`}>
                          <RotateCcw size={isFullscreen ? 16 : 12} className="text-white" />
                          <span className={`text-white ${isFullscreen ? 'text-sm' : 'text-xs'}`}>Loop</span>
                        </div>
                        <div className="flex items-center">
                          <div className={`rounded-full transition-colors ${isLoop ? 'bg-red-500' : 'bg-gray-600'} relative cursor-pointer ${isFullscreen ? 'w-8 h-4' : 'w-6 h-3'}`}
                               onClick={toggleLoop}>
                            <div className={`rounded-full bg-white absolute top-0.5 transition-transform ${isLoop ? (isFullscreen ? 'translate-x-4' : 'translate-x-3') : 'translate-x-0.5'} ${isFullscreen ? 'w-3 h-3' : 'w-2 h-2'}`}></div>
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
                              className={`block w-full px-1.5 py-1 text-xs text-left rounded transition-colors ${
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
                              className={`block w-full px-1.5 py-1 text-xs text-left rounded transition-colors ${
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
                </div>
              )}
            </div>

            {/* Mini Player button */}
            <button
              onClick={() => {
                activateMiniPlayer()
                navigate('/')
              }}
              className={`rounded-full text-white transition-colors hover:bg-white/20 ${isFullscreen ? 'p-2.5' : 'p-1.5'}`}
              aria-label="Mini Player"
              title="Open mini player and go to home"
            >
              <PictureInPicture2 size={isFullscreen ? 24 : 18} />
            </button>

            {/* Fullscreen button */}
            <button onClick={toggleFullscreen} className={`rounded-full text-white transition-colors hover:bg-white/20 ${isFullscreen ? 'p-2.5' : 'p-1.5'}`} aria-label="Fullscreen">
              {isFullscreen ? <Minimize size={isFullscreen ? 24 : 18} /> : <Maximize size={isFullscreen ? 24 : 18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Click outside to close menus */}
      {(showSpeedMenu || showSettingsMenu) && (
        <div
          className="fixed inset-0 z-10"
          onClick={closeAllMenus}
        />
      )}

      {/* Global styles for slider */}
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
        `
      }} />
    </div>
  )
})

SyncedVideoPlayer.displayName = 'SyncedVideoPlayer'

export default SyncedVideoPlayer