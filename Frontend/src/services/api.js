import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, Promise.reject);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const status = error?.response?.status;
    const payload = error?.response?.data || {};
    const message = payload?.message || (Array.isArray(payload?.errors) && payload.errors[0]?.message) || "An error occurred";

    if (error.code === "ECONNABORTED") {
      toast.error("Request timeout. Please try again.");
    } else if (!error.response) {
      toast.error("Network error. Please check your internet.");
    } else {
      switch (status) {
        case 401:
          localStorage.removeItem("token");
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
          break;
        case 403:
          toast.error("You don't have permission to perform this action.");
          break;
        case 404:
          toast.error("Resource not found.");
          break;
        case 429:
          toast.error("Too many requests. Try again later.");
          break;
        case 500:
        case 503:
          toast.error("Server error. Please try again later.");
          break;
        default:
          toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);


// === AUTH APIs ===
export const authAPI = {
  register: (formData) =>
    api.post("/users/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  login: (email, password) => api.post("/users/login", { email, password }),
  logout: () => api.post("/users/logout"),
  refreshToken: () => api.post("/users/refresh-token"),
  getCurrentUser: () => api.get("/users/current-user"),
  updateProfile: (data) => api.patch("/users/update-account", data),
  updateAvatar: (file) =>
    api.patch("/users/avatar", file, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateCoverImage: (file) =>
    api.patch("/users/cover-image", file, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (data) => api.post("/users/change-password", data),
  getUserProfile: (username) =>
    api.get(`/users/channel/${username}`),
  getWatchHistory: (page = 1, limit = 10) =>
    api.get(`/users/history?page=${page}&limit=${limit}`),
  addToWatchHistory: (videoId) =>
    api.patch(`/users/history/${videoId}`),
  forgotPassword: (data) => api.post("/users/forgot-password", data),
  resetPassword: (data) => api.post("/users/reset-password", data),
  resendOTP: (data) => api.post("/users/resend-otp", data),
  sendOTP: (data) => api.post("/users/send-otp", data),
  verifyOTP: (data) => api.post("/users/verify-otp", data),
};

// === VIDEO APIs ===
export const videoAPI = {
  // getAllVideos: (page = 1, limit = 20) =>
  //   api.get(`/videos?page=${page}&limit=${limit}`),
  getAllVideosWithOwnerDetails: (page = 1, limit = 20) =>
    api.get(`/videos/?page=${page}&limit=${limit}`),
  searchVideos: (query, page = 1, limit = 20) =>
    api.get(`/videos/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`),
  getVideoById: (id) =>
    api.get(`/videos/${id}`),
  uploadVideo: (formData, options = {}) =>
    api.post("/videos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 300000,
      onUploadProgress: options.onUploadProgress,
    }),
  updateVideo: (id, data) =>
    api.patch(`/videos/${id}`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteVideo: (id) => api.delete(`/videos/${id}`),
  getUserVideos: (username) =>
    api.get(`/videos/user/${username}`),
  toggleVideoPublish: (id) => api.patch(`/videos/toggle/publish/${id}`),
  // Add increment views method (not implemented in backend, so we'll handle gracefully)
  incrementViews: (id) => api.patch(`/videos/views/${id}`),
  // Get video categories
  getVideoCategories: () =>
    api.get('/videos/categories'),
  // Get videos by category
  getVideosByCategory: (category, page = 1, limit = 20) =>
    api.get(`/videos/?category=${encodeURIComponent(category)}&page=${page}&limit=${limit}`),
  // Get recommended videos based on viewing history
  getRecommendedVideos: (page = 1, limit = 10) =>
    api.get(`/videos/recommendations?page=${page}&limit=${limit}`),
  // Get watch next videos for a specific video
  getWatchNextVideos: (videoId, limit = 5) =>
    api.get(`/videos/watch-next/${videoId}?limit=${limit}`),
  // Add watch later functionality (using playlists)
  addToWatchLater: async (videoId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please login to use Watch Later');
    }
    
    try {
      // Get current user to find their ID
      const currentUser = await authAPI.getCurrentUser();
      const userId = currentUser.data?.data?._id || currentUser.data?._id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      // Get user's own playlists
      const userPlaylists = await playlistAPI.getUserPlaylists(userId);
      const playlists = userPlaylists.data?.data || [];
      let watchLaterPlaylist = playlists.find(p => p.name === 'Watch Later');
      
      if (!watchLaterPlaylist) {
        // Create Watch Later playlist for the current user (private by default)
        const newPlaylist = await playlistAPI.createPlaylist({
          name: 'Watch Later',
          description: 'Videos to watch later',
          isPublic: false,
          visibility: 'private'
        });
        watchLaterPlaylist = newPlaylist.data?.data;
      }
      
      if (watchLaterPlaylist) {
        // Add video to the user's own Watch Later playlist
        return await playlistAPI.addVideoToPlaylist(videoId, watchLaterPlaylist._id);
      }
      throw new Error('Could not create or find Watch Later playlist');
    } catch (error) {
      console.error('Watch Later error:', error);
      // Handle specific error messages
      if (error.response?.status === 400) {
        throw new Error('Failed to add to Watch Later. Please try again.');
      }
      throw new Error(error.message || 'Watch Later feature not available');
    }
  },
  saveToPlaylist: async (videoId, playlistId) => {
    if (!playlistId) {
      throw new Error('Please select a playlist');
    }
    return await playlistAPI.addVideoToPlaylist(videoId, playlistId);
  },
  // Get user's playlists for playlist selection (only owned playlists, not saved ones)
  getUserPlaylistsForSelection: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Please login to view playlists');
    }
    
    try {
      const currentUser = await authAPI.getCurrentUser();
      const userId = currentUser.data?.data?._id || currentUser.data?._id;
      
      if (!userId) {
        throw new Error('User ID not found');
      }
      
      const userPlaylists = await playlistAPI.getUserPlaylists(userId);
      const allPlaylists = userPlaylists.data?.data || [];
      
      // Filter to only show owned playlists (not saved ones) and exclude system playlists
      const ownedPlaylists = allPlaylists.filter(playlist => {
        // Only include playlists owned by the current user (not saved playlists)
        const isOwned = playlist.owner === userId ||
                       (playlist.owner && playlist.owner._id === userId) ||
                       playlist.isSaved !== true;
        
        // Exclude system playlists
        const isNotSystemPlaylist = playlist.name !== "Watch Later" &&
                                   playlist.name !== "Watch History" &&
                                   !playlist.name.toLowerCase().includes("history");
        
        return isOwned && isNotSystemPlaylist;
      });
      
      return ownedPlaylists;
    } catch (error) {
      console.error('Error getting user playlists:', error);
      throw new Error('Failed to load playlists');
    }
  }
};

// === COMMENT APIs ===
export const commentAPI = {
  getVideoComments: (videoId, page = 1, limit = 20) =>
    api.get(`/comments/${videoId}?page=${page}&limit=${limit}`),
  addComment: (videoId, content) => api.post(`/comments/${videoId}`, { content }),
  updateComment: (commentId, content) =>
    api.patch(`/comments/c/${commentId}`, { content }),
  deleteComment: (commentId) => api.delete(`/comments/c/${commentId}`),
  // Add the missing toggleCommentLike function
  toggleCommentLike: (commentId) => api.post(`/likes/toggle/c/${commentId}`),
};

// === LIKE APIs ===
export const likeAPI = {
  toggleVideoLike: (videoId) => api.post(`/likes/toggle/v/${videoId}`),
  toggleCommentLike: (commentId) => api.post(`/likes/toggle/c/${commentId}`),
  toggleTweetLike: (tweetId) => api.post(`/likes/toggle/t/${tweetId}`),
  getLikedVideos: () => api.get("/likes/videos"),
};

// === DASHBOARD APIs ===
export const dashboardAPI = {
  getDashboardStats: () => api.get("/dashboard/stats"),
  getChannelVideos: () => api.get("/dashboard/videos"),
};

// === SUBSCRIPTION APIs ===
export const subscriptionAPI = {
  toggleSubscription: (channelId) => api.post(`/subscriptions/c/${channelId}`),
  getSubscribedChannels: (subscriberId) => api.get(`/subscriptions/s/${subscriberId}`),
  getChannelSubscribers: (channelId) => api.get(`/subscriptions/u/${channelId}`),
};

// === TWEET APIs ===
export const tweetAPI = {
  getAllTweets: (page = 1, limit = 10) => api.get(`/tweets?page=${page}&limit=${limit}`),
  createTweet: (data) => api.post("/tweets", data),
  updateTweet: (tweetId, data) => api.patch(`/tweets/${tweetId}`, data),
  deleteTweet: (tweetId) => api.delete(`/tweets/${tweetId}`),
  getUserTweets: (userId) => api.get(`/tweets/user/${userId}`),
};

// === PLAYLIST APIs ===
export const playlistAPI = {
  createPlaylist: (data) => api.post("/playlist", data),
  getPlaylistById: (id) => api.get(`/playlist/${id}`),
  updatePlaylist: (id, data) => api.patch(`/playlist/${id}`, data),
  deletePlaylist: (id) => api.delete(`/playlist/${id}`),
  addVideoToPlaylist: (videoId, playlistId) =>
    api.patch(`/playlist/add/${videoId}/${playlistId}`),
  removeVideoFromPlaylist: (videoId, playlistId) =>
    api.patch(`/playlist/remove/${videoId}/${playlistId}`),
  getUserPlaylists: (userId) =>
    api.get(`/playlist/user/${userId}`),
  savePlaylist: (playlistId, data = {}) =>
    api.post(`/playlist/save/${playlistId}`, data),
  unsavePlaylist: (playlistId) =>
    api.post(`/playlist/unsave/${playlistId}`),
  getSavedPlaylists: () =>
    api.get("/playlist/saved"),
  getPublicPlaylists: (page = 1, limit = 20) =>
    api.get(`/playlist/public?page=${page}&limit=${limit}`),
  checkVideoInPlaylists: (videoId) =>
    api.get(`/playlist/check/${videoId}`),
};

export default api;
