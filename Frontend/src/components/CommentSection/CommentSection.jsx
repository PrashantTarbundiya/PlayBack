"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "../../contexts/AuthContext"
import { commentAPI } from "../../services/api"
import { ThumbsUp, ThumbsDown, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import toast from "react-hot-toast"

const CommentSection = ({ videoId, onTimeClick, videoOwnerId, videoOwnerName, videoOwnerAvatar }) => {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('newest')
  const [showDropdown, setShowDropdown] = useState(null)
  const [editingComment, setEditingComment] = useState(null)
  const [editContent, setEditContent] = useState("")
  const [isMobileExpanded, setIsMobileExpanded] = useState(false)
  const dropdownRefs = useRef({})
  const { user } = useAuth()

  // Prevent body scroll when mobile sheet is opened
  useEffect(() => {
    if (isMobileExpanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileExpanded])

  useEffect(() => {
    if (videoId) {
      fetchComments()
    }
  }, [videoId, sortBy])

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
      
      const response = await commentAPI.getVideoComments(videoId, 1, 20, sortBy)
      
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
      toast.remove()
      toast.error("Failed to load comments")
      setComments([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!user) return toast.remove(), toast.error("Please login to comment")
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
        toast.remove()
        toast.success("Comment added successfully!")
      } else {
        throw new Error("No comment data received from API")
      }
    } catch (error) {
      console.error("Comment submission error:", error)
      toast.remove()
      toast.error("Failed to add comment")
    }
  }

  const handleLikeComment = async (commentId) => {
    if (!user) return toast.remove(), toast.error("Please login to like comments")

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
              isHearted: user?._id === videoOwnerId ? newIsLiked : comment.isHearted,
            }
          }
          return comment
        })
      )
      
      // Show success message
      const currentComment = comments.find(c => c._id === commentId)
      const wasLiked = currentComment?.isLiked || false
      toast.remove()
      toast.success(isLiked !== null
        ? (isLiked ? "Comment liked!" : "Like removed")
        : (wasLiked ? "Like removed" : "Comment liked!"))
    } catch (error) {
      toast.remove()
      toast.error(error.response?.data?.message || "Failed to like comment")
    }
  }

  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) {
      toast.remove()
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
      toast.remove()
      toast.success('Comment updated successfully!')
    } catch (error) {
      toast.remove()
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
      toast.remove()
      toast.success('Comment deleted successfully!')
    } catch (error) {
      toast.remove()
      toast.error('Failed to delete comment')
    }
  }

  const handleTogglePin = async (commentId) => {
    try {
      const response = await commentAPI.toggleCommentPin(commentId)
      const data = response.data?.data
      
      if (data) {
        setComments(prev => {
          // Unpin all other comments and update the target comment
          return prev.map(c => {
            if (c._id === data._id) return { ...c, isPinned: data.isPinned }
            return { ...c, isPinned: false }
          }).sort((a, b) => {
            // Re-sort so pinned is at the top locally
            if (a._id === data._id && data.isPinned) return -1;
            if (b._id === data._id && data.isPinned) return 1;
            return 0; // Other sorting remains roughly the same as they were fetched
          })
        })
        setShowDropdown(null)
        toast.remove()
        toast.success(data.isPinned ? 'Comment pinned!' : 'Comment unpinned')
      }
    } catch (error) {
      toast.remove()
      toast.error('Failed to pin comment')
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

  const parseTimestamp = (timestamp) => {
    const parts = timestamp.split(':').map(Number);
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1];
    }
    return 0;
  };

  const renderCommentContent = (content) => {
    if (!content) return null;
    
    // Split by time format like 11:11 or 1:05:22
    const timeRegex = /((?:(?:(?:[0-9]{1,2}):)?[0-5]?[0-9]:[0-5][0-9]))/g;
    const parts = content.split(timeRegex);
    
    return parts.map((part, index) => {
      if (/^(?:(?:(?:[0-9]{1,2}):)?[0-5]?[0-9]:[0-5][0-9])$/.test(part)) {
        return (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onTimeClick) {
                onTimeClick(parseTimestamp(part));
              }
            }}
            className="text-blue-400 hover:text-blue-300 hover:underline font-medium px-1 bg-blue-500/10 rounded transition-colors"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <>
      {/* Mobile Preview Box */}
      <div 
        className="md:hidden bg-[#272727] rounded-xl p-4 cursor-pointer hover:bg-[#3f3f3f] transition-colors"
        onClick={() => setIsMobileExpanded(true)}
      >
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-white font-bold text-sm">
            Comments <span className="text-gray-400 font-normal ml-1">{commentsArray.length.toLocaleString()}</span>
          </h3>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white"><path fillRule="evenodd" d="M11.47 7.72a.75.75 0 011.06 0l7.5 7.5a.75.75 0 11-1.06 1.06L12 9.31l-6.97 6.97a.75.75 0 01-1.06-1.06l7.5-7.5z" clipRule="evenodd" /></svg>
        </div>
        {commentsArray.length > 0 ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src={getCommentOwnerAvatar(commentsArray[0])}
              alt=""
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              onError={(e) => { e.target.src = getFallbackAvatar() }}
            />
            <p className="text-xs text-white truncate w-full">
              <span className="text-gray-400 mr-2 font-medium">@{commentsArray[0].owner?.username || "user"}</span>
              {commentsArray[0].content}
            </p>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No comments yet. Be the first to comment!</p>
        )}
      </div>

      {/* Full Comments Area */}
      <div className={`
        ${isMobileExpanded ? 'fixed bottom-0 left-0 right-0 h-[75vh] z-[2000] bg-[#0f0f0f] flex flex-col rounded-t-2xl transform transition-transform duration-300 shadow-[0_-10px_50px_rgba(0,0,0,0.8)]' : 'hidden md:block'}
        md:relative md:inset-auto md:z-auto md:bg-transparent md:block md:mt-8 px-0 md:px-0 md:h-auto md:rounded-none md:shadow-none
      `}>
        {/* Mobile Header (Only visible when expanded) */}
        {isMobileExpanded && (
          <div className="flex items-center justify-between p-4 border-b border-[#3f3f3f] md:hidden sticky top-0 bg-[#0f0f0f] rounded-t-2xl z-10 shrink-0">
            <h3 className="text-lg font-bold text-white">Comments</h3>
            <button 
              onClick={() => setIsMobileExpanded(false)} 
              className="p-2 text-white hover:bg-[#272727] rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <div className={`${isMobileExpanded ? 'overflow-y-auto flex-1 p-4 pb-20' : ''}`}>
          <div className="flex items-center gap-8 mb-6">
            <h3 className="text-xl font-bold text-white hidden md:block">
              {commentsArray.length.toLocaleString()} Comments
            </h3>
        
        <div className="relative" ref={el => dropdownRefs.current['sort'] = el}>
           <button 
             onClick={() => setShowDropdown(showDropdown === 'sort' ? null : 'sort')}
             className="flex items-center gap-2 text-sm font-semibold text-white hover:text-gray-300 transition-colors"
           >
             <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" className="fill-current w-6 h-6"><path d="M21 6H3V5h18v1zm-6 5H3v1h12v-1zm-6 6H3v1h6v-1z"></path></svg>
             Sort by
           </button>
           
           {showDropdown === 'sort' && (
             <div className="absolute top-8 left-0 z-50 bg-[#282828] rounded-xl shadow-lg shadow-black/50 py-2 w-64 border border-[#3f3f3f]">
               <button 
                 onClick={() => { setSortBy('top'); setShowDropdown(null); }}
                 className={`w-full text-left px-4 py-3 hover:bg-[#3f3f3f] transition-colors flex flex-col ${sortBy === 'top' ? 'bg-[#3f3f3f]' : ''}`}
               >
                 <span className="text-white text-[15px]">Top comments</span>
               </button>
               <button 
                 onClick={() => { setSortBy('newest'); setShowDropdown(null); }}
                 className={`w-full text-left px-4 py-3 hover:bg-[#3f3f3f] transition-colors flex flex-col ${sortBy === 'newest' ? 'bg-[#3f3f3f]' : ''}`}
               >
                 <span className="text-white text-[15px]">Newest first</span>
               </button>
             </div>
           )}
        </div>
      </div>

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
              <div key={comment._id} className="relative group/comment flex gap-4">
                <img
                  src={getCommentOwnerAvatar(comment)}
                  alt={comment.owner?.fullName || comment.owner?.username || "User"}
                  className="w-10 h-10 rounded-full object-cover mt-1 cursor-pointer"
                  onError={(e) => { e.target.src = getFallbackAvatar() }}
                />
                <div className="flex-1 min-w-0">
                  {/* Pinned Badge */}
                  {comment.isPinned && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium mb-1">
                      <span className="text-[13px]">📌</span>
                      <span>Pinned by</span>
                      <img 
                         src={getAvatarUrl(videoOwnerAvatar)} 
                         alt={videoOwnerName}
                         className="w-4 h-4 rounded-full object-cover ml-0.5"
                      />
                      <span className="font-medium">@{videoOwnerName.replace(/\s+/g, '').toLowerCase()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center flex-wrap gap-1 text-[13px]">
                    <span 
                      className={`font-medium truncate cursor-pointer mr-1 ${
                        comment.owner?._id === videoOwnerId 
                          ? 'bg-[#888888] text-white px-2 py-[1px] rounded-[10px]' 
                          : 'text-white'
                      }`}
                    >
                      @{comment.owner?.username || "user"}
                    </span>
                    <span className="text-gray-400 hover:text-gray-300 cursor-pointer">
                      {formatDistanceToNow(new Date(comment.createdAt))} ago
                    </span>
                    {comment.isEdited && <span className="text-gray-400 ml-1">(edited)</span>}
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
                      <div className="text-[15px] text-white mt-1 mb-1 whitespace-pre-wrap leading-[20px] break-words">
                        {renderCommentContent(comment.content)}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-gray-400">
                        <button
                          onClick={() => handleLikeComment(comment._id)}
                          className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-700/50 transition-colors"
                        >
                          <ThumbsUp
                            size={16}
                            className={`transition-all duration-200 ${
                              comment.isLiked ? "fill-white text-white" : ""
                            }`}
                          />
                        </button>
                        <span className="text-[13px] text-gray-400 mr-2 min-w-[12px]">
                          {comment.likesCount > 0 ? comment.likesCount : ''}
                        </span>
                        
                        <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-700/50 transition-colors mr-2">
                          <ThumbsDown size={16} />
                        </button>
                        
                        {/* Heart Badge */}
                        {comment.isHearted && (
                           <div className="relative group cursor-pointer ml-1">
                             <div className="flex items-center justify-center relative">
                               <img 
                                 src={getAvatarUrl(videoOwnerAvatar)} 
                                 className="w-4 h-4 rounded-full object-cover border-[1.5px] border-[#0f0f0f] shadow-sm"
                                 alt="Owner"
                               />
                               <div className="absolute -bottom-1 -right-1.5 bg-[#121212] rounded-full p-[1px]">
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[10px] h-[10px] text-red-500">
                                   <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                                 </svg>
                               </div>
                             </div>
                           </div>
                        )}

                        <button className="text-[13px] font-medium px-3 py-1.5 rounded-full hover:bg-gray-700/50 transition-colors">
                          Reply
                        </button>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Three-dot menu */}
                {user && (user?._id === videoOwnerId || comment.owner?._id === user?._id || comment.owner?.id === user?._id || comment.owner === user?._id || comment.owner?.username === user?.username) && (
                <div
                  className="relative md:opacity-0 group-hover/comment:opacity-100 transition-opacity"
                  ref={el => dropdownRefs.current[comment._id] = el}
                >
                  <button
                    className="text-white hover:bg-[#3f3f3f] transition-colors p-2 rounded-full mt-2 mr-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDropdown(showDropdown === comment._id ? null : comment._id)
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {showDropdown === comment._id && (
                    <div className="absolute right-0 top-12 bg-[#282828] rounded-xl shadow-lg shadow-black/50 z-50 min-w-[200px] border border-[#3f3f3f] py-2">
                        
                        {/* Option: Pin Comment (video owner only) */}
                      {user?._id === videoOwnerId && (
                           <button
                             onClick={(e) => {
                               e.stopPropagation()
                               handleTogglePin(comment._id)
                             }}
                             className={`flex items-center gap-4 px-4 py-2 text-white hover:bg-[#3f3f3f] transition-colors w-full text-left text-[14px]`}
                           >
                             <span className="w-[18px] h-[18px] text-[16px] flex items-center justify-center">📌</span>
                             {comment.isPinned ? 'Unpin' : 'Pin'}
                           </button>
                      )}

                      {/* Options: Edit & Delete (comment owner only) */}
                      {(comment.owner?._id === user?._id || comment.owner?.id === user?._id || comment.owner === user?._id || comment.owner?.username === user?.username) && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              startEdit(comment)
                            }}
                            className={`flex items-center gap-4 px-4 py-2 text-white hover:bg-[#3f3f3f] transition-colors w-full text-left text-[14px]`}
                          >
                            <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" className="w-[18px] h-[18px] fill-current text-white"><g><path d="M14.06,9.02l0.92,0.92L5.92,19H5v-0.92L14.06,9.02 M17.66,3c-0.25,0-0.51,0.1-0.7,0.29l-1.83,1.83l3.75,3.75l1.83-1.83 c0.39-0.39,0.39-1.02,0-1.41l-2.34-2.34C18.17,3.09,17.92,3,17.66,3L17.66,3z M14.06,6.19L3,17.25V21h3.75L17.81,9.94L14.06,6.19 L14.06,6.19z"></path></g></svg>
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteComment(comment._id)
                            }}
                            className="flex items-center gap-4 px-4 py-2 text-white hover:bg-[#3f3f3f] transition-colors w-full text-left text-[14px]"
                          >
                            <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" className="w-[18px] h-[18px] fill-current text-white"><g><path d="M11,17H9V8h2V17z M15,8h-2v9h2V8z M19,4v1h-1v16H6V5H5V4h4V3h6v1H19z M17,5H7v15h10V5z"></path></g></svg>
                            Delete
                          </button>
                        </>
                      )}
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
    </div>
    </>
  )
}

export default CommentSection