"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { authAPI } from "../services/api"
import { User, Mail, Lock, Camera, Save } from "lucide-react"
import toast from "react-hot-toast"
import VideoPreviewSettings from "../components/Settings/VideoPreviewSettings"

const Settings = () => {
  const { user: currentUser, updateUser } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
  })
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    if (currentUser) {
      setFormData({
        fullName: currentUser.fullName || "",
        email: currentUser.email || "",
      })
    }
  }, [currentUser])

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.remove()
      toast.error("Please fill in all fields")
      return
    }

    try {
      setLoading(true)
      const response = await authAPI.updateProfile(formData)
      updateUser(response.data.data)
      toast.remove()
      toast.success("Profile updated successfully")
    } catch (error) {
      toast.remove()
      toast.error("Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.remove()
      toast.error("Please fill in all password fields")
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.remove()
      toast.error("New passwords don't match")
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.remove()
      toast.error("New password must be at least 6 characters")
      return
    }

    try {
      setLoading(true)
      await authAPI.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      })
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      toast.remove()
      toast.success("Password changed successfully")
    } catch (error) {
      toast.remove()
      toast.error("Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("avatar", file)

    try {
      setLoading(true)
      const response = await authAPI.updateAvatar(formData)
      updateUser(response.data.data)
      toast.remove()
      toast.success("Avatar updated successfully")
    } catch (error) {
      toast.remove()
      toast.error("Failed to update avatar")
    } finally {
      setLoading(false)
    }
  }

  const handleCoverImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append("coverImage", file)

    try {
      setLoading(true)
      const response = await authAPI.updateCoverImage(formData)
      updateUser(response.data.data)
      toast.remove()
      toast.success("Cover image updated successfully")
    } catch (error) {
      toast.remove()
      toast.error("Failed to update cover image")
    } finally {
      setLoading(false)
    }
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f0f0f] text-white">
        <p className="text-red-500 text-lg">Please login to access settings</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">Account Settings</h1>

        <div className="space-y-8">
          {/* Profile Picture Section */}
          <div className="bg-[#1c1c1c] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Picture</h2>
            <div className="flex items-center gap-6">
              <img
                src={currentUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.fullName}`}
                alt={currentUser.fullName}
                className="w-20 h-20 rounded-full"
              />
              <div>
                <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg cursor-pointer transition">
                  <Camera size={16} />
                  Change Avatar
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
                <p className="text-gray-400 text-sm mt-2">JPG, PNG or GIF. Max size 5MB.</p>
              </div>
            </div>
          </div>

          {/* Cover Image Section */}
          <div className="bg-[#1c1c1c] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Cover Image</h2>
            <div className="space-y-4">
              {(() => {
                const coverUrl = currentUser?.coverImage?.url || currentUser?.coverImage || "";
                return coverUrl ? (
                  <img
                    src={coverUrl}
                    alt="Cover"
                    className="w-full h-32 object-cover rounded-lg"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : null;
              })()}
              <label className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg cursor-pointer transition w-fit">
                <Camera size={16} />
                Change Cover Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  className="hidden"
                  disabled={loading}
                />
              </label>
              <p className="text-gray-400 text-sm">JPG, PNG or GIF. Max size 5MB.</p>
            </div>
          </div>

          {/* Profile Information */}
          <div className="bg-[#1c1c1c] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-[#1c1c1c] rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Change Password</h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition disabled:opacity-50"
              >
                <Lock size={16} />
                {loading ? "Changing..." : "Change Password"}
              </button>
            </form>
          </div>

          {/* Video Preview Settings */}
          <VideoPreviewSettings />

        </div>
      </div>
    </div>
  )
}

export default Settings