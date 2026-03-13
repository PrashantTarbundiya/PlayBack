import React from 'react'
import { Play, Volume2, Clock, Zap } from 'lucide-react'
import { useVideoPreviewSettings } from '../../contexts/VideoPreviewContext'

const VideoPreviewSettings = () => {
  const { settings, updateSettings, resetSettings } = useVideoPreviewSettings()

  const handleToggle = (key) => {
    updateSettings({ [key]: !settings[key] })
  }

  const handleDelayChange = (delay) => {
    updateSettings({ delay: parseInt(delay) })
  }

  const handleQualityChange = (quality) => {
    updateSettings({ previewQuality: quality })
  }

  const resetToDefaults = () => {
    resetSettings()
  }

  return (
    <div className="bg-[#1a1a1a] p-6 rounded-lg border border-[#333]">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Play size={20} />
        Video Preview Settings
      </h3>
      
      <div className="space-y-4">
        {/* Enable/Disable Previews */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-gray-400" />
            <span className="text-white">Enable Video Previews</span>
          </div>
          <button
            onClick={() => handleToggle('enabled')}
            className={`relative shrink-0 block w-[40px] h-[20px] min-w-[40px] max-w-[40px] min-h-[20px] max-h-[20px] p-0 m-0 border-none rounded-[10px] transition-colors duration-300 focus:outline-none ${
              settings.enabled ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`absolute top-1/2 -translate-y-1/2 left-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform duration-300 ${
                settings.enabled ? 'translate-x-[20px]' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Hover Delay */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-gray-400" />
            <span className="text-white">Hover Delay</span>
          </div>
          <select
            value={settings.delay}
            onChange={(e) => handleDelayChange(e.target.value)}
            className="bg-[#2a2a2a] text-white px-3 py-1 rounded border border-[#444] focus:border-blue-500 focus:outline-none"
            disabled={!settings.enabled}
          >
            <option value={1000}>1 second</option>
            <option value={2000}>2 seconds</option>
            <option value={3000}>3 seconds</option>
            <option value={5000}>5 seconds</option>
          </select>
        </div>

        {/* Auto Mute */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-gray-400" />
            <span className="text-white">Auto Mute Previews</span>
          </div>
          <button
            onClick={() => handleToggle('autoMute')}
            className={`relative shrink-0 block w-[40px] h-[20px] min-w-[40px] max-w-[40px] min-h-[20px] max-h-[20px] p-0 m-0 border-none rounded-[10px] transition-colors duration-300 focus:outline-none ${
              settings.autoMute ? 'bg-blue-600' : 'bg-gray-600'
            }`}
            disabled={!settings.enabled}
          >
            <span
              className={`absolute top-1/2 -translate-y-1/2 left-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform duration-300 ${
                settings.autoMute ? 'translate-x-[20px]' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Show Hover Indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white">Show Hover Indicator</span>
          </div>
          <button
            onClick={() => handleToggle('showHoverIndicator')}
            className={`relative shrink-0 block w-[40px] h-[20px] min-w-[40px] max-w-[40px] min-h-[20px] max-h-[20px] p-0 m-0 border-none rounded-[10px] transition-colors duration-300 focus:outline-none ${
              settings.showHoverIndicator ? 'bg-blue-600' : 'bg-gray-600'
            }`}
            disabled={!settings.enabled}
          >
            <span
              className={`absolute top-1/2 -translate-y-1/2 left-[2px] w-[16px] h-[16px] rounded-full bg-white shadow-sm transition-transform duration-300 ${
                settings.showHoverIndicator ? 'translate-x-[20px]' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Preview Quality */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white">Preview Quality</span>
          </div>
          <select
            value={settings.previewQuality}
            onChange={(e) => handleQualityChange(e.target.value)}
            className="bg-[#2a2a2a] text-white px-3 py-1 rounded border border-[#444] focus:border-blue-500 focus:outline-none"
            disabled={!settings.enabled}
          >
            <option value="low">Low (faster)</option>
            <option value="medium">Medium</option>
            <option value="high">High (slower)</option>
          </select>
        </div>

        {/* Reset Button */}
        <div className="pt-4 border-t border-[#333]">
          <button
            onClick={resetToDefaults}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded transition-colors"
          >
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-[#2a2a2a] rounded border border-[#444]">
        <p className="text-sm text-gray-400">
          Video previews will play when you hover over a video thumbnail for the specified delay time. 
          This feature enhances browsing experience but may use additional bandwidth.
        </p>
      </div>
    </div>
  )
}

export default VideoPreviewSettings