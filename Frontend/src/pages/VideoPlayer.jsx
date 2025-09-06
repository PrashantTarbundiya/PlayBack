"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { ThumbsUp, ThumbsDown, Share, Download, Clock, Plus } from "lucide-react"
import LikeButton from "../components/LikeButton/LikeButton"
import SyncedVideoPlayer from "../components/VideoPlayer/SyncedVideoPlayer"
import CommentSection from "../components/CommentSection/CommentSection"
import VideoCard from "../components/VideoCard/VideoCard"
import PlaylistModal from "../components/PlaylistModal/PlaylistModal"
import { videoAPI, likeAPI, subscriptionAPI, authAPI, playlistAPI } from "../services/api"
import SubscriptionDropdown from "../components/SubscriptionDropdown/SubscriptionDropdown"
import { useAuth } from "../contexts/AuthContext"
import { useSyncedVideo } from "../contexts/SyncedVideoContext"
import { formatDistanceToNow } from "date-fns"
import toast from "react-hot-toast"
import { CenteredLoader } from "../components/Skeleton/LoadingScreen"
import VideoPlayerSkeleton from "../components/Skeleton/VideoPlayerSkeleton"

const VideoPlayer = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    currentVideo,
    loadVideo,
    currentPlaylist,
    playlistVideos,
    currentVideoIndex,
    autoPlayNext,
    setCurrentPlaylist,
    setPlaylistVideos,
    setCurrentVideoIndex,
    setAutoPlayNext,
    handleVideoEnd
  } = useSyncedVideo()
  
  const videoRef = useRef(null)
  const relatedVideosRef = useRef(null)
  const [video, setVideo] = useState(null)
  const [relatedVideos, setRelatedVideos] = useState([])
  const [relatedVideosPage, setRelatedVideosPage] = useState(1)
  const [hasMoreRelated, setHasMoreRelated] = useState(true)
  const [loadingMoreRelated, setLoadingMoreRelated] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [avatarError, setAvatarError] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [actionLoading, setActionLoading] = useState({ like: false, subscribe: false, watchLater: false, saveToPlaylist: false })
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [savedPlaylists, setSavedPlaylists] = useState([])
  const [isPlaylistLoading, setIsPlaylistLoading] = useState(false)

  // Scroll to top when component mounts or video ID changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    if (id) {
      // Check if we're coming from a playlist
      const urlParams = new URLSearchParams(window.location.search)
      const playlistId = urlParams.get('playlist')
      const videoIndex = urlParams.get('index')
      
      if (playlistId) {
        fetchPlaylistContext(playlistId, videoIndex)
      } else {
        // Clear playlist context if not from playlist
        setCurrentPlaylist(null)
        setPlaylistVideos([])
        setCurrentVideoIndex(0)
      }
      
      fetchVideo()
      fetchRelatedVideos().catch(() => {})
    }
  }, [id, user?._id])

  useEffect(() => {
    if (id) {
      setIsSaved(false)
      setSavedPlaylists([])
      setRelatedVideosPage(1)
      setHasMoreRelated(true)
    }
  }, [id])



  // Auto-play video when it's loaded
  useEffect(() => {
    if (video && videoRef.current && !loading) {
      // Small delay to ensure video is ready
      const timer = setTimeout(() => {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch((error) => {
            // Silently handle autoplay restrictions
            console.log("Autoplay prevented:", error.message)
          })
        }
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [video, loading])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable
      ) return

      const handledKeys = ['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
      if (handledKeys.includes(e.code)) e.preventDefault()

      const videoElement = videoRef.current
      if (!videoElement) return

      switch (e.code) {
        case 'Space':
          videoElement.paused ? videoElement.play().catch(() => {}) : videoElement.pause()
          break
        case 'ArrowLeft':
          videoElement.currentTime = Math.max(0, videoElement.currentTime - 10)
          break
        case 'ArrowRight':
          videoElement.currentTime = Math.min(videoElement.duration || 0, videoElement.currentTime + 10)
          break
        case 'ArrowUp':
          videoElement.volume = Math.min(1, videoElement.volume + 0.1)
          break
        case 'ArrowDown':
          videoElement.volume = Math.max(0, videoElement.volume - 0.1)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const addToWatchHistory = async (videoId) => {
    try {
      // We need to create a backend endpoint to add videos to watch history
      // For now, we'll create a simple API call
      const response = await authAPI.addToWatchHistory(videoId)
    } catch (error) {
      throw error
    }
  }

  const fetchVideo = async () => {
    try {
      setLoading(true)
      setError(null)
      setAvatarError(false)
      setThumbnailError(false)

      if (!id?.trim()) throw new Error("Video ID is missing")

      const trimmedId = id.trim()
      
      const response = await videoAPI.getVideoById(trimmedId)
      const videoData = response?.data?.data || response?.data

      if (!videoData) throw new Error("No video data received")
      setVideo(videoData)
      setLikesCount(videoData.likesCount || 0)
      
      // Load video into synced context
      loadVideo(videoData, currentPlaylist, currentVideoIndex)
      
      // Set initial states from video data if available
      if (videoData.isLiked !== undefined) {
        setIsLiked(videoData.isLiked)
      }
      if (videoData.owner?.isSubscribed !== undefined) {
        setIsSubscribed(videoData.owner.isSubscribed)
      }

      if (user) {
        await Promise.all([
          checkLikeStatus(trimmedId),
          videoData.owner?._id ? checkSubscriptionStatus(videoData.owner._id) : Promise.resolve(),
          checkSaveStatus(trimmedId)
        ])
      }

      // Increment views
      try {
        if (videoAPI.incrementViews) {
          await videoAPI.incrementViews(trimmedId)
        }
      } catch (viewError) {
        // Silently handle view increment errors to not disrupt video loading
      }

      // Add video to watch history if user is logged in
      if (user) {
        try {
          await addToWatchHistory(trimmedId)
        } catch (historyError) {
          // Silently handle watch history errors to not disrupt video loading
        }
      }

    } catch (error) {
      let errorMessage = "Failed to load video"

      if (error.response) {
        const status = error.response.status
        const serverMsg = error.response.data?.message || error.response.data?.error
        errorMessage = serverMsg || `Server error (${status})`
        if (status === 404) errorMessage = "Video not found"
        if (status === 401) errorMessage = "Authentication required"
        if (status === 403) errorMessage = "Access denied"
      } else if (error.request) {
        errorMessage = "Network error - check your connection"
      } else {
        errorMessage = error.message
      }

      setError(errorMessage)
      toast.remove()
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const fetchPlaylistContext = async (playlistId, videoIndex) => {
    try {
      setIsPlaylistLoading(true)
      const response = await playlistAPI.getPlaylistById(playlistId)
      const playlistData = response?.data?.data
      
      if (playlistData) {
        setCurrentPlaylist(playlistData)
        const videos = playlistData.videos || []
        setPlaylistVideos(videos)
        
        // Find current video index
        const currentIndex = videoIndex ? parseInt(videoIndex) : videos.findIndex(v => v._id === id)
        setCurrentVideoIndex(currentIndex >= 0 ? currentIndex : 0)
        
        // Update synced context with playlist info
        if (video) {
          loadVideo(video, playlistData, currentIndex >= 0 ? currentIndex : 0)
        }
      }
    } catch (error) {
      // Handle playlist fetch error silently
    } finally {
      setIsPlaylistLoading(false)
    }
  }

  const fetchRelatedVideos = async (reset = true) => {
    try {
      const response = await videoAPI.getWatchNextVideos(id, 10)
      const videosData = response?.data?.data || response?.data || []
      if (reset) {
        setRelatedVideos(videosData)
        setRelatedVideosPage(1)
        setHasMoreRelated(videosData.length === 10)
      }
    } catch (error) {
      if (reset) {
        setRelatedVideos([])
        setHasMoreRelated(false)
      }
    }
  }

  const loadMoreRelatedVideos = async () => {
    if (!hasMoreRelated || loadingMoreRelated) return
    
    setLoadingMoreRelated(true)
    try {
      const response = await videoAPI.getAllVideosWithOwnerDetails(relatedVideosPage + 1, 5)
      const videosData = response?.data?.data || response?.data || []
      const filteredVideos = videosData.filter(v => v._id !== id && !relatedVideos.some(rv => rv._id === v._id))
      
      if (filteredVideos.length > 0) {
        setRelatedVideos(prev => [...prev, ...filteredVideos])
        setRelatedVideosPage(prev => prev + 1)
        setHasMoreRelated(filteredVideos.length === 5)
      } else {
        setHasMoreRelated(false)
      }
    } catch (error) {
      setHasMoreRelated(false)
    } finally {
      setLoadingMoreRelated(false)
    }
  }



  const checkLikeStatus = async (videoId) => {
    try {
      // Try to get user's liked videos
      try {
        const response = await likeAPI.getLikedVideos()
        const likedVideos = response?.data?.data || response?.data || []
        
        const isVideoLiked = likedVideos.some(item => {
          const video = item.likedVideo || item
          return video._id === videoId || video.video?._id === videoId
        })
        setIsLiked(isVideoLiked)
        return
      } catch (error) {
        // If we can't get liked videos, we'll rely on the video data itself
        setIsLiked(false)
      }
      
    } catch (error) {
      setIsLiked(false)
    }
  }

  const checkSubscriptionStatus = async (channelId) => {
    try {
      // Get user's subscriptions using the correct endpoint
      try {
        const response = await subscriptionAPI.getSubscribedChannels(user._id)
        const subscriptions = response?.data?.data || response?.data || []
        
        const isSubscribedToChannel = subscriptions.some(sub => {
          const channel = sub.subscribedChannel || sub.channel || sub
          return channel._id === channelId || channel === channelId
        })
        setIsSubscribed(isSubscribedToChannel)
        return
      } catch (error) {
        setIsSubscribed(false)
      }
      
    } catch (error) {
      setIsSubscribed(false)
    }
  }

  const checkSaveStatus = async (videoId) => {
    try {
      const response = await playlistAPI.checkVideoInPlaylists(videoId)
      const data = response?.data?.data || response?.data
      
      if (data) {
        setIsSaved(data.isSaved || false)
        setSavedPlaylists(data.playlists || [])
      }
    } catch (error) {
      setIsSaved(false)
      setSavedPlaylists([])
    }
  }

  const handleLike = async () => {
    if (!user) {
      toast.remove()
      toast.error("Please login to like videos")
      return
    }

    if (actionLoading.like) {
      return
    }

    setActionLoading(prev => ({ ...prev, like: true }))
    
    try {
      const response = await likeAPI.toggleVideoLike(id)
      
      // Update like status based on response or toggle current state
      const newLikeStatus = response?.data?.isLiked !== undefined
        ? response.data.isLiked
        : !isLiked

      const newLikesCount = response?.data?.likesCount !== undefined
        ? response.data.likesCount
        : (newLikeStatus ? likesCount + 1 : Math.max(likesCount - 1, 0))

      setIsLiked(newLikeStatus)
      setLikesCount(newLikesCount)
      
      toast.remove()
      toast.success(newLikeStatus ? "Video liked!" : "Like removed")
      
    } catch (error) {
      
      let errorMessage = "Failed to like video"
      if (error.response?.status === 401) {
        errorMessage = "Please login to like videos"
      } else if (error.response?.status === 404) {
        errorMessage = "Video not found"
      }
      
      toast.remove()
      toast.error(errorMessage)
    } finally {
      setActionLoading(prev => ({ ...prev, like: false }))
    }
  }

  const handleSubscribe = async () => {
    if (!user) {
      toast.remove()
      toast.error("Please login to subscribe")
      return
    }
    
    if (!video?.owner?._id) {
      toast.remove()
      toast.error("Channel info missing")
      return
    }

    if (actionLoading.subscribe) {
      return
    }

    setActionLoading(prev => ({ ...prev, subscribe: true }))

    try {
      const response = await subscriptionAPI.toggleSubscription(video.owner._id)
      
      // Update subscription status based on response or toggle current state
      const newSubscriptionStatus = response?.data?.subscribed !== undefined
        ? response.data.subscribed
        : !isSubscribed

      setIsSubscribed(newSubscriptionStatus)
      
      toast.remove()
      toast.success(newSubscriptionStatus ? "Subscribed!" : "Unsubscribed")
      
    } catch (error) {
      
      let errorMessage = "Failed to subscribe"
      if (error.response?.status === 401) {
        errorMessage = "Please login to subscribe"
      } else if (error.response?.status === 404) {
        errorMessage = "Channel not found"
      }
      
      toast.remove()
      toast.error(errorMessage)
    } finally {
      setActionLoading(prev => ({ ...prev, subscribe: false }))
    }
  }

  const handleWatchLater = async () => {
    if (!user) {
      toast.remove()
      toast.error("Please login to use Watch Later")
      return
    }

    if (actionLoading.watchLater) {
      return
    }

    setActionLoading(prev => ({ ...prev, watchLater: true }))
    
    try {
      // Check if video is already in Watch Later before making API call
      const watchLaterPlaylist = savedPlaylists.find(p => p.name === 'Watch Later')
      if (watchLaterPlaylist) {
        toast.remove()
        toast.error("Video is already in Watch Later")
        return
      }
      
      await videoAPI.addToWatchLater(id)
      toast.remove()
      toast.success("Added to Watch Later!")
      // Refresh save status to update UI
      await checkSaveStatus(id)
    } catch (error) {
      toast.remove()
      toast.error("Failed to add to Watch Later")
    } finally {
      setActionLoading(prev => ({ ...prev, watchLater: false }))
    }
  }

  const handleSaveToPlaylist = async () => {
    if (!user) {
      toast.remove()
      toast.error("Please login to save to playlist")
      return
    }

    if (actionLoading.saveToPlaylist) {
      return
    }

    setActionLoading(prev => ({ ...prev, saveToPlaylist: true }))
    
    try {
      setShowPlaylistModal(true)
    } catch (error) {
      toast.remove()
      toast.error("Failed to open playlist modal")
    } finally {
      setActionLoading(prev => ({ ...prev, saveToPlaylist: false }))
    }
  }

  const handlePlaylistModalClose = () => {
    setShowPlaylistModal(false)
    // Refresh save status after modal closes to update UI
    if (user && id) {
      checkSaveStatus(id).catch(() => {})
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: video.title,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          toast.remove()
          toast.success("Link copied!")
        })
        .catch(() => {
          toast.remove()
          toast.error("Copy failed")
        })
    }
  }

  const formatViews = (views) => {
    if (!views) return "0 views"
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`
    return `${views} views`
  }

  const getFallbackAvatar = () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="24" fill="#374151"/>
        <path d="M24 10c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6 2.686-6 6-6zm0 16c4.418 0 8 1.79 8 4v2H16v-2c0-2.21 3.582-4 8-4z" fill="#D1D5DB"/>
      </svg>
    `
    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  const getAvatarUrl = () => {
    if (avatarError) return getFallbackAvatar()
    const avatar = video.owner?.avatar
    if (!avatar) return getFallbackAvatar()
    
    let imageUrl = ""
    if (typeof avatar === 'string') {
      imageUrl = avatar
    } else {
      imageUrl = avatar.url || avatar.secure_url || ""
    }
    
    // Check if it's a valid URL
    if (!imageUrl || imageUrl.trim() === "") {
      return getFallbackAvatar()
    }
    
    return imageUrl
  }

  const getThumbnailUrl = () => {
    if (thumbnailError) return "/default-thumbnail.jpg"
    const thumbnail = video.thumbnail
    if (!thumbnail) return "/default-thumbnail.jpg"
    
    let imageUrl = ""
    if (typeof thumbnail === 'string') {
      imageUrl = thumbnail
    } else {
      imageUrl = thumbnail.url || thumbnail.secure_url || ""
    }
    
    // Check if it's a valid URL
    if (!imageUrl || imageUrl.trim() === "") {
      return "/default-thumbnail.jpg"
    }
    
    return imageUrl
  }

  const getVideoUrl = () => {
    const videoFile = video.videoFile
    if (!videoFile) {
      return null
    }

    let videoUrl = null
    
    // Handle different possible URL structures from Cloudinary or other sources
    if (typeof videoFile === 'string') {
      // Direct string URL (like Cloudinary URL)
      videoUrl = videoFile
    } else if (typeof videoFile === 'object') {
      // Object with URL properties
      videoUrl = videoFile.url || videoFile.secure_url || videoFile.path || videoFile.src
      
      // If still no URL found, check if it's a nested object
      if (!videoUrl && videoFile.videoFile) {
        const nestedFile = videoFile.videoFile
        if (typeof nestedFile === 'string') {
          videoUrl = nestedFile
        } else {
          videoUrl = nestedFile.url || nestedFile.secure_url || nestedFile.path || nestedFile.src
        }
      }
    }
    
    // Validate URL format
    if (videoUrl && !videoUrl.startsWith('http')) {
      // If it's a relative path, you might need to construct the full URL
      // For now, we'll assume it needs to be a complete URL
      if (!videoUrl.includes('cloudinary.com') && !videoUrl.includes('://')) {
        toast.remove()
        toast.error('Invalid video URL format. Expected a complete URL.')
        return null
      }
    }
    
    if (!videoUrl) {
      toast.remove()
      toast.error('Video URL could not be resolved. Please check video file configuration.')
    }

    return videoUrl
  }

  const handleThumbnailError = () => {
    setThumbnailError(true)
  }

  const handleAvatarError = () => {
    setAvatarError(true)
  }

  if (loading) {
    return <VideoPlayerSkeleton />
  }

  if (error || !video) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[70vh] text-red-500 px-4">
        <div className="text-6xl mb-4">🎬</div>
        <h2 className="text-2xl font-bold mb-2">Video Load Error</h2>
        <p className="text-gray-400 mb-4 max-w-md">{error}</p>
        <div className="flex gap-4">
          <button onClick={() => window.history.back()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Go Back</button>
          <button onClick={fetchVideo} className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 text-white bg-[#0f0f0f] min-h-screen">
      {/* Main Video Section */}
      <div className="flex-1 max-w-5xl">
        <div className="rounded-lg overflow-hidden">
          <SyncedVideoPlayer
            ref={videoRef}
            src={getVideoUrl()}
            poster={getThumbnailUrl()}
            onVideoEnd={handleVideoEnd}
            onError={(e) => {
              toast.remove()
              toast.error(`Video failed to load: ${getVideoUrl() || 'No video URL found'}. Please check if the video file exists and is accessible.`);
            }}
          />
        </div>

        <h1 className="text-xl font-semibold mb-2">{video.title}</h1>

        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <span className="text-sm text-gray-400">
            {formatViews(video.views)} • {formatDistanceToNow(new Date(video.createdAt))} ago
          </span>

          <div className="flex gap-2 sm:gap-3 text-sm">
            <LikeButton
              isLiked={isLiked}
              likesCount={actionLoading.like ? "..." : likesCount}
              onLike={handleLike}
              disabled={actionLoading.like}
            />
            <button className="flex items-center gap-2 px-5 py-[22px] h-[39px] rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700">
              <ThumbsDown size={25} />
            </button>
            <button onClick={handleShare} className="flex items-center gap-2 px-4 py-[22px] h-[36px] rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700">
              <Share size={20} />
              <span className="hidden sm:inline ">Share</span>
            </button>
            <button
              onClick={handleWatchLater}
              disabled={actionLoading.watchLater}
              className={`flex items-center gap-2 px-4 py-[22px] h-[36px] rounded-full transition-colors ${
                actionLoading.watchLater
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Clock size={20} />
              <span className="hidden sm:inline">{actionLoading.watchLater ? "..." : "Watch Later"}</span>
            </button>
            <button
              onClick={handleSaveToPlaylist}
              disabled={actionLoading.saveToPlaylist}
              className={`flex items-center gap-2 px-4 py-[22px] h-[36px] rounded-full transition-colors ${
                actionLoading.saveToPlaylist
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
              title={isSaved ? `Saved in ${savedPlaylists.length} playlist${savedPlaylists.length === 1 ? '' : 's'}` : 'Save to playlist'}
            >
              <Plus size={20} className={isSaved ? "fill-current" : ""} />
              <span className="hidden sm:inline">
                {actionLoading.saveToPlaylist
                  ? "..."
                  : isSaved
                    ? "Saved"
                    : "Save"
                }
              </span>
            </button>
            <button className="hidden sm:flex items-center gap-2 px-4 py-[22px] h-[36px] rounded-full bg-gray-800 text-gray-300 hover:bg-gray-700">
              <Download size={20} />
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Channel Info */}
        <div className="flex items-center justify-between bg-gray-900 p-4 rounded-lg mb-6">
          <Link
            to={`/profile/${video.owner?.username}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src={getAvatarUrl()}
              alt="Channel"
              className="w-12 h-12 rounded-full object-cover bg-gray-600"
              onError={handleAvatarError}
            />
            <div>
              <p className="font-medium text-white hover:text-gray-300">{video.owner?.fullName || video.owner?.username || "Unknown Channel"}</p>
              <p className="text-sm text-gray-400">{video.owner?.subscribersCount || 0} subscribers</p>
            </div>
          </Link>
          {user && video.owner?._id !== user._id && (
            <SubscriptionDropdown
              channelId={video?.owner?._id}
              isSubscribed={isSubscribed}
              onSubscriptionChange={(newStatus) => {
                setIsSubscribed(newStatus);
                // Update localStorage
                if (video?.owner?._id) {
                  localStorage.setItem(`subscribed_${video.owner._id}`, newStatus.toString());
                }
              }}
              size="default"
            />
          )}
        </div>

        {/* Description */}
        <div className="bg-gray-900 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{video.description || "No description available"}</p>
        </div>

        {/* Comments */}
        <CommentSection videoId={id} />
      </div>

      {/* Playlist/Related Videos Sidebar */}
      <aside className="w-full lg:w-96 lg:min-w-96">
        {currentPlaylist ? (
          <div className="space-y-4">
            {/* Playlist Header */}
            <div className="bg-[#1a1a1a] rounded-lg p-4 max-w-[350px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{currentPlaylist.name}</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAutoPlayNext(!autoPlayNext)}
                    className={`p-2 rounded-full transition-colors ${
                      autoPlayNext
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    }`}
                    title="Auto-play next video"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z"/>
                      <path d="M3 5v14l11-7z" opacity="0.5"/>
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                {currentVideoIndex + 1} / {playlistVideos.length} videos
              </p>
              {currentPlaylist.description && (
                <p className="text-sm text-gray-300 mt-2">{currentPlaylist.description}</p>
              )}
            </div>

            {/* Playlist Videos */}
            <div className="space-y-2">
              <h4 className="text-md font-medium text-gray-300">Playlist Videos</h4>
              <div className="max-h-[600px] max-w-[350px] overflow-y-auto space-y-2">
                {isPlaylistLoading ? (
                  <CenteredLoader message="Loading playlist..." />
                ) : (
                  playlistVideos.map((video, index) => (
                    <div
                      key={video._id}
                      onClick={() => {
                        const newUrl = `/watch/${video._id}?playlist=${currentPlaylist._id}&index=${index}`
                        navigate(newUrl)
                      }}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                        index === currentVideoIndex
                          ? 'bg-blue-900/50 border border-blue-500'
                          : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                      }`}
                      style={{ minHeight: '82px', maxHeight: '82px' }}
                    >
                      <div className="relative flex-shrink-0 overflow-hidden rounded bg-gray-800" style={{ width: '106px', height: '64px' }}>
                        <img
                          src={video.thumbnail?.url || video.thumbnail || '/default-thumbnail.jpg'}
                          alt={video.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-thumbnail.jpg'
                          }}
                        />
                        
                        {/* Video number indicator */}
                        <div className="absolute top-0.5 left-0.5 bg-black/80 text-white text-xs px-1 py-0.5 rounded font-medium">
                          {index + 1}
                        </div>
                        
                        {/* Duration badge */}
                        {video.duration && (
                          <div className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-xs px-1 py-0.5 rounded font-medium">
                            {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
                          </div>
                        )}
                        
                        {/* Playing indicator */}
                        {index === currentVideoIndex && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center" style={{ height: '64px' }}>
                        <h5
                          className={`text-sm font-medium leading-tight mb-1 ${
                            index === currentVideoIndex ? 'text-blue-300' : 'text-white'
                          }`}
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.3'
                          }}
                        >
                          {video.title}
                        </h5>
                        <p className="text-xs text-gray-400 truncate">
                          {video.ownerDetails?.fullName || video.owner?.fullName || video.ownerDetails?.username || video.owner?.username || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {video.views || 0} views
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-semibold mb-4">Related Videos</h3>
            <div ref={relatedVideosRef} className="related-videos-container space-y-3">
              {relatedVideos.length > 0 ? (
                <>
                  {relatedVideos.map(vid => <VideoCard key={vid._id} video={vid} disablePreview={true} />)}
                  {loadingMoreRelated && (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                  {!hasMoreRelated && relatedVideos.length > 10 && (
                    <p className="text-center text-sm text-gray-500 py-4">No more videos to load</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500">No related videos found.</p>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Playlist Selection Modal */}
      <PlaylistModal
        isOpen={showPlaylistModal}
        onClose={handlePlaylistModalClose}
        videoId={id}
        savedPlaylists={savedPlaylists}
      />
    </div>
  )
}

export default VideoPlayer