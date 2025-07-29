"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useParams, useNavigate } from "react-router-dom"
import VideoCard from "../components/VideoCard/VideoCard"
import { authAPI, videoAPI, subscriptionAPI, tweetAPI, likeAPI, playlistAPI } from "../services/api"
import SubscriptionDropdown from "../components/SubscriptionDropdown/SubscriptionDropdown"
import { useAuth } from "../contexts/AuthContext"
import {
  Settings, Users, VideoIcon, PlayCircle, Calendar,
  MapPin, Link as LinkIcon, Edit3, Camera, MessageCircle,
  MoreHorizontal, Edit2, Trash2, Heart, Play, Lock, Globe, List, Bookmark
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import toast from "react-hot-toast"

const Profile = () => {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [tweets, setTweets] = useState([])
  const [subscribedChannels, setSubscribedChannels] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [activeTab, setActiveTab] = useState("videos")
  const [loading, setLoading] = useState(true)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [subscribing, setSubscribing] = useState(false)
  const [editingTweet, setEditingTweet] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [showDropdown, setShowDropdown] = useState(null)
  const [showPlaylistDropdown, setShowPlaylistDropdown] = useState(null)
  const [savingPlaylists, setSavingPlaylists] = useState(new Set())
  const [savedPlaylists, setSavedPlaylists] = useState(new Set())
  const [unsavingPlaylists, setUnsavingPlaylists] = useState(new Set())
  const playlistDropdownRefs = useRef({})

  // Memoize if it's own profile to avoid recalculation
  const isOwnProfileMemo = useMemo(() => {
    return currentUser?.username === username
  }, [currentUser?.username, username])

  useEffect(() => {
    if (username) {
      setIsOwnProfile(isOwnProfileMemo)
      fetchUserProfile()
      fetchUserVideos()
      
      if (isOwnProfileMemo) {
        fetchSubscribedChannels()
      }
    }
  }, [username, currentUser, isOwnProfileMemo])

  // Separate useEffect for playlists that depends on user being loaded
  useEffect(() => {
    if (username && user) {
      fetchUserPlaylists()
      if (!isOwnProfile && currentUser) {
        checkSavedPlaylists()
      }
    }
  }, [username, user, isOwnProfile, currentUser])

  useEffect(() => {
    if (user?._id) {
      fetchUserTweets()
    }
  }, [user])

  // Close playlist dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showPlaylistDropdown) {
        const currentDropdownRef = playlistDropdownRefs.current[showPlaylistDropdown]
        if (currentDropdownRef && !currentDropdownRef.contains(event.target)) {
          setShowPlaylistDropdown(null)
        }
      }
    }

    if (showPlaylistDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    
    // Cleanup function to remove any stale event listeners
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPlaylistDropdown])

  // Cleanup refs when component unmounts or playlists change
  useEffect(() => {
    return () => {
      playlistDropdownRefs.current = {}
    }
  }, [playlists])

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await authAPI.getUserProfile(username)
      const userData = response.data.data
      setUser(userData)
    } catch (error) {
      console.error("Failed to fetch user profile:", error)
      toast.error("Failed to load profile")
    }
  }, [username])

  const fetchUserVideos = useCallback(async () => {
    try {
      const response = await videoAPI.getUserVideos(username)
      const videosData = response.data.data?.docs || []
      setVideos(videosData)
    } catch (error) {
      console.error("Failed to fetch user videos:", error)
      setVideos([])
    } finally {
      setLoading(false)
    }
  }, [username])

  const fetchUserTweets = useCallback(async () => {
    if (!user?._id) return
    
    try {
      const response = await tweetAPI.getUserTweets(user._id)
      const tweetsData = response.data?.data || []
      setTweets(tweetsData)
    } catch (error) {
      console.error("Failed to fetch user tweets:", error)
      setTweets([])
    }
  }, [user?._id])

  const fetchSubscribedChannels = useCallback(async () => {
    if (!currentUser?._id) return
    
    try {
      const response = await subscriptionAPI.getSubscribedChannels(currentUser._id)
      const subscriptionsData = response.data.data || []
      setSubscribedChannels(subscriptionsData)
    } catch (error) {
      console.error("Failed to fetch subscribed channels:", error)
      setSubscribedChannels([])
    }
  }, [currentUser?._id])

  const fetchUserPlaylists = useCallback(async () => {
    try {
      let playlistsData = []
      
      if (isOwnProfile) {
        // If viewing own profile, get both own playlists and saved playlists
        const [userPlaylists, savedPlaylists] = await Promise.all([
          videoAPI.getUserPlaylistsForSelection(),
          playlistAPI.getSavedPlaylists().catch(() => ({ data: { data: [] } }))
        ])
        
        // Filter out system playlists for own profile
        const filteredUserPlaylists = userPlaylists.filter(
          playlist => playlist.name !== "Watch Later" &&
                     playlist.name !== "Watch History"
        )
        
        // Mark saved playlists
        const markedSavedPlaylists = (savedPlaylists?.data?.data || []).map(playlist => ({
          ...playlist,
          isSaved: true
        }))
        
        // Combine both arrays
        playlistsData = [...filteredUserPlaylists, ...markedSavedPlaylists]
      } else if (user?._id) {
        // If viewing someone else's profile, get their public playlists only
        const response = await playlistAPI.getUserPlaylists(user._id)
        const allPlaylists = response.data?.data || []
        
        // Filter to show only public playlists (excluding system playlists)
        playlistsData = allPlaylists.filter(playlist => {
          // Exclude system playlists
          if (playlist.name === "Watch Later" || playlist.name === "Watch History") {
            return false
          }
          
          // Show playlist if it's explicitly public OR if privacy fields are missing (default to public)
          return playlist.isPublic !== false && playlist.visibility !== 'private'
        })
      }
      
      setPlaylists(playlistsData)
      
      // Check saved playlists after playlists are loaded
      if (!isOwnProfile && currentUser && playlistsData.length > 0) {
        // Small delay to ensure state is updated
        setTimeout(() => checkSavedPlaylists(playlistsData), 100)
      }
    } catch (error) {
      console.error("Failed to fetch user playlists:", error)
      setPlaylists([])
    }
  }, [isOwnProfile, user?._id, currentUser])

  const handleTogglePlaylistVisibility = async (playlistId, currentVisibility) => {
    try {
      // Find the playlist to get its current data
      const playlist = playlists.find(p => p._id === playlistId)
      if (!playlist) {
        toast.error("Playlist not found")
        return
      }

      // Toggle between public and private
      const newVisibility = currentVisibility === 'public' ? 'private' : 'public'
      
      // Update playlist visibility via API call with required fields
      await playlistAPI.updatePlaylist(playlistId, {
        name: playlist.name,
        description: playlist.description || "My playlist",
        visibility: newVisibility,
        isPublic: newVisibility === 'public'
      })
      
      // Update local state
      setPlaylists(prev => prev.map(p =>
        p._id === playlistId
          ? { ...p, visibility: newVisibility, isPublic: newVisibility === 'public' }
          : p
      ))
      
      toast.success(`Playlist is now ${newVisibility}`)
    } catch (error) {
      console.error("Failed to update playlist visibility:", error)
      toast.error("Failed to update playlist visibility")
    }
  }

  const handleDeletePlaylist = async (playlistId, playlistName) => {
    if (!window.confirm(`Are you sure you want to delete "${playlistName}"?`)) {
      return
    }

    try {
      await playlistAPI.deletePlaylist(playlistId)
      setPlaylists(prev => prev.filter(p => p._id !== playlistId))
      toast.success("Playlist deleted successfully")
    } catch (error) {
      console.error("Error deleting playlist:", error)
      toast.error("Failed to delete playlist")
    }
  }

  const handleSavePlaylist = async (playlistId, playlistName) => {
    if (!currentUser) {
      toast.error("Please login to save playlists")
      return
    }

    try {
      setSavingPlaylists(prev => new Set(prev).add(playlistId))
      
      // Use the new bookmark system instead of creating copies
      await playlistAPI.savePlaylist(playlistId)
      
      setSavedPlaylists(prev => new Set(prev).add(playlistId))
      toast.success(`Bookmarked "${playlistName}"! You can find it in your Playlists page.`)
    } catch (error) {
      console.error("Error saving playlist:", error)
      const errorMessage = error.response?.data?.message || "Failed to save playlist"
      toast.error(errorMessage)
    } finally {
      setSavingPlaylists(prev => {
        const newSet = new Set(prev)
        newSet.delete(playlistId)
        return newSet
      })
    }
  }

  const checkSavedPlaylists = useCallback(async (playlistsToCheck = null) => {
    if (!currentUser || isOwnProfile) return

    const playlistsData = playlistsToCheck || playlists
    if (playlistsData.length === 0) return

    try {
      // Get user's own playlists to check which ones are saved
      const response = await playlistAPI.getUserPlaylists(currentUser._id)
      const userPlaylists = response.data?.data || []
      
      // Find saved playlists that match the profile user's playlists
      const savedPlaylistIds = new Set()
      playlistsData.forEach(playlist => {
        const isSaved = userPlaylists.some(userPlaylist =>
          userPlaylist.savedBy && userPlaylist.savedBy.includes(currentUser._id) &&
          userPlaylist._id === playlist._id
        )
        if (isSaved) {
          savedPlaylistIds.add(playlist._id)
        }
      })
      
      setSavedPlaylists(savedPlaylistIds)
    } catch (error) {
      console.error('Error checking saved playlists:', error)
    }
  }, [currentUser, isOwnProfile, playlists])

  const handleUnsavePlaylist = async (playlistId, playlistName) => {
    if (!currentUser) {
      toast.error("Please login to unsave playlists")
      return
    }

    try {
      setUnsavingPlaylists(prev => new Set(prev).add(playlistId))
      
      await playlistAPI.unsavePlaylist(playlistId)
      
      setSavedPlaylists(prev => {
        const newSet = new Set(prev)
        newSet.delete(playlistId)
        return newSet
      })
      toast.success(`Removed "${playlistName}" from your bookmarks.`)
    } catch (error) {
      console.error("Error unsaving playlist:", error)
      const errorMessage = error.response?.data?.message || "Failed to unsave playlist"
      toast.error(errorMessage)
    } finally {
      setUnsavingPlaylists(prev => {
        const newSet = new Set(prev)
        newSet.delete(playlistId)
        return newSet
      })
    }
  }

  const handleChannelClick = useCallback((channelUsername) => {
    navigate(`/profile/${channelUsername}`)
  }, [navigate])

  const handleSubscribedChannelVideos = useCallback((channelUsername) => {
    navigate(`/channel/${channelUsername}/videos`)
  }, [navigate])

  const handleSubscribe = useCallback(async () => {
    if (!currentUser) {
      toast.error("Please login to subscribe")
      return
    }

    if (!user) return

    try {
      setSubscribing(true)
      await subscriptionAPI.toggleSubscription(user._id)
      setUser(prev => ({
        ...prev,
        isSubscribed: !prev.isSubscribed,
        subscribersCount: prev.isSubscribed
          ? (prev.subscribersCount || 1) - 1
          : (prev.subscribersCount || 0) + 1
      }))
      
      toast.success(user.isSubscribed ? "Unsubscribed" : "Subscribed")
    } catch (error) {
      console.error("Subscription error:", error)
      toast.error("Failed to update subscription")
    } finally {
      setSubscribing(false)
    }
  }, [currentUser, user, username])

  const handleUpdateTweet = async (tweetId) => {
    if (!editContent.trim()) {
      toast.error('Tweet content cannot be empty')
      return
    }

    try {
      await tweetAPI.updateTweet(tweetId, { content: editContent })
      setTweets(tweets.map(tweet =>
        tweet._id === tweetId
          ? { ...tweet, content: editContent }
          : tweet
      ))
      setEditingTweet(null)
      setEditContent('')
      setShowDropdown(null)
      toast.success('Tweet updated successfully!')
    } catch (error) {
      console.error('Error updating tweet:', error)
      toast.error('Failed to update tweet')
    }
  }

  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm('Are you sure you want to delete this tweet?')) {
      return
    }

    try {
      await tweetAPI.deleteTweet(tweetId)
      setTweets(tweets.filter(tweet => tweet._id !== tweetId))
      setShowDropdown(null)
      toast.success('Tweet deleted successfully!')
    } catch (error) {
      console.error('Error deleting tweet:', error)
      toast.error('Failed to delete tweet')
    }
  }


  const startEdit = (tweet) => {
    setEditingTweet(tweet._id)
    setEditContent(tweet.content)
    setShowDropdown(null)
  }

  const cancelEdit = () => {
    setEditingTweet(null)
    setEditContent('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="bg-[#1e1e1e] rounded-lg h-48 mb-6"></div>
            <div className="bg-[#1e1e1e] rounded h-8 w-1/3 mb-4"></div>
            <div className="bg-[#1e1e1e] rounded h-4 w-1/2 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-[#1e1e1e] rounded-lg h-40"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f] text-white">
        <p className="text-red-500 text-lg">User not found</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Cover Image Section */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-purple-900 to-blue-900">
        {user.coverImage ? (
          <img
            src={user.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-900 to-blue-900" />
        )}
      </div>

      {/* Profile Info Section */}
      <div className="px-6 md:px-10 -mt-20 relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
          {/* Avatar */}
          <div className="relative">
            <img
              src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}`}
              alt={user.fullName}
              className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-[#0f0f0f] bg-gray-800 shadow-xl"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">{user.fullName}</h1>
                <p className="text-gray-400 text-lg">@{user.username}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <Users size={16} />
                    {user.subscribersCount || 0} subscribers
                  </span>
                  <span className="flex items-center gap-1">
                    <VideoIcon size={16} />
                    {videos.length} videos
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Joined {user.createdAt ? formatDistanceToNow(new Date(user.createdAt)) + " ago" : "recently"}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0">
                {isOwnProfile ? (
                  <button
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg transition font-medium"
                  >
                    <Edit3 size={18} />
                    Edit Profile
                  </button>
                ) : (
                  <SubscriptionDropdown
                    channelId={user?._id}
                    isSubscribed={user?.isSubscribed || false}
                    onSubscriptionChange={(newStatus) => {
                      setUser(prev => ({
                        ...prev,
                        isSubscribed: newStatus,
                        subscribersCount: newStatus
                          ? (prev.subscribersCount || 0) + 1
                          : (prev.subscribersCount || 1) - 1
                      }));
                    }}
                    size="large"
                    className="px-8 py-3"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 md:px-10 mt-12">
        <div className="border-b border-gray-800">
          <div className="flex gap-8 overflow-x-auto">
            {['videos', 'playlists', 'tweets', isOwnProfile && 'subscriptions'].filter(Boolean).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition whitespace-nowrap ${
                  activeTab === tab
                    ? 'text-blue-500 border-blue-500'
                    : 'text-gray-400 border-transparent hover:text-white'
                }`}
              >
                {tab === 'videos' && (
                  <>
                    <VideoIcon size={18} className="inline mr-2" />
                    Videos ({videos.length})
                  </>
                )}
                {tab === 'playlists' && (
                  <>
                    <List size={18} className="inline mr-2" />
                    Playlists ({playlists.length})
                  </>
                )}
                {tab === 'tweets' && (
                  <>
                    <MessageCircle size={18} className="inline mr-2" />
                    Tweets ({tweets.length})
                  </>
                )}
                {tab === 'subscriptions' && (
                  <>
                    <Users size={18} className="inline mr-2" />
                    Subscriptions ({subscribedChannels.length})
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === "videos" && (
            <div>
              {videos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {videos.map(video => (
                    <VideoCard key={video._id} video={video} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <VideoIcon size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No videos uploaded yet</p>
                  {isOwnProfile && (
                    <button
                      onClick={() => navigate('/upload')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition"
                    >
                      Upload your first video
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "playlists" && (
            <div>
              {playlists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist._id}
                      className="bg-[#1f1f1f] rounded-lg overflow-hidden hover:bg-[#2a2a2a] transition-colors border border-[#333]"
                    >
                      <div
                        className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center relative cursor-pointer"
                        onClick={() => navigate(`/playlist/${playlist._id}`)}
                      >
                        <Play size={48} className="text-white opacity-80" />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                          {playlist.totalVideos || 0} videos
                        </div>
                        <div className="absolute top-2 left-2">
                          {(playlist.isPublic !== false && playlist.visibility !== 'private') ? (
                            <Globe size={16} className="text-white opacity-80" />
                          ) : (
                            <Lock size={16} className="text-white opacity-80" />
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3
                            className="font-semibold text-white truncate flex-1 cursor-pointer hover:text-blue-400 transition-colors"
                            onClick={() => navigate(`/playlist/${playlist._id}`)}
                          >
                            {playlist.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {!isOwnProfile && (playlist.isPublic !== false && playlist.visibility !== 'private') && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (savedPlaylists.has(playlist._id)) {
                                    handleUnsavePlaylist(playlist._id, playlist.name)
                                  } else {
                                    handleSavePlaylist(playlist._id, playlist.name)
                                  }
                                }}
                                disabled={
                                  savingPlaylists.has(playlist._id) ||
                                  unsavingPlaylists.has(playlist._id)
                                }
                                className={`p-1.5 rounded-full transition-colors ${
                                  savedPlaylists.has(playlist._id)
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : savingPlaylists.has(playlist._id) || unsavingPlaylists.has(playlist._id)
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                                title={
                                  savedPlaylists.has(playlist._id)
                                    ? "Remove from bookmarks"
                                    : "Bookmark playlist"
                                }
                              >
                                {savingPlaylists.has(playlist._id) || unsavingPlaylists.has(playlist._id) ? (
                                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
                                ) : savedPlaylists.has(playlist._id) ? (
                                  <Bookmark size={14} className="fill-current" />
                                ) : (
                                  <Bookmark size={14} />
                                )}
                              </button>
                            )}
                            {isOwnProfile && (
                              <div
                                className="relative"
                                ref={(el) => playlistDropdownRefs.current[playlist._id] = el}
                              >
                                <button
                                  className="p-1 rounded-full hover:bg-[#333] transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setShowPlaylistDropdown(showPlaylistDropdown === playlist._id ? null : playlist._id)
                                  }}
                                >
                                  <MoreHorizontal size={16} className="text-gray-400" />
                                </button>
                                {showPlaylistDropdown === playlist._id && (
                                  <div className="absolute right-0 top-full mt-1 bg-[#1f1f1f] border border-[#333] rounded shadow-xl text-sm w-48 z-[100] min-w-max transform-gpu">
                                    {playlist.isSaved ? (
                                      // Options for saved playlists
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleUnsavePlaylist(playlist._id, playlist.name)
                                          setShowPlaylistDropdown(null)
                                        }}
                                        className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-[#2a2a2a] transition-colors w-full text-left"
                                      >
                                        <Trash2 size={14} />
                                        Remove from Saved
                                      </button>
                                    ) : (
                                      // Options for owned playlists
                                      <>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleTogglePlaylistVisibility(
                                              playlist._id,
                                              (playlist.isPublic !== false && playlist.visibility !== 'private') ? 'public' : 'private'
                                            )
                                            setShowPlaylistDropdown(null)
                                          }}
                                          className="flex items-center gap-2 px-4 py-2 text-white hover:bg-[#2a2a2a] transition-colors w-full text-left"
                                        >
                                          {(playlist.isPublic !== false && playlist.visibility !== 'private') ? (
                                            <>
                                              <Lock size={14} />
                                              Make Private
                                            </>
                                          ) : (
                                            <>
                                              <Globe size={14} />
                                              Make Public
                                            </>
                                          )}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleDeletePlaylist(playlist._id, playlist.name)
                                            setShowPlaylistDropdown(null)
                                          }}
                                          className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-[#2a2a2a] transition-colors w-full text-left"
                                        >
                                          <Trash2 size={14} />
                                          Delete
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {playlist.description && (
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {playlist.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{playlist.totalVideos || 0} videos</span>
                          <div className="flex items-center gap-1">
                            {(playlist.isPublic !== false && playlist.visibility !== 'private') ? (
                              <>
                                <Globe size={12} />
                                <span>Public</span>
                              </>
                            ) : (
                              <>
                                <Lock size={12} />
                                <span>Private</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <List size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No playlists yet</p>
                  {isOwnProfile ? (
                    <p className="text-gray-500 text-sm mt-2">
                      Create playlists to organize your favorite videos
                    </p>
                  ) : (
                    <p className="text-gray-500 text-sm mt-2">
                      This user hasn't created any public playlists yet
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "tweets" && (
            <div>
              {tweets.length > 0 ? (
                <div className="space-y-4">
                  {tweets.map(tweet => (
                    <div key={tweet._id} className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#2a2a2a] transition-colors">
                      <div className="flex space-x-3">
                        <img
                          src={tweet.ownerDetails?.avatar || user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.fullName}`}
                          alt={tweet.ownerDetails?.username || user.username}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-white">
                                {tweet.ownerDetails?.fullName || user.fullName}
                              </h3>
                              <span className="text-gray-400">@{tweet.ownerDetails?.username || user.username}</span>
                              <span className="text-gray-500">·</span>
                              <span className="text-gray-500 text-sm">
                                {formatDistanceToNow(new Date(tweet.createdAt))} ago
                              </span>
                            </div>
                            
                            {isOwnProfile && (
                              <div className="relative">
                                <button
                                  onClick={() => setShowDropdown(showDropdown === tweet._id ? null : tweet._id)}
                                  className="p-1 rounded-full hover:bg-[#2a2a2a] transition-colors"
                                >
                                  <MoreHorizontal size={16} className="text-gray-400" />
                                </button>
                                
                                {showDropdown === tweet._id && (
                                  <div className="absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-lg shadow-lg z-10">
                                    <button
                                      onClick={() => startEdit(tweet)}
                                      className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center space-x-2 rounded-t-lg"
                                    >
                                      <Edit2 size={16} />
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      onClick={() => handleDeleteTweet(tweet._id)}
                                      className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center space-x-2 text-red-400 rounded-b-lg"
                                    >
                                      <Trash2 size={16} />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2">
                            {editingTweet === tweet._id ? (
                              <div className="space-y-3">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full bg-[#2a2a2a] text-white rounded-lg p-3 resize-none border-none outline-none"
                                  rows="3"
                                  maxLength="280"
                                />
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-400">
                                    {editContent.length}/280
                                  </span>
                                  <div className="space-x-2">
                                    <button
                                      onClick={cancelEdit}
                                      className="px-3 py-1 text-gray-400 hover:text-white transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleUpdateTweet(tweet._id)}
                                      disabled={!editContent.trim()}
                                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded-full text-sm"
                                    >
                                      Save
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <p className="text-white whitespace-pre-wrap">{tweet.content}</p>
                            )}
                          </div>
                          
                          {editingTweet !== tweet._id && (
                            <div className="flex items-center space-x-6 mt-3">
                              <span className="flex items-center space-x-2 text-gray-400">
                                <Heart size={16} />
                                <span className="text-sm">{tweet.likeCount || 0} likes</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <MessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No tweets yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    {isOwnProfile ? "Share your thoughts with your first tweet" : "This user hasn't tweeted yet"}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "subscriptions" && isOwnProfile && (
            <div>
              {subscribedChannels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subscribedChannels.map(({ subscribedChannel }) => (
                    <div
                      key={subscribedChannel._id}
                      className="bg-[#1c1c1c] rounded-lg p-4 hover:bg-[#262626] transition cursor-pointer"
                      onClick={() => handleChannelClick(subscribedChannel.username)}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={subscribedChannel.avatar?.url || `https://api.dicebear.com/7.x/initials/svg?seed=${subscribedChannel.fullName}`}
                          alt={subscribedChannel.fullName}
                          className="w-12 h-12 rounded-full flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">{subscribedChannel.fullName}</h3>
                          <p className="text-gray-400 text-xs truncate">@{subscribedChannel.username}</p>
                          {subscribedChannel.latestVideo && (
                            <p className="text-gray-500 text-xs mt-1 truncate">
                              Latest: {subscribedChannel.latestVideo.title}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSubscribedChannelVideos(subscribedChannel.username)
                          }}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded text-xs font-medium transition flex-shrink-0"
                        >
                          View Videos
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Users size={48} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 text-lg">No subscriptions yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Subscribe to channels to see them here
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile
