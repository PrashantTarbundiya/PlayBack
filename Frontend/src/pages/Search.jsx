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
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const query = searchParams.get("q")

  useEffect(() => {
    if (query) {
      setVideos([])
      setPage(1)
      setHasMore(true)
      searchVideos(1, true)
    }
  }, [query])

  const searchVideos = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true)
      const res = await videoAPI.searchVideos(query, pageNum, 50)
      
      // Handle paginated response structure
      const data = res.data?.data
      let newVideos = []
      let hasNextPage = false
      
      if (Array.isArray(data)) {
        newVideos = data
      } else if (data?.docs && Array.isArray(data.docs)) {
        newVideos = data.docs
        hasNextPage = data.hasNextPage || false
      } else if (res.data && Array.isArray(res.data)) {
        newVideos = res.data
      }
      
      if (reset) {
        setVideos(newVideos)
      } else {
        setVideos(prev => [...prev, ...newVideos])
      }
      
      setHasMore(hasNextPage && newVideos.length >= 50)
    } catch (err) {
      console.error('Search error:', err)
      if (reset) {
        setVideos([])
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      searchVideos(nextPage, false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-1">Search results for "{query}"</h2>
          <p className="text-sm text-gray-400">{videos.length} results found</p>
        </div>

        {loading && page === 1 ? (
          <VideoGridSkeleton count={12} />
        ) : videos.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
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
