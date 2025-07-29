import { useState, useEffect } from "react"
import { TrendingUp, Flame } from "lucide-react"
import VideoCard from "../components/VideoCard/VideoCard"
import { videoAPI } from "../services/api"
import { VideoGridSkeleton } from "../components/Skeleton/Skeleton"

const Trending = () => {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchTrendingVideos()
  }, [])

  const fetchTrendingVideos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch videos and sort by views to simulate trending
      const response = await videoAPI.getAllVideosWithOwnerDetails(1, 50)
      const videosData = response?.data?.data || response?.data || []
      
      // Show all videos (both published and unpublished) for better trending experience
      const allVideos = videosData.filter(video => video && video._id)
      
      // Enhanced trending algorithm: combine views, recency, and engagement
      const sortedVideos = allVideos.sort((a, b) => {
        const aViews = a.views || 0
        const bViews = b.views || 0
        const aDate = new Date(a.createdAt || 0)
        const bDate = new Date(b.createdAt || 0)
        const aLikes = a.likesCount || 0
        const bLikes = b.likesCount || 0
        
        // Calculate trending score (views + likes + recency bonus)
        const daysSinceA = (Date.now() - aDate.getTime()) / (1000 * 60 * 60 * 24)
        const daysSinceB = (Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24)
        
        // Recency bonus (newer videos get boost)
        const aRecencyBonus = Math.max(0, 7 - daysSinceA) * 2
        const bRecencyBonus = Math.max(0, 7 - daysSinceB) * 2
        
        const aScore = aViews + (aLikes * 2) + aRecencyBonus
        const bScore = bViews + (bLikes * 2) + bRecencyBonus
        
        return bScore - aScore
      })
      
      setVideos(sortedVideos.slice(0, 20)) // Limit to top 20
    } catch (error) {
      console.error("Error fetching trending videos:", error)
      setError("Failed to load trending videos")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-red-600 rounded-full">
            <TrendingUp size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Trending</h1>
            <p className="text-gray-400">Popular videos right now</p>
          </div>
        </div>
        <VideoGridSkeleton count={20} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">📈</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Unable to load trending videos</h2>
        <p className="text-gray-400 mb-6">{error}</p>
        <button
          onClick={fetchTrendingVideos}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-red-600 rounded-full">
          <TrendingUp size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Trending</h1>
          <p className="text-gray-400">Popular videos right now</p>
        </div>
      </div>

      {videos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video, index) => (
            <div key={video._id} className="relative">
              {index < 7 && (
                <div className={`absolute top-2 left-2 z-10 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-amber-600' :
                  'bg-red-600'
                }`}>
                  <Flame size={12} />
                  #{index + 1}
                </div>
              )}
              <VideoCard video={video} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📈</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No trending videos</h3>
          <p className="text-gray-400">Check back later for trending content</p>
        </div>
      )}
    </div>
  )
}

export default Trending