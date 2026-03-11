"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate, Link } from "react-router-dom"
import VideoCard from "../components/VideoCard/VideoCard"
import { videoAPI, authAPI, playlistAPI } from "../services/api"
import { VideoGridSkeleton } from "../components/Skeleton/Skeleton"
import SEO from "../components/SEO/SEO"
import { Users, ListVideo, PlaySquare } from "lucide-react"

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const query = searchParams.get("q")
  const typeParam = searchParams.get("type") || "all"

  const [activeTab, setActiveTab] = useState(typeParam)
  const [videos, setVideos] = useState([])
  const [channels, setChannels] = useState([])
  const [playlists, setPlaylists] = useState([])

  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'videos', label: 'Videos' },
    { id: 'channels', label: 'Channels' },
    { id: 'playlists', label: 'Playlists' }
  ]

  useEffect(() => {
    if (typeParam !== activeTab) {
      setActiveTab(typeParam)
    }
  }, [typeParam])

  useEffect(() => {
    if (query) {
      setVideos([])
      setChannels([])
      setPlaylists([])
      setPage(1)
      setHasMore(true)
      performSearch(1, true, activeTab)
    }
  }, [query, activeTab])

  const handleTabChange = (tabId) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set("type", tabId)
    setSearchParams(newParams)
  }

  const performSearch = async (pageNum = 1, reset = false, type = 'all') => {
    if (!query) return;

    try {
      setLoading(true)

      let videosRes = null;
      let channelsRes = null;
      let playlistsRes = null;

      if (type === 'all' || type === 'videos') {
        videosRes = await videoAPI.searchVideos(query, pageNum, type === 'all' ? 12 : 50)
      }

      if (type === 'all' || type === 'channels') {
        channelsRes = await authAPI.searchUsers(query, pageNum, type === 'all' ? 4 : 20)
      }

      if (type === 'all' || type === 'playlists') {
        playlistsRes = await playlistAPI.searchPlaylists(query, pageNum, type === 'all' ? 4 : 20)
      }

      // Process Videos
      if (videosRes) {
        const data = videosRes.data?.data
        let newVideos = []
        let hasNextPage = false

        if (Array.isArray(data)) {
          newVideos = data
        } else if (data?.docs && Array.isArray(data.docs)) {
          newVideos = data.docs
          hasNextPage = data.hasNextPage || false
        } else if (videosRes.data && Array.isArray(videosRes.data)) {
          newVideos = videosRes.data
        }

        if (reset) {
          setVideos(newVideos)
        } else if (type === 'videos') {
          setVideos(prev => [...prev, ...newVideos])
        }

        if (type === 'videos') setHasMore(hasNextPage && newVideos.length > 0)
      }

      // Process Channels
      if (channelsRes) {
        const data = channelsRes.data?.data
        let newChannels = []
        let hasNextPage = false

        if (Array.isArray(data)) {
          newChannels = data
        } else if (data?.docs && Array.isArray(data.docs)) {
          newChannels = data.docs
          hasNextPage = data.hasNextPage || false
        } else if (channelsRes.data && Array.isArray(channelsRes.data)) {
          newChannels = channelsRes.data
        }

        if (reset) {
          setChannels(newChannels)
        } else if (type === 'channels') {
          setChannels(prev => [...prev, ...newChannels])
        }

        if (type === 'channels') setHasMore(hasNextPage && newChannels.length > 0)
      }

      // Process Playlists
      if (playlistsRes) {
        const data = playlistsRes.data?.data
        let newPlaylists = []
        let hasNextPage = false

        if (Array.isArray(data)) {
          newPlaylists = data
        } else if (data?.docs && Array.isArray(data.docs)) {
          newPlaylists = data.docs
          hasNextPage = data.hasNextPage || false
        } else if (playlistsRes.data && Array.isArray(playlistsRes.data)) {
          newPlaylists = playlistsRes.data
        }

        if (reset) {
          setPlaylists(newPlaylists)
        } else if (type === 'playlists') {
          setPlaylists(prev => [...prev, ...newPlaylists])
        }

        if (type === 'playlists') setHasMore(hasNextPage && newPlaylists.length > 0)
      }

      // For 'all' tab, we don't support pagination, just show the top results
      if (type === 'all') setHasMore(false)

    } catch (err) {
      console.error('Search error:', err)
      if (reset) {
        setVideos([])
        setChannels([])
        setPlaylists([])
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      performSearch(nextPage, false, activeTab)
    }
  }

  return (
    <>
      <SEO
        title={query ? `Search: ${query}` : "Search"}
        description={query ? `Search results for "${query}" on PlayBack.` : "Search for videos on PlayBack."}
        url={`/search${query ? `?q=${encodeURIComponent(query)}` : ''}`}
        keywords={`search videos, ${query || ''}, PlayBack search`}
      />
      <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 border-b border-gray-800 pb-4">
            <h2 className="text-xl font-semibold mb-4">Search results for "{query}"</h2>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'bg-[#272727] text-white hover:bg-[#3f3f3f]'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {loading && page === 1 ? (
            <VideoGridSkeleton count={12} />
          ) : (
            <div className="space-y-10">

              {/* Channels Section */}
              {(activeTab === 'all' || activeTab === 'channels') && channels.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users size={20} className="text-blue-500" /> Channels
                      </h3>
                      {channels.length >= 4 && (
                        <button onClick={() => handleTabChange('channels')} className="text-blue-500 text-sm hover:underline">
                          View all
                        </button>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {channels.map(channel => (
                      <Link
                        to={`/profile/${channel.username}`}
                        key={channel._id}
                        className="flex flex-col items-center justify-center p-6 bg-[#1a1a1a] rounded-xl hover:bg-[#222] cursor-pointer transition-colors border border-gray-800 group"
                      >
                        <img
                          src={channel.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${channel.fullName}`}
                          alt={channel.fullName}
                          className="w-24 h-24 rounded-full object-cover mb-4 group-hover:scale-105 transition-transform"
                        />
                        <h4 className="font-semibold text-lg text-center truncate w-full">{channel.fullName}</h4>
                        <p className="text-gray-400 text-sm mb-2 truncate w-full text-center">@{channel.username}</p>
                        <div className="text-xs text-gray-500 bg-[#2a2a2a] px-3 py-1 rounded-full mt-2">
                          {channel.subscribersCount || 0} subscribers
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Playlists Section */}
              {(activeTab === 'all' || activeTab === 'playlists') && playlists.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <ListVideo size={20} className="text-purple-500" /> Playlists
                      </h3>
                      {playlists.length >= 4 && (
                        <button onClick={() => handleTabChange('playlists')} className="text-purple-500 text-sm hover:underline">
                          View all
                        </button>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {playlists.map(playlist => (
                      <Link
                        to={`/playlist/${playlist._id}`}
                        key={playlist._id}
                        className="bg-[#1a1a1a] rounded-xl overflow-hidden hover:bg-[#222] cursor-pointer transition flex flex-col border border-gray-800 group block"
                      >
                        <div className="relative aspect-video bg-[#2a2a2a] flex flex-col items-center justify-center w-full">
                          {playlist.totalVideos > 0 && playlist.videos && playlist.videos[0] ? (
                            <>
                              <img
                                src={playlist.videos[0].thumbnail?.url || playlist.videos[0].thumbnail}
                                alt={playlist.name}
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition"
                              />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <PlaySquare size={36} className="text-white opacity-80" />
                              </div>
                            </>
                          ) : (
                            <ListVideo size={48} className="text-gray-500" />
                          )}

                          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-medium flex items-center gap-1">
                            <ListVideo size={12} />
                            {playlist.totalVideos || 0} videos
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col w-full">
                          <h4 className="font-semibold text-lg line-clamp-1 mb-1 group-hover:text-purple-400 transition-colors">{playlist.name}</h4>
                          <span className="text-sm text-gray-400 mb-2">
                            By {playlist.ownerDetails?.fullName || 'User'}
                          </span>
                          <p className="text-xs text-gray-500 line-clamp-2 mt-auto">
                            {playlist.description || "No description"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {(activeTab === 'all' || activeTab === 'videos') && videos.length > 0 && (
                <div>
                  {activeTab === 'all' && (
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <PlaySquare size={20} className="text-red-500" /> Videos
                      </h3>
                      {videos.length >= 12 && (
                        <button onClick={() => handleTabChange('videos')} className="text-red-500 text-sm hover:underline">
                          View all
                        </button>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <VideoCard key={video._id} video={video} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {videos.length === 0 && channels.length === 0 && playlists.length === 0 && (
                <div className="text-center py-16 bg-[#111] rounded-xl border border-gray-800">
                  <h3 className="text-xl font-semibold mb-2">No results found</h3>
                  <p className="text-gray-400 max-w-md mx-auto">We couldn't find any {activeTab !== 'all' ? activeTab : 'results'} matching "{query}". Try checking your spelling or using more general keywords.</p>
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (activeTab !== 'all') && (
                <div className="flex justify-center mt-10">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-8 py-3 bg-[#272727] hover:bg-[#3f3f3f] disabled:opacity-50 text-white rounded-full font-medium transition-colors flex items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                        Loading...
                      </>
                    ) : (
                      'Load More Results'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default Search
