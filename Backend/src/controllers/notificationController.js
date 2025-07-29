import { asyncHandler } from "../utils/asyncHandler.js"
import { apiErrors } from "../utils/apiErrors.js"
import { apiResponse } from "../utils/apiResponse.js"
import { Notification } from "../models/notificationModel.js"
import { userModel } from "../models/userModel.js"
import { videoModel } from "../models/videoModel.js"
import { tweetModel } from "../models/tweetModel.js"
import { subscriptionModel } from "../models/subscriptionModel.js"

// Get all notifications for the authenticated user
const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, type, isRead } = req.query
  const userId = req.user._id

  // Build filter object
  const filter = { recipient: userId }
  if (type) filter.type = type
  if (isRead !== undefined) filter.isRead = isRead === 'true'

  const notifications = await Notification.find(filter)
    .populate({
      path: "sender",
      select: "username fullName avatar",
    })
    .populate({
      path: "relatedVideo",
      select: "title thumbnail duration views",
    })
    .populate({
      path: "relatedTweet",
      select: "content createdAt",
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)

  const totalNotifications = await Notification.countDocuments(filter)
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  })

  return res.status(200).json(
    new apiResponse(200, {
      notifications,
      totalNotifications,
      unreadCount,
      currentPage: page,
      totalPages: Math.ceil(totalNotifications / limit),
    }, "Notifications fetched successfully")
  )
})

// Get unread notification count
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user._id

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  })

  return res.status(200).json(
    new apiResponse(200, { unreadCount }, "Unread count fetched successfully")
  )
})

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params
  const userId = req.user._id

  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  )

  if (!notification) {
    throw new apiErrors(404, "Notification not found")
  }

  return res.status(200).json(
    new apiResponse(200, notification, "Notification marked as read")
  )
})

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id

  await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  )

  return res.status(200).json(
    new apiResponse(200, {}, "All notifications marked as read")
  )
})

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params
  const userId = req.user._id

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  })

  if (!notification) {
    throw new apiErrors(404, "Notification not found")
  }

  return res.status(200).json(
    new apiResponse(200, {}, "Notification deleted successfully")
  )
})

// Clear all notifications
const clearAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id

  await Notification.deleteMany({ recipient: userId })

  return res.status(200).json(
    new apiResponse(200, {}, "All notifications cleared successfully")
  )
})

// Create notification (internal function)
const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  relatedVideo = null,
  relatedTweet = null,
  thumbnail = null,
}) => {
  try {
    // Don't create notification if sender and recipient are the same
    if (sender.toString() === recipient.toString()) {
      return null
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedVideo,
      relatedTweet,
      thumbnail,
    })

    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

// Create notifications for new video upload
const createVideoNotification = async (videoId, uploaderId) => {
  try {
    const video = await videoModel.findById(videoId).populate("owner", "username fullName")
    if (!video) return

    // Get all subscribers of the video uploader
    const subscriptions = await subscriptionModel.find({ channel: uploaderId })
    
    const notifications = subscriptions.map(subscription => ({
      recipient: subscription.subscriber,
      sender: uploaderId,
      type: "video",
      title: `${video.owner.fullName} uploaded a new video`,
      message: video.title,
      relatedVideo: videoId,
      thumbnail: video.thumbnail,
    }))

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }
  } catch (error) {
    console.error("Error creating video notifications:", error)
  }
}

// Create notifications for new tweet
const createTweetNotification = async (tweetId, authorId) => {
  try {
    const tweet = await tweetModel.findById(tweetId).populate("owner", "username fullName")
    if (!tweet) return

    // Get all subscribers of the tweet author
    const subscriptions = await subscriptionModel.find({ channel: authorId })
    
    const notifications = subscriptions.map(subscription => ({
      recipient: subscription.subscriber,
      sender: authorId,
      type: "tweet",
      title: `${tweet.owner.fullName} posted a new tweet`,
      message: tweet.content.substring(0, 100) + (tweet.content.length > 100 ? "..." : ""),
      relatedTweet: tweetId,
    }))

    if (notifications.length > 0) {
      await Notification.insertMany(notifications)
    }
  } catch (error) {
    console.error("Error creating tweet notifications:", error)
  }
}

export {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  createNotification,
  createVideoNotification,
  createTweetNotification,
}