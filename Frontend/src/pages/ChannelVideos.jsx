"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import VideoCard from "../components/VideoCard/VideoCard"
import { authAPI, videoAPI, subscriptionAPI } from "../services/api"
import SubscriptionDropdown from "../components/SubscriptionDropdown/SubscriptionDropdown"
import { useAuth } from "../contexts/AuthContext"
import {
  ArrowLeft, Users, VideoIcon, Calendar, Bell, BellOff
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import toast from "react-hot-toast"

const ChannelVideos = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [channel, setChannel] = useState(null)
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    if (username) {
      fetchChannelData()
      fetchChannelVideos()
    }
  }, [username])

  const fetchChannelData = async () => {
    try {
      const response = await authAPI.getUserProfile(username)
      const channelData = response.data.data
      setChannel(channelData)
      setIsSubscribed(channelData.isSubscribed || false)
    } catch (error) {
      console.error("Failed to fetch channel data:", error)
      toast.remove()
      toast.error("Failed to load channel")
    }
  }

  const fetchChannelVideos = async () => {
    try {
      const response = await videoAPI.getUserVideos(username)
      setVideos(response.data.data?.docs || [])
    } catch (error) {
      console.error("Failed to fetch channel videos:", error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async () => {
    if (!currentUser) {
      toast.remove()
      toast.error("Please login to subscribe")
      return
    }

    if (!channel) return

    try {
      setSubscribing(true)
      await subscriptionAPI.toggleSubscription(channel._id)
      setIsSubscribed(!isSubscribed)
      setChannel(prev => ({
        ...prev,
        subscribersCount: isSubscribed 
          ? (prev.subscribersCount || 1) - 1 
          : (prev.subscribersCount || 0) + 1
      }))
      toast.remove();
      toast.success(isSubscribed ? "Unsubscribed" : "Subscribed")
    } catch (error) {
      console.error("Subscription error:", error)
      toast.remove()
      toast.error("Failed to update subscription")
    } finally {
      setSubscribing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f] text-white">
        <p className="text-gray-400 text-lg">Loading channel...</p>
      </div>
    )
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f] text-white">
        <div className="text-center">
          <p className="text-red-500 text-lg mb-4">Channel not found</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Header */}
      <div className="bg-[#1c1c1c] border-b border-gray-800">
        <div className="px-6 md:px-10 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Channel Avatar */}
            <img
              src={channel.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${channel.fullName}`}
              alt={channel.fullName}
              className="w-24 h-24 rounded-full"
            />

            {/* Channel Info */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">{channel.fullName}</h1>
              <p className="text-gray-400 mb-2">@{channel.username}</p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <Users size={16} />
                  {channel.subscribersCount || 0} subscribers
                </span>
                <span className="flex items-center gap-1">
                  <VideoIcon size={16} />
                  {videos.length} videos
                </span>
                {channel.createdAt && (
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Joined {formatDistanceToNow(new Date(channel.createdAt))} ago
                  </span>
                )}
              </div>
            </div>

            {/* Subscribe Button */}
            {currentUser && currentUser.username !== username && (
              <SubscriptionDropdown
                channelId={channel?._id}
                isSubscribed={isSubscribed}
                onSubscriptionChange={(newStatus) => {
                  setIsSubscribed(newStatus);
                  setChannel(prev => ({
                    ...prev,
                    subscribersCount: newStatus
                      ? (prev.subscribersCount || 0) + 1
                      : (prev.subscribersCount || 1) - 1
                  }));
                }}
                size="default"
              />
            )}
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="px-6 md:px-10 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            Videos ({videos.length})
          </h2>
        </div>

        {videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map(video => (
              <VideoCard key={video._id} video={video} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <VideoIcon size={48} className="mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 text-lg">No videos available</p>
            <p className="text-gray-500 text-sm mt-2">
              This channel hasn't uploaded any videos yet.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChannelVideos