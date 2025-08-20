import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { memo, Suspense, lazy } from "react"
import { AuthProvider } from "./contexts/AuthContext"
import { VideoProvider } from "./contexts/VideoContext"
import { SyncedVideoProvider } from "./contexts/SyncedVideoContext"
import { NotificationProvider } from "./contexts/NotificationContext"
import { VideoPreviewProvider } from "./contexts/VideoPreviewContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout/Layout"
import { Toaster } from "react-hot-toast"
import LoadingScreen from "./components/Skeleton/LoadingScreen"
import "./App.css"

// Lazy load pages to reduce initial bundle size
const Home = lazy(() => import("./pages/Home"))
const VideoPlayer = lazy(() => import("./pages/VideoPlayer"))
const Search = lazy(() => import("./pages/Search"))
const Upload = lazy(() => import("./pages/Upload"))
const Login = lazy(() => import("./pages/Login"))
const Register = lazy(() => import("./pages/Register"))
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"))
const Profile = lazy(() => import("./pages/Profile"))
const Dashboard = lazy(() => import("./pages/Dashboard"))
const ChannelVideos = lazy(() => import("./pages/ChannelVideos"))
const Settings = lazy(() => import("./pages/Settings"))
const Trending = lazy(() => import("./pages/Trending"))
const Library = lazy(() => import("./pages/Library"))
const History = lazy(() => import("./pages/History"))
const WatchLater = lazy(() => import("./pages/WatchLater"))
const LikedVideos = lazy(() => import("./pages/LikedVideos"))
const Playlists = lazy(() => import("./pages/Playlists"))
const Tweets = lazy(() => import("./pages/Tweets"))
const Notifications = lazy(() => import("./pages/Notifications"))
const Categories = lazy(() => import("./pages/Categories"))
const BrowsePlaylists = lazy(() => import("./pages/BrowsePlaylists"))
const PlaylistDetail = lazy(() => import("./pages/PlaylistDetail"))

// Loading component for Suspense
const PageLoader = () => <LoadingScreen message="Loading page..." />

const App = memo(() => {
  return (
    <AuthProvider>
      <VideoProvider>
        <Router>
          <SyncedVideoProvider>
            <NotificationProvider>
              <VideoPreviewProvider>
                <div className="App">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />

                    {/* Layout wrapper for authenticated and public pages */}
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="watch/:id" element={<VideoPlayer />} />
                      <Route path="search" element={<Search />} />
                      <Route path="trending" element={<Trending />} />
                      <Route path="tweets" element={<Tweets />} />
                      <Route path="notifications" element={<Notifications />} />
                      <Route path="library" element={<Library />} />
                      <Route path="profile/:username" element={<Profile />} />
                      <Route path="channel/:username/videos" element={<ChannelVideos />} />
                      <Route path="dashboard" element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      
                      {/* These routes show login prompts within layout instead of redirecting */}
                      <Route path="upload" element={
                        <ProtectedRoute>
                          <Upload />
                        </ProtectedRoute>
                      } />
                      <Route path="history" element={<History />} />
                      <Route path="watch-later" element={<WatchLater />} />
                      <Route path="liked" element={<LikedVideos />} />
                      <Route path="playlists" element={<Playlists />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="browse-playlists" element={<BrowsePlaylists />} />
                      <Route path="playlist/:id" element={<PlaylistDetail />} />
                      
                      {/* Fallback route */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Route>
                  </Routes>
                </Suspense>

                <Toaster
                  position="top-center"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#1e1e1e",
                      color: "#ffffff",
                      border: "1px solid #404040",
                      borderRadius: "8px",
                      fontSize: "14px",
                      maxWidth: "500px",
                    },
                    success: {
                      iconTheme: {
                        primary: "#10b981",
                        secondary: "#ffffff",
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: "#ef4444",
                        secondary: "#ffffff",
                      },
                    },
                  }}
                />
                </div>
              </VideoPreviewProvider>
            </NotificationProvider>
          </SyncedVideoProvider>
        </Router>
      </VideoProvider>
    </AuthProvider>
  )
})

App.displayName = 'App'

export default App
