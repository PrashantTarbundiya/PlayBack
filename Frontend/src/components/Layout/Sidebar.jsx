"use client"

import { Link, useLocation } from "react-router-dom"
import {
  Home,
  TrendingUp as Trending,
  Library,
  MessageSquare,
  History,
  Clock,
  ThumbsUp,
  PlaySquare,
  List,
  Settings,
} from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"
import { useResponsive } from "../../hooks/useResponsive"

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation()
  const { user } = useAuth()
  const { isMobile } = useResponsive()

  const menuItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Trending, label: "Trending", path: "/trending" },
    { icon: Library, label: "Library", path: "/library" },
    { icon: MessageSquare, label: "Tweets", path: "/tweets" },
  ]

  const userMenuItems = user
    ? [
        { icon: History, label: "History", path: "/history" },
        { icon: Clock, label: "Watch Later", path: "/watch-later" },
        { icon: ThumbsUp, label: "Liked Videos", path: "/liked" },
        { icon: PlaySquare, label: "Your Videos", path: `/profile/${user.username}` },
        { icon: List, label: "Playlists", path: "/playlists" },
      ]
    : []

  const settingsMenuItems = [
    { icon: Settings, label: "Settings", path: "/settings" },
  ]

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[45] opacity-100 visible transition-all duration-300 ease-in-out"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 bg-[#0f0f0f] border-r border-gray-700
        transition-all duration-300 ease-in-out z-40 overflow-y-auto scrollbar-none
        ${isMobile ? (isOpen ? 'translate-x-0 w-60 top-0 h-screen z-50' : '-translate-x-full w-60 top-0 h-screen') : 'top-0 h-screen'}
        ${!isMobile ? (isOpen ? 'w-60' : 'w-18') : ''}
      `}>
        <nav className="h-full flex flex-col pt-16 pb-4" role="navigation" aria-label="Main navigation">
          {/* Main Menu Items */}
          <div className="mb-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-4 px-4 py-3 mx-2 text-gray-400 no-underline
                  transition-all duration-200 ease-in-out text-sm font-normal
                  hover:bg-gray-700 hover:text-white hover:rounded-lg
                  ${location.pathname === item.path ? 'bg-gray-700 text-white rounded-lg font-medium' : ''}
                  ${!isOpen && !isMobile ? 'justify-center px-3' : ''}
                `}
                aria-current={location.pathname === item.path ? "page" : undefined}
              >
                <item.icon size={20} aria-hidden="true" />
                {(isOpen || !isMobile) && (
                  <span className={`whitespace-nowrap overflow-hidden ${!isOpen && !isMobile ? 'hidden' : ''} text-selectable`}>
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* User Menu Items */}
          {user && userMenuItems.length > 0 && (
            <div className="mb-2">
              <div className={`h-px bg-gray-700 ${!isOpen && !isMobile ? 'mr-0 ml-2' : 'mr-0 ml-3'} my-2`} />
              {userMenuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleLinkClick}
                  className={`
                    flex items-center gap-4 px-4 py-3 mx-2 text-gray-400 no-underline
                    transition-all duration-200 ease-in-out text-sm font-normal
                    hover:bg-gray-700 hover:text-white hover:rounded-lg
                    ${location.pathname === item.path ? 'bg-gray-700 text-white rounded-lg font-medium' : ''}
                    ${!isOpen && !isMobile ? 'justify-center px-3' : ''}
                  `}
                  aria-current={location.pathname === item.path ? "page" : undefined}
                >
                  <item.icon size={20} aria-hidden="true" />
                  {(isOpen || !isMobile) && (
                    <span className={`whitespace-nowrap overflow-hidden ${!isOpen && !isMobile ? 'hidden' : ''} text-selectable`}>
                      {item.label}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}

          {/* Settings Menu Items */}
          <div>
            <div className={`h-px bg-gray-700 ${!isOpen && !isMobile ? 'mr-0 ml-2' : 'mr-0 ml-3'} my-2`} />
            {settingsMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-4 px-4 py-3 mx-2 text-gray-400 no-underline
                  transition-all duration-200 ease-in-out text-sm font-normal
                  hover:bg-gray-700 hover:text-white hover:rounded-lg
                  ${location.pathname === item.path ? 'bg-gray-700 text-white rounded-lg font-medium' : ''}
                  ${!isOpen && !isMobile ? 'justify-center px-3' : ''}
                `}
                aria-current={location.pathname === item.path ? "page" : undefined}
              >
                <item.icon size={20} aria-hidden="true" />
                {(isOpen || !isMobile) && (
                  <span className={`whitespace-nowrap overflow-hidden ${!isOpen && !isMobile ? 'hidden' : ''} text-selectable`}>
                    {item.label}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
