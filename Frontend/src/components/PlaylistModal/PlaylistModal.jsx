import { useState, useEffect } from "react"
import { X, Plus, List } from "lucide-react"
import { toast } from "react-hot-toast"
import { videoAPI, playlistAPI } from "../../services/api"
import { CenteredLoader } from "../Skeleton/LoadingScreen"

const PlaylistModal = ({ isOpen, onClose, videoId, savedPlaylists = [] }) => {
  const [playlists, setPlaylists] = useState([])
  const [loading, setLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState("")
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [actioningPlaylists, setActioningPlaylists] = useState(new Set())

  useEffect(() => {
    if (isOpen) {
      fetchUserPlaylists()
    }
  }, [isOpen])

  const fetchUserPlaylists = async () => {
    try {
      setLoading(true)
      const userPlaylists = await videoAPI.getUserPlaylistsForSelection()
      setPlaylists(userPlaylists)
    } catch (error) {
      console.error("Error fetching playlists:", error)
      toast.remove()
      toast.error(error.message || "Failed to load playlists")
    } finally {
      setLoading(false)
    }
  }

  const handleAddToPlaylist = async (playlistId) => {
    if (actioningPlaylists.has(playlistId)) return
    
    try {
      setActioningPlaylists(prev => new Set(prev).add(playlistId))
      await playlistAPI.addVideoToPlaylist(videoId, playlistId)
      toast.remove()
      toast.success("Video added to playlist!")
      onClose()
    } catch (error) {
      console.error("Error adding to playlist:", error)
      const errorMessage = error.response?.data?.message || "Failed to add to playlist"
      // Check if it's a duplicate error
      if (errorMessage.toLowerCase().includes('already') || errorMessage.toLowerCase().includes('duplicate')) {
        toast.remove()
        toast.error("Video is already in this playlist")
      } else {
        toast.remove()
        toast.error(errorMessage)
      }
    } finally {
      setActioningPlaylists(prev => {
        const newSet = new Set(prev)
        newSet.delete(playlistId)
        return newSet
      })
    }
  }

  const handleRemoveFromPlaylist = async (playlistId) => {
    if (actioningPlaylists.has(playlistId)) return
    
    try {
      setActioningPlaylists(prev => new Set(prev).add(playlistId))
      await playlistAPI.removeVideoFromPlaylist(videoId, playlistId)
      toast.remove()
      toast.success("Video removed from playlist!")
      onClose()
    } catch (error) {
      console.error("Error removing from playlist:", error)
      toast.remove()
      toast.error(error.response?.data?.message || "Failed to remove from playlist")
    } finally {
      setActioningPlaylists(prev => {
        const newSet = new Set(prev)
        newSet.delete(playlistId)
        return newSet
      })
    }
  }

  const isVideoInPlaylist = (playlistId) => {
    return savedPlaylists.some(p => p._id === playlistId)
  }

  const handleCreatePlaylist = async (e) => {
    e.preventDefault()
    if (!newPlaylistName.trim()) {
      toast.remove()
      toast.error("Playlist name is required")
      return
    }

    try {
      setCreating(true)
      const newPlaylist = await playlistAPI.createPlaylist({
        name: newPlaylistName.trim(),
        description: newPlaylistDescription.trim() || "My playlist"
      })
      
      const playlist = newPlaylist.data?.data
      if (playlist) {
        // Add the video to the newly created playlist
        await playlistAPI.addVideoToPlaylist(videoId, playlist._id)
        toast.remove()
        toast.success(`Created "${playlist.name}" and added video!`)
        onClose()
      }
    } catch (error) {
      console.error("Error creating playlist:", error)
      toast.remove()
      toast.error(error.response?.data?.message || "Failed to create playlist")
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1f1f1f] rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Save to Playlist</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <CenteredLoader message="Loading playlists..." />
        ) : (
          <>
            {/* Create New Playlist Button */}
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#2a2a2a] hover:bg-[#333] transition-colors text-white mb-4"
            >
              <Plus size={20} />
              <span>Create New Playlist</span>
            </button>

            {/* Create Playlist Form */}
            {showCreateForm && (
              <form onSubmit={handleCreatePlaylist} className="mb-4 p-4 bg-[#2a2a2a] rounded-lg">
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Playlist name"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    className="w-full bg-[#121212] text-white border border-[#333] rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-3">
                  <textarea
                    placeholder="Description (optional)"
                    value={newPlaylistDescription}
                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                    rows="2"
                    className="w-full bg-[#121212] text-white border border-[#333] rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-2 text-gray-400 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {creating ? "Creating..." : "Create & Add"}
                  </button>
                </div>
              </form>
            )}

            {/* Existing Playlists */}
            <div className="space-y-2">
              {playlists.length > 0 ? (
                playlists.map((playlist) => {
                  const isInPlaylist = isVideoInPlaylist(playlist._id)
                  const isActioning = actioningPlaylists.has(playlist._id)
                  
                  return (
                    <div
                      key={playlist._id}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isInPlaylist ? 'bg-green-900/30 border border-green-600/50' : 'bg-[#2a2a2a]'
                      }`}
                    >
                      <List size={20} className={isInPlaylist ? "text-green-400" : "text-gray-400"} />
                      <div className="flex-1">
                        <div className={`font-medium ${isInPlaylist ? 'text-green-300' : 'text-white'}`}>
                          {playlist.name}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {playlist.totalVideos || 0} videos
                        </div>
                      </div>
                      <button
                        onClick={() => isInPlaylist ? handleRemoveFromPlaylist(playlist._id) : handleAddToPlaylist(playlist._id)}
                        disabled={isActioning}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          isActioning
                            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            : isInPlaylist
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isActioning
                          ? '...'
                          : isInPlaylist
                            ? 'Remove'
                            : 'Add'
                        }
                      </button>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <List size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No playlists yet</p>
                  <p className="text-sm">Create your first playlist above</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PlaylistModal