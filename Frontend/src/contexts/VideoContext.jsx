"use client"

import { createContext, useContext, useState, useCallback, useMemo } from "react"

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

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    videos,
    setVideos,
    currentVideo,
    setCurrentVideo,
    loading,
    setLoading,
  }), [
    videos,
    currentVideo,
    loading,
  ])

  return <VideoContext.Provider value={value}>{children}</VideoContext.Provider>
}
