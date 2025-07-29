import { useState, useEffect } from "react"
import { ThumbsUp, Search, Heart } from "lucide-react"
import VideoCard from "../components/VideoCard/VideoCard"
import { VideoGridSkeleton } from "../components/Skeleton/Skeleton"
import { likeAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { Link } from "react-router-dom"

const LikedVideos = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchLikedVideos()
    }
  }, [user])

  const fetchLikedVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await likeAPI.getLikedVideos()
      const likedVideos = response?.data?.data || response?.data || []
      
      // Ensure likedVideos is an array before processing
      const videosArray = Array.isArray(likedVideos) ? likedVideos : []
      // Extract videos from the liked videos response
      const videos = videosArray.map(item => item.likedVideo || item.video || item).filter(Boolean)
      setVideos(Array.isArray(videos) ? videos : [])
    } catch (error) {
      console.error("Error fetching liked videos:", error)
      setError("Failed to load liked videos")
    } finally {
      setLoading(false)
    }
  }

  const filteredVideos = Array.isArray(videos) ? videos.filter(video =>
    video.title?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : []

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">❤️</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Sign in to see your liked videos</h2>
        <p className="text-gray-400 mb-6">Videos you've liked will appear here</p>
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
          <div className="p-3 bg-red-600 rounded-full">
            <ThumbsUp size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Liked Videos</h1>
            <p className="text-gray-400">Loading your liked videos...</p>
          </div>z
        </div>
        <VideoGridSkeleton count={8} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-600 rounded-full">
          <ThumbsUp size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Liked Videos</h1>
          <p className="text-gray-400">
            {videos.length} video{videos.length !== 1 ? 's' : ''} you've liked
          </p>
        </div>
      </div>

      {videos.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search liked videos..."
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
          <h3 className="text-xl font-semibold mb-2 text-white">Unable to load liked videos</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchLikedVideos}
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
              <div className="absolute top-2 left-2 p-2 bg-red-600 text-white rounded-full">
                <Heart size={14} fill="currentColor" />
              </div>
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
          <div className="text-6xl mb-4">❤️</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No liked videos yet</h3>
          <p className="text-gray-400 mb-6">Like videos to see them here</p>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Discover Videos
          </Link>
        </div>
      )}
    </div>
  )
}

export default LikedVideos