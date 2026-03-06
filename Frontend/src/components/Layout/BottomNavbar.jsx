"use client"

import { Link, useLocation } from "react-router-dom"
import {
    Home,
    Library,
    Plus,
    Youtube,
    User
} from "lucide-react"
import { useResponsive } from "../../hooks/useResponsive"
import { useAuth } from "../../contexts/AuthContext"

const BottomNavbar = () => {
    const location = useLocation()
    const { isMobile } = useResponsive()
    const { user } = useAuth()

    if (!isMobile) return null

    const leftItems = [
        { icon: Home, label: "Home", path: "/" },
        { icon: Library, label: "Library", path: "/library" },
    ]

    const rightItems = [
        { icon: Youtube, label: "Subs", path: "/subscriptions" },
        {
            icon: User,
            label: "You",
            path: user?.username ? `/profile/${user.username}` : "/login"
        },
    ]

    const uploadItem = { icon: Plus, label: "Upload", path: "/upload" }

    const renderNavItem = (item) => {
        const isActive = location.pathname === item.path
        return (
            <Link
                key={item.label}
                to={item.path}
                className="flex flex-col items-center justify-center relative group flex-1 py-2"
            >
                {/* Active background pill */}
                <div className={`absolute inset-x-3 inset-y-1 rounded-2xl transition-all duration-300 ${isActive
                    ? "bg-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                    : "bg-transparent group-active:bg-white/[0.06]"
                    }`} />

                <div className={`relative transition-all duration-200 ${isActive ? "transform -translate-y-[1px]" : "group-active:scale-90"
                    }`}>
                    <item.icon
                        size={22}
                        strokeWidth={isActive ? 2.5 : 1.7}
                        className={`transition-all duration-200 ${isActive
                            ? "text-white"
                            : "text-gray-500 group-hover:text-gray-300"
                            }`}
                    />
                </div>
                <span className={`text-[9px] mt-1 transition-all duration-200 relative ${isActive
                    ? "text-white font-bold"
                    : "text-gray-500 font-medium group-hover:text-gray-300"
                    }`}>
                    {item.label}
                </span>
                {/* Red gradient underline */}
                {isActive && (
                    <div className="absolute -bottom-0.5 w-5 h-[2.5px] rounded-full bg-gradient-to-r from-red-500 to-orange-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                )}
            </Link>
        )
    }

    const isUploadActive = location.pathname === uploadItem.path

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[max(0.15rem,env(safe-area-inset-bottom))] pointer-events-none">
            <div className="mx-2.5 mb-2 pointer-events-auto">
                <div className="relative flex items-center justify-center">
                    {/* Main pill container */}
                    <div className="w-full rounded-[20px] overflow-visible"
                        style={{
                            background: 'linear-gradient(180deg, rgba(30,30,30,0.95) 0%, rgba(15,15,15,0.98) 100%)',
                            backdropFilter: 'blur(24px)',
                            WebkitBackdropFilter: 'blur(24px)',
                            boxShadow: '0 -2px 20px rgba(0,0,0,0.5), 0 4px 30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.06)',
                        }}
                    >
                        <div className="flex items-center justify-between h-[60px] px-1">
                            {/* Left side nav items */}
                            <div className="flex items-center flex-1 justify-evenly">
                                {leftItems.map(renderNavItem)}
                            </div>

                            {/* Center spacer for upload button */}
                            <div className="w-[64px] shrink-0" />

                            {/* Right side nav items */}
                            <div className="flex items-center flex-1 justify-evenly">
                                {rightItems.map(renderNavItem)}
                            </div>
                        </div>
                    </div>

                    {/* Center Upload Button */}
                    <div className="absolute left-1/2 -translate-x-1/2 -top-5 flex flex-col items-center">
                        <Link to={uploadItem.path} className="relative group">
                            {/* Outer border ring */}
                            <div className="absolute -inset-[3px] rounded-full bg-gradient-to-b from-[#1e1e1e] to-[#0f0f0f]" />
                            <div className={`relative w-[50px] h-[50px] rounded-full flex items-center justify-center transition-all duration-300 ${isUploadActive
                                ? "bg-gradient-to-br from-red-400 via-red-500 to-red-700 shadow-[0_4px_20px_rgba(239,68,68,0.5)]"
                                : "bg-gradient-to-br from-red-500 via-red-600 to-red-700 shadow-[0_4px_16px_rgba(239,68,68,0.3)] group-hover:shadow-[0_4px_24px_rgba(239,68,68,0.5)] group-active:scale-95"
                                }`}>
                                {/* Inner glass highlight */}
                                <div className="absolute inset-[1px] rounded-full bg-gradient-to-b from-white/25 via-transparent to-black/10 pointer-events-none" />
                                <Plus size={25} strokeWidth={2.8} className="text-white relative z-10" />
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}

export default BottomNavbar
