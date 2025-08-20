"use client"

import { useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useSyncedVideo } from "../contexts/SyncedVideoContext"

export const useVideoNavigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { 
    currentVideo, 
    isPlaying, 
    isMiniPlayerActive, 
    loadVideo, 
    activateMiniPlayer,
    deactivateMiniPlayer 
  } = useSyncedVideo()

  // Navigate to video with mini player consideration
  const navigateToVideo = useCallback((video, playlist = null, videoIndex = 0) => {
    const videoPath = `/watch/${video._id}`
    const queryParams = new URLSearchParams()
    
    if (playlist) {
      queryParams.set('playlist', playlist._id)
      queryParams.set('index', videoIndex.toString())
    }
    
    const fullPath = queryParams.toString() 
      ? `${videoPath}?${queryParams.toString()}`
      : videoPath

    // If we're currently playing a different video and not on video player page,
    // activate mini player for current video before navigating
    if (currentVideo && 
        currentVideo._id !== video._id && 
        isPlaying && 
        !location.pathname.startsWith('/watch/') &&
        !isMiniPlayerActive) {
      activateMiniPlayer()
    }

    // Load the new video into context
    loadVideo(video, playlist, videoIndex)
    
    // Navigate to the video page
    navigate(fullPath)
  }, [currentVideo, isPlaying, isMiniPlayerActive, location.pathname, loadVideo, activateMiniPlayer, navigate])

  // Handle video card click with mini player logic
  const handleVideoCardClick = useCallback((video, playlist = null, videoIndex = 0) => {
    navigateToVideo(video, playlist, videoIndex)
  }, [navigateToVideo])

  // Continue playing current video in mini player
  const continueInMiniPlayer = useCallback(() => {
    if (currentVideo && isPlaying && !isMiniPlayerActive) {
      activateMiniPlayer()
    }
  }, [currentVideo, isPlaying, isMiniPlayerActive, activateMiniPlayer])

  // Stop mini player and clear video
  const stopMiniPlayer = useCallback(() => {
    if (isMiniPlayerActive) {
      deactivateMiniPlayer()
    }
  }, [isMiniPlayerActive, deactivateMiniPlayer])

  return {
    navigateToVideo,
    handleVideoCardClick,
    continueInMiniPlayer,
    stopMiniPlayer,
    isVideoPlaying: isPlaying,
    currentPlayingVideo: currentVideo,
    isMiniPlayerActive
  }
}