"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { commentAPI } from "../../services/api"
import { ThumbsUp, ThumbsDown, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import toast from "react-hot-toast"

const CommentSection = ({ videoId }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showDropdown, setShowDropdown] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [editContent, setEditContent] = useState("")
  const dropdownRefs = useRef({})
  const { user } = useAuth()

  useEffect(() => {
    if (videoId) {
      fetchComments()
    }
  }, [videoId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && dropdownRefs.current[showDropdown]) {
        if (!dropdownRefs.current[showDropdown].contains(event.target)) {
          setShowDropdown(null)
        }
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const fetchComments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!videoId) {
        throw new Error("Invalid video ID")
      }
      
      const response = await commentAPI.getVideoComments(videoId)
      
      // Handle different API response structures
      let commentsData = []
      
      if (response?.data?.docs) {
        // Paginated response with docs array
        commentsData = response.data.docs
      } else if (response?.data?.data?.docs) {
        // Nested paginated response
        commentsData = response.data.data.docs
      } else if (response?.data?.data) {
        commentsData = response.data.data
      } else if (response?.data && Array.isArray(response.data)) {
        commentsData = response.data
      } else if (response?.comments) {
        commentsData = response.comments
      } else if (response?.data && typeof response.data === 'object' && response.data !== null) {
        // Look for common array property names
        const possibleArrayProps = ['docs', 'comments', 'data', 'results', 'items', 'content', 'list']
        
        for (const prop of possibleArrayProps) {
          if (response.data.hasOwnProperty(prop) && Array.isArray(response.data[prop])) {
            commentsData = response.data[prop]
            break
          }
        }
      }
      
      // Ensure commentsData is an array
      if (!Array.isArray(commentsData)) {
        commentsData = []
      }
      
      setComments(commentsData)
      
    } catch (error) {
      setError(`Failed to load comments: ${error.message}`)
      toast.error("Failed to load comments")
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!user) return toast.error("Please login to comment")
    if (!newComment.trim()) return

    try {
      const response = await commentAPI.addComment(videoId, newComment.trim())
      
      // Handle different API response structures for adding comments
      let newCommentData = null
      
      if (response?.data?.data) {
        newCommentData = response.data.data
      } else if (response?.data) {
        newCommentData = response.data
      }
      
      if (newCommentData) {
        // Ensure the comment has proper owner information
        if (!newCommentData.owner || !newCommentData.owner.username) {
          newCommentData.owner = {
            _id: user._id,
            username: user.username,
            fullName: user.fullName,
            avatar: user.avatar
          }
        }
        
        // Ensure default values for likes
        if (newCommentData.likesCount === undefined) {
          newCommentData.likesCount = 0
        }
        if (newCommentData.isLiked === undefined) {
          newCommentData.isLiked = false
        }
        
        setComments(prev => [newCommentData, ...prev])
        setNewComment("")
        toast.success("Comment added successfully!")
      } else {
        throw new Error("No comment data received from API")
      }
    } catch (error) {
      console.error("Comment submission error:", error)
      toast.error("Failed to add comment")
    }
  }

  const handleLikeComment = async (commentId) => {
    if (!user) return toast.error("Please login to like comments")

    try {
      const response = await commentAPI.toggleCommentLike(commentId)
      
      const isLiked = response?.data?.data?.isLiked !== undefined
        ? response.data.data.isLiked
        : response?.data?.isLiked !== undefined
        ? response.data.isLiked
        : null

      setComments((prev) =>
        prev.map((comment) => {
          if (comment._id === commentId) {
            const currentIsLiked = comment.isLiked || false
            const newIsLiked = isLiked !== null ? isLiked : !currentIsLiked
            const currentLikesCount = comment.likesCount || 0
            
            let newLikesCount
            if (isLiked !== null) {
              // Use server response
              newLikesCount = isLiked ? currentLikesCount + 1 : Math.max(currentLikesCount - 1, 0)
            } else {
              // Toggle based on current state
              newLikesCount = currentIsLiked
                ? Math.max(currentLikesCount - 1, 0)
                : currentLikesCount + 1
            }
            
            return {
              ...comment,
              isLiked: newIsLiked,
              likesCount: newLikesCount,
            }
          }
          return comment
        })
      )
      
      // Show success message
      const currentComment = comments.find(c => c._id === commentId)
      const wasLiked = currentComment?.isLiked || false
      toast.success(isLiked !== null
        ? (isLiked ? "Comment liked!" : "Like removed")
        : (wasLiked ? "Like removed" : "Comment liked!"))
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to like comment")
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) {
      toast.error('Comment content cannot be empty')
      return
    }

    try {
      const response = await commentAPI.updateComment(commentId, editContent.trim())
      
      // Update the comment in local state
      setComments(prev => prev.map(comment =>
        comment._id === commentId
          ? { ...comment, content: editContent.trim() }
          : comment
      ))
      
      setEditingComment(null)
      setEditContent('')
      setShowDropdown(null)
      toast.success('Comment updated successfully!')
    } catch (error) {
      toast.error('Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      await commentAPI.deleteComment(commentId)
      
      // Remove the comment from local state
      setComments(prev => prev.filter(comment => comment._id !== commentId))
      setShowDropdown(null)
      toast.success('Comment deleted successfully!')
    } catch (error) {
      toast.error('Failed to delete comment')
    }
  }

  const startEdit = (comment) => {
    setEditingComment(comment._id)
    setEditContent(comment.content)
    setShowDropdown(null)
  }

  const cancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
  }

  const getFallbackAvatar = () => {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23374151'/%3E%3Cpath d='M20 8c3.314 0 6 2.686 6 6s-2.686 6-6 6-6-2.686-6-6 2.686-6 6-6zm0 16c4.418 0 8 1.79 8 4v2H12v-2c0-2.21 3.582-4 8-4z' fill='%23D1D5DB'/%3E%3C/svg%3E"
  }

  const getAvatarUrl = (avatarData) => {
    if (!avatarData) return getFallbackAvatar()
    if (typeof avatarData === 'string') return avatarData
    if (avatarData.url) return avatarData.url
    if (avatarData.secure_url) return avatarData.secure_url
    return getFallbackAvatar()
  }

  const getCommentOwnerAvatar = (comment) => {
    // Try to get avatar from comment owner
    if (comment.owner?.avatar) {
      return getAvatarUrl(comment.owner.avatar)
    }
    // If no avatar in comment owner, check if it's the same user and use current user's avatar
    if (user && comment.owner?.username === user.username) {
      return getAvatarUrl(user.avatar)
    }
    return getFallbackAvatar()
  }

  const commentsArray = Array.isArray(comments) ? comments : []

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold text-white mb-4">
        {commentsArray.length} Comment{commentsArray.length !== 1 ? 's' : ''}
      </h3>

      {user && (
        <form
          onSubmit={handleSubmitComment}
          className="flex items-start gap-3 mb-6"
        >
          <img
            src={getAvatarUrl(user.avatar)}
            alt={user.fullName || user.username || "User"}
            className="w-10 h-10 rounded-full object-cover"
            onError={(e) => { e.target.src = getFallbackAvatar() }}
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows="3"
              className="w-full bg-[#121212] text-white border border-[#333] rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button
                type="button"
                onClick={() => setNewComment("")}
                className="text-sm px-4 py-1.5 text-white bg-gray-700 rounded hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="text-sm px-4 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:opacity-50 transition-colors"
              >
                Comment
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex gap-3 p-4 animate-pulse">
              <div className="w-10 h-10 bg-[#2a2a2a] rounded-full flex-shrink-0"></div>
              <div className="flex-1">
                <div className="bg-[#2a2a2a] rounded h-4 w-1/4 mb-2"></div>
                <div className="bg-[#2a2a2a] rounded h-3 w-3/4 mb-1"></div>
                <div className="bg-[#2a2a2a] rounded h-3 w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchComments}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {commentsArray.length > 0 ? (
            commentsArray.map((comment) => (
              <div key={comment._id} className="flex gap-3">
                <img
                  src={getCommentOwnerAvatar(comment)}
                  alt={comment.owner?.fullName || comment.owner?.username || "User"}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => { e.target.src = getFallbackAvatar() }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="font-medium text-white">
                      {comment.owner?.fullName || comment.owner?.username || "Unknown User"}
                    </span>
                    <span>
                      {formatDistanceToNow(new Date(comment.createdAt))} ago
                    </span>
                  </div>
                  
                  {editingComment === comment._id ? (
                    <div className="mt-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-[#121212] text-white border border-[#333] rounded-lg p-3 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        rows="3"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={cancelEdit}
                          className="text-sm px-3 py-1 text-gray-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEditComment(comment._id)}
                          disabled={!editContent.trim()}
                          className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-white mt-1">{comment.content}</p>
                      <div className="flex items-center gap-4 mt-2 text-gray-400 text-sm">
                        <button
                          onClick={() => handleLikeComment(comment._id)}
                          className={`btn-animate flex items-center gap-1 p-2 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                            comment.isLiked
                              ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20"
                              : "text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                          }`}
                          style={{
                            animation: comment.isLiked ? "pulseHeart 0.6s ease-in-out" : ""
                          }}
                        >
                          <ThumbsUp
                            size={16}
                            className={`transition-all duration-300 ${
                              comment.isLiked
                                ? "fill-current transform scale-110"
                                : "hover:scale-110"
                            }`}
                            style={{
                              animation: comment.isLiked ? "bounceIn 0.5s ease-out" : ""
                            }}
                          />
                          <span className="text-sm font-medium transition-all duration-200">
                            {comment.likesCount || 0}
                          </span>
                        </button>
                        <button className="hover:text-red-400 flex items-center gap-1 transition-colors">
                          <ThumbsDown size={16} />
                        </button>
                        <button className="hover:text-gray-300 transition-colors">Reply</button>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Three-dot menu for comment owner */}
                {user && (comment.owner?._id === user._id || comment.owner?.id === user._id || comment.owner === user._id || comment.owner?.username === user.username) && editingComment !== comment._id && (
                  <div
                    className="relative overflow-visible"
                    ref={el => dropdownRefs.current[comment._id] = el}
                  >
                    <button
                      className="text-gray-400 hover:text-gray-200 transition-colors p-1 rounded-full hover:bg-gray-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDropdown(showDropdown === comment._id ? null : comment._id)
                      }}
                    >
                      <MoreVertical size={16} />
                    </button>
                    
                    {showDropdown === comment._id && (
                      <div className="absolute right-0 top-8 bg-[#2a2a2a] border border-[#444] rounded-lg shadow-xl z-50 min-w-[120px] overflow-visible">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEdit(comment)
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-white hover:bg-[#333] transition-colors w-full text-left text-sm rounded-t-lg"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteComment(comment._id)
                          }}
                          className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-[#333] transition-colors w-full text-left text-sm rounded-b-lg"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CommentSection