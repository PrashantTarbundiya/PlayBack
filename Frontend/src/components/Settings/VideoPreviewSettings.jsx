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
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enabled ? 'bg-blue-600' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enabled ? 'translate-x-6' : 'translate-x-1'
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
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.autoMute ? 'bg-blue-600' : 'bg-gray-600'
            }`}
            disabled={!settings.enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.autoMute ? 'translate-x-6' : 'translate-x-1'
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
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.showHoverIndicator ? 'bg-blue-600' : 'bg-gray-600'
            }`}
            disabled={!settings.enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.showHoverIndicator ? 'translate-x-6' : 'translate-x-1'
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