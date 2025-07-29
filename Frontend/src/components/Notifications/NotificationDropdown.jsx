"use client"

import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { Bell, Video, MessageSquare, X, Check, Trash2 } from "lucide-react"
import { useNotifications } from "../../contexts/NotificationContext"

const NotificationDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null)
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

  // Fetch latest notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ limit: 10 }) // Fetch only recent notifications for dropdown
    }
  }, [isOpen, fetchNotifications])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }
    onClose()
  }

  const handleMarkAllRead = () => {
    markAllAsRead()
  }

  const handleClearAll = () => {
    clearAllNotifications()
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'video':
        return <Video size={16} className="text-red-500" />
      case 'tweet':
        return <MessageSquare size={16} className="text-blue-500" />
      default:
        return <Bell size={16} className="text-gray-400" />
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

  if (!isOpen) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute top-[calc(100%+8px)] right-0 w-96 max-w-[90vw] bg-[#1f1f1f] border border-[#333] rounded-lg shadow-xl z-[1001] max-h-[80vh] overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#333]">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-white" />
          <h3 className="text-white font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
              title="Mark all as read"
            >
              <Check size={16} />
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-red-400 hover:text-red-300 text-sm transition-colors"
              title="Clear all"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="animate-pulse divide-y divide-[#333]">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex gap-3">
                  {/* Avatar skeleton */}
                  <div className="w-10 h-10 bg-[#2a2a2a] rounded-full flex-shrink-0"></div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-1">
                      {/* Icon skeleton */}
                      <div className="w-4 h-4 bg-[#2a2a2a] rounded mt-0.5"></div>
                      
                      <div className="flex-1 space-y-1">
                        {/* Title skeleton */}
                        <div className="h-3 bg-[#2a2a2a] rounded w-3/4"></div>
                        {/* Message skeleton */}
                        <div className="h-3 bg-[#2a2a2a] rounded w-full"></div>
                      </div>
                      
                      {/* Unread dot skeleton */}
                      <div className="w-2 h-2 bg-[#2a2a2a] rounded-full flex-shrink-0 mt-1"></div>
                    </div>
                    
                    {/* Thumbnail skeleton (for some cards) */}
                    {i % 2 === 0 && (
                      <div className="w-20 h-11 bg-[#2a2a2a] rounded mb-2"></div>
                    )}
                    
                    {/* Footer skeleton */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="h-2 bg-[#2a2a2a] rounded w-12"></div>
                      <div className="h-2 bg-[#2a2a2a] rounded w-16"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.slice(0, 10).length === 0 ? (
          <div className="text-center py-8 px-4">
            <Bell size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No notifications yet</p>
            <p className="text-gray-500 text-xs mt-1">
              You'll see notifications when subscribed channels upload videos or post tweets
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#333]">
            {notifications.slice(0, 10).map((notification) => (
              <div
                key={notification.id}
                className={`relative group ${
                  !notification.isRead ? 'bg-blue-500/10' : ''
                }`}
              >
                <Link
                  to={getNotificationLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                  className="block p-4 hover:bg-[#2a2a2a] transition-colors"
                >
                  <div className="flex gap-3">
                    {/* Channel Avatar */}
                    <img
                      src={notification.channelAvatar}
                      alt={notification.channelName}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        e.target.src = `data:image/svg+xml;base64,${btoa(`
                          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                            <rect width="40" height="40" fill="#444" rx="20"/>
                            <g transform="translate(20,20)">
                              <circle cx="0" cy="-4" r="6" fill="#666"/>
                              <path d="M-10,8 C-10,2 -6,-2 0,-2 C6,-2 10,2 10,8 Z" fill="#666"/>
                            </g>
                          </svg>
                        `)}`
                      }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <span className="text-white text-sm font-medium">
                          {notification.title}
                        </span>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                        )}
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      {/* Thumbnail for video notifications */}
                      {notification.type === 'video' && notification.thumbnail && (
                        <img
                          src={notification.thumbnail}
                          alt="Video thumbnail"
                          className="w-20 h-11 object-cover rounded mb-2"
                          onError={(e) => {
                            e.target.style.display = 'none'
                          }}
                        />
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-xs">
                          {formatDistanceToNow(notification.timestamp)} ago
                        </span>
                        <span className="text-gray-500 text-xs">
                          {notification.channelName}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    removeNotification(notification.id)
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all p-1"
                  title="Remove notification"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-[#333] p-3">
          <Link
            to="/notifications"
            onClick={onClose}
            className="block text-center text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown