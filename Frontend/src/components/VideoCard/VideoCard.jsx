import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { MoreVertical, Clock, ListPlus, Share2, User, Video, Volume2, VolumeX } from "lucide-react"
import { toast } from "react-hot-toast"
import { videoAPI } from "../../services/api"
import PlaylistModal from "../PlaylistModal/PlaylistModal"
import { useVideoNavigation } from "../../hooks/useVideoNavigation"

const VideoCard = memo(({ video, showPlaylistIndex, playlist = null, videoIndex = 0, disablePreview = false }) => {
  const { handleVideoCardClick } = useVideoNavigation()
  const [showOptions, setShowOptions] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [ownerData, setOwnerData] = useState(null)
  const [loadingOwner, setLoadingOwner] = useState(false)
  const [showPlaylistModal, setShowPlaylistModal] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewMuted, setPreviewMuted] = useState(true)
  const [previewLoaded, setPreviewLoaded] = useState(false)
  const [previewError, setPreviewError] = useState(false)
  const optionsRef = useRef(null)
  const hoverTimeoutRef = useRef(null)
  const videoRef = useRef(null)

  // Check if owner is populated or just an ID
  const isOwnerPopulated = video.owner && typeof video.owner === 'object' && video.owner._id
  const isOwnerIdOnly = video.owner && typeof video.owner === 'string'
  

  // We can't fetch owner data by ID since the API doesn't provide that endpoint
  // Instead, we'll use a fallback approach for when owner is just an ID
  useEffect(() => {
    if (isOwnerIdOnly && !ownerData && !loadingOwner) {
      setLoadingOwner(true)
      
      // Since we can't fetch by ID, set a fallback owner object
      // This will show a placeholder avatar and "Channel" as the name
      setOwnerData({
        username: null,
        fullName: "Channel",
        avatar: null,
        _id: video.owner
      })
      
      setLoadingOwner(false)
    }
  }, [isOwnerIdOnly, video.owner, ownerData, loadingOwner])

  // Handle hover preview logic
  useEffect(() => {
    if (!disablePreview && isHovering && !showPreview && !previewError) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowPreview(true)
      }, 2000)
    } else if (!isHovering) {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
      setShowPreview(false)
      setPreviewLoaded(false)
    }

    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
        hoverTimeoutRef.current = null
      }
    }
  }, [disablePreview, isHovering, showPreview, previewError])

  // Handle video preview controls
  useEffect(() => {
    if (!disablePreview && showPreview && videoRef.current) {
      const video = videoRef.current
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          if (error.name !== 'AbortError') {
            setPreviewError(true)
          }
        })
      }
    } else if (videoRef.current) {
      const video = videoRef.current
      if (video.parentNode) {
        video.pause()
        video.currentTime = 0
      }
    }
  }, [disablePreview, showPreview])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        const video = videoRef.current
        try {
          video.pause()
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  // Get the effective owner (populated or fetched)
  const effectiveOwner = isOwnerPopulated ? video.owner : ownerData

  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false)
      }
    }

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOptions])







  const formatViews = useCallback((views) => {
    // Handle null, undefined, or invalid values
    const viewCount = Number(views) || 0
    if (viewCount <= 0) return "No views"
    if (viewCount >= 1_000_000) return `${(viewCount / 1_000_000).toFixed(1)}M views`
    if (viewCount >= 1_000) return `${(viewCount / 1_000).toFixed(1)}K views`
    return `${viewCount} views`
  }, [])

  const formatDuration = useCallback((seconds = 0) => {
    // Handle null, undefined, or invalid values
    const duration = Number(seconds) || 0
    if (duration <= 0) return "N/A"
    
    const totalSeconds = Math.floor(duration)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    
    // For videos longer than an hour, show hours
    if (mins >= 60) {
      const hours = Math.floor(mins / 60)
      const remainingMins = mins % 60
      return `${hours}:${remainingMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Memoize placeholder generators to avoid recreating them
  const getPlaceholderThumbnail = useMemo(() => {
    // Using a solid color placeholder that will always work
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="320" height="180" viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
        <rect width="320" height="180" fill="#2a2a2a"/>
        <g transform="translate(160,90)">
          <rect x="-20" y="-15" width="40" height="30" fill="#666" rx="4"/>
          <polygon points="-5,-8 -5,8 8,0" fill="#999"/>
        </g>
      </svg>
    `)}`
  }, [])

  const getPlaceholderAvatar = useMemo(() => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <rect width="36" height="36" fill="#444" rx="18"/>
        <g transform="translate(18,18)">
          <circle cx="0" cy="-4" r="6" fill="#666"/>
          <path d="M-10,8 C-10,2 -6,-2 0,-2 C6,-2 10,2 10,8 Z" fill="#666"/>
        </g>
      </svg>
    `)}`
  }, [])

  // Memoize Cloudinary URL fixing to avoid recalculation
  const fixCloudinaryUrl = useCallback((url) => {
    if (!url) return null
    
    try {
      // Handle direct Cloudinary URLs
      if (url.includes('res.cloudinary.com')) {
        // Ensure HTTPS
        let fixedUrl = url.replace(/^http:\/\//, 'https://')
        
        // Handle version parameter issues - sometimes the URL might have malformed version
        // Remove any existing version parameter and add a proper one
        if (fixedUrl.includes('/v1') && !fixedUrl.match(/\/v\d+\//)) {
          fixedUrl = fixedUrl.replace('/v1', '/v1752063994')
        }
        
        // Add transformation for better loading (optional)
        if (!fixedUrl.includes('w_320,h_180')) {
          fixedUrl = fixedUrl.replace('/upload/', '/upload/w_320,h_180,c_fill/')
        }
        
        return fixedUrl
      }
      
      // Handle public_id format
      if (!url.startsWith('http') && !url.startsWith('data:')) {
        return `https://res.cloudinary.com/dnlkzlnhv/image/upload/w_320,h_180,c_fill/${url}`
      }
      
      return url
    } catch (error) {
      return null
    }
  }, [])

  // Memoize thumbnail URL to avoid recalculation
  const getThumbnailUrl = useMemo(() => {
    if (thumbnailError) return getPlaceholderThumbnail
    
    const thumbnail = video.thumbnail
    if (!thumbnail) return getPlaceholderThumbnail
    
    try {
      // If it's a string, return it directly
      if (typeof thumbnail === 'string') {
        const fixedUrl = fixCloudinaryUrl(thumbnail)
        return fixedUrl || getPlaceholderThumbnail
      }
      
      // If it's an object, extract the URL
      const imageUrl = thumbnail.url || thumbnail.secure_url || thumbnail.public_id || ""
      const fixedUrl = fixCloudinaryUrl(imageUrl)
      return fixedUrl || getPlaceholderThumbnail
    } catch (error) {
      return getPlaceholderThumbnail
    }
  }, [video.thumbnail, thumbnailError, getPlaceholderThumbnail, fixCloudinaryUrl])

  // Memoize video URL to avoid recalculation
  const getVideoUrl = useMemo(() => {
    if (!video.videoFile) return null
    
    try {
      if (typeof video.videoFile === 'string') {
        const fixedUrl = fixCloudinaryUrl(video.videoFile)
        return fixedUrl
      }
      
      const videoUrl = video.videoFile.url || video.videoFile.secure_url || video.videoFile.public_id || ""
      const fixedUrl = fixCloudinaryUrl(videoUrl)
      return fixedUrl
    } catch (error) {
      return null
    }
  }, [video.videoFile, fixCloudinaryUrl])

  const handleVideoPreviewError = (error) => {
    if (error && error.target && error.target.error) {
      const videoError = error.target.error
      if (videoError.code !== videoError.MEDIA_ERR_ABORTED) {
        setPreviewError(true)
        setShowPreview(false)
      }
    } else {
      setPreviewError(true)
      setShowPreview(false)
    }
  }

  const handleVideoPreviewLoad = () => {
    setPreviewLoaded(true)
  }

  const togglePreviewMute = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setPreviewMuted(!previewMuted)
  }, [previewMuted])

  const handleMouseEnter = useCallback(() => {
    if (!disablePreview) {
      setIsHovering(true)
    }
  }, [disablePreview])

  const handleMouseLeave = useCallback(() => {
    if (!disablePreview) {
      setIsHovering(false)
    }
  }, [disablePreview])





  // Memoize avatar URL to avoid recalculation
  const getAvatarUrl = useMemo(() => {
    if (avatarError) return getPlaceholderAvatar
    
    // Use effective owner instead of just video.owner
    if (!effectiveOwner || !effectiveOwner.avatar) {
      return getPlaceholderAvatar
    }
    
    const avatar = effectiveOwner.avatar
    
    try {
      // Avatar is stored as a simple string in the database
      if (typeof avatar === 'string') {
        const fixedUrl = fixCloudinaryUrl(avatar)
        return fixedUrl || getPlaceholderAvatar
      }
      
      // Fallback for legacy object format (if any)
      if (typeof avatar === 'object' && avatar) {
        const imageUrl = avatar.url || avatar.secure_url || avatar.public_id || ""
        const fixedUrl = fixCloudinaryUrl(imageUrl)
        return fixedUrl || getPlaceholderAvatar
      }
      
      return getPlaceholderAvatar
    } catch (error) {
      return getPlaceholderAvatar
    }
  }, [effectiveOwner, avatarError, getPlaceholderAvatar, fixCloudinaryUrl])

  const handleThumbnailError = useCallback(() => {
    setThumbnailError(true)
  }, [])

  const handleAvatarError = useCallback(() => {
    setAvatarError(true)
  }, [])

  const handleAddToWatchLater = useCallback(async () => {
    try {
      await videoAPI.addToWatchLater(video._id)
      toast.remove()
      toast.success("Added to Watch Later")
    } catch (err) {
      toast.remove()
      toast.error(err.message || "Failed to add to Watch Later")
    }
    setShowOptions(false)
  }, [video._id])

  const handleSaveToPlaylist = useCallback(() => {
    setShowOptions(false)
    setShowPlaylistModal(true)
  }, [])

  const handleShare = useCallback(() => {
    try {
      const shareUrl = `${window.location.origin}/watch/${video._id}`
      
      // Check if the Clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            toast.remove()
            toast.success("Link copied to clipboard")
          })
          .catch(() => {
            // Fallback for older browsers
            fallbackCopyTextToClipboard(shareUrl)
          })
      } else {
        // Fallback for older browsers
        fallbackCopyTextToClipboard(shareUrl)
      }
    } catch (error) {
      toast.remove()
      toast.error("Failed to copy link")
    }
    setShowOptions(false)
  }, [video._id])

  // Fallback function for copying text to clipboard
  const fallbackCopyTextToClipboard = useCallback((text) => {
    try {
      const textArea = document.createElement("textarea")
      textArea.value = text
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      textArea.style.top = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        toast.remove()
        toast.success("Link copied to clipboard")
      } else {
        toast.remove()
        toast.error("Failed to copy link")
      }
    } catch (err) {
      toast.remove()
      toast.error("Failed to copy link")
    }
  }, [])

  // Handle video card click
  const handleVideoClick = useCallback((e) => {
    e.preventDefault()
    handleVideoCardClick(video, playlist, videoIndex)
  }, [video, playlist, videoIndex, handleVideoCardClick])

  // Safeguard against missing video data
  if (!video || !video._id) {
    return (
      <div className="bg-[#0f0f0f] text-white w-full max-w-md rounded-lg overflow-hidden p-4">
        <div className="text-gray-400 text-sm">Video data not available</div>
      </div>
    )
  }

  return (
    <div className="bg-[#0f0f0f] text-white w-full max-w-[350px] rounded-lg hover:bg-[#1c1c1c] transition shadow border border-[#222] relative">
      <div
        className="block relative cursor-pointer"
        onClick={handleVideoClick}
      >
        <div
          className="relative aspect-video bg-black overflow-hidden"
          {...(!disablePreview && {
            onMouseEnter: handleMouseEnter,
            onMouseLeave: handleMouseLeave
          })}
        >
          {/* Thumbnail */}
          <img
            src={getThumbnailUrl}
            alt={video.title || "Video thumbnail"}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              !disablePreview && showPreview && previewLoaded ? 'opacity-0' : 'opacity-100'
            }`}
            onError={handleThumbnailError}
            loading="lazy"
          />
          
          {/* Video Preview */}
          {!disablePreview && showPreview && getVideoUrl && (
            <video
              ref={videoRef}
              src={getVideoUrl}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                previewLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              muted={previewMuted}
              loop
              playsInline
              onLoadedData={handleVideoPreviewLoad}
              onError={handleVideoPreviewError}
              onCanPlay={handleVideoPreviewLoad}
            />
          )}
          
          {/* Duration badge */}
          <span className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
            {formatDuration(video.duration)}
          </span>
          
          {/* Playlist index badge */}
          {showPlaylistIndex && (
            <span className="absolute top-1 left-1 bg-blue-600/90 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              {showPlaylistIndex}
            </span>
          )}
          
          {/* Preview controls */}
          {!disablePreview && showPreview && previewLoaded && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={togglePreviewMute}
                className="p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
                title={previewMuted ? "Unmute preview" : "Mute preview"}
              >
                {previewMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}
          
          {/* Hover indicator */}
          {!disablePreview && isHovering && !showPreview && !previewError && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                Hover for preview...
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex p-3 gap-3 relative">
        {/* Show avatar - use effective owner data */}
        {effectiveOwner && effectiveOwner.username ? (
          <Link to={`/profile/${effectiveOwner.username}`} className="shrink-0">
            <img
              src={getAvatarUrl}
              alt={effectiveOwner.fullName || "Channel avatar"}
              className="w-9 h-9 rounded-full object-cover"
              onError={handleAvatarError}
              loading="lazy"
            />
          </Link>
        ) : (
          <div className="shrink-0">
            <img
              src={getPlaceholderAvatar}
              alt="Channel avatar"
              className="w-9 h-9 rounded-full object-cover"
            />
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <div
            onClick={handleVideoClick}
            className="block font-semibold text-sm truncate hover:underline text-selectable cursor-pointer"
          >
            {video.title || "Untitled Video"}
          </div>
          {/* Show channel name using effective owner */}
          {effectiveOwner && effectiveOwner.username ? (
            <Link to={`/profile/${effectiveOwner.username}`} className="block text-xs text-gray-400 hover:underline truncate">
              {effectiveOwner.fullName || effectiveOwner.username || "Channel"}
            </Link>
          ) : loadingOwner ? (
            <span className="block text-xs text-gray-400 text-selectable">Loading...</span>
          ) : (
            <span className="block text-xs text-gray-400 text-selectable">Channel</span>
          )}
          <div className="text-xs text-gray-400 text-selectable">
            <span>{formatViews(video.views)}</span>
            <span> • </span>
            <span>
              {video.createdAt && !isNaN(new Date(video.createdAt).getTime())
                ? formatDistanceToNow(new Date(video.createdAt)) + " ago"
                : "Unknown time"
              }
            </span>
          </div>
        </div>

        <div className="relative" ref={optionsRef}>
          <button
            onClick={() => setShowOptions(prev => !prev)}
            className="p-1.5 rounded-full hover:bg-[#272727] transition-colors"
            aria-label="More options"
          >
            <MoreVertical size={16} />
          </button>

          {showOptions && (
            <div className="absolute right-0 top-full mt-1 bg-[#1f1f1f] border border-[#333] rounded shadow-xl text-sm w-48 z-[100] min-w-max transform-gpu">
              <button
                onClick={handleAddToWatchLater}
                className="flex items-center w-full gap-2 px-4 py-2 hover:bg-[#2a2a2a] transition-colors"
              >
                <Clock size={16} /> Add to Watch Later
              </button>
              <button
                onClick={handleSaveToPlaylist}
                className="flex items-center w-full gap-2 px-4 py-2 hover:bg-[#2a2a2a] transition-colors"
              >
                <ListPlus size={16} /> Save to Playlist
              </button>
              <button
                onClick={handleShare}
                className="flex items-center w-full gap-2 px-4 py-2 hover:bg-[#2a2a2a] transition-colors"
              >
                <Share2 size={16} /> Share
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Playlist Modal */}
      <PlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => setShowPlaylistModal(false)}
        videoId={video._id}
      />
    </div>
  )
})

// Add display name for debugging
VideoCard.displayName = 'VideoCard'

export default VideoCard