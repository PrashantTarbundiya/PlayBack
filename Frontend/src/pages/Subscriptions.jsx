import { useState, useEffect, useMemo } from "react"
import { useAuth } from "../contexts/AuthContext"
import { subscriptionAPI, authAPI } from "../services/api"
import VideoCard from "../components/VideoCard/VideoCard"
import LoadingScreen from "../components/Skeleton/LoadingScreen"
import { PlaySquare, BellOff } from "lucide-react"

const Subscriptions = () => {
    const { user, loading: authLoading } = useAuth()
    const [channels, setChannels] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [activeChannelId, setActiveChannelId] = useState("all")

    useEffect(() => {
        const fetchSubscriptions = async () => {
            if (!user?._id) return

            try {
                setLoading(true)
                setError(null)
                const response = await subscriptionAPI.getSubscribedChannels(user._id)

                // Extract the subscribed channels array
                const fetchedChannels = response.data?.data || []

                // Filter out channels that don't have a latestVideo
                // and sort them by the latestVideo's createdAt date descending
                const channelsWithVideos = fetchedChannels
                    .filter(c => c.subscribedChannel?.latestVideo)
                    .sort((a, b) => {
                        const dateA = new Date(a.subscribedChannel.latestVideo.createdAt)
                        const dateB = new Date(b.subscribedChannel.latestVideo.createdAt)
                        return dateB - dateA
                    })

                // The subscription API projects "avatar.url" which doesn't work
                // for string-type avatar fields. Fetch each channel's profile
                // separately to get the actual avatar URL (same as Home page does).
                const enrichedChannels = await Promise.all(
                    channelsWithVideos.map(async (channelData) => {
                        const ch = channelData.subscribedChannel
                        // If avatar is already a usable string, skip fetching
                        if (ch.avatar && typeof ch.avatar === 'string' && ch.avatar.startsWith('http')) {
                            return channelData
                        }
                        try {
                            const profileRes = await authAPI.getUserProfile(ch.username)
                            const profile = profileRes.data?.data
                            if (profile?.avatar) {
                                return {
                                    ...channelData,
                                    subscribedChannel: {
                                        ...ch,
                                        avatar: profile.avatar
                                    }
                                }
                            }
                        } catch (e) {
                            // If profile fetch fails, just continue without avatar
                        }
                        return channelData
                    })
                )

                setChannels(enrichedChannels)
            } catch (err) {
                console.error("Error fetching subscriptions:", err)
                setError(err.message || "Failed to load subscriptions")
            } finally {
                setLoading(false)
            }
        }

        if (!authLoading) {
            if (user) {
                fetchSubscriptions()
            } else {
                setLoading(false)
            }
        }
    }, [user, authLoading])

    // Derive filtered channels based on the active channel selection
    const displayedChannels = useMemo(() => {
        if (activeChannelId === "all") {
            return channels
        }
        return channels.filter(c => c.subscribedChannel._id === activeChannelId)
    }, [channels, activeChannelId])

    // Utility to get a secure/working avatar
    const getAvatarSrc = (avatarData) => {
        if (!avatarData) return "/default-avatar.png"
        if (typeof avatarData === 'string') return avatarData
        return avatarData.url || avatarData.secure_url || "/default-avatar.png"
    }

    if (authLoading || loading) {
        return <LoadingScreen message="Loading subscriptions..." />
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                <PlaySquare className="w-20 h-20 text-gray-600 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Sign in to view subscriptions</h2>
                <p className="text-gray-400 max-w-sm mb-6">
                    Sign in to see updates from your favorite channels.
                </p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                <div className="text-red-500 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h2>
                <p className="text-gray-400">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                >
                    Try Again
                </button>
            </div>
        )
    }

    if (channels.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
                <BellOff className="w-20 h-20 text-gray-600 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No recent videos</h2>
                <p className="text-gray-400 max-w-sm">
                    You haven't subscribed to any channels yet, or the channels you've subscribed to haven't uploaded any videos.
                </p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0f0f0f] text-white">
            {/* Horizontal Channel Filter Bar */}
            <div className="sticky top-14 bg-[#0f0f0f] border-b border-[#222] z-40 px-4 sm:px-6 py-3">
                <div className="max-w-[1400px] mx-auto">
                    <div className="flex gap-2 sm:gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        <style dangerouslySetInnerHTML={{
                            __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }`
                        }} />

                        {/* "All" Filter Bubble */}
                        <button
                            onClick={() => setActiveChannelId("all")}
                            className="flex flex-col items-center gap-2 min-w-[70px] transition-transform hover:scale-105 shrink-0"
                        >
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-200 shadow-md border-2 ${activeChannelId === "all" ? "border-white bg-white text-black" : "border-transparent bg-[#1e1e1e] text-white hover:bg-[#2a2a2a]"}`}>
                                <span className="font-semibold text-sm">All</span>
                            </div>
                            <span className={`text-xs w-full text-center truncate px-1 transition-colors ${activeChannelId === "all" ? "text-white font-medium" : "text-gray-400"}`}>
                                All
                            </span>
                        </button>

                        {/* Subscribed Channels Bubbles */}
                        {channels.map((channelData) => {
                            const channel = channelData.subscribedChannel
                            const isActive = activeChannelId === channel._id
                            return (
                                <button
                                    key={channel._id}
                                    onClick={() => setActiveChannelId(channel._id)}
                                    className="flex flex-col items-center gap-2 min-w-[70px] transition-transform hover:scale-105 shrink-0 group"
                                >
                                    <div className={`w-16 h-16 rounded-full p-[3px] transition-colors duration-200 ${isActive ? "bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.5)]" : "bg-transparent group-hover:bg-gray-600"}`}>
                                        <img
                                            src={getAvatarSrc(channel.avatar)}
                                            alt={channel.fullName || channel.username}
                                            className="w-full h-full object-cover rounded-full bg-gray-900 border-[3px] border-[#0f0f0f]"
                                            onError={(e) => {
                                                e.target.onerror = null
                                                e.target.src = "/default-avatar.png"
                                            }}
                                        />
                                    </div>
                                    <span className={`text-xs w-full text-center truncate px-1 transition-colors ${isActive ? "text-white font-medium" : "text-gray-400 group-hover:text-gray-300"}`}>
                                        {channel.fullName || channel.username}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Videos Content */}
            <div className="p-4 sm:p-6 w-full">
                <h1 className="text-xl md:text-2xl font-bold text-white mb-6 mt-2 max-w-[1400px] mx-auto">Latest Videos</h1>

                {displayedChannels.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-12 min-h-[40vh] gap-4">
                        <div className="text-6xl mb-4">📺</div>
                        <h3 className="text-2xl font-semibold mb-2 text-white">No videos found</h3>
                        <p className="text-gray-400 text-base leading-6">Try selecting a different channel or check back later</p>
                    </div>
                ) : (
                    <div className="max-w-[1400px] mx-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 w-full">
                            {displayedChannels.map((channelData) => {
                                const channel = channelData.subscribedChannel
                                const video = channel.latestVideo

                                const mappedVideo = {
                                    ...video,
                                    owner: {
                                        _id: channel._id,
                                        username: channel.username,
                                        fullName: channel.fullName,
                                        avatar: channel.avatar
                                    }
                                }

                                return (
                                    <VideoCard
                                        key={`${channel._id}-${video._id}`}
                                        video={mappedVideo}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Subscriptions
