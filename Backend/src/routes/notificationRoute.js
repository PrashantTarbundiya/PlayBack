import { Router } from "express"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
} from "../controllers/notificationController.js"
import { verifyJWT } from "../middlewares/authMiddleware.js"

const router = Router()

// Apply auth middleware to all routes
router.use(verifyJWT)

// Get all notifications for authenticated user
router.route("/").get(getNotifications)

// Get unread notification count
router.route("/unread-count").get(getUnreadCount)

// Mark all notifications as read
router.route("/mark-all-read").patch(markAllAsRead)

// Clear all notifications
router.route("/clear-all").delete(clearAllNotifications)

// Mark specific notification as read
router.route("/:notificationId/read").patch(markAsRead)

// Delete specific notification
router.route("/:notificationId").delete(deleteNotification)

export default router