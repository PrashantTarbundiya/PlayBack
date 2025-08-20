"use client"

import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

const SyncedVideoContext = createContext()

export const useSyncedVideo = () => {
  const context = useContext(SyncedVideoContext)
  if (!context) {
    throw new Error("useSyncedVideo must be used within a SyncedVideoProvider")
  }
  return context 
}

export const SyncedVideoProvider = ({ children }) => {
  // Core video state
  const [currentVideo, setCurrentVideo] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isBuffering, setIsBuffering] = useState(false)
  
  // Mini player state
  const [isMiniPlayerActive, setIsMiniPlayerActive] = useState(false)
  const [miniPlayerPosition, setMiniPlayerPosition] = useState(() => {
    const defaultWidth = 1200
    const playerWidth = 360
    const margin = 20
    const initialX = (typeof window !== 'undefined' ? window.innerWidth : defaultWidth) - playerWidth - margin
    return { x: Math.max(margin, initialX), y: margin }
  })
  const [miniPlayerSize, setMiniPlayerSize] = useState({ width: 360, height: 202 })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  
  // Player references
  const mainVideoRef = useRef(null)
  const miniVideoRef = useRef(null)
  const activePlayerRef = useRef(null)
  const syncTimeoutRef = useRef(null)
  const isSyncingRef = useRef(false) // Prevent sync loops
  
  // Navigation and location
  const location = useLocation()
  const navigate = useNavigate()
  
  // Playlist context
  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [playlistVideos, setPlaylistVideos] = useState([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [autoPlayNext, setAutoPlayNext] = useState(true)
  
  // Scroll detection for mini player activation
  const [isMainPlayerVisible, setIsMainPlayerVisible] = useState(true)
  const mainPlayerObserverRef = useRef(null)
  
  // Check if we're on video player page
  const isOnVideoPlayerPage = useMemo(() => {
    return location.pathname.startsWith('/watch/')
  }, [location.pathname])
  
  // Enhanced sync function with loop prevention (defined first to avoid circular dependencies)
  const syncBothPlayers = useCallback(() => {
    if (isSyncingRef.current) return
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      if (isSyncingRef.current) return
      
      const activePlayer = activePlayerRef.current
      const inactivePlayer = activePlayerRef.current === mainVideoRef.current ? miniVideoRef.current : mainVideoRef.current
      
      if (activePlayer && inactivePlayer && activePlayer.readyState >= 2 && inactivePlayer.readyState >= 2) {
        isSyncingRef.current = true
        
        try {
          // Only sync if there's a significant difference to avoid constant micro-adjustments
          const timeDifference = Math.abs(activePlayer.currentTime - inactivePlayer.currentTime)
          if (timeDifference > 0.5) { // Increased threshold for better stability
            inactivePlayer.currentTime = activePlayer.currentTime
          }
          
          // Sync other properties only if they're different
          if (Math.abs(inactivePlayer.volume - activePlayer.volume) > 0.01) {
            inactivePlayer.volume = activePlayer.volume
          }
          
          if (inactivePlayer.muted !== activePlayer.muted) {
            inactivePlayer.muted = activePlayer.muted
          }
          
          if (Math.abs(inactivePlayer.playbackRate - activePlayer.playbackRate) > 0.01) {
            inactivePlayer.playbackRate = activePlayer.playbackRate
          }
          
          // Sync play/pause state with better error handling
          if (!activePlayer.paused && inactivePlayer.paused) {
            inactivePlayer.play().catch((error) => {
            })
          } else if (activePlayer.paused && !inactivePlayer.paused) {
            inactivePlayer.pause()
          }
        } catch (error) {
        } finally {
          // Reset sync flag after a longer delay to prevent rapid re-syncing
          setTimeout(() => {
            isSyncingRef.current = false
          }, 200)
        }
      } else {
        isSyncingRef.current = false
      }
    }, 250) // Longer delay to reduce sync frequency
  }, [])
  
  // Improved current time update with debouncing
  const updateCurrentTime = useCallback((time) => {
    // Only update if the difference is significant to avoid unnecessary re-renders
    if (Math.abs(time - currentTime) > 0.1) {
      setCurrentTime(time)
    }
    
    // Debounced sync to prevent excessive syncing
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      if (!isSyncingRef.current) {
        syncBothPlayers()
      }
    }, 200)
  }, [currentTime, syncBothPlayers])
  
  // Improved active player switching
  const setActivePlayer = useCallback((playerType) => {
    const newActiveRef = playerType === 'main' ? mainVideoRef : miniVideoRef
    
    if (newActiveRef.current && activePlayerRef.current !== newActiveRef.current) {
      const oldActiveRef = activePlayerRef.current
      
      // Update active player reference
      activePlayerRef.current = newActiveRef.current
      
      // Wait for the new player to be ready before syncing
      const syncWhenReady = () => {
        if (newActiveRef.current && newActiveRef.current.readyState >= 2) {
          // Sync state from old active player to new active player
          if (oldActiveRef && oldActiveRef !== newActiveRef.current && oldActiveRef.readyState >= 2) {
            isSyncingRef.current = true
            
            try {
              // More precise time sync during player switch
              const timeDifference = Math.abs(oldActiveRef.currentTime - newActiveRef.current.currentTime)
              if (timeDifference > 0.2) {
                newActiveRef.current.currentTime = oldActiveRef.currentTime
              }
              
              newActiveRef.current.volume = oldActiveRef.volume
              newActiveRef.current.muted = oldActiveRef.muted
              newActiveRef.current.playbackRate = oldActiveRef.playbackRate
              
              // Sync play state
              if (!oldActiveRef.paused && newActiveRef.current.paused) {
                newActiveRef.current.play().catch((error) => {
                })
              } else if (oldActiveRef.paused && !newActiveRef.current.paused) {
                newActiveRef.current.pause()
              }
            } catch (error) {
            } finally {
              setTimeout(() => {
                isSyncingRef.current = false
              }, 150)
            }
          }
          
          // Trigger sync after switching
          setTimeout(() => {
            if (!isSyncingRef.current) {
              syncBothPlayers()
            }
          }, 300)
        } else {
          // Retry if player isn't ready
          setTimeout(syncWhenReady, 100)
        }
      }
      
      syncWhenReady()
    }
  }, [syncBothPlayers])
  
  // Video control functions with better error handling
  const play = useCallback(async () => {
    if (activePlayerRef.current && activePlayerRef.current.readyState >= 2) {
      try {
        await activePlayerRef.current.play()
        setIsPlaying(true)
        
        // Delayed sync to ensure play state is properly set
        setTimeout(() => {
          if (!isSyncingRef.current) {
            syncBothPlayers()
          }
        }, 100)
      } catch (error) {
        setIsPlaying(false)
      }
    }
  }, [syncBothPlayers])
  
  const pause = useCallback(() => {
    if (activePlayerRef.current) {
      activePlayerRef.current.pause()
      setIsPlaying(false)
      
      // Immediate sync for pause to ensure both players stop
      setTimeout(() => {
        if (!isSyncingRef.current) {
          syncBothPlayers()
        }
      }, 50)
    }
  }, [syncBothPlayers])
  
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])
  
  const seekTo = useCallback((time) => {
    const clampedTime = Math.max(0, Math.min(time, duration || 0))
    
    if (activePlayerRef.current) {
      isSyncingRef.current = true
      
      try {
        activePlayerRef.current.currentTime = clampedTime
        setCurrentTime(clampedTime)
        
        // Immediate sync for seek operations
        setTimeout(() => {
          isSyncingRef.current = false
          syncBothPlayers()
        }, 100)
      } catch (error) {
        isSyncingRef.current = false
      }
    }
  }, [duration, syncBothPlayers])
  
  const setVolumeLevel = useCallback((newVolume) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolume(clampedVolume)
    setIsMuted(clampedVolume === 0)
    
    // Apply to both players immediately
    if (mainVideoRef.current) {
      mainVideoRef.current.volume = clampedVolume
      mainVideoRef.current.muted = clampedVolume === 0
    }
    if (miniVideoRef.current) {
      miniVideoRef.current.volume = clampedVolume
      miniVideoRef.current.muted = clampedVolume === 0
    }
  }, [])
  
  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    // Apply to both players immediately
    if (mainVideoRef.current) {
      mainVideoRef.current.muted = newMutedState
    }
    if (miniVideoRef.current) {
      miniVideoRef.current.muted = newMutedState
    }
  }, [isMuted])
  
  const setPlaybackSpeed = useCallback((speed) => {
    const clampedSpeed = Math.max(0.25, Math.min(2, speed))
    setPlaybackRate(clampedSpeed)
    
    // Apply to both players immediately
    if (mainVideoRef.current) {
      mainVideoRef.current.playbackRate = clampedSpeed
    }
    if (miniVideoRef.current) {
      miniVideoRef.current.playbackRate = clampedSpeed
    }
  }, [])
  
  // Mini player functions with improved switching
  const activateMiniPlayer = useCallback(() => {
    if (!currentVideo) return
    
    setIsMiniPlayerActive(true)
    
    // Wait a bit for the mini player to render before switching
    setTimeout(() => {
      setActivePlayer('mini')
    }, 200)
  }, [currentVideo, setActivePlayer])
  
  const deactivateMiniPlayer = useCallback(() => {
    setIsMiniPlayerActive(false)
    
    // Wait a bit before switching to main player
    setTimeout(() => {
      setActivePlayer('main')
    }, 200)
  }, [setActivePlayer])
  
  const closeMiniPlayer = useCallback(() => {
    setIsMiniPlayerActive(false)
    pause()
  }, [pause])
  
  const returnToMainPlayer = useCallback(() => {
    if (currentVideo) {
      
      // First, deactivate mini player and switch to main player
      deactivateMiniPlayer()
      
      // Then navigate to the video page if not already there
      const videoPath = `/watch/${currentVideo._id}`
      const currentPath = location.pathname
      
      // Preserve playlist parameters if they exist
      const urlParams = new URLSearchParams(window.location.search)
      const playlistId = urlParams.get('playlist')
      const videoIndex = urlParams.get('index')
      
      let targetPath = videoPath
      if (playlistId) {
        targetPath += `?playlist=${playlistId}`
        if (videoIndex) {
          targetPath += `&index=${videoIndex}`
        }
      }
      
      
      // Only navigate if we're not already on the video page
      if (currentPath !== videoPath) {
        navigate(targetPath)
      } else {
      }
      
      // Scroll to main player if on the same page
      setTimeout(() => {
        const mainPlayerElement = document.querySelector('[data-main-video-player]')
        if (mainPlayerElement) {
          mainPlayerElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500) // Increased delay to ensure navigation completes
    }
  }, [currentVideo, location.pathname, navigate, deactivateMiniPlayer])
  
  // Load new video with better initialization
  const loadVideo = useCallback((video, playlist = null, videoIndex = 0) => {
    // Reset sync state
    isSyncingRef.current = false
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    
    setCurrentVideo(video)
    setCurrentPlaylist(playlist)
    setCurrentVideoIndex(videoIndex)
    setCurrentTime(0)
    setDuration(0)
    setIsBuffering(true)
    
    // Set active player based on mini player state with delay
    setTimeout(() => {
      if (isMiniPlayerActive) {
        setActivePlayer('mini')
      } else {
        setActivePlayer('main')
      }
    }, 200)
  }, [isMiniPlayerActive, setActivePlayer])
  
  // Handle video end
  const handleVideoEnd = useCallback(() => {
    if (autoPlayNext && currentPlaylist && playlistVideos.length > 0) {
      const nextIndex = currentVideoIndex + 1
      if (nextIndex < playlistVideos.length) {
        const nextVideo = playlistVideos[nextIndex]
        const newUrl = `/watch/${nextVideo._id}?playlist=${currentPlaylist._id}&index=${nextIndex}`
        navigate(newUrl)
      } else {
        setIsPlaying(false)
      }
    } else {
      setIsPlaying(false)
    }
  }, [autoPlayNext, currentPlaylist, playlistVideos, currentVideoIndex, navigate])
  
  // Update mini player position
  const updateMiniPlayerPosition = useCallback((position) => {
    setMiniPlayerPosition(position)
  }, [])
  
  // Update mini player size
  const updateMiniPlayerSize = useCallback((size) => {
    setMiniPlayerSize(size)
  }, [])
  
  // Register main player for visibility tracking
  const registerMainPlayer = useCallback((element) => {
    if (mainPlayerObserverRef.current && element) {
      mainPlayerObserverRef.current.observe(element)
    }
  }, [])
  
  // Unregister main player
  const unregisterMainPlayer = useCallback((element) => {
    if (mainPlayerObserverRef.current && element) {
      mainPlayerObserverRef.current.unobserve(element)
    }
  }, [])
  
  // Initialize intersection observer for main player visibility
  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.5
        setIsMainPlayerVisible(isVisible)
        
        // Auto-activate mini player when main player is not visible and video is playing
        // But only if we're not already on the video player page
        if (!isVisible && isPlaying && currentVideo && !isMiniPlayerActive && !isOnVideoPlayerPage) {
          activateMiniPlayer()
        }
      })
    }
    
    mainPlayerObserverRef.current = new IntersectionObserver(observerCallback, {
      threshold: [0, 0.5, 1],
      rootMargin: '-50px 0px -50px 0px'
    })
    
    return () => {
      if (mainPlayerObserverRef.current) {
        mainPlayerObserverRef.current.disconnect()
      }
    }
  }, [isPlaying, currentVideo, isMiniPlayerActive, isOnVideoPlayerPage, activateMiniPlayer])
  
  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      isSyncingRef.current = false
    }
  }, [])
  
  // Memoized context value
  const contextValue = useMemo(() => ({
    // Video state
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isBuffering,
    
    // Mini player state
    isMiniPlayerActive,
    miniPlayerPosition,
    miniPlayerSize,
    isDragging,
    isResizing,
    isMainPlayerVisible,
    
    // Player refs
    mainVideoRef,
    miniVideoRef,
    activePlayerRef,
    
    // Playlist state
    currentPlaylist,
    playlistVideos,
    currentVideoIndex,
    autoPlayNext,
    
    // Control functions
    play,
    pause,
    togglePlay,
    seekTo,
    setVolumeLevel,
    toggleMute,
    setPlaybackSpeed,
    
    // Mini player functions
    activateMiniPlayer,
    deactivateMiniPlayer,
    closeMiniPlayer,
    returnToMainPlayer,
    updateMiniPlayerPosition,
    updateMiniPlayerSize,
    
    // Video management
    loadVideo,
    handleVideoEnd,
    
    // Player management
    setActivePlayer,
    registerMainPlayer,
    unregisterMainPlayer,
    syncBothPlayers,
    updateCurrentTime,
    
    // State setters (for video player components)
    setCurrentTime,
    setDuration,
    setIsPlaying,
    setIsBuffering,
    setCurrentPlaylist,
    setPlaylistVideos,
    setCurrentVideoIndex,
    setAutoPlayNext,
    setIsDragging,
    setIsResizing,
    
    // Utility
    isOnVideoPlayerPage
  }), [
    currentVideo, isPlaying, currentTime, duration, volume, isMuted, playbackRate, isBuffering,
    isMiniPlayerActive, miniPlayerPosition, miniPlayerSize, isDragging, isResizing, isMainPlayerVisible,
    currentPlaylist, playlistVideos, currentVideoIndex, autoPlayNext,
    play, pause, togglePlay, seekTo, setVolumeLevel, toggleMute, setPlaybackSpeed,
    activateMiniPlayer, deactivateMiniPlayer, closeMiniPlayer, returnToMainPlayer,
    updateMiniPlayerPosition, updateMiniPlayerSize, loadVideo, handleVideoEnd,
    setActivePlayer, registerMainPlayer, unregisterMainPlayer, syncBothPlayers, updateCurrentTime, isOnVideoPlayerPage
  ])
  
  return (
    <SyncedVideoContext.Provider value={contextValue}>
      {children}
    </SyncedVideoContext.Provider>
  )
}