import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { History, Clock, ThumbsUp, PlaySquare, List, Video } from "lucide-react"
import { useAuth } from "../contexts/AuthContext"

const Library = () => {
  const { user } = useAuth()

  const libraryItems = [
    {
      icon: History,
      title: "History",
      description: "Videos you've watched",
      path: "/history",
      color: "bg-blue-600"
    },
    {
      icon: Clock,
      title: "Watch Later",
      description: "Videos to watch later",
      path: "/watch-later",
      color: "bg-green-600"
    },
    {
      icon: ThumbsUp,
      title: "Liked Videos",
      description: "Videos you liked",
      path: "/liked",
      color: "bg-red-600"
    },
    {
      icon: List,
      title: "Playlists",
      description: "Your created playlists",
      path: "/playlists",
      color: "bg-purple-600"
    },
    {
      icon: PlaySquare,
      title: "Your Videos",
      description: "Videos you've uploaded",
      path: user ? `/profile/${user.username}` : "/login",
      color: "bg-orange-600"
    }
  ]

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-bold mb-2 text-white">Sign in to see your library</h2>
        <p className="text-gray-400 mb-6">Access your history, playlists, and saved videos</p>
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
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-600 rounded-full">
          <Video size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Library</h1>
          <p className="text-gray-400">Your videos, playlists, and more</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {libraryItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="block p-6 bg-[#1f1f1f] rounded-lg border border-[#333] hover:bg-[#2a2a2a] transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 ${item.color} rounded-full group-hover:scale-110 transition-transform`}>
                <item.icon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-8 p-6 bg-[#1f1f1f] rounded-lg border border-[#333]">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Upload Video
          </Link>
          <Link
            to="/playlists"
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Playlist
          </Link>
          <Link
            to={`/profile/${user.username}`}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            View Channel
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Library