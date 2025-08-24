"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useNotifications } from "../../contexts/NotificationContext"
import { useResponsive } from "../../hooks/useResponsive"
import MobileSearch from "./MobileSearch"
import NotificationDropdown from "../Notifications/NotificationDropdown"
import { Search, Menu, Upload, Bell, User } from "lucide-react"
import playbackLogo from "../../assets/PlayBack.png"

const Header = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { isMobile } = useResponsive()
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate("/")
  }

  const toggleDropdown = () => {
    setShowDropdown((prev) => !prev)
  }

  const closeDropdown = () => {
    setShowDropdown(false)
  }

  const toggleNotifications = () => {
    setShowNotifications((prev) => !prev)
  }

  const closeNotifications = () => {
    setShowNotifications(false)
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-[rgba(15,15,15,0.95)] backdrop-blur-[10px] border-b border-[#303030] flex items-center justify-between px-4 z-[1000] transition-all duration-300 ease-in-out">
        <div className="flex items-center gap-4 min-w-0 flex-shrink-0">
          <button
            className="p-2 rounded-full text-white transition-colors duration-200 flex items-center justify-center min-w-10 min-h-10 hover:bg-[#303030] focus-visible:bg-[#303030] focus-visible:outline-2 focus-visible:outline-[#3ea6ff] touch-manipulation"
            onClick={onMenuClick}
            aria-label="Toggle menu"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-red-500 whitespace-nowrap">
            <img
              src={playbackLogo}
              alt="PlayBack Logo"
              className="h-8 w-auto"
            />
            <span className="text-white text-selectable">PlayBack</span>
          </Link>
        </div>

        {!isMobile && (
          <div className="flex-1 max-w-[600px] mx-10 flex justify-center">
            <form className="flex h-10 w-full max-w-[500px]" onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 bg-[#121212] border border-[#303030] border-r-0 rounded-l-[20px] text-white text-base min-w-0 focus:outline-none focus:border-[#1976d2] focus:bg-[#1a1a1a] placeholder:text-[#aaa] text-selectable"
                aria-label="Search videos"
              />
              <button
                type="submit"
                className="w-16 h-10 bg-[#303030] border border-[#303030] rounded-r-[20px] text-white flex items-center justify-center transition-colors duration-200 flex-shrink-0 hover:bg-[#404040] focus-visible:bg-[#404040] focus-visible:outline-2 focus-visible:outline-[#3ea6ff]"
                aria-label="Search"
              >
                <Search size={20} />
              </button>
            </form>
          </div>
        )}

        <div className="flex items-center gap-2 flex-shrink-0">
          {isMobile && (
            <button
              className="p-2 rounded-full text-white transition-colors duration-200 flex items-center justify-center min-w-9 min-h-9 hover:bg-[#303030] focus-visible:bg-[#303030] focus-visible:outline-2 focus-visible:outline-[#3ea6ff]"
              onClick={() => setShowMobileSearch(true)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
          )}

          {user ? (
            <>
              <Link
                to="/upload"
                className="p-2 rounded-full text-white transition-colors duration-200 flex items-center justify-center min-w-10 min-h-10 hover:bg-[#303030] focus-visible:bg-[#303030] focus-visible:outline-2 focus-visible:outline-[#3ea6ff]"
                aria-label="Upload video"
              >
                <Upload size={20} />
              </Link>
              <div className="relative">
                <button
                  className="p-2 rounded-full text-white transition-colors duration-200 flex items-center justify-center min-w-10 min-h-10 hover:bg-[#303030] focus-visible:bg-[#303030] focus-visible:outline-2 focus-visible:outline-[#3ea6ff]"
                  onClick={toggleNotifications}
                  aria-label="Notifications"
                  aria-expanded={showNotifications}
                >
                  <div className="relative">
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 font-medium text-selectable">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </button>
                
                <NotificationDropdown
                  isOpen={showNotifications}
                  onClose={closeNotifications}
                />
              </div>
              <div className="relative">
                <button
                  className="w-8 h-8 rounded-full bg-[#303030] text-white flex items-center justify-center transition-colors duration-200 hover:bg-[#404040] overflow-hidden"
                  onClick={toggleDropdown}
                  aria-label="User menu"
                  aria-expanded={showDropdown}
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName || user.username}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <User size={20} />
                  )}
                </button>

                {showDropdown && (
                  <div
                    className="absolute top-[calc(100%+8px)] right-0 bg-[#282828] border border-[#404040] rounded-lg py-2 min-w-40 z-[1000] shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
                    onMouseLeave={closeDropdown}
                  >
                    <Link
                      to={`/profile/${user.username}`}
                      onClick={closeDropdown}
                      className="block w-full py-3 px-4 text-left text-white transition-colors duration-200 text-sm hover:bg-[#404040] hover:no-underline"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/dashboard"
                      onClick={closeDropdown}
                      className="block w-full py-3 px-4 text-left text-white transition-colors duration-200 text-sm hover:bg-[#404040] hover:no-underline"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full py-3 px-4 text-left text-white transition-colors duration-200 text-sm hover:bg-[#404040]"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <Link
                to="/login"
                className="py-2 px-4 rounded-[18px] font-medium text-sm transition-all duration-200 whitespace-nowrap text-[#3ea6ff] border border-[#303030] hover:bg-[#263850] text-selectable"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="py-2 px-4 rounded-[18px] font-medium text-sm transition-all duration-200 whitespace-nowrap bg-[#3ea6ff] text-[#0f0f0f] hover:bg-[#2196f3] text-selectable"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </header>

      <MobileSearch isOpen={showMobileSearch} onClose={() => setShowMobileSearch(false)} />
    </>
  )
}

export default Header
