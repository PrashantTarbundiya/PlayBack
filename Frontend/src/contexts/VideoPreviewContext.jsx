import React, { createContext, useContext, useState, useEffect } from 'react'

const VideoPreviewContext = createContext()

export const useVideoPreviewSettings = () => {
  const context = useContext(VideoPreviewContext)
  if (!context) {
    throw new Error('useVideoPreviewSettings must be used within a VideoPreviewProvider')
  }
  return context
}

const defaultSettings = {
  enabled: true,
  delay: 2000,
  autoMute: true,
  showHoverIndicator: true,
  previewQuality: 'medium'
}

export const VideoPreviewProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load settings from localStorage on mount
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('videoPreviewSettings')
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)
          setSettings(prevSettings => ({ ...prevSettings, ...parsed }))
        }
      } catch (error) {
        console.error('Error loading video preview settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [])

  const updateSettings = (newSettings) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings }
      
      // Save to localStorage
      try {
        localStorage.setItem('videoPreviewSettings', JSON.stringify(updatedSettings))
      } catch (error) {
        console.error('Error saving video preview settings:', error)
      }
      
      return updatedSettings
    })
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
    try {
      localStorage.removeItem('videoPreviewSettings')
    } catch (error) {
      console.error('Error removing video preview settings:', error)
    }
  }

  const getQualityTransformation = (quality) => {
    switch (quality) {
      case 'low':
        return 'w_240,h_135,c_fill'
      case 'medium':
        return 'w_480,h_270,c_fill'
      case 'high':
        return 'w_720,h_405,c_fill'
      default:
        return 'w_480,h_270,c_fill'
    }
  }

  const isPreviewEnabled = () => {
    return settings.enabled && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  const value = {
    settings,
    updateSettings,
    resetSettings,
    isLoading,
    getQualityTransformation,
    isPreviewEnabled
  }

  return (
    <VideoPreviewContext.Provider value={value}>
      {children}
    </VideoPreviewContext.Provider>
  )
}

export default VideoPreviewProvider