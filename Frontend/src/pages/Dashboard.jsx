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
import EditVideoModal from "../components/EditVideoModal/EditVideoModal"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Line, LineChart
} from 'recharts'
import SEO from "../components/SEO/SEO"

const Dashboard = () => {
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [period, setPeriod] = useState('30d')

  const PERIODS = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ]

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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedVideoToEdit, setSelectedVideoToEdit] = useState(null)

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

  const handleEditVideo = (video) => {
    setSelectedVideoToEdit(video)
    setIsEditModalOpen(true)
  }

  const handleVideoUpdate = (updatedVideo) => {
    setVideos(prev => Array.isArray(prev) ? prev.map(v => v._id === updatedVideo._id ? updatedVideo : v) : [])
    // Also trigger a dashboard refresh to update analytics if needed
    fetchDashboardData(false)
  }

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

            {/* Charts Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
              <div className="bg-[#1e1e1e] p-6 rounded-lg h-80 animate-pulse"></div>
              <div className="bg-[#1e1e1e] p-6 rounded-lg h-80 animate-pulse"></div>
              <div className="bg-[#1e1e1e] p-6 rounded-lg h-80 animate-pulse"></div>
              <div className="bg-[#1e1e1e] p-6 rounded-lg h-80 animate-pulse"></div>
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

  // Prepare data for Analytics Charts

  const getCumulativePerformanceData = () => {
    if (!videos || !videos.length) return [];
    // Calculate cumulative views and likes over the latest 10 videos (oldest to newest)
    let cumulativeViews = 0;
    let cumulativeLikes = 0;
    const sortedVideos = [...videos].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const recentVideos = sortedVideos.slice(-10);

    return recentVideos.map(v => {
      cumulativeViews += Number(v.views || v.viewsCount || v.totalViews || 0);
      cumulativeLikes += Number(v.likesCount || v.likes || v.totalLikes || 0);
      return {
        name: v.title.length > 10 ? v.title.substring(0, 10) + '...' : v.title,
        cumViews: cumulativeViews,
        cumLikes: cumulativeLikes
      };
    });
  }

  const getCorrelationData = () => {
    if (!videos || !videos.length) return [];
    // Map duration against views and likes
    return [...videos].slice(0, 10).map(v => ({
      name: v.title.length > 10 ? v.title.substring(0, 10) + '...' : v.title,
      duration: Number(v.duration || 0),
      views: Number(v.views || v.viewsCount || v.totalViews || 0),
      likes: Number(v.likesCount || v.likes || v.totalLikes || 0)
    })).reverse();
  }



  const getTimelineData = () => {
    let days = 30;
    if (period === '7d') days = 7;
    else if (period === '30d') days = 30;
    else if (period === '90d') days = 90;
    else if (period === '1y') days = 365;

    // Create an empty array for the last X days
    const timelineMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayStr = d.toLocaleDateString('default', { month: 'short', day: 'numeric' });
      timelineMap[dateStr] = { name: displayStr, views: 0, likes: 0 };
    }

    if (!videos || !videos.length) return Object.values(timelineMap);

    // Populate timeline map
    videos.forEach(v => {
      if (!v.createdAt) return;
      const date = new Date(v.createdAt);
      if (isNaN(date.getTime())) return;

      const dateStr = date.toISOString().split('T')[0];

      if (timelineMap[dateStr]) {
        timelineMap[dateStr].views += Number(v.views || v.viewsCount || v.totalViews || 0);
        timelineMap[dateStr].likes += Number(v.likesCount || v.likes || v.totalLikes || 0);
      }
    });

    return Object.values(timelineMap);
  }

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

  return (
    <>
      <SEO
        title="Dashboard"
        description="Manage your PlayBack channel - view analytics, upload videos, and track performance."
        url="/dashboard"
      />
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
                className={`px-6 py-4 flex items-center gap-2 font-medium border-b-2 transition whitespace-nowrap ${activeTab === tab
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
                              <span className={`text-xs px-2 py-1 rounded ${video.isPublished
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
                              className={`text-sm px-3 py-1 rounded transition ${video.isPublished
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                              {video.isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                              onClick={() => handleEditVideo(video)}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                            >
                              Edit
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

                {/* Hero Chart: Channel Growth Timeline */}
                {videos.length > 0 && (
                  <div className="bg-[#181818] p-6 rounded-lg w-full min-h-[400px] mt-6 border border-gray-800/50 shadow-xl shadow-blue-500/5 relative z-10">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h4 className="text-xl font-bold text-white">
                          Channel Growth Timeline
                        </h4>
                        <p className="text-sm text-gray-400">Total views and likes over {PERIODS.find(p => p.value === period)?.label.toLowerCase() || 'time'}</p>
                      </div>

                      <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-[#262626] border border-gray-700/50 rounded-lg px-3 py-2 text-sm font-medium hover:bg-[#333] cursor-pointer transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        {PERIODS.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>

                    <ResponsiveContainer width="100%" height={320}>
                      <AreaChart
                        data={getTimelineData()}
                        margin={{ top: 20, right: 20, left: -20, bottom: 10 }}
                      >
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#aaaaaa" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#aaaaaa" stopOpacity={0} />
                          </linearGradient>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis
                          dataKey="name"
                          stroke="#888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          stroke="#888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                        />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'rgba(28, 28, 28, 0.95)', borderColor: '#333', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
                          itemStyle={{ fontWeight: 'bold' }}
                          cursor={{ stroke: '#444', strokeWidth: 1, strokeDasharray: '5 5' }}
                        />
                        <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />

                        <Area
                          type="basis"
                          dataKey="views"
                          name="Views"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorViews)"
                          strokeWidth={4}
                          dot={{ r: 0 }}
                          activeDot={{ r: 8, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                          filter="url(#glow)"
                          animationDuration={1500}
                          animationEasing="ease-out"
                        />
                        <Area
                          type="basis"
                          dataKey="likes"
                          name="Likes"
                          stroke="#aaaaaa"
                          fillOpacity={1}
                          fill="url(#colorLikes)"
                          strokeWidth={3}
                          dot={{ r: 0 }}
                          activeDot={{ r: 6, fill: '#aaaaaa', stroke: '#fff', strokeWidth: 2 }}
                          animationDuration={1500}
                          animationEasing="ease-out"
                          strokeDasharray="5 5"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}


                {/* Advanced Graphs Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">

                  {/* Performance Velocity Area Chart */}
                  <div className="bg-[#181818] p-6 rounded-lg w-full min-h-[350px]">
                    <h4 className="font-medium mb-1">Performance Velocity</h4>
                    <p className="text-xs text-gray-400 mb-6">Cumulative views & likes over last 10 uploads</p>
                    {videos.length > 1 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart
                          data={getCumulativePerformanceData()}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: '#262626', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="plainline" wrapperStyle={{ paddingBottom: '20px' }} />
                          <Area
                            type="monotone"
                            dataKey="cumViews"
                            name="Cumulative Views"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorViews)"
                            dot={{ r: 0 }}
                            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={1500}
                          />
                          <Area
                            type="monotone"
                            dataKey="cumLikes"
                            name="Cumulative Likes"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorLikes)"
                            dot={{ r: 0 }}
                            activeDot={{ r: 4, fill: '#8b5cf6', stroke: '#fff', strokeWidth: 2 }}
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[280px] text-gray-500">
                        Need at least 2 videos to show velocity
                      </div>
                    )}
                  </div>

                  {/* Engagement Correlation Composed Chart */}
                  <div className="bg-[#181818] p-6 rounded-lg w-full min-h-[350px]">
                    <h4 className="font-medium mb-1">Duration vs Engagement Metric</h4>
                    <p className="text-xs text-gray-400 mb-6">Does video length affect performance?</p>
                    {videos.length > 0 ? (
                      <ResponsiveContainer width="100%" height={280}>
                        <ComposedChart
                          data={getCorrelationData()}
                          margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="name" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="#888" fontSize={11} tickLine={false} axisLine={false} />
                          <RechartsTooltip
                            contentStyle={{ backgroundColor: '#262626', borderColor: '#333', color: '#fff', borderRadius: '8px' }}
                          />
                          <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                          <defs>
                            <linearGradient id="barViews" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                              <stop offset="100%" stopColor="#d97706" stopOpacity={0.4} />
                            </linearGradient>
                            <filter id="glow2" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>
                          <Bar yAxisId="left" dataKey="views" name="Views" barSize={20} fill="url(#barViews)" radius={[4, 4, 0, 0]} animationDuration={1500} />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="duration"
                            name="Duration (sec)"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 4, fill: '#0f0f0f', stroke: '#10b981', strokeWidth: 2 }}
                            activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                            filter="url(#glow2)"
                            animationDuration={1500}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[280px] text-gray-500">
                        Not enough data yet
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Video Modal */}
        {
          isEditModalOpen && (
            <EditVideoModal
              video={selectedVideoToEdit}
              onClose={() => {
                setIsEditModalOpen(false)
                setSelectedVideoToEdit(null)
              }}
              onUpdate={handleVideoUpdate}
            />
          )
        }
      </div >
    </>
  )
}

export default Dashboard