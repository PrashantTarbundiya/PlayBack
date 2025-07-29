"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { Bell, Video, MessageSquare, Check, CheckCheck, Trash2, Filter } from "lucide-react"
import { useNotifications } from "../contexts/NotificationContext"

const Notifications = () => {
  const [filter, setFilter] = useState("all") 
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    fetchNotifications
  } = useNotifications()

  // Fetch notifications when component mounts or filter changes
  useEffect(() => {
    const params = {}
    if (filter === "unread") params.isRead = false
    if (filter === "videos") params.type = "video"
    if (filter === "tweets") params.type = "tweet"
    
    fetchNotifications(params)
  }, [filter, fetchNotifications])

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case "unread":
        return !notification.isRead
      case "videos":
        return notification.type === "video"
      case "tweets":
        return notification.type === "tweet"
      default:
        return true
    }
  })

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={20} className="text-red-500" />
      case 'tweet':
        return <MessageSquare size={20} className="text-blue-500" />
      default:
        return <Bell size={20} className="text-gray-400" />
    }
  }

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'video':
        return notification.videoId ? `/watch/${notification.videoId}` : '/trending'
      case 'tweet':
        return '/tweets'
      default:
        return '/'
    }
  }

  const filterOptions = [
    { value: "all", label: "All", count: notifications.length },
    { value: "unread", label: "Unread", count: unreadCount },
    { value: "videos", label: "Videos", count: notifications.filter(n => n.type === "video").length },
    { value: "tweets", label: "Tweets", count: notifications.filter(n => n.type === "tweet").length }
  ]

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell size={28} className="text-white" />
            <h1 className="text-2xl font-bold">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-sm"
              >
                <CheckCheck size={16} />
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors text-sm"
              >
                <Trash2 size={16} />
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          <Filter size={20} className="text-gray-400 flex-shrink-0" />
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                filter === option.value
                  ? "bg-[#3ea6ff] text-white"
                  : "bg-[#272727] text-gray-300 hover:bg-[#3a3a3a]"
              }`}
            >
              {option.label}
              {option.count > 0 && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  filter === option.value
                    ? "bg-white/20"
                    : "bg-gray-600"
                }`}>
                  {option.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-[#1e1e1e] rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-[#2a2a2a] rounded-full flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="bg-[#2a2a2a] rounded h-4 w-3/4 mb-2"></div>
                  <div className="bg-[#2a2a2a] rounded h-3 w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell size={64} className="text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-medium text-gray-300 mb-2">
              {filter === "all" ? "No notifications yet" : `No ${filter} notifications`}
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              {filter === "all" 
                ? "You'll see notifications when subscribed channels upload videos or post tweets"
                : `No ${filter} notifications to show`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`relative group border border-[#333] rounded-lg overflow-hidden transition-all hover:border-[#555] ${
                  !notification.isRead ? 'bg-blue-500/5 border-blue-500/30' : 'bg-[#1a1a1a]'
                }`}
              >
                <Link
                  to={getNotificationLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                  className="block p-4 hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Channel Avatar */}
                    <img
                      src={notification.channelAvatar}
                      alt={notification.channelName}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = `data:image/svg+xml;base64,${btoa(`
                          <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <rect width="48" height="48" fill="#444" rx="24"/>
                            <g transform="translate(24,24)">
                              <circle cx="0" cy="-4" r="6" fill="#666"/>
                              <path d="M-12,10 C-12,2 -8,-2 0,-2 C8,-2 12,2 12,10 Z" fill="#666"/>
                            </g>
                          </svg>
                        `)}`
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3 mb-2">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1 line-clamp-2">
                            {notification.title}
                          </h3>
                          <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>

                      {/* Thumbnail for video notifications */}
                      {notification.type === 'video' && notification.thumbnail && (
                        <img
                          src={notification.thumbnail}
                          alt="Video thumbnail"
                          className="w-32 h-18 object-cover rounded mb-3"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">
                          {formatDistanceToNow(notification.timestamp)} ago
                        </span>
                        <span className="text-gray-400">
                          {notification.channelName}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Action buttons */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  {!notification.isRead && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        markAsRead(notification.id)
                      }}
                      className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                      title="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeNotification(notification.id)
                    }}
                    className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    title="Remove notification"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notifications