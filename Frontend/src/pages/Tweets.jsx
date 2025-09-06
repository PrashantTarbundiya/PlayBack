import React, { useState, useEffect, useCallback } from 'react';
import { tweetAPI, likeAPI, subscriptionAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Heart, MessageCircle, MoreHorizontal, Edit2, Trash2, Send, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

const Tweets = () => {
  const { user } = useAuth();
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTweet, setNewTweet] = useState('');
  const [editingTweet, setEditingTweet] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [showDropdown, setShowDropdown] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'following'

  const fetchTweets = useCallback(async () => {
    try {
      setLoading(true);
      const response = await tweetAPI.getAllTweets(1, 20);
      const tweetsData = response.data?.data || [];
      
      // Ensure each tweet has proper like state
      const tweetsWithLikeState = tweetsData.map(tweet => ({
        ...tweet,
        isLiked: Boolean(tweet.isLiked),
        likesCount: tweet.likesCount || 0
      }));
      
      // Filter tweets based on active tab
      if (activeTab === 'following' && user) {
        try {
          // Get subscribed channels
          const subscriptionsResponse = await subscriptionAPI.getSubscribedChannels(user._id);
          const subscribedChannels = subscriptionsResponse.data?.data || [];
          
          // Extract the channel IDs that the user is subscribed to
          const subscribedChannelIds = subscribedChannels.map(sub =>
            sub.subscribedChannel?._id || sub.subscribedChannel
          ).filter(Boolean);
          
          // Also include user's own tweets
          subscribedChannelIds.push(user._id);
          
          // Filter tweets to only show those from subscribed channels
          const followingTweets = tweetsWithLikeState.filter(tweet =>
            subscribedChannelIds.includes(tweet.owner)
          );
          
          setTweets(followingTweets);
        } catch (subscriptionError) {
          // Fallback to showing all tweets if subscription fetch fails
          setTweets(tweetsWithLikeState);
        }
      } else {
        setTweets(tweetsWithLikeState);
      }
    } catch (error) {
      toast.remove()
      toast.error('Failed to load tweets');
    } finally {
      setLoading(false);
    }
  }, [activeTab, user]);

  useEffect(() => {
    fetchTweets();
  }, [fetchTweets]);


  const handleCreateTweet = async (e) => {
    e.preventDefault();
    if (!newTweet.trim()) {
      toast.remove()
      toast.error('Tweet content cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      const response = await tweetAPI.createTweet({ content: newTweet });
      const createdTweet = response.data?.data;
      
      // Add the new tweet to the top of the list with user details
      const tweetWithDetails = {
        ...createdTweet,
        ownerDetails: {
          username: user.username,
          fullName: user.fullName,
          avatar: user.avatar?.url || user.avatar
        },
        likesCount: 0,
        isLiked: false
      };
      
      setTweets(prevTweets => [tweetWithDetails, ...prevTweets]);
      setNewTweet('');
      toast.remove()
      toast.success('Tweet created successfully!');
    } catch (error) {
      toast.remove()
      toast.error('Failed to create tweet');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateTweet = async (tweetId) => {
    if (!editContent.trim()) {
      toast.remove()
      toast.error('Tweet content cannot be empty');
      return;
    }

    try {
      await tweetAPI.updateTweet(tweetId, { content: editContent });
      setTweets(prevTweets => prevTweets.map(tweet =>
        tweet._id === tweetId
          ? { ...tweet, content: editContent }
          : tweet
      ));
      setEditingTweet(null);
      setEditContent('');
      setShowDropdown(null);
      toast.remove()
      toast.success('Tweet updated successfully!');
    } catch (error) {
      toast.remove()
      toast.error('Failed to update tweet');
    }
  };

  const handleDeleteTweet = async (tweetId) => {
    if (!window.confirm('Are you sure you want to delete this tweet?')) {
      return;
    }

    try {
      await tweetAPI.deleteTweet(tweetId);
      setTweets(prevTweets => prevTweets.filter(tweet => tweet._id !== tweetId));
      setShowDropdown(null);
      toast.remove()
      toast.success('Tweet deleted successfully!');
    } catch (error) {
      toast.remove()
      toast.error('Failed to delete tweet');
    }
  };

  const handleToggleLike = async (tweetId) => {
    if (!user) {
      toast.remove()
      toast.error('Please login to like tweets');
      return;
    }

    // Find the current tweet to get its current state
    const currentTweet = tweets.find(tweet => tweet._id === tweetId);
    if (!currentTweet) return;

    // Store original state for potential revert
    const originalIsLiked = Boolean(currentTweet.isLiked);
    const originalLikesCount = currentTweet.likesCount || 0;

    try {
      // Optimistically update UI for immediate feedback
      setTweets(prevTweets => prevTweets.map(tweet => {
        if (tweet._id === tweetId) {
          return {
            ...tweet,
            isLiked: !originalIsLiked,
            likesCount: originalIsLiked ? originalLikesCount - 1 : originalLikesCount + 1
          };
        }
        return tweet;
      }));

      // Make API call and get response
      const response = await likeAPI.toggleTweetLike(tweetId);
      const { isLiked, likesCount } = response.data?.data || {};
      
      // Update with actual backend response
      setTweets(prevTweets => prevTweets.map(tweet => {
        if (tweet._id === tweetId) {
          return {
            ...tweet,
            isLiked: Boolean(isLiked),
            likesCount: likesCount || 0
          };
        }
        return tweet;
      }));
      
    } catch (error) {
      toast.remove()
      toast.error('Failed to toggle like');
      
      // Revert optimistic update on error
      setTweets(prevTweets => prevTweets.map(tweet => {
        if (tweet._id === tweetId) {
          return {
            ...tweet,
            isLiked: originalIsLiked,
            likesCount: originalLikesCount
          };
        }
        return tweet;
      }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    
    return date.toLocaleDateString();
  };

  const startEdit = (tweet) => {
    setEditingTweet(tweet._id);
    setEditContent(tweet.content);
    setShowDropdown(null);
  };

  const cancelEdit = () => {
    setEditingTweet(null);
    setEditContent('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white">
        <div className="max-w-2xl mx-auto p-4">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Tweets</h1>
            <p className="text-gray-400">Share your thoughts with the community</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex border-b border-gray-700">
              <button className="flex-1 py-3 px-4 text-center font-medium text-blue-500 border-b-2 border-blue-500">
                All Tweets
              </button>
              <button className="flex-1 py-3 px-4 text-center font-medium text-gray-400">
                Following
              </button>
            </div>
          </div>

          {/* Loading State */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="bg-[#1a1a1a] rounded-lg p-4 animate-pulse">
                <div className="flex space-x-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="flex space-x-2">
                      <div className="h-4 bg-gray-700 rounded w-24"></div>
                      <div className="h-4 bg-gray-700 rounded w-16"></div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-700 rounded w-full"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                    <div className="flex space-x-4">
                      <div className="h-6 bg-gray-700 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Tweets</h1>
          <p className="text-gray-400">Share your thoughts with the community</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Tweets
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-3 px-4 text-center font-medium transition-colors ${
                activeTab === 'following'
                  ? 'text-blue-500 border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
              disabled={!user}
            >
              Following
            </button>
          </div>
        </div>

        {/* Create Tweet Form */}
        {user ? (
          <div className="bg-[#1a1a1a] rounded-lg p-4 mb-6">
            <form onSubmit={handleCreateTweet}>
              <div className="flex space-x-3">
                <img
                  src={user.avatar?.url || user.avatar || '/default-avatar.png'}
                  alt={user.username}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
                <div className="flex-1">
                  <textarea
                    value={newTweet}
                    onChange={(e) => setNewTweet(e.target.value)}
                    placeholder="What's happening?"
                    className="w-full bg-transparent text-white placeholder-gray-400 resize-none border-none outline-none text-lg"
                    rows="3"
                    maxLength="280"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-sm text-gray-400">
                      {newTweet.length}/280
                    </span>
                    <button
                      type="submit"
                      disabled={!newTweet.trim() || submitting}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-full font-medium flex items-center space-x-2"
                    >
                      <Send size={16} />
                      <span>{submitting ? 'Posting...' : 'Tweet'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6 text-center">
            <LogIn size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Join the conversation</h3>
            <p className="text-gray-400 mb-4">Sign in to share your thoughts and interact with tweets</p>
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-full font-medium text-white inline-flex items-center space-x-2"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </Link>
          </div>
        )}

        {/* Tweets List */}
        <div className="space-y-4">
          {tweets.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No tweets yet</h3>
              <p className="text-gray-500">Be the first to share something!</p>
            </div>
          ) : (
            tweets.map((tweet) => (
              <div key={tweet._id} className="bg-[#1a1a1a] rounded-lg p-4 hover:bg-[#2a2a2a] transition-colors">
                <div className="flex space-x-3">
                  <img
                    src={tweet.ownerDetails?.avatar || '/default-avatar.png'}
                    alt={tweet.ownerDetails?.username || 'User'}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-white">
                          {tweet.ownerDetails?.fullName || tweet.ownerDetails?.username}
                        </h3>
                        <span className="text-gray-400">@{tweet.ownerDetails?.username}</span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-500 text-sm">
                          {formatDate(tweet.createdAt)}
                        </span>
                      </div>
                      
                      {user && user._id === tweet.owner && (
                        <div className="relative">
                          <button
                            onClick={() => setShowDropdown(showDropdown === tweet._id ? null : tweet._id)}
                            className="p-1 rounded-full hover:bg-[#2a2a2a] transition-colors"
                          >
                            <MoreHorizontal size={16} className="text-gray-400" />
                          </button>
                          
                          {showDropdown === tweet._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-[#2a2a2a] rounded-lg shadow-lg z-10">
                              <button
                                onClick={() => startEdit(tweet)}
                                className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center space-x-2 rounded-t-lg"
                              >
                                <Edit2 size={16} />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteTweet(tweet._id)}
                                className="w-full px-4 py-2 text-left hover:bg-[#3a3a3a] flex items-center space-x-2 text-red-400 rounded-b-lg"
                              >
                                <Trash2 size={16} />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      {editingTweet === tweet._id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full bg-[#2a2a2a] text-white rounded-lg p-3 resize-none border-none outline-none"
                            rows="3"
                            maxLength="280"
                          />
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                              {editContent.length}/280
                            </span>
                            <div className="space-x-2">
                              <button
                                onClick={cancelEdit}
                                className="px-3 py-1 text-gray-400 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateTweet(tweet._id)}
                                disabled={!editContent.trim()}
                                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded-full text-sm"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-white whitespace-pre-wrap">{tweet.content}</p>
                      )}
                    </div>
                    
                    {editingTweet !== tweet._id && (
                      <div className="flex items-center space-x-6 mt-3">
                        <button
                          onClick={() => handleToggleLike(tweet._id)}
                          className={`btn-animate flex items-center space-x-2 p-2 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${
                            tweet.isLiked
                              ? 'text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
                          }`}
                          style={{
                            animation: tweet.isLiked ? "pulseHeart 0.6s ease-in-out" : ""
                          }}
                        >
                          <Heart
                            size={16}
                            className={`transition-all duration-300 ${
                              tweet.isLiked
                                ? 'fill-current transform scale-110'
                                : 'hover:scale-110'
                            }`}
                            style={{
                              animation: tweet.isLiked ? "bounceIn 0.5s ease-out" : ""
                            }}
                          />
                          <span className="text-sm transition-all duration-200 font-medium">
                            {tweet.likesCount || 0}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Tweets;