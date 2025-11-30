"use client"

import { createContext, useContext, useState, useCallback, useMemo, useRef } from "react"

const VideoContext = createContext()

export const useVideo = () => {
  const context = useContext(VideoContext)
  if (!context) {
    throw new Error("useVideo must be used within a VideoProvider")
  }
  return context
}

export const VideoProvider = ({ children }) => {
  const [videos, setVideos] = useState([])
  const [currentVideo, setCurrentVideo] = useState(null)
  const [loading, setLoading] = useState(false)
  
  // Cache for video player data
  const videoCache = useRef(new Map())

  const cacheVideoData = useCallback((videoId, data) => {
    videoCache.current.set(videoId, {
      ...data,
      timestamp: Date.now()
    })
  }, [])

  const getCachedVideoData = useCallback((videoId) => {
    const cached = videoCache.current.get(videoId)
    if (!cached) return null
    
    // Cache valid for 5 minutes
    const isValid = Date.now() - cached.timestamp < 5 * 60 * 1000
    return isValid ? cached : null
  }, [])

  const clearVideoCache = useCallback((videoId) => {
    if (videoId) {
      videoCache.current.delete(videoId)
    } else {
      videoCache.current.clear()
    }
  }, [])

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    videos,
    setVideos,
    currentVideo,
    setCurrentVideo,
    loading,
    setLoading,
    cacheVideoData,
    getCachedVideoData,
    clearVideoCache,
  }), [
    videos,
    currentVideo,
    loading,
    cacheVideoData,
    getCachedVideoData,
    clearVideoCache,
  ])

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
}
