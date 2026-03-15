"use client"

import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useCallback } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward, Settings, Minimize, RotateCcw, Gauge, PlayCircle, PictureInPicture2, Subtitles } from "lucide-react"
import { useSyncedVideo } from "../../contexts/SyncedVideoContext"
import { useNavigate } from 'react-router-dom';
import TranscriptSidebar from "./TranscriptSidebar"
import { useAuth } from "../../contexts/AuthContext"
import toast from "react-hot-toast"
// Shared speed options
const speedOptions = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

const SyncedVideoPlayer = forwardRef(({ src, poster, onVideoEnd, nextVideoSrc, endScreenVideos = [], autoPlayEnabled = true, chapters = [], onChapterPillClick, className = "", transcriptSegments = [] }, ref) => {
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
    activePlayerType,
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

  const { user } = useAuth()
  
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
  const [isMobile, setIsMobile] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [captionsEnabled, setCaptionsEnabled] = useState(false)
  const [showFullscreenSidebar, setShowFullscreenSidebar] = useState(false)

  // Hover Preview State
  const [hoverTime, setHoverTime] = useState(0)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [showHoverPreview, setShowHoverPreview] = useState(false)
  const [hoverChapter, setHoverChapter] = useState(null)

  // End Screen Auto-Play State
  const [autoPlayTimer, setAutoPlayTimer] = useState(10)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Expose the video element to parent component
  useImperativeHandle(ref, () => mainVideoRef.current, [])

  // Speed options (shared)
  // imported above

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    const timeout = isFullscreen || isMobile ? 2000 : 3000
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false)
      }
    }, timeout)
  }, [isPlaying, isFullscreen, isMobile])

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
        setCaptionsEnabled(prev => !prev)
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

  // Seek handlers
  const handleSeek = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const newTime = pos * duration
    seekTo(newTime)
    setShowControls(true)
    resetControlsTimeout()
  }, [duration, seekTo, resetControlsTimeout])

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
        const newTime = pos * duration
        seekTo(newTime)
      }
    }
  }, [isSeeking, duration, seekTo])

  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false)
    setShowHoverPreview(false)
  }, [])

  const handleProgressHover = (e) => {
    if (!duration) return
    const progressBar = e.currentTarget
    const rect = progressBar.getBoundingClientRect()
    // Calculate position taking bounding rect into account properly
    let pos = (e.clientX || e.touches?.[0]?.clientX) - rect.left
    
    // Clamp position within bounds
    pos = Math.max(0, Math.min(pos, rect.width))
    const percentage = rect.width > 0 ? pos / rect.width : 0
    
    const time = percentage * duration
    
    // Find current chapter
    const currentChapter = [...chapters].reverse().find(c => time >= c.time)
    
    setHoverTime(time)
    setHoverPosition(pos)
    setHoverChapter(currentChapter?.title || null)
    setShowHoverPreview(true)
  }

  const handleProgressMouseLeave = () => {
    if (!isSeeking) {
      setShowHoverPreview(false)
      setHoverChapter(null)
    }
  }

  // Event listeners
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("mouseup", handleMouseUp)
    document.addEventListener("mousemove", handleSeekMove)
    document.addEventListener("mouseup", handleSeekEnd)
    document.addEventListener("touchmove", handleSeekMove)
    document.addEventListener("touchend", handleSeekEnd)

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mouseup", handleMouseUp)
      document.removeEventListener("mousemove", handleSeekMove)
      document.removeEventListener("mouseup", handleSeekEnd)
      document.removeEventListener("touchmove", handleSeekMove)
      document.removeEventListener("touchend", handleSeekEnd)
    }
  }, [handleKeyDown, handleMouseUp, handleSeekMove, handleSeekEnd])

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
      // RULE: When user interacts with main player, ensure miniplayer is closed
      // This ensures main player never gets overridden by miniplayer
      const miniPlayer = document.querySelector('[data-mini-player]')
      if (miniPlayer) {
        const closeMiniPlayerEvent = new CustomEvent('closeMiniPlayer')
        window.dispatchEvent(closeMiniPlayerEvent)
      }
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

  // End Screen Logic
  const getIsEndScreenVisible = () => {
    if (!duration || duration <= 0) return false;
    const timeRemaining = duration - currentTime;
    // Show end screen in the last 5 seconds AND keep it after video ends
    return timeRemaining <= 5;
  };
  
  const isEndScreenVisible = getIsEndScreenVisible();

  // Handle End Screen Auto-play side effects
  useEffect(() => {
    if (isEndScreenVisible && endScreenVideos.length > 0 && autoPlayEnabled && !isAutoPlaying) {
      setIsAutoPlaying(true);
      setAutoPlayTimer(10);
    } else if (!isEndScreenVisible) {
      setIsAutoPlaying(false);
      setAutoPlayTimer(10);
    }
    // Only reset if end screen disappears (user seeked back), NOT when autoplay is toggled mid-countdown
  }, [isEndScreenVisible, endScreenVideos.length]);

  useEffect(() => {
    let interval;
    if (isAutoPlaying && autoPlayEnabled && autoPlayTimer > 0) {
      interval = setInterval(() => {
        setAutoPlayTimer((prev) => prev - 1);
      }, 1000);
    } else if (isAutoPlaying && autoPlayEnabled && autoPlayTimer === 0) {
      navigate(`/watch/${endScreenVideos[0]._id}`);
      setIsAutoPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayTimer, navigate, endScreenVideos, autoPlayEnabled]);

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
      <div className={`flex w-full h-full ${isFullscreen ? 'bg-black' : ''}`}>
        <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
      {/* End Screen Overlay */}
      {isEndScreenVisible && endScreenVideos.length > 0 && (
        <div 
          className="absolute inset-0 z-20 flex flex-col items-center justify-center"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.92) 100%)',
            animation: 'endScreenFadeIn 0.4s ease-out'
          }}
        >
          {/* Circular Countdown Timer - Top Right */}
          {autoPlayEnabled && isAutoPlaying && (
            <div 
              className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-1.5 sm:gap-2 z-30 group cursor-pointer" 
              style={{ animation: 'endScreenFadeIn 0.4s ease-out' }}
              onClick={() => {
                setIsAutoPlaying(false);
                navigate(`/watch/${endScreenVideos[0]._id}`);
              }}
              title="Skip to next video"
            >
              <span className="text-white/80 text-[10px] sm:text-xs font-medium">Up next in</span>
              <div className="relative w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center bg-black/30 sm:bg-black/20 rounded-full hover:bg-white/10 transition-colors">
                {/* Background ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                  <circle 
                    cx="22" cy="22" r="18" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="3" 
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18}`}
                    strokeDashoffset={`${2 * Math.PI * 18 * (autoPlayTimer / 10)}`}
                    className="transition-all duration-1000 linear"
                  />
                </svg>
                
                {/* Timer text (Hidden on hover) */}
                <span className="absolute inset-0 flex items-center justify-center text-white text-xs sm:text-sm font-bold group-hover:opacity-0 transition-opacity">
                  {autoPlayTimer}
                </span>

                {/* Skip Icon (Shows on hover) */}
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-white ml-0.5">
                    <path d="M4 4v16l11-8L4 4zm13 0h2v16h-2V4z" />
                  </svg>
                </span>
              </div>
            </div>
          )}

          {/* Replay Button */}
          <button
            className="mb-4 sm:mb-5 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 group"
            onClick={() => {
              const video = mainVideoRef.current;
              if (video) { video.currentTime = 0; video.play().catch(() => {}); }
              setIsAutoPlaying(false);
            }}
            title="Replay"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-[-30deg] transition-transform duration-300">
              <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
          </button>

          <h3 className="text-white/90 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-3 sm:mb-4">Up Next</h3>

          <div className="flex gap-3 sm:gap-5 px-4 max-w-full">
            {endScreenVideos.slice(0, 2).map((vid, idx) => (
              <div
                key={vid._id}
                className="group cursor-pointer flex-shrink-0 relative"
                onClick={() => {
                  setIsAutoPlaying(false);
                  navigate(`/watch/${vid._id}`);
                }}
                style={{ 
                  animation: `endScreenSlideUp 0.5s ease-out ${idx * 0.12}s both`,
                  width: 'clamp(140px, 22vw, 220px)'
                }}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 group-hover:ring-2 group-hover:ring-white/40 transition-all duration-300 group-hover:shadow-white/10">
                  <img
                    src={vid.thumbnail?.url || vid.thumbnail || ''}
                    alt={vid.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { e.target.src = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 320 180%22><rect fill=%22%23374151%22 width=%22320%22 height=%22180%22/><text x=%2250%25%22 y=%2250%25%22 fill=%22%239ca3af%22 font-size=%2214%22 text-anchor=%22middle%22 dy=%22.3em%22>Video</text></svg>'; }}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Play icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg backdrop-blur-sm transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#000"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  {/* Duration badge */}
                  {vid.duration && (
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
                      {Math.floor(vid.duration / 60)}:{String(Math.floor(vid.duration % 60)).padStart(2, '0')}
                    </div>
                  )}
                </div>
                {/* Info */}
                <p className="text-white text-xs sm:text-sm font-medium mt-2 line-clamp-2 leading-snug group-hover:text-white/90 transition-colors">{vid.title}</p>
                <p className="text-gray-500 text-[10px] sm:text-xs mt-0.5 truncate">
                  {vid.ownerDetails?.fullName || vid.owner?.fullName || vid.ownerDetails?.username || vid.owner?.username || ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
        muted={isMuted || activePlayerType !== 'main'}
        onError={(e) => {
          if (e.target.src !== "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4") {
            e.target.src = "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
          }
        }}
      />

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

      {/* Captions Overlay - YouTube-style 2-line rolling */}
      {captionsEnabled && transcriptSegments.length > 0 && (() => {
        // Find current active line index
        // Add 1s offset so captions appear slightly ahead of speech (AI timestamps tend to lag)
        const adjustedTime = currentTime + 1;
        let activeIdx = -1;
        for (let i = transcriptSegments.length - 1; i >= 0; i--) {
          if (transcriptSegments[i].time !== null && adjustedTime >= transcriptSegments[i].time) {
            activeIdx = i;
            break;
          }
        }
        if (activeIdx === -1) return null;

        const currentLine = transcriptSegments[activeIdx]?.text;
        const prevLine = activeIdx > 0 ? transcriptSegments[activeIdx - 1]?.text : null;

        if (!currentLine) return null;

        return (
          <div 
            className="absolute left-0 right-0 flex justify-center pointer-events-none z-10"
            style={{ bottom: showControls ? (isFullscreen ? '90px' : '70px') : '20px', transition: 'bottom 0.3s ease' }}
          >
            <div 
              className="text-center px-5 py-2.5 rounded-lg max-w-[85%]"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            >
              {prevLine && (
                <div 
                  key={`prev-${activeIdx - 1}`}
                  style={{ 
                    fontSize: isFullscreen ? '1.1rem' : '0.85rem',
                    lineHeight: '1.6',
                    color: 'rgba(255,255,255,0.55)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    transition: 'opacity 0.2s ease',
                  }}
                >
                  {prevLine}
                </div>
              )}
              <div 
                key={`curr-${activeIdx}`}
                style={{ 
                  fontSize: isFullscreen ? '1.25rem' : '0.95rem',
                  lineHeight: '1.6',
                  color: '#ffffff',
                  fontWeight: 500,
                  textShadow: '0 1px 4px rgba(0,0,0,0.9)',
                  transition: 'opacity 0.2s ease',
                }}
              >
                {currentLine}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Mobile and Desktop Controls */}
      {isMobile ? (
        // Mobile Controls Layout
        <div className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}>
          {/* Top Left - Mini Player Button */}
          <div className="absolute top-3 left-3">
            <button
              onClick={() => {
                activateMiniPlayer()
                navigate('/')
              }}
              className="p-2 rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              aria-label="Mini Player"
            >
              <PictureInPicture2 size={20} />
            </button>
          </div>

          {/* Top Right - Settings Button */}
          <div className="absolute top-3 right-3">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSettingsMenu(!showSettingsMenu)
                }}
                className="p-2 rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 relative"
                aria-label="Settings"
              >
                <Settings size={20} />
              </button>
              {showSettingsMenu && (
                <>
                  {/* Backdrop to close menu */}
                  <div
                    className="fixed inset-0 bg-black/50 z-[90]"
                    onClick={closeAllMenus}
                  />
                  {/* Bottom sheet on small screens */}
                  <div className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-sm rounded-t-lg pt-2 pb-3 overflow-y-auto z-[100] border-t border-gray-700/50 shadow-2xl min-w-full max-h-64 transition-all duration-200">
                    {settingsView === 'main' && (
                      <>
                        {/* Playback Speed */}
                        <div className="flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer px-3 py-2"
                             onClick={() => openSettingsSubmenu('speed')}>
                          <div className="flex items-center gap-2">
                            <Gauge size={16} className="text-white" />
                            <span className="text-white text-sm">Playback speed</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/70 text-sm">
                              {playbackRate === 1 ? 'Normal' : `${playbackRate}x`}
                            </span>
                            <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor" className="text-white/70">
                              <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>

                        {/* Quality */}
                        <div className="flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer px-3 py-2"
                             onClick={() => openSettingsSubmenu('quality')}>
                          <div className="flex items-center gap-2">
                            <div className="bg-white/60 rounded-sm w-4 h-3"></div>
                            <span className="text-white text-sm">Quality</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white/70 text-sm">{selectedQuality.split(' ')[0]}</span>
                            <svg width="6" height="10" viewBox="0 0 6 10" fill="currentColor" className="text-white/70">
                              <path d="M1 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>

                        {/* Autoplay Next */}
                        <div className="border-t border-gray-700/50 pt-1">
                          <div className="flex items-center justify-between hover:bg-white/10 transition-colors px-3 py-2">
                            <div className="flex items-center gap-2">
                              <PlayCircle size={16} className="text-white" />
                              <span className="text-white text-sm">Autoplay next</span>
                            </div>
                            <div className="flex items-center">
                              <div className={`rounded-full transition-colors ${autoplayNext ? 'bg-red-500' : 'bg-gray-600'} relative cursor-pointer w-8 h-4`}
                                   onClick={toggleAutoplayNext}>
                                <div className={`rounded-full bg-white absolute top-0.5 transition-transform ${autoplayNext ? 'translate-x-4' : 'translate-x-0.5'} w-3 h-3`}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Loop Option */}
                        <div className="flex items-center justify-between hover:bg-white/10 transition-colors px-3 py-2">
                          <div className="flex items-center gap-2">
                            <RotateCcw size={16} className="text-white" />
                            <span className="text-white text-sm">Loop</span>
                          </div>
                          <div className="flex items-center">
                            <div className={`rounded-full transition-colors ${isLoop ? 'bg-red-500' : 'bg-gray-600'} relative cursor-pointer w-8 h-4`}
                                 onClick={toggleLoop}>
                              <div className={`rounded-full bg-white absolute top-0.5 transition-transform ${isLoop ? 'translate-x-4' : 'translate-x-0.5'} w-3 h-3`}></div>
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
                </>
              )}
            </div>
          </div>

          {/* Center - Main Playback Controls */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => skip(-10)} 
                className="p-2 rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                aria-label="Rewind 10s"
              >
                <SkipBack size={20} />
              </button>
              
              <button 
                onClick={togglePlay} 
                className="p-3 rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                aria-label="Play/Pause"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} />}
              </button>
              
              <button 
                onClick={() => skip(10)} 
                className="p-2 rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                aria-label="Forward 10s"
              >
                <SkipForward size={20} />
              </button>
            </div>
          </div>

          {/* Bottom - Progress Bar and Time */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-4 px-2 pb-1">
            {/* Progress bar */}
            <div className="relative w-full">
              {/* Hover Preview Tooltip */}
              {showHoverPreview && (
                <div 
                  className="absolute bottom-5 transform -translate-x-1/2 flex items-center gap-1.5 bg-black/80 backdrop-blur-sm text-white font-medium px-2.5 py-1 rounded-sm shadow-sm pointer-events-none transition-opacity duration-100 z-30 whitespace-nowrap"
                  style={{ left: `${Math.max(20, Math.min(hoverPosition, containerRef.current?.offsetWidth - 20))}px` }}
                >
                  <span className="text-xs">{formatTime(hoverTime)}</span>
                  {hoverChapter && (
                    <span className="text-xs text-gray-300 font-semibold truncate max-w-[120px]">
                      • {hoverChapter}
                    </span>
                  )}
                </div>
              )}
              <div className="w-full bg-white/20 cursor-pointer group h-1 progress-bar relative z-10" 
                   onMouseDown={handleSeekStart}
                   onTouchStart={handleSeekStart}
                   onMouseMove={handleProgressHover}
                   onMouseLeave={handleProgressMouseLeave}
                   onTouchMove={handleProgressHover}
                   onTouchEnd={handleProgressMouseLeave}>
                <div
                  className="h-full bg-red-500 transition-all duration-100 relative"
                  style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
                >
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity w-2.5 h-2.5 shadow-sm shadow-red-500/50"></div>
                </div>
                {/* Chapter Markers */}
                {duration > 0 && chapters.map((chapter, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 w-0.5 bg-black z-20"
                    style={{ left: `${(chapter.time / duration) * 100}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between">
              {/* Bottom Left - Time Display + Volume + CC */}
              <div className="flex items-center gap-3">
                <span className="text-white font-medium text-xs">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
                <button 
                  onClick={toggleMute}
                  className="p-1 rounded-full text-white transition-colors hover:bg-white/20"
                  aria-label="Mute/Unmute"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button 
                  onClick={() => setCaptionsEnabled(!captionsEnabled)} 
                  className={`p-1 rounded-full transition-colors hover:bg-white/20 relative ${captionsEnabled ? 'text-[#3ea6ff]' : 'text-white'}`} 
                  aria-label="Subtitles/CC"
                  title={captionsEnabled ? 'Turn off captions' : 'Turn on captions'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M7 10h4M7 14h4M15 10h2M15 14h2" />
                  </svg>
                  {captionsEnabled && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-[#3ea6ff] rounded-full" />
                  )}
                </button>
              </div>

              {/* Bottom Right - Fullscreen Toggle */}
              <button 
                onClick={toggleFullscreen} 
                className="p-4 rounded-full text-white transition-colors hover:bg-white/20"
                aria-label="Fullscreen"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Desktop Controls Layout (Original)
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"} ${isFullscreen ? 'pt-12 px-8 pb-8' : 'pt-8 px-4 pb-4'}`}>
        {/* Progress bar area */}
        <div className="relative w-full">
          {/* Hover Preview Tooltip */}
          {showHoverPreview && (
            <div 
              className={`absolute transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white font-medium rounded-sm shadow-md pointer-events-none transition-opacity duration-100 z-30 flex items-center gap-2 whitespace-nowrap ${isFullscreen ? 'bottom-8 px-3 py-1.5' : 'bottom-6 px-2.5 py-1'}`}
              style={{ left: `${Math.max(30, Math.min(hoverPosition, (containerRef.current?.offsetWidth || hoverPosition) - 30))}px` }}
            >
              <span className={isFullscreen ? 'text-sm' : 'text-xs'}>{formatTime(hoverTime)}</span>
              {hoverChapter && (
                <span className={`font-semibold text-gray-300 truncate max-w-[200px] ${isFullscreen ? 'text-sm' : 'text-xs'}`}>
                  • {hoverChapter}
                </span>
              )}
            </div>
          )}
          
          <div className={`w-full bg-white/20 cursor-pointer group progress-bar relative z-10 ${isFullscreen ? 'h-2 mb-6' : 'h-1.5 mb-4'}`} 
               onMouseDown={handleSeekStart}
               onTouchStart={handleSeekStart}
               onMouseMove={handleProgressHover}
               onMouseLeave={handleProgressMouseLeave}
               onTouchMove={handleProgressHover}
               onTouchEnd={handleProgressMouseLeave}>
            
            {/* Hover visual indicator on the bar itself */}
            {showHoverPreview && (
              <div 
                className="absolute top-0 bottom-0 bg-white/40 pointer-events-none"
                style={{ width: `${(hoverPosition / (containerRef.current?.offsetWidth || 1)) * 100}%` }}
              ></div>
            )}
            
            <div
              className="h-full bg-red-500 transition-all duration-100 relative z-20"
              style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
            >
              <div className={`absolute right-0 top-1/2 transform -translate-y-1/2 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm shadow-red-500/50 ${isFullscreen ? 'w-4 h-4' : 'w-3 h-3'}`}></div>
            </div>
            
            {/* Chapter Markers */}
            {duration > 0 && chapters.map((chapter, idx) => (
              <div
                key={idx}
                className="absolute top-0 bottom-0 w-[2px] bg-black z-30 pointer-events-none"
                style={{ left: `${(chapter.time / duration) * 100}%` }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Left controls */}
          <div className={`flex items-center ${isFullscreen ? 'gap-4' : 'gap-2'}`}>
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
            <div className={`flex items-center group ${isFullscreen ? 'gap-3' : 'gap-1.5'}`}>
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
            <div className={`flex items-center ${isFullscreen ? 'ml-6' : 'ml-4'} gap-4`}>
              <span className={`text-white font-medium ${isFullscreen ? 'text-lg' : 'text-sm'}`}>
                {formatTime(currentTime)} <span className="text-white/70 mx-0.5">/</span> {formatTime(duration)}
              </span>
              
              {/* "In this video" Chapter Pill */}
              {chapters && chapters.length > 0 && (
                <button 
                  onClick={isFullscreen ? () => setShowFullscreenSidebar(prev => !prev) : onChapterPillClick}
                  className={`hidden md:flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full text-white font-medium px-3 py-1.5 ${isFullscreen ? 'text-sm' : 'text-xs'}`}
                >
                  In this video
                  <svg width="6" height="10" viewBox="0 0 6 10" fill="none" className="ml-0.5 opacity-80" aria-hidden="true">
                    <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Right controls */}
          <div className={`flex items-center ${isFullscreen ? 'gap-4' : 'gap-2'}`}>
            {/* CC Button */}
            <button 
              onClick={() => setCaptionsEnabled(!captionsEnabled)} 
              className={`rounded-full transition-colors hover:bg-white/20 relative ${isFullscreen ? 'p-2.5' : 'p-1.5'} ${captionsEnabled ? 'text-[#3ea6ff]' : 'text-white'}`} 
              aria-label="Subtitles/CC"
              title={captionsEnabled ? 'Turn off captions (C)' : 'Turn on captions (C)'}
            >
              <svg width={isFullscreen ? "24" : "18"} height={isFullscreen ? "24" : "18"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M7 10h4M7 14h4M15 10h2M15 14h2" />
              </svg>
              {captionsEnabled && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] bg-[#3ea6ff] rounded-full" />
              )}
            </button>
            
            {/* Settings button */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`rounded-full text-white transition-colors hover:bg-white/20 relative ${isFullscreen ? 'p-2.5' : 'p-1.5'}`}
                aria-label="Settings"
              >
                <div className="relative flex items-center justify-center">
                  <Settings size={isFullscreen ? 24 : 18} />
                  <span className="absolute -top-[5px] -right-[6px] bg-[#cc0000] text-white text-[9px] font-bold rounded-sm tracking-tighter leading-none" style={{ padding: '2px 3px', transform: 'scale(0.85)' }}>
                    HD
                  </span>
                </div>
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
    )}
  </div>

        {/* Fullscreen Sidebar (Integrated, not overlay) */}
        {showFullscreenSidebar && isFullscreen && (
          <div 
            className="w-80 sm:w-96 h-full z-10 bg-[#0f0f0f] border-l border-white/10 flex-shrink-0 flex flex-col"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'sidebarSlideIn 0.3s ease-out' }}
          >
            <TranscriptSidebar
              chapters={chapters}
              currentTime={currentTime}
              onSeek={(time) => {
                if (mainVideoRef.current) {
                  mainVideoRef.current.currentTime = time;
                  if (isPlaying) {
                    mainVideoRef.current.play().catch(() => {});
                  }
                }
                updateCurrentTime(time);
              }}
              onClose={() => setShowFullscreenSidebar(false)}
              videoThumbnail={poster}
              onShareChapter={(time) => {
                const baseUrl = window.location.href.split('?')[0];
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('t', Math.floor(time));
                const shareUrl = `${baseUrl}?${urlParams.toString()}`;
                navigator.clipboard.writeText(shareUrl).then(() => {
                  toast.success("Chapter link copied!"); 
                });
              }}
              videoId={currentVideo?._id}
              isOwner={user && (currentVideo?.owner === user?._id || currentVideo?.owner?._id === user?._id)}
              className="!h-full !w-full !max-w-none !lg:h-full !lg:border-none !lg:shadow-none !rounded-none !static"
            />
          </div>
        )}
      </div>

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
          @keyframes endScreenFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes endScreenSlideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes sidebarSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `
      }} />
    </div>
  )
})

SyncedVideoPlayer.displayName = 'SyncedVideoPlayer'

export default SyncedVideoPlayer