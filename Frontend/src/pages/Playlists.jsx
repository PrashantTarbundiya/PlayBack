import { useState, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { Plus, Play, Lock, Globe, MoreVertical, Trash2, Edit, ArrowLeft, Save, Search, Users, Bookmark } from "lucide-react"
import { toast } from "react-hot-toast"
import { playlistAPI, videoAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import VideoCard from "../components/VideoCard/VideoCard"
import { VideoGridSkeleton } from "../components/Skeleton/Skeleton"
import { CenteredLoader } from "../components/Skeleton/LoadingScreen"

const Playlists = () => {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("")
  const [newPlaylistPrivacy, setNewPlaylistPrivacy] = useState("public")
  const [creating, setCreating] = useState(false)
  const [activeFilter, setActiveFilter] = useState("your")
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistVideos, setPlaylistVideos] = useState([])
  const [loadingVideos, setLoadingVideos] = useState(false)
  const [showDropdown, setShowDropdown] = useState(null)
  const [removingVideo, setRemovingVideo] = useState(null)
  const dropdownRefs = useRef({})
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      fetchPlaylists()
    }
  }, [user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown) {
        const currentDropdownRef = dropdownRefs.current[showDropdown]
        if (currentDropdownRef && !currentDropdownRef.contains(event.target)) {
          setShowDropdown(null)
        }
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      
      // Get both user's own playlists and saved playlists
      const [userPlaylistsResponse, savedPlaylistsResponse] = await Promise.all([
        videoAPI.getUserPlaylistsForSelection(),
        playlistAPI.getSavedPlaylists().catch(() => ({ data: { data: [] } })) // Handle if endpoint doesn't exist
      ])
      
      const userPlaylists = userPlaylistsResponse || []
      const savedPlaylists = savedPlaylistsResponse?.data?.data || []
      
      // Filter out system playlists from user's own playlists
      const filteredUserPlaylists = userPlaylists.filter(
        playlist => playlist.name !== "Watch Later" &&
                   playlist.name.toLowerCase() !== "watch later" &&
                   playlist.name !== "Watch History" &&
                   playlist.name.toLowerCase() !== "watch history" &&
                   !playlist.name.toLowerCase().includes("history")
      )
      
      // Mark saved playlists
      const markedSavedPlaylists = savedPlaylists.map(playlist => ({
        ...playlist,
        isSaved: true
      }))
      
      // Combine both arrays
      const allPlaylists = [...filteredUserPlaylists, ...markedSavedPlaylists]
      
      setPlaylists(allPlaylists)
    } catch (error) {
      console.error("Error fetching playlists:", error)
      toast.error("Failed to load playlists")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlaylist = async (e) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) {
      toast.error("Playlist name is required")
      return
    }

    try {
      setCreating(true)
      const newPlaylist = await playlistAPI.createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || "My playlist",
        isPublic: newPlaylistPrivacy === "public",
        visibility: newPlaylistPrivacy
      })
      
      const playlist = newPlaylist.data?.data
      if (playlist) {
        setPlaylists(prev => [playlist, ...prev])
        setNewPlaylistName("")
        setNewPlaylistDescription("")
        setNewPlaylistPrivacy("public")
        setShowCreateForm(false)
        toast.success(`Created "${playlist.name}" playlist!`)
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast.error(error.response?.data?.message || "Failed to create playlist")
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePlaylist = async (playlistId, playlistName, isSaved = false) => {
    const action = isSaved ? "remove from saved" : "delete"
    const message = isSaved
      ? `Are you sure you want to remove "${playlistName}" from your saved playlists?`
      : `Are you sure you want to delete "${playlistName}"?`
    
    if (!confirm(message)) {
      return
    }

    try {
      if (isSaved) {
        await playlistAPI.unsavePlaylist(playlistId)
        toast.success("Playlist removed from saved")
      } else {
        await playlistAPI.deletePlaylist(playlistId)
        toast.success("Playlist deleted successfully")
      }
      setPlaylists(prev => prev.filter(p => p._id !== playlistId))
    } catch (error) {
      console.error(`Error ${action}ing playlist:`, error)
      toast.error(`Failed to ${action} playlist`)
    }
  }

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

  const handlePlaylistClick = async (playlist) => {
    try {
      setLoadingVideos(true)
      setSelectedPlaylist(playlist)
      const response = await playlistAPI.getPlaylistById(playlist._id)
      const playlistData = response?.data?.data
      const videos = playlistData?.videos || []
      // Show all videos in playlist (don't filter by published status in playlists)
      setPlaylistVideos(Array.isArray(videos) ? videos : [])
    } catch (error) {
      console.error("Error fetching playlist videos:", error)
      toast.error("Failed to load playlist videos")
    } finally {
      setLoadingVideos(false)
    }
  }

  const handleBackToPlaylists = () => {
    setSelectedPlaylist(null)
    setPlaylistVideos([])
  }

  const handleRemoveVideoFromPlaylist = async (videoId, videoTitle) => {
    if (!user || !selectedPlaylist) {
      toast.error("You don't have permission to remove videos")
      return
    }

    // Check if user is the owner of the playlist
    const isOwner = selectedPlaylist.owner === user._id ||
                   (selectedPlaylist.owner && selectedPlaylist.owner._id === user._id) ||
                   selectedPlaylist.isSaved !== true

    if (!isOwner) {
      toast.error("You can only remove videos from your own playlists")
      return
    }

    const confirmed = window.confirm(`Are you sure you want to remove "${videoTitle}" from this playlist?`)
    if (!confirmed) return

    setRemovingVideo(videoId)
    try {
      await playlistAPI.removeVideoFromPlaylist(videoId, selectedPlaylist._id)
      
      // Update the playlist videos state to remove the video
      setPlaylistVideos(prev => prev.filter(video => video._id !== videoId))
      
      // Update the selected playlist's video count
      setSelectedPlaylist(prev => ({
        ...prev,
        totalVideos: (prev.totalVideos || playlistVideos.length) - 1
      }))
      
      toast.success(`Removed "${videoTitle}" from playlist`)
    } catch (error) {
      console.error("Error removing video from playlist:", error)
      toast.error(error.response?.data?.message || "Failed to remove video")
    } finally {
      setRemovingVideo(null)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🎵</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Sign in to see your playlists</h2>
        <p className="text-gray-400 mb-6">Create and manage your video playlists</p>
        <Link
          to="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  // If a playlist is selected, show its videos
  if (selectedPlaylist) {
    const handlePlayAll = () => {
      if (playlistVideos.length > 0) {
        const firstVideo = playlistVideos[0]
        const playAllUrl = `/watch/${firstVideo._id}?playlist=${selectedPlaylist._id}&index=0`
        window.location.href = playAllUrl
      }
    }

    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handleBackToPlaylists}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
            Back to Playlists
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{selectedPlaylist.name}</h1>
            <p className="text-gray-400">
              {playlistVideos.length} video{playlistVideos.length !== 1 ? 's' : ''}
            </p>
          </div>
          {playlistVideos.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Play size={20} />
              Play All
            </button>
          )}
        </div>

        {selectedPlaylist.description && (
          <p className="text-gray-300 mb-6">{selectedPlaylist.description}</p>
        )}

        {loadingVideos ? (
          <VideoGridSkeleton count={8} />
        ) : playlistVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlistVideos.map((video, index) => {
              // Check if user is the owner of the playlist
              const isOwner = selectedPlaylist.owner === user._id ||
                             (selectedPlaylist.owner && selectedPlaylist.owner._id === user._id) ||
                             selectedPlaylist.isSaved !== true

              return (
                <div key={video._id} className="relative group">
                  <VideoCard
                    video={video}
                    showPlaylistIndex={index + 1}
                  />
                  {/* Remove button for playlist owners */}
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveVideoFromPlaylist(video._id, video.title)}
                      disabled={removingVideo === video._id}
                      className={`absolute top-2 right-2 p-2 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 ${
                        removingVideo === video._id
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      } text-white shadow-lg`}
                      title="Remove from playlist"
                    >
                      {removingVideo === video._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2 text-white">No videos in this playlist</h3>
            <p className="text-gray-400">Videos added to this playlist will appear here</p>
          </div>
        )}
      </div>
    )
  }

  // Filter playlists based on active filter
  const filteredPlaylists = playlists.filter(playlist => {
    if (activeFilter === "saved") {
      return playlist.isSaved === true
    } else {
      return playlist.isSaved !== true // Your playlists (created by user)
    }
  })

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Playlists</h1>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Playlist
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-[#1f1f1f] p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveFilter("your")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeFilter === "your"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
          }`}
        >
          <Users size={16} />
          Your Playlists
        </button>
        <button
          onClick={() => setActiveFilter("saved")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
            activeFilter === "saved"
              ? "bg-blue-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-[#2a2a2a]"
          }`}
        >
          <Bookmark size={16} />
          Saved Playlists
        </button>
      </div>

      {/* Create Playlist Form */}
      {showCreateForm && (
        <div className="mb-6 p-6 bg-[#1f1f1f] rounded-lg border border-[#333]">
          <h3 className="text-lg font-semibold mb-4">Create New Playlist</h3>
          <form onSubmit={handleCreatePlaylist} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full bg-[#121212] text-white border border-[#333] rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Description (optional)"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                rows="3"
                className="w-full bg-[#121212] text-white border border-[#333] rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Privacy</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={newPlaylistPrivacy === "public"}
                    onChange={(e) => setNewPlaylistPrivacy(e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <Globe size={16} className="mr-1" />
                  <span className="text-gray-300">Public</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={newPlaylistPrivacy === "private"}
                    onChange={(e) => setNewPlaylistPrivacy(e.target.value)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  <Lock size={16} className="mr-1" />
                  <span className="text-gray-300">Private</span>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {newPlaylistPrivacy === "public"
                  ? "Anyone can view this playlist"
                  : "Only you can view this playlist"
                }
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-400 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {creating ? "Creating..." : "Create Playlist"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Playlists Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-[#1e1e1e] rounded-lg p-4 animate-pulse">
              <div className="bg-[#2a2a2a] rounded h-32 mb-4"></div>
              <div className="bg-[#2a2a2a] rounded h-4 w-3/4 mb-2"></div>
              <div className="bg-[#2a2a2a] rounded h-3 w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredPlaylists.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist._id}
              className="bg-[#1f1f1f] rounded-lg overflow-hidden hover:bg-[#2a2a2a] transition-colors border border-[#333] cursor-pointer relative"
              onClick={() => handlePlaylistClick(playlist)}
            >
              <div className="aspect-video bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center relative">
                <Play size={48} className="text-white opacity-80" />
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {playlist.totalVideos || 0} videos
                </div>
                <div className="absolute top-2 left-2">
                  {playlist.isPublic !== false ? (
                    <Globe size={16} className="text-white opacity-80" />
                  ) : (
                    <Lock size={16} className="text-white opacity-80" />
                  )}
                </div>
              </div>
              
              <div className="p-4 overflow-visible">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white truncate flex-1">
                    {playlist.name}
                  </h3>
                  <div
                    className="relative overflow-visible"
                    ref={(el) => dropdownRefs.current[playlist._id] = el}
                  >
                    <button
                      className="p-1 rounded-full hover:bg-[#333] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDropdown(showDropdown === playlist._id ? null : playlist._id)
                      }}
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>
                    {showDropdown === playlist._id && (
                      <div className="absolute right-0 top-full mt-1 bg-[#1f1f1f] border border-[#333] rounded shadow-xl text-sm w-48 z-[100] min-w-max transform-gpu">
                        {playlist.isSaved ? (
                          // Options for saved playlists
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePlaylist(playlist._id, playlist.name, true)
                              setShowDropdown(null)
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-[#2a2a2a] transition-colors w-full text-left"
                          >
                            <Trash2 size={14} />
                            Remove from Saved
                          </button>
                        ) : (
                          // Options for own playlists
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleTogglePlaylistVisibility(
                                  playlist._id,
                                  playlist.isPublic !== false ? 'public' : 'private'
                                )
                                setShowDropdown(null)
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-white hover:bg-[#2a2a2a] transition-colors w-full text-left"
                            >
                              {playlist.isPublic !== false ? (
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
                                handleDeletePlaylist(playlist._id, playlist.name, false)
                                setShowDropdown(null)
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
                </div>
                
                {playlist.description && (
                  <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                    {playlist.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{playlist.totalVideos || 0} videos</span>
                  <div className="flex items-center gap-1">
                    {playlist.isPublic !== false ? (
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
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No playlists yet</h3>
          <p className="text-gray-400 mb-6">Create your first playlist to organize your favorite videos</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Playlist
          </button>
        </div>
      )}
    </div>
  )
}

export default Playlists