"use client"

import { useState, useEffect, useCallback, useMemo, memo } from "react"
import { Outlet } from "react-router-dom"
import { useResponsive } from "../../hooks/useResponsive"
import Header from "./Header"
import Sidebar from "./Sidebar"

const Layout = memo(() => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { isMobile } = useResponsive()

  useEffect(() => {
    // Automatically close sidebar on mobile and open on desktop
    setSidebarOpen(!isMobile)
  }, [isMobile])

  const handleMenuClick = useCallback(() => {
    setSidebarOpen((prev) => !prev)
  }, [])

  const handleSidebarClose = useCallback(() => {
    if (isMobile) setSidebarOpen(false)
  }, [isMobile])

  // Memoize the main className to prevent unnecessary recalculations
  const mainClassName = useMemo(() => {
    return `transition-all duration-300 ease-out ${
      isMobile
        ? 'ml-0'
        : sidebarOpen
        ? 'ml-60'
        : 'ml-[72px]'
    }`
  }, [sidebarOpen, isMobile])

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header onMenuClick={handleMenuClick} />

      <div className="pt-14">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          aria-hidden={!sidebarOpen}
        />

        <main className={mainClassName} role="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
})

Layout.displayName = 'Layout'

export default Layout
