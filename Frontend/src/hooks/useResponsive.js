"use client"

import { useState, useEffect } from "react"

export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800,
  })

  const [deviceType, setDeviceType] = useState("desktop")

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      const height = window.innerHeight

      setScreenSize({ width, height })

      if (width <= 480) {
        setDeviceType("small-mobile")
      } else if (width <= 768) {
        setDeviceType("mobile")
      } else if (width <= 1024) {
        setDeviceType("tablet")
      } else if (width <= 1440) {
        setDeviceType("desktop")
      } else {
        setDeviceType("large-desktop")
      }
    }

    handleResize() // Initial call
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const isMobile = deviceType === "small-mobile" || deviceType === "mobile"
  const isTablet = deviceType === "tablet"
  const isDesktop = deviceType === "desktop" || deviceType === "large-desktop"
  const isSmallMobile = deviceType === "small-mobile"

  return {
    screenSize,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    isSmallMobile,
    isLandscape: screenSize.width > screenSize.height,
    isPortrait: screenSize.width <= screenSize.height,
  }
}
