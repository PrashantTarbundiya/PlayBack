"use client"

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react"
import { useAuth } from "./AuthContext"
import api from "../services/api"
import toast from "react-hot-toast"

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider")
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const { user, isAuthenticated } = useAuth()

  // Polling interval for notifications
  const POLLING_INTERVAL = 2 * 60 * 1000

  // Fetch notifications from API
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticated) return

    try {
      setLoading(true)
      const response = await api.get("/notifications", { params })
      
      if (response.data?.success) {
        const { notifications: fetchedNotifications, unreadCount: count } = response.data.data
        
        // Transform API data to match frontend format
        const transformedNotifications = fetchedNotifications.map(notification => ({
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          channelName: notification.sender?.fullName || notification.sender?.username || "Unknown",
          channelAvatar: notification.sender?.avatar?.url || notification.sender?.avatar || "",
          timestamp: new Date(notification.createdAt),
          isRead: notification.isRead,
          videoId: notification.relatedVideo?._id,
          thumbnail: notification.thumbnail || notification.relatedVideo?.thumbnail?.url,
          tweetId: notification.relatedTweet?._id,
        }))
        
        setNotifications(transformedNotifications)
        setUnreadCount(count)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
      toast.error("Failed to fetch notifications")
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  // Fetch unread count only (lightweight)
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return

    try {
      const response = await api.get("/notifications/unread-count")
      if (response.data?.success) {
        setUnreadCount(response.data.data.unreadCount)
      }
    } catch (error) {
      console.error("Error fetching unread count:", error)
      // Silently fail for background polling
    }
  }, [isAuthenticated])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`)
      
      if (response.data?.success) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
      toast.error("Failed to mark notification as read")
    }
  }, [])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await api.patch("/notifications/mark-all-read")
      
      if (response.data?.success) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, isRead: true }))
        )
        setUnreadCount(0)
        toast.success("All notifications marked as read")
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      toast.error("Failed to mark all notifications as read")
    }
  }, [])

  // Remove notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`)
      
      if (response.data?.success) {
        const removedNotification = notifications.find(n => n.id === notificationId)
        setNotifications(prev => prev.filter(notification => notification.id !== notificationId))
        
        if (removedNotification && !removedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        toast.success("Notification removed")
      }
    } catch (error) {
      console.error("Error removing notification:", error)
      toast.error("Failed to remove notification")
    }
  }, [notifications])

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const response = await api.delete("/notifications/clear-all")
      
      if (response.data?.success) {
        setNotifications([])
        setUnreadCount(0)
        toast.success("All notifications cleared")
      }
    } catch (error) {
      console.error("Error clearing all notifications:", error)
      toast.error("Failed to clear all notifications")
    }
  }, [])

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    const transformedNotification = {
      id: notification._id || Date.now().toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      channelName: notification.sender?.fullName || notification.sender?.username || "Unknown",
      channelAvatar: notification.sender?.avatar?.url || notification.sender?.avatar || "",
      timestamp: new Date(notification.createdAt || Date.now()),
      isRead: false,
      videoId: notification.relatedVideo?._id,
      thumbnail: notification.thumbnail || notification.relatedVideo?.thumbnail?.url,
      tweetId: notification.relatedTweet?._id,
    }

    setNotifications(prev => [transformedNotification, ...prev])
    setUnreadCount(prev => prev + 1)
  }, [])

  // Fetch notifications when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications({})
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isAuthenticated, user, fetchNotifications])

  // Periodically fetch unread count (reduced frequency)
  useEffect(() => {
    if (!isAuthenticated) return

    const interval = setInterval(() => {
      fetchUnreadCount()
    }, POLLING_INTERVAL) // Check every 2 minutes instead of 30 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated, fetchUnreadCount, POLLING_INTERVAL])

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    addNotification,
  }), [
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    addNotification,
  ])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}