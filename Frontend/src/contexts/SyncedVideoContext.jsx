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
  const [currentVideo, setCurrentVideo] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isBuffering, setIsBuffering] = useState(false)
  
  const [isMiniPlayerActive, setIsMiniPlayerActive] = useState(false)
  const [miniPlayerPosition, setMiniPlayerPosition] = useState(() => {
    const defaultWidth = 1200
    const defaultHeight = 800
    const playerWidth = 360
    const playerHeight = Math.round(playerWidth * 9 / 16) + 60 // 16:9 ratio + controls height
    const margin = 20
    const bottomMargin = 20 // Reduced margin for bottom corner positioning
    const initialX = (typeof window !== 'undefined' ? window.innerWidth : defaultWidth) - playerWidth - margin
    const initialY = (typeof window !== 'undefined' ? window.innerHeight : defaultHeight) - playerHeight - bottomMargin
    return { x: Math.max(margin, initialX), y: Math.max(margin, initialY) }
  })
  const [miniPlayerSize, setMiniPlayerSize] = useState({ width: 360, height: 'auto' })
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  
  const mainVideoRef = useRef(null)
  const miniVideoRef = useRef(null)
  const activePlayerRef = useRef(null)
  const syncTimeoutRef = useRef(null)
  const isSyncingRef = useRef(false)
  const isLoadingNewVideoRef = useRef(false)
  const currentVideoIdRef = useRef(null)
  
  const location = useLocation()
  const navigate = useNavigate()
  
  const [currentPlaylist, setCurrentPlaylist] = useState(null)
  const [playlistVideos, setPlaylistVideos] = useState([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [autoPlayNext, setAutoPlayNext] = useState(true)
  
  const [isMainPlayerVisible, setIsMainPlayerVisible] = useState(true)
  const mainPlayerObserverRef = useRef(null)
  
  const isOnVideoPlayerPage = useMemo(() => {
    return location.pathname.startsWith('/watch/')
  }, [location.pathname])
  
  const syncBothPlayers = useCallback(() => {
    if (isSyncingRef.current || isLoadingNewVideoRef.current) return
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      if (isSyncingRef.current || isLoadingNewVideoRef.current) return
      
      const activePlayer = activePlayerRef.current
      const inactivePlayer = activePlayerRef.current === mainVideoRef.current ? miniVideoRef.current : mainVideoRef.current
      
      if (activePlayer && inactivePlayer && activePlayer.readyState >= 2 && inactivePlayer.readyState >= 2) {
        isSyncingRef.current = true
        
        try {
          const timeDifference = Math.abs(activePlayer.currentTime - inactivePlayer.currentTime)
          if (timeDifference > 0.5) {
            inactivePlayer.currentTime = activePlayer.currentTime
          }
          
          if (Math.abs(inactivePlayer.volume - activePlayer.volume) > 0.01) {
            inactivePlayer.volume = activePlayer.volume
          }
          
          if (inactivePlayer.muted !== activePlayer.muted) {
            inactivePlayer.muted = activePlayer.muted
          }
          
          if (Math.abs(inactivePlayer.playbackRate - activePlayer.playbackRate) > 0.01) {
            inactivePlayer.playbackRate = activePlayer.playbackRate
          }
          
          if (!activePlayer.paused && inactivePlayer.paused) {
            inactivePlayer.play().catch((error) => {
            })
          } else if (activePlayer.paused && !inactivePlayer.paused) {
            inactivePlayer.pause()
          }
        } catch (error) {
        } finally {
          setTimeout(() => {
            isSyncingRef.current = false
          }, 200)
        }
      } else {
        isSyncingRef.current = false
      }
    }, 250)
  }, [])
  
  const updateCurrentTime = useCallback((time) => {
    if (isLoadingNewVideoRef.current) return
    
    if (Math.abs(time - currentTime) > 0.1) {
      setCurrentTime(time)
    }
    
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      if (!isSyncingRef.current && !isLoadingNewVideoRef.current) {
        syncBothPlayers()
      }
    }, 200)
  }, [currentTime, syncBothPlayers])
  
  const setActivePlayer = useCallback((playerType) => {
    const newActiveRef = playerType === 'main' ? mainVideoRef : miniVideoRef
    
    if (newActiveRef.current && activePlayerRef.current !== newActiveRef.current) {
      const oldActiveRef = activePlayerRef.current
      
      activePlayerRef.current = newActiveRef.current
      
      const syncWhenReady = () => {
        if (newActiveRef.current && newActiveRef.current.readyState >= 2) {
          if (oldActiveRef && oldActiveRef !== newActiveRef.current && oldActiveRef.readyState >= 2 && !isLoadingNewVideoRef.current) {
            isSyncingRef.current = true
            
            try {
              const timeDifference = Math.abs(oldActiveRef.currentTime - newActiveRef.current.currentTime)
              if (timeDifference > 0.2) {
                newActiveRef.current.currentTime = oldActiveRef.currentTime
              }
              
              newActiveRef.current.volume = oldActiveRef.volume
              newActiveRef.current.muted = oldActiveRef.muted
              newActiveRef.current.playbackRate = oldActiveRef.playbackRate
              
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
          
          setTimeout(() => {
            if (!isSyncingRef.current && !isLoadingNewVideoRef.current) {
              syncBothPlayers()
            }
          }, 300)
        } else {
          setTimeout(syncWhenReady, 100)
        }
      }
      
      syncWhenReady()
    }
  }, [syncBothPlayers])
  
  const play = useCallback(async () => {
    if (activePlayerRef.current && activePlayerRef.current.readyState >= 2) {
      try {
        await activePlayerRef.current.play()
        setIsPlaying(true)
        
        setTimeout(() => {
          if (!isSyncingRef.current && !isLoadingNewVideoRef.current) {
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
      
      setTimeout(() => {
        if (!isSyncingRef.current && !isLoadingNewVideoRef.current) {
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
        
        setTimeout(() => {
          isSyncingRef.current = false
          if (!isLoadingNewVideoRef.current) {
            syncBothPlayers()
          }
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
    
    if (mainVideoRef.current) {
      mainVideoRef.current.playbackRate = clampedSpeed
    }
    if (miniVideoRef.current) {
      miniVideoRef.current.playbackRate = clampedSpeed
    }
  }, [])
  
  const activateMiniPlayer = useCallback(() => {
    if (!currentVideo) return
    
    setIsMiniPlayerActive(true)
    
    const resetToBottomRight = () => {
      const playerWidth = 360
      const playerHeight = Math.round(playerWidth * 9 / 16) + 60
      const margin = 20
      const bottomMargin = 20
      const newX = (typeof window !== 'undefined' ? window.innerWidth : 1200) - playerWidth - margin
      const newY = (typeof window !== 'undefined' ? window.innerHeight : 800) - playerHeight - bottomMargin
      setMiniPlayerPosition({ 
        x: Math.max(margin, newX), 
        y: Math.max(margin, newY) 
      })
    }
    
    resetToBottomRight()
    
    // Ensure video continues playing when switching to mini player
    const wasPlaying = isPlaying
    
    setTimeout(() => {
      setActivePlayer('mini')
      if (wasPlaying) {
        setTimeout(() => {
          play()
        }, 100)
      }
    }, 200)
  }, [currentVideo, setActivePlayer, play, isPlaying])
  
  const deactivateMiniPlayer = useCallback(() => {
    setIsMiniPlayerActive(false)
    
    setTimeout(() => {
      setActivePlayer('main')
    }, 200)
  }, [setActivePlayer])
  
  const closeMiniPlayer = useCallback(() => {
    // RULE: User can manually close miniplayer
    setIsMiniPlayerActive(false)
    pause()
    // Return player to idle state
    setCurrentVideo(null)
    setCurrentTime(0)
    setDuration(0)
  }, [pause])
  
  const returnToMainPlayer = useCallback(() => {
    if (currentVideo) {
      deactivateMiniPlayer()
      
      const videoPath = `/watch/${currentVideo._id}`
      const currentPath = location.pathname
      
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
      
      if (currentPath !== videoPath) {
        navigate(targetPath)
      }
      
      setTimeout(() => {
        const mainPlayerElement = document.querySelector('[data-main-video-player]')
        if (mainPlayerElement) {
          mainPlayerElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 500)
    }
  }, [currentVideo, location.pathname, navigate, deactivateMiniPlayer])
  
  const loadVideo = useCallback((video, playlist = null, videoIndex = 0) => {
    // Only reset if it's actually a different video
    if (!video || video._id === currentVideoIdRef.current) {
      return
    }
    
    // RULE: When user plays new video, stop current miniplayer video and hide miniplayer
    if (isMiniPlayerActive) {
      setIsMiniPlayerActive(false)
    }
    
    currentVideoIdRef.current = video._id
    isLoadingNewVideoRef.current = true
    
    isSyncingRef.current = false
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current)
    }
    
    setCurrentVideo(video)
    setCurrentPlaylist(playlist)
    setCurrentVideoIndex(videoIndex)
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(false)
    setIsBuffering(true)
    
    // Stop and reset both players
    if (mainVideoRef.current) {
      mainVideoRef.current.pause()
      mainVideoRef.current.currentTime = 0
    }
    if (miniVideoRef.current) {
      miniVideoRef.current.pause()
      miniVideoRef.current.currentTime = 0
    }
    
    // RULE: Load and play new video in main player (miniplayer never overrides main player)
    setTimeout(() => {
      setActivePlayer('main')
      
      setTimeout(() => {
        isLoadingNewVideoRef.current = false
      }, 500)
    }, 200)
  }, [isMiniPlayerActive, setActivePlayer])
  
  const handleVideoEnd = useCallback(() => {
    // RULE: Hide miniplayer automatically when video ends
    if (isMiniPlayerActive) {
      setIsMiniPlayerActive(false)
    }
    
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
  }, [autoPlayNext, currentPlaylist, playlistVideos, currentVideoIndex, navigate, isMiniPlayerActive])
  
  const updateMiniPlayerPosition = useCallback((position) => {
    setMiniPlayerPosition(position)
  }, [])
  
  const updateMiniPlayerSize = useCallback((size) => {
    setMiniPlayerSize(size)
  }, [])

  const resetMiniPlayerPosition = useCallback(() => {
    const playerWidth = 360
    const playerHeight = Math.round(playerWidth * 9 / 16) + 60 // 16:9 ratio + controls height
    const margin = 20
    const bottomMargin = 20 // Reduced margin for bottom corner positioning
    const newX = (typeof window !== 'undefined' ? window.innerWidth : 1200) - playerWidth - margin
    const newY = (typeof window !== 'undefined' ? window.innerHeight : 800) - playerHeight - bottomMargin
    setMiniPlayerPosition({ 
      x: Math.max(margin, newX), 
      y: Math.max(margin, newY) 
    })
  }, [])
  
  const registerMainPlayer = useCallback((element) => {
    if (mainPlayerObserverRef.current && element) {
      mainPlayerObserverRef.current.observe(element)
    }
  }, [])
  
  const unregisterMainPlayer = useCallback((element) => {
    if (mainPlayerObserverRef.current && element) {
      mainPlayerObserverRef.current.unobserve(element)
    }
  }, [])
  
  useEffect(() => {
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.5
        setIsMainPlayerVisible(isVisible)
        
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
  
  useEffect(() => {
    if (currentVideo && currentVideo._id !== currentVideoIdRef.current) {
      // Only reset when it's actually a new video, not just settings change
      currentVideoIdRef.current = currentVideo._id
      isLoadingNewVideoRef.current = true
      
      const resetVideoPosition = (videoElement) => {
        if (videoElement) {
          videoElement.pause()
          videoElement.currentTime = 0
          videoElement.volume = volume
          videoElement.muted = isMuted
          videoElement.playbackRate = playbackRate
        }
      }
      
      resetVideoPosition(mainVideoRef.current)
      resetVideoPosition(miniVideoRef.current)
      
      setCurrentTime(0)
      setIsPlaying(false)
      
      const timer = setTimeout(() => {
        isLoadingNewVideoRef.current = false
      }, 1000)
      
      return () => {
        clearTimeout(timer)
      }
    } else if (currentVideo) {
      // Just update video properties without resetting time for settings changes
      const updateVideoProperties = (videoElement) => {
        if (videoElement) {
          videoElement.volume = volume
          videoElement.muted = isMuted
          videoElement.playbackRate = playbackRate
        }
      }
      
      updateVideoProperties(mainVideoRef.current)
      updateVideoProperties(miniVideoRef.current)
    }
  }, [currentVideo, volume, isMuted, playbackRate])

  useEffect(() => {
    const handleResize = () => {
      if (isMiniPlayerActive) {
        const playerWidth = 360
        const playerHeight = Math.round(playerWidth * 9 / 16) + 60 // 16:9 ratio + controls height
        const margin = 20
        const bottomMargin = 20 // Reduced margin for bottom corner positioning
        const newX = window.innerWidth - playerWidth - margin
        const newY = window.innerHeight - playerHeight - bottomMargin
        setMiniPlayerPosition({ 
          x: Math.max(margin, newX), 
          y: Math.max(margin, newY) 
        })
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isMiniPlayerActive])
  
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
      isSyncingRef.current = false
      isLoadingNewVideoRef.current = false
    }
  }, [])
  
  const contextValue = useMemo(() => ({
    currentVideo,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    isBuffering,
    
    isMiniPlayerActive,
    miniPlayerPosition,
    miniPlayerSize,
    isDragging,
    isResizing,
    isMainPlayerVisible,
    
    mainVideoRef,
    miniVideoRef,
    activePlayerRef,
    
    currentPlaylist,
    playlistVideos,
    currentVideoIndex,
    autoPlayNext,
    
    play,
    pause,
    togglePlay,
    seekTo,
    setVolumeLevel,
    toggleMute,
    setPlaybackSpeed,
    
    activateMiniPlayer,
    deactivateMiniPlayer,
    closeMiniPlayer,
    returnToMainPlayer,
    updateMiniPlayerPosition,
    updateMiniPlayerSize,
    resetMiniPlayerPosition,
    
    loadVideo,
    handleVideoEnd,
    
    setActivePlayer,
    registerMainPlayer,
    unregisterMainPlayer,
    syncBothPlayers,
    updateCurrentTime,
    
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
    
    isOnVideoPlayerPage
  }), [
    currentVideo, isPlaying, currentTime, duration, volume, isMuted, playbackRate, isBuffering,
    isMiniPlayerActive, miniPlayerPosition, miniPlayerSize, isDragging, isResizing, isMainPlayerVisible,
    currentPlaylist, playlistVideos, currentVideoIndex, autoPlayNext,
    play, pause, togglePlay, seekTo, setVolumeLevel, toggleMute, setPlaybackSpeed,
    activateMiniPlayer, deactivateMiniPlayer, closeMiniPlayer, returnToMainPlayer,
    updateMiniPlayerPosition, updateMiniPlayerSize, resetMiniPlayerPosition, loadVideo, handleVideoEnd,
    setActivePlayer, registerMainPlayer, unregisterMainPlayer, syncBothPlayers, updateCurrentTime, isOnVideoPlayerPage
  ])
  
  return (
    <SyncedVideoContext.Provider value={contextValue}>
      {children}
    </SyncedVideoContext.Provider>
  )
}