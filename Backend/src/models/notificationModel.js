import mongoose from "mongoose"

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["video", "tweet", "subscription", "like", "comment"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedVideo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
    },
    relatedTweet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    thumbnail: {
      type: String, // URL for video thumbnail
    },
  },
  {
    timestamps: true,
  }
)

// Index for efficient queries
notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, isRead: 1 })

export const Notification = mongoose.model("Notification", notificationSchema)