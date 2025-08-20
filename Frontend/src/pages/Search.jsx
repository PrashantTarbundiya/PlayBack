"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import VideoCard from "../components/VideoCard/VideoCard"
import { videoAPI } from "../services/api"
import { VideoGridSkeleton } from "../components/Skeleton/Skeleton"

const Search = () => {
  const [searchParams] = useSearchParams()
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const query = searchParams.get("q")

  useEffect(() => {
    if (query) searchVideos()
  }, [query])

  const searchVideos = async () => {
    try {
      setLoading(true)
      const res = await videoAPI.searchVideos(query)
      
      // Handle paginated response structure
      const videosData = res.data?.data?.docs || res.data?.data || res.data || []
      setVideos(videosData)
    } catch (err) {
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-1">Search results for "{query}"</h2>
          <p className="text-sm text-gray-400">{videos.length} results found</p>
        </div>

        {loading ? (
          <VideoGridSkeleton count={12} />
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <h3 className="text-lg font-semibold mb-2">No results found</h3>
            <p className="text-gray-400">Try different keywords or check your spelling</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Search
