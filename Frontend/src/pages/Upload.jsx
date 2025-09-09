"use client"

import { useState, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { UploadIcon, X } from "lucide-react"
import { videoAPI } from "../services/api"
import toast from "react-hot-toast"

const Upload = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
  })
  const [videoFile, setVideoFile] = useState(null)
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { user } = useAuth()
  const navigate = useNavigate()

  const categories = [
    'Gaming',
    'Entertainment',
    'Education',
    'Music',
    'Sports',
    'News',
    'Technology',
    'Comedy',
    'Film & Animation',
    'How-to & Style',
    'Travel & Events',
    'Science & Technology',
    'People & Blogs',
    'Pets & Animals',
    'Autos & Vehicles',
    'Non-profits & Activism',
    'Other'
  ]

  // Memoize video preview URL to prevent recreation on every render
  const videoPreviewUrl = useMemo(() => {
    return videoFile ? URL.createObjectURL(videoFile) : null
  }, [videoFile])

  // Memoize thumbnail preview URL to prevent recreation on every render
  const thumbnailPreviewUrl = useMemo(() => {
    return thumbnailFile ? URL.createObjectURL(thumbnailFile) : null
  }, [thumbnailFile])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }, [])

  const handleVideoUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (file) setVideoFile(file)
  }, [])

  const handleThumbnailUpload = useCallback((e) => {
    const file = e.target.files[0]
    if (file) setThumbnailFile(file)
  }, [])

  const removeVideoFile = useCallback(() => {
    setVideoFile(null)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!videoFile) return toast.remove(), toast.error("Please select a video file")
    if (!user) return toast.remove(), toast.error("Please login to upload videos")

    setUploading(true)
    setUploadProgress(0)

    try {
      const uploadData = new FormData()
      uploadData.append("videoFile", videoFile)
      if (thumbnailFile) uploadData.append("thumbnail", thumbnailFile)
      uploadData.append("title", formData.title)
      uploadData.append("description", formData.description)
      uploadData.append("category", formData.category)

      const response = await videoAPI.uploadVideo(uploadData, {
        onUploadProgress: (e) => {
          const progress = Math.round((e.loaded * 100) / e.total)
          setUploadProgress(progress)
        },
      })

      toast.remove()
      toast.success("Video uploaded successfully!")
      
      // Always redirect to dashboard after successful upload
      navigate('/dashboard')
    } catch (error) {
      // If upload fails, show error and redirect to dashboard
      toast.remove()
      toast.error("Upload failed. Please try again.")
      navigate('/dashboard')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f]">
        <h2 className="text-lg text-gray-300">Please login to upload videos</h2>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] py-10 px-4 text-white">
      <div className="w-full max-w-5xl mx-auto bg-[#1e1e1e] border border-[#2e2e2e] shadow-md rounded-lg p-8">
        <h1 className="text-2xl font-semibold mb-6">Upload Video</h1>

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
          {/* Video Upload */}
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-blue-500 transition-colors duration-200 min-h-[200px] flex items-center justify-center">
            {videoFile ? (
              <div className="relative w-full">
                <video
                  src={videoPreviewUrl}
                  className="w-full max-h-80 object-contain rounded"
                  controls
                  preload="metadata"
                />
                <div className="flex justify-between items-center mt-2 text-sm text-gray-400">
                  <span>{videoFile.name}</span>
                  <button
                    type="button"
                    onClick={removeVideoFile}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block w-full h-full">
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" />
                <div className="flex flex-col items-center text-gray-400">
                  <UploadIcon size={40} />
                  <p className="mt-2">Click to select video file</p>
                  <span className="text-xs mt-1 text-gray-500">MP4, WebM, AVI up to 100MB</span>
                </div>
              </label>
            )}
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm mb-1">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              autoComplete="off"
              className="w-full px-4 py-2 rounded bg-[#2c2c2c] text-white border border-[#444] focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-200"
              placeholder="Enter video title"
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm mb-1">Description</label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              autoComplete="off"
              className="w-full px-4 py-2 rounded bg-[#2c2c2c] text-white border border-[#444] focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-200 resize-none"
              placeholder="Tell viewers about your video"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm mb-1">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full px-2 py-1.5 sm:px-3 sm:py-2 rounded bg-[#2c2c2c] text-white border border-[#444] focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all duration-200 text-xs sm:text-sm"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Thumbnail */}
          <div>
            <label htmlFor="thumbnail" className="block text-sm mb-1">Thumbnail</label>
            <input
              type="file"
              id="thumbnail"
              accept="image/*"
              onChange={handleThumbnailUpload}
              className="w-full text-sm file:bg-[#3a3a3a] file:border-0 file:px-4 file:py-2 file:rounded file:text-white file:cursor-pointer"
            />
            {thumbnailFile && (
              <div className="mt-3">
                <img
                  src={thumbnailPreviewUrl}
                  alt="Thumbnail preview"
                  className="w-40 h-24 object-cover rounded border border-gray-700"
                />
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 mt-1">Uploading... {uploadProgress}%</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded"
              disabled={uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
              disabled={uploading || !videoFile}
            >
              {uploading ? "Uploading..." : "Upload Video"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Upload
