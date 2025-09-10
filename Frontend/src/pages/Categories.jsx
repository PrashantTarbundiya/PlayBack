import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { videoAPI } from '../services/api'
import VideoCard from '../components/VideoCard/VideoCard'
import { ChevronDown, Grid, List } from 'lucide-react'

const Categories = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All')
  const [showDropdown, setShowDropdown] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (selectedCategory !== 'All') {
      setSearchParams({ category: selectedCategory })
    } else {
      setSearchParams({})
    }
    setPage(1)
    setVideos([])
    setHasMore(true)
    fetchVideos(1, true)
  }, [selectedCategory])

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const response = await videoAPI.getVideoCategories()
      const categoriesData = response.data?.data || []
      setCategories([{ name: 'All', count: categoriesData.reduce((sum, cat) => sum + cat.count, 0) }, ...categoriesData])
    } catch (error) {
      // console.error('Failed to fetch categories:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchVideos = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true)
      let response
      
      if (selectedCategory === 'All') {
        response = await videoAPI.getAllVideosWithOwnerDetails(pageNum, 50)
      } else {
        response = await videoAPI.getVideosByCategory(selectedCategory, pageNum, 50)
      }
      
      // Handle different response structures
      const data = response.data?.data
      let newVideos = []
      let hasNextPage = false
      
      if (Array.isArray(data)) {
        // Direct array response
        newVideos = data
      } else if (data?.docs && Array.isArray(data.docs)) {
        // Paginated response
        newVideos = data.docs
        hasNextPage = data.hasNextPage || false
      } else if (response.data && Array.isArray(response.data)) {
        // Response data is directly an array
        newVideos = response.data
      }
      
      if (reset) {
        setVideos(newVideos)
      } else {
        setVideos(prev => [...prev, ...newVideos])
      }
      
      // Check if there are more videos
      setHasMore(hasNextPage && newVideos.length >= 50)
      
    } catch (error) {
      console.error('Failed to fetch videos:', error)
      if (reset) {
        setVideos([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setShowDropdown(false)
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchVideos(nextPage, false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Browse by Category</h1>
          
          {/* Category Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1e1e1e] border border-[#333] rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              <span>{selectedCategory}</span>
              <ChevronDown size={16} className={`transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#1e1e1e] border border-[#333] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {categoriesLoading ? (
                  <div className="p-4 text-center text-gray-400">Loading categories...</div>
                ) : (
                  categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => handleCategoryChange(category.name)}
                      className={`w-full text-left px-4 py-2 hover:bg-[#2a2a2a] transition-colors flex justify-between items-center ${
                        selectedCategory === category.name ? 'bg-[#2a2a2a] text-blue-400' : ''
                      }`}
                    >
                      <span>{category.name}</span>
                      <span className="text-xs text-gray-500">{category.count}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {!categoriesLoading && categories.slice(0, 10).map((category) => (
            <button
              key={category.name}
              onClick={() => handleCategoryChange(category.name)}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                selectedCategory === category.name
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#1e1e1e] text-gray-300 hover:bg-[#2a2a2a]'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Videos Grid */}
        {loading && page === 1 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-400 border-t-transparent mr-3" />
            <span className="text-gray-400">Loading videos...</span>
          </div>
        ) : videos.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 w-full">
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
          <div className="text-center py-12 flex flex-col items-center gap-4">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-2xl font-semibold mb-2 text-white">
              No videos found{selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
            </h3>
            <p className="text-gray-400 text-base leading-6">
              {selectedCategory !== 'All' 
                ? `Try browsing other categories or check back later` 
                : 'Check back later for new content'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Categories