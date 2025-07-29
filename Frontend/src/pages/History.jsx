import { useState, useEffect } from "react"
import { History as HistoryIcon, Trash2, Search } from "lucide-react"
import VideoCard from "../components/VideoCard/VideoCard"
import { authAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { Link } from "react-router-dom"
import { VideoGridSkeleton } from "../components/Skeleton/Skeleton"

const History = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchHistory()
    }
  }, [user])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await authAPI.getWatchHistory(1, 50)
      const userData = response?.data?.data
      // Extract watchHistory from user data
      const watchHistoryArray = userData?.watchHistory || []
      // Ensure watchHistoryArray is always an array
      setHistory(Array.isArray(watchHistoryArray) ? watchHistoryArray : [])
    } catch (error) {
      setError("Failed to load watch history")
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = async () => {
    if (!confirm("Are you sure you want to clear your entire watch history?")) {
      return
    }

    try {
      setHistory([])
      // toast.success("Watch history cleared")
    } catch (error) {
      // toast.error("Failed to clear history")
    }
  }

  const filteredHistory = Array.isArray(history) ? history.filter(video => {
    return video.title?.toLowerCase().includes(searchTerm.toLowerCase())
  }) : []

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">📺</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Sign in to see your history</h2>
        <p className="text-gray-400 mb-6">Keep track of videos you've watched</p>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-full">
              <HistoryIcon size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Watch History</h1>
              <p className="text-gray-400">Videos you've watched recently</p>
            </div>
          </div>
        </div>
        <VideoGridSkeleton count={12} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-full">
            <HistoryIcon size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Watch History</h1>
            <p className="text-gray-400">Videos you've watched recently</p>
          </div>
        </div>
        
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 text-red-400 border border-red-400 rounded-lg hover:bg-red-400 hover:text-white transition-colors"
          >
            <Trash2 size={16} />
            Clear History
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
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
          <h3 className="text-xl font-semibold mb-2 text-white">Unable to load history</h3>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={fetchHistory}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredHistory.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHistory.map((video, index) => (
            <VideoCard key={`${video._id}-${index}`} video={video} />
          ))}
        </div>
      ) : history.length > 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No videos found</h3>
          <p className="text-gray-400">Try searching with different keywords</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📺</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No watch history</h3>
          <p className="text-gray-400 mb-6">Videos you watch will appear here</p>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Watching
          </Link>
        </div>
      )}
    </div>
  )
}

export default History