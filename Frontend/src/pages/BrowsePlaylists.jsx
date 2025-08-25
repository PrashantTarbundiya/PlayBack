import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Bookmark, Play, Globe, User, Clock } from "lucide-react"
import { toast } from "react-hot-toast"
import { playlistAPI } from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { formatDistanceToNow } from "date-fns"
import { InlineLoader } from "../components/Skeleton/LoadingScreen"

const BrowsePlaylists = () => {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [savingPlaylists, setSavingPlaylists] = useState(new Set())
  const { user } = useAuth()

  useEffect(() => {
    fetchPublicPlaylists()
  }, [])

  const fetchPublicPlaylists = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1)
      const response = await playlistAPI.getPublicPlaylists(pageNum, 20)
      const newPlaylists = response?.data?.data || []
      
      if (pageNum === 1) {
        setPlaylists(newPlaylists)
      } else {
        setPlaylists(prev => [...prev, ...newPlaylists])
      }
      
      setHasMore(newPlaylists.length === 20)
      setPage(pageNum)
    } catch (error) {
      console.error("Error fetching public playlists:", error)
      toast.remove()
      toast.error("Failed to load playlists")
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlaylist = async (playlist) => {
    if (!user) {
      toast.remove()
      toast.error("Please login to save playlists")
      return
    }

    setSavingPlaylists(prev => new Set([...prev, playlist._id]))

    try {
      await playlistAPI.savePlaylist(playlist._id, {
        name: `Saved - ${playlist.name}`,
        description: `Saved from ${playlist.owner?.fullName || playlist.owner?.username || 'Unknown'}'s collection`
      })
      toast.remove()
      toast.success(`Saved "${playlist.name}" to your library!`)
    } catch (error) {
      console.error("Error saving playlist:", error)
      const errorMessage = error.response?.data?.message || "Failed to save playlist"
      toast.remove()
      toast.error(errorMessage)
    } finally {
      setSavingPlaylists(prev => {
        const newSet = new Set(prev)
        newSet.delete(playlist._id)
        return newSet
      })
    }
  }

  const loadMorePlaylists = () => {
    if (!loading && hasMore) {
      fetchPublicPlaylists(page + 1)
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🎵</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Sign in to browse playlists</h2>
        <p className="text-gray-400 mb-6">Discover and save amazing playlists from the community</p>
        <Link
          to="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Browse Public Playlists</h1>
        <p className="text-gray-400 text-sm sm:text-base">Discover and save playlists created by the community</p>
      </div>

      {loading && page === 1 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-[#1e1e1e] rounded-lg p-3 sm:p-4 animate-pulse">
              <div className="bg-[#2a2a2a] rounded h-24 sm:h-32 mb-3 sm:mb-4"></div>
              <div className="bg-[#2a2a2a] rounded h-3 sm:h-4 w-3/4 mb-2"></div>
              <div className="bg-[#2a2a2a] rounded h-2 sm:h-3 w-1/2"></div>
            </div>
          ))}
        </div>
      ) : playlists.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist._id}
                className="bg-[#1f1f1f] rounded-lg overflow-hidden hover:bg-[#2a2a2a] transition-colors border border-[#333] group"
              >
                {/* Playlist Thumbnail */}
                <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center relative">
                  <Play size={48} className="text-white opacity-80" />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {playlist.totalVideos || 0} videos
                  </div>
                  <div className="absolute top-2 left-2">
                    <Globe size={16} className="text-white opacity-80" />
                  </div>
                  
                  {/* Save button overlay - shows on hover */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSavePlaylist(playlist)
                      }}
                      disabled={savingPlaylists.has(playlist._id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        savingPlaylists.has(playlist._id)
                          ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <Bookmark size={16} />
                      {savingPlaylists.has(playlist._id) ? "Saving..." : "Save Playlist"}
                    </button>
                  </div>
                </div>

                {/* Playlist Info */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      to={`/playlist/${playlist._id}`}
                      className="font-semibold text-white hover:text-blue-300 transition-colors truncate flex-1 mr-2"
                    >
                      {playlist.name}
                    </Link>
                    <button
                      onClick={() => handleSavePlaylist(playlist)}
                      disabled={savingPlaylists.has(playlist._id)}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                        savingPlaylists.has(playlist._id)
                          ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                          : "hover:bg-[#404040] text-gray-400 hover:text-blue-400"
                      }`}
                      title="Save playlist to your library"
                    >
                      <Bookmark size={16} />
                    </button>
                  </div>

                  {playlist.description && (
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}

                  {/* Creator info */}
                  {playlist.owner && (
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        {playlist.owner.avatar?.url ? (
                          <img
                            src={playlist.owner.avatar.url}
                            alt={playlist.owner.fullName || playlist.owner.username}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                            <User size={12} />
                          </div>
                        )}
                        <Link
                          to={`/profile/${playlist.owner.username}`}
                          className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                        >
                          {playlist.owner.fullName || playlist.owner.username}
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Playlist stats */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{playlist.totalVideos || 0} videos</span>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>
                        {playlist.updatedAt && !isNaN(new Date(playlist.updatedAt).getTime())
                          ? formatDistanceToNow(new Date(playlist.updatedAt)) + " ago"
                          : "Unknown time"
                        }z
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center mt-8">
              <button
                onClick={loadMorePlaylists}
                disabled={loading}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  loading
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <InlineLoader size="small" />
                    Loading...
                  </div>
                ) : (
                  "Load More Playlists"
                )}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2 text-white">No public playlists found</h3>
          <p className="text-gray-400">Check back later for new playlists from the community</p>
        </div>
      )}
    </div>
  )
}

export default BrowsePlaylists