import { useState, useEffect } from "react"
import { Clock, Trash2, Search } from "lucide-react"
import VideoCard from "../components/VideoCard/VideoCard"
import { VideoGridSkeleton } from "../components/Skeleton/Skeleton"
import { playlistAPI, videoAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { Link } from "react-router-dom"
import { toast } from "react-hot-toast"

const WatchLater = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [watchLaterPlaylist, setWatchLaterPlaylist] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchWatchLaterVideos()
    }
  }, [user])

  const fetchWatchLaterVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get user's playlists including system playlists like "Watch Later"
      const userPlaylistsResponse = await playlistAPI.getUserPlaylists(user._id)
      const allPlaylists = userPlaylistsResponse.data?.data || []
      const watchLater = allPlaylists.find(p => p.name === 'Watch Later')
      
      if (watchLater) {
        setWatchLaterPlaylist(watchLater)
        // Get playlist details with videos
        const playlistDetails = await playlistAPI.getPlaylistById(watchLater._id)
        const playlistData = playlistDetails?.data?.data
        const videosData = playlistData?.videos || []
        setVideos(Array.isArray(videosData) ? videosData : [])
      } else {
        // If no Watch Later playlist exists, create one
        try {
          const newPlaylist = await playlistAPI.createPlaylist({
            name: 'Watch Later',
            description: 'Videos to watch later',
            isPublic: false,
            visibility: 'private'
          })
          setWatchLaterPlaylist(newPlaylist.data?.data)
          setVideos([])
        } catch (createError) {
          setVideos([])
        }
      }
    } catch (error) {
      setError("Failed to load watch later videos")
    } finally {
      setLoading(false)
    }
  }

  const removeFromWatchLater = async (videoId) => {
    if (!watchLaterPlaylist) return

    try {
      await playlistAPI.removeVideoFromPlaylist(videoId, watchLaterPlaylist._id)
      setVideos(prev => prev.filter(video => video._id !== videoId))
      toast.remove()
      toast.success("Removed from Watch Later")
    } catch (error) {
      toast.remove()
      toast.error("Failed to remove from Watch Later")
    }
  }

  const clearWatchLater = async () => {
    if (!watchLaterPlaylist || videos.length === 0) return
    
    if (!confirm("Are you sure you want to clear your entire Watch Later list?")) {
      return
    }

    try {
      // Remove all videos from the playlist
      for (const video of videos) {
        await playlistAPI.removeVideoFromPlaylist(video._id, watchLaterPlaylist._id)
      }
      setVideos([])
      toast.remove()
      toast.success("Watch Later cleared")
    } catch (error) {
      toast.remove()
      toast.error("Failed to clear Watch Later")
    }
  }

  const filteredVideos = Array.isArray(videos) ? videos.filter(video =>
    video.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">⏰</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Sign in to see your Watch Later</h2>
        <p className="text-gray-400 mb-6">Save videos to watch when you have time</p>
        <Link
          to="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-600 rounded-full">
            <Clock size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Watch Later</h1>
            <p className="text-gray-400">Loading your saved videos...</p>
          </div>
        </div>
        <VideoGridSkeleton count={8} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-600 rounded-full">
            <Clock size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Watch Later</h1>
            <p className="text-gray-400">
              {videos.length} video{videos.length !== 1 ? 's' : ''} saved for later
            </p>
          </div>
        </div>
        
        {videos.length > 0 && (
          <button
            onClick={clearWatchLater}
            className="flex items-center gap-2 px-4 py-2 text-red-400 border border-red-400 rounded-lg hover:bg-red-400 hover:text-white transition-colors"
          >
            <Trash2 size={16} />
            Clear All
          </button>
        )}
      </div>

      {videos.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search saved videos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1f1f1f] border border-[#333] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      {error ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2 text-white">Unable to load Watch Later</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchWatchLaterVideos}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <div key={video._id} className="relative group">
              <VideoCard video={video} />
              <button
                onClick={() => removeFromWatchLater(video._id)}
                className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                title="Remove from Watch Later"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : videos.length > 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No videos found</h3>
          <p className="text-gray-400">Try searching with different keywords</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⏰</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No videos in Watch Later</h3>
          <p className="text-gray-400 mb-6">Save videos to watch when you have time</p>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Videos
          </Link>
        </div>
      )}
    </div>
  )
}

export default WatchLater