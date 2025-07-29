import { useState, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { ArrowLeft, Play, Bookmark, Lock, Globe, User, Clock, Share2, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"
import { playlistAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import VideoCard from "../components/VideoCard/VideoCard"
import { formatDistanceToNow } from "date-fns"

const PlaylistDetail = () => {
  const { id } = useParams()
  const [playlist, setPlaylist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removingVideo, setRemovingVideo] = useState(null)
  const [isSaved, setIsSaved] = useState(false)
  const [checkingSaveStatus, setCheckingSaveStatus] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (id) {
      fetchPlaylistDetails()
      if (user) {
        checkPlaylistSaveStatus()
      }
    }
  }, [id, user])

  const fetchPlaylistDetails = async () => {
    try {
      setLoading(true)
      const response = await playlistAPI.getPlaylistById(id)
      const playlistData = response?.data?.data
      
      if (playlistData) {
        setPlaylist(playlistData)
      }
    } catch (error) {
      console.error("Error fetching playlist details:", error)
      toast.error("Failed to load playlist")
    } finally {
      setLoading(false)
    }
  }

  const checkPlaylistSaveStatus = async () => {
    if (!user || !id) return
    
    try {
      setCheckingSaveStatus(true)
      const response = await playlistAPI.getSavedPlaylists()
      const savedPlaylists = response?.data?.data || response?.data || []
      
      // Check if current playlist is in the saved playlists
      const isPlaylistSaved = savedPlaylists.some(savedPlaylist => {
        // Handle different possible response structures
        const playlistId = savedPlaylist._id || savedPlaylist.playlist?._id || savedPlaylist.id
        return playlistId === id
      })
      
      setIsSaved(isPlaylistSaved)
    } catch (error) {
      console.error("Error checking playlist save status:", error)
      // Don't show error to user, just assume not saved
      setIsSaved(false)
    } finally {
      setCheckingSaveStatus(false)
    }
  }

  const handleSavePlaylist = async () => {
    if (!user) {
      toast.error("Please login to save playlists")
      return
    }

    if (!playlist) return

    setSaving(true)

    if (isSaved) {
      // If already saved, unsave it
      await playlistAPI.unsavePlaylist(playlist._id)
      setIsSaved(false)
      toast.success(`Removed "${playlist.name}" from your library!`)
    } else {
      // If not saved, save it
      await playlistAPI.savePlaylist(playlist._id, {
        name: `Saved - ${playlist.name}`,
        description: `Saved from ${playlist.owner?.fullName || playlist.owner?.username || 'Unknown'}'s collection`
      })
      setIsSaved(true)
      toast.success(`Saved "${playlist.name}" to your library!`)
    }

    setSaving(false)
  }

  const handlePlayAll = () => {
    if (playlist?.videos && playlist.videos.length > 0) {
      const firstVideo = playlist.videos[0]
      const playAllUrl = `/watch/${firstVideo._id}?playlist=${playlist._id}&index=0`
      window.location.href = playAllUrl
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: playlist.name,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
        .then(() => toast.success("Link copied!"))
        .catch(() => toast.error("Copy failed"))
    }
  }

  const handleRemoveVideo = async (videoId, videoTitle) => {
    if (!user || !playlist || !isOwner) {
      toast.error("You don't have permission to remove videos")
      return
    }

    const confirmed = window.confirm(`Are you sure you want to remove "${videoTitle}" from this playlist?`)
    if (!confirmed) return

    setRemovingVideo(videoId)
    try {
      await playlistAPI.removeVideoFromPlaylist(videoId, playlist._id)
      
      // Update the playlist state to remove the video
      setPlaylist(prev => ({
        ...prev,
        videos: prev.videos.filter(video => video._id !== videoId),
        totalVideos: (prev.totalVideos || prev.videos?.length || 0) - 1
      }))
      
      toast.success(`Removed "${videoTitle}" from playlist`)
    } catch (error) {
      console.error("Error removing video from playlist:", error)
      toast.error(error.response?.data?.message || "Failed to remove video")
    } finally {
      setRemovingVideo(null)
    }
  }

  const isOwner = user && playlist && playlist.owner?._id === user._id
  const canSave = user && playlist && playlist.isPublic !== false && !isOwner

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-gray-300">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent mr-3" />
        <span>Loading playlist...</span>
      </div>
    )
  }

  if (!playlist) {
    return (
      <div className="flex flex-col items-center justify-center text-center min-h-[70vh] text-red-500 px-4">
        <div className="text-6xl mb-4">🎵</div>
        <h2 className="text-2xl font-bold mb-2">Playlist Not Found</h2>
        <p className="text-gray-400 mb-4">The playlist you're looking for doesn't exist or is private.</p>
        <Link to="/playlists" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Back to Playlists
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{playlist.name}</h1>
          <p className="text-gray-400">
            {playlist.totalVideos || playlist.videos?.length || 0} video{(playlist.totalVideos || playlist.videos?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {playlist.videos && playlist.videos.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Play size={20} />
              Play All
            </button>
          )}
          
          {canSave && (
            <button
              onClick={handleSavePlaylist}
              disabled={saving || checkingSaveStatus}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                saving || checkingSaveStatus
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : isSaved
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              <Bookmark size={20} className={isSaved ? "fill-current" : ""} />
              {saving
                ? "Saving..."
                : checkingSaveStatus
                  ? "Checking..."
                  : isSaved
                    ? "Remove from Library"
                    : "Save Playlist"
              }
            </button>
          )}
          
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Share2 size={20} />
            Share
          </button>
        </div>
      </div>

      {/* Playlist Info Card */}
      <div className="bg-[#1f1f1f] rounded-lg p-6 mb-6 border border-[#333]">
        <div className="flex items-start gap-6">
          {/* Playlist Thumbnail */}
          <div className="w-48 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 relative">
            <Play size={48} className="text-white opacity-80" />
            <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
              {playlist.totalVideos || playlist.videos?.length || 0} videos
            </div>
            <div className="absolute top-2 left-2">
              {playlist.isPublic !== false ? (
                <Globe size={16} className="text-white opacity-80" />
              ) : (
                <Lock size={16} className="text-white opacity-80" />
              )}
            </div>
          </div>

          {/* Playlist Details */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{playlist.name}</h2>
            
            {playlist.description && (
              <p className="text-gray-300 mb-4">{playlist.description}</p>
            )}

            {/* Owner Info */}
            {playlist.owner && (
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  {playlist.owner.avatar?.url ? (
                    <img
                      src={playlist.owner.avatar.url}
                      alt={playlist.owner.fullName || playlist.owner.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                      <User size={16} />
                    </div>
                  )}
                  <Link
                    to={`/profile/${playlist.owner.username}`}
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    {playlist.owner.fullName || playlist.owner.username}
                  </Link>
                </div>
              </div>
            )}

            {/* Playlist Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Play size={14} />
                <span>{playlist.totalViews || 0} total views</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>
                  {playlist.updatedAt && !isNaN(new Date(playlist.updatedAt).getTime())
                    ? `Updated ${formatDistanceToNow(new Date(playlist.updatedAt))} ago`
                    : "Unknown time"
                  }
                </span>
              </div>
              <div className="flex items-center gap-1">
                {playlist.isPublic !== false ? (
                  <>
                    <Globe size={14} />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <Lock size={14} />
                    <span>Private</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Videos */}
      {playlist.videos && playlist.videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlist.videos.map((video, index) => (
            <div key={video._id} className="relative group">
              <VideoCard
                video={video}
                showPlaylistIndex={index + 1}
              />
              {/* Remove button for playlist owners */}
              {isOwner && (
                <button
                  onClick={() => handleRemoveVideo(video._id, video.title)}
                  disabled={removingVideo === video._id}
                  className={`absolute top-2 right-2 p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                    removingVideo === video._id
                      ? 'bg-gray-600 cursor-not-allowed'
                      : 'bg-red-600 hover:bg-red-700'
                  } text-white shadow-lg`}
                  title="Remove from playlist"
                >
                  {removingVideo === video._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No videos in this playlist</h3>
          <p className="text-gray-400">Videos in this playlist will appear here</p>
        </div>
      )}
    </div>
  )
}

export default PlaylistDetail