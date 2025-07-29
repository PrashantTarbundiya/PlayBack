import React from 'react'

const LoadingScreen = ({ 
  message = "Loading...", 
  showSpinner = true,
  className = "",
  size = "default"
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8", 
    large: "h-12 w-12"
  }

  const textSizes = {
    small: "text-sm",
    default: "text-base",
    large: "text-lg"
  }

  return (
    <div className={`flex items-center justify-center min-h-screen bg-[#0f0f0f] text-white ${className}`}>
      <div className="flex flex-col items-center gap-4">
        {showSpinner && (
          <div className={`animate-spin rounded-full border-2 border-gray-400 border-t-transparent ${sizeClasses[size]}`} />
        )}
        <span className={`text-gray-400 ${textSizes[size]}`}>{message}</span>
      </div>
    </div>
  )
}

// Centered loading component for smaller areas
export const CenteredLoader = ({ 
  message = "Loading...", 
  size = "default",
  className = "" 
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-6 w-6", 
    large: "h-8 w-8"
  }

  return (
    <div className={`flex items-center justify-center py-8 ${className}`}>
      <div className="flex items-center gap-3">
        <div className={`animate-spin rounded-full border-2 border-gray-400 border-t-transparent ${sizeClasses[size]}`} />
        <span className="text-gray-400">{message}</span>
      </div>
    </div>
  )
}

// Inline loader for buttons and small components
export const InlineLoader = ({ 
  size = "small",
  className = "" 
}) => {
  const sizeClasses = {
    small: "h-3 w-3",
    default: "h-4 w-4", 
    large: "h-5 w-5"
  }

  return (
    <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${className}`} />
  )
}

export default LoadingScreen