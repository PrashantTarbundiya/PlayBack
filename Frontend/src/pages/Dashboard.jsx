"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import VideoCard from "../components/VideoCard/VideoCard"
import { dashboardAPI, videoAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import {
  BarChart3, Clock, Eye, Heart, MessageSquare,
  TrendingUp, Users, VideoIcon, PlayCircle, Upload, RefreshCw
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import toast from "react-hot-toast"
import { useNavigate } from "react-router-dom"
import LoadingScreen from "../components/Skeleton/LoadingScreen"

const Dashboard = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  
  const [videos, setVideos] = useState([])
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalSubscribers: 0,
    totalVideos: 0
  })
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const isComponentMounted = useRef(true)

  // Initial data fetch
  useEffect(() => {
    if (!currentUser) return

    fetchDashboardData()

    return () => {
      isComponentMounted.current = false
    }
  }, [currentUser])

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true)
      
      const [videoRes, analyticsRes] = await Promise.all([
        dashboardAPI.getChannelVideos(),
        dashboardAPI.getDashboardStats()
      ])

      // Ensure videos is always an array
      const videosData = videoRes?.data?.data || videoRes?.data || []
      setVideos(Array.isArray(videosData) ? videosData : [])
      
      // Ensure analytics is always an object
      const analyticsData = analyticsRes?.data?.data || analyticsRes?.data || {}
      setAnalytics(analyticsData)
      
    } catch (error) {
      console.error("Dashboard fetch error:", error)
      if (showLoading) {
        toast.remove()
        toast.error("Failed to load dashboard")
      }
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    fetchDashboardData(false)
    setLastUpdate(new Date())
    toast.remove()
    toast.success("Dashboard refreshed")
  }, [])

  const handleVideoDelete = async (videoId) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await videoAPI.deleteVideo(videoId)
        // Optimistically update UI
        setVideos(prev => Array.isArray(prev) ? prev.filter(v => v._id !== videoId) : [])
        toast.remove()
        toast.success("Video deleted")
        // Update last update time
        setLastUpdate(new Date())
      } catch {
        toast.remove()
        toast.error("Could not delete video")
        // Refresh data to revert optimistic update
        fetchDashboardData(false)
      }
    }
  }

  const handleTogglePublish = async (videoId) => {
    try {
      await videoAPI.toggleVideoPublish(videoId)
      // Optimistically update UI
      setVideos(prev => Array.isArray(prev) ? prev.map(v =>
        v._id === videoId
          ? { ...v, isPublished: !v.isPublished }
          : v
      ) : [])
      toast.remove()
      toast.success("Video status updated")
      // Update last update time
      setLastUpdate(new Date())
    } catch {
      toast.remove()
      toast.error("Could not update video status")
      // Refresh data to revert optimistic update
      fetchDashboardData(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 md:p-10 bg-[#0f0f0f] min-h-screen text-white">
        {/* Header Skeleton */}
        <div className="mb-8 bg-[#1c1c1c] p-6 rounded-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="h-8 bg-gray-700 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-48 animate-pulse"></div>
              <div className="h-3 bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-9 bg-gray-700 rounded w-20 animate-pulse"></div>
              <div className="h-9 bg-gray-700 rounded w-24 animate-pulse"></div>
              <div className="h-9 bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="bg-[#1c1c1c] rounded-xl overflow-hidden">
          {/* Tabs Skeleton */}
          <div className="flex border-b border-gray-800 bg-[#181818] p-4">
            <div className="h-6 bg-gray-700 rounded w-24 animate-pulse mr-6"></div>
            <div className="h-6 bg-gray-700 rounded w-24 animate-pulse"></div>
          </div>

          {/* Content Skeleton */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-pulse">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="bg-[#1e1e1e] rounded-lg p-6">
                  <div className="bg-[#2a2a2a] rounded h-4 w-1/2 mb-4"></div>
                  <div className="bg-[#2a2a2a] rounded h-8 w-3/4"></div>
                </div>
              ))}
            </div>
            
            {/* Recent Videos Skeleton */}
            <div className="mt-10">
              <div className="h-6 bg-gray-700 rounded w-32 animate-pulse mb-4"></div>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center bg-[#181818] p-4 rounded-lg">
                    <div className="w-20 h-12 bg-gray-700 rounded animate-pulse"></div>
                    <div className="flex-1 ml-4 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 bg-gray-700 rounded w-20 animate-pulse"></div>
                      <div className="h-8 bg-gray-700 rounded w-16 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f] text-white">
        <p className="text-red-500 text-lg">Please login to view dashboard</p>
      </div>
    )
  }

  const StatCard = ({ icon: Icon, title, value, color = "blue" }) => {
    const colors = {
      blue: "border-l-blue-500 bg-blue-950/50",
      red: "border-l-red-500 bg-red-950/50",
      green: "border-l-green-500 bg-green-950/50",
      purple: "border-l-purple-500 bg-purple-950/50"
    }

    return (
      <div className={`flex items-center gap-4 p-6 border-l-4 rounded-lg ${colors[color]}`}>
        <div className="bg-black/20 p-2 rounded-lg">
          <Icon size={24} className="text-gray-100" />
        </div>
        <div>
          <h4 className="text-sm text-gray-400">{title}</h4>
          <p className="text-2xl font-bold text-white">{value || 0}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 bg-[#0f0f0f] min-h-screen text-white">
      {/* Header */}
      <div className="mb-8 bg-[#1c1c1c] p-6 rounded-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Channel Dashboard</h1>
            <p className="text-gray-400 mt-1">Welcome back, {currentUser.fullName}</p>
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {formatDistanceToNow(lastUpdate)} ago
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Manual refresh button */}
            <button
              onClick={handleManualRefresh}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded-lg transition text-sm"
              title="Refresh now"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            
            {/* Upload button */}
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
            >
              <Upload size={20} />
              Upload Video
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#1c1c1c] rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-800 bg-[#181818] overflow-x-auto">
          {['overview', 'analytics'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 flex items-center gap-2 font-medium border-b-2 transition whitespace-nowrap ${
                activeTab === tab
                  ? 'text-blue-500 border-blue-500 bg-[#0f0f0f]'
                  : 'text-gray-400 border-transparent hover:bg-[#262626]'
              }`}
            >
              {{
                overview: <BarChart3 size={20} />,
                analytics: <TrendingUp size={20} />
              }[tab]}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 md:p-8">
          {activeTab === "overview" && (
            <div className="space-y-10">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  icon={Eye} 
                  title="Total Views" 
                  value={analytics.totalViews} 
                  color="blue" 
                />
                <StatCard 
                  icon={Heart} 
                  title="Total Likes" 
                  value={analytics.totalLikes} 
                  color="red" 
                />
                <StatCard 
                  icon={Users} 
                  title="Subscribers" 
                  value={analytics.totalSubscribers} 
                  color="green" 
                />
                <StatCard 
                  icon={VideoIcon} 
                  title="Total Videos" 
                  value={analytics.totalVideos} 
                  color="purple" 
                />
              </div>

              {/* Recent Videos */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Videos</h3>
                {videos.length === 0 ? (
                  <div className="text-center py-12 bg-[#181818] rounded-lg">
                    <VideoIcon size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-500 text-lg mb-4">You haven't uploaded any videos yet.</p>
                    <button
                      onClick={() => navigate('/upload')}
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
                    >
                      Upload Your First Video
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Array.isArray(videos) ? videos.slice(0, 5).map(video => (
                      <div key={video._id} className="flex items-center bg-[#181818] p-4 rounded-lg hover:bg-[#202020] transition">
                        <img
                          src={video?.thumbnail?.url || "/placeholder.svg"}
                          alt={video.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                        <div className="flex-1 ml-4">
                          <h4 className="font-medium text-white">{video.title}</h4>
                          <p className="text-sm text-gray-400">
                            {video?.likesCount || video?.likes || video?.totalLikes || 0} likes • {video?.views || video?.viewsCount || video?.totalViews || 0} views
                            {video?.createdAt && !isNaN(new Date(video.createdAt).getTime()) && (
                              <> • {formatDistanceToNow(new Date(video.createdAt)) + " ago"}</>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs px-2 py-1 rounded ${
                              video.isPublished 
                                ? 'bg-green-900 text-green-300' 
                                : 'bg-yellow-900 text-yellow-300'
                            }`}>
                              {video.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTogglePublish(video._id)}
                            className={`text-sm px-3 py-1 rounded transition ${
                              video.isPublished
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          >
                            {video.isPublished ? 'Unpublish' : 'Publish'}
                          </button>
                          <button
                            onClick={() => handleVideoDelete(video._id)}
                            className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )) : []}
                  </div>
                )}
              </div>
            </div>
          )}


          {activeTab === "analytics" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Channel Analytics</h3>
              
              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#181818] p-6 rounded-lg">
                  <h4 className="font-medium mb-4">Performance Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Views</span>
                      <span className="font-medium">{analytics.totalViews || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Likes</span>
                      <span className="font-medium">{analytics.totalLikes || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Subscribers</span>
                      <span className="font-medium">{analytics.totalSubscribers || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Videos Published</span>
                      <span className="font-medium">{Array.isArray(videos) ? videos.filter(v => v.isPublished).length : 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#181818] p-6 rounded-lg">
                  <h4 className="font-medium mb-4">Content Stats</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Videos</span>
                      <span className="font-medium">{Array.isArray(videos) ? videos.length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Published</span>
                      <span className="font-medium text-green-400">{Array.isArray(videos) ? videos.filter(v => v.isPublished).length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Drafts</span>
                      <span className="font-medium text-yellow-400">{Array.isArray(videos) ? videos.filter(v => !v.isPublished).length : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg. Likes per Video</span>
                      <span className="font-medium">
                        {Array.isArray(videos) && videos.length > 0 ? Math.round((analytics.totalLikes || 0) / videos.length) : 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#181818] p-6 rounded-lg">
                <p className="text-gray-400">More detailed analytics coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard