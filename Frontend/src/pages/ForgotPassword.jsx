"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import FormInput from "../components/FormInput"
import LoadingButton from "../components/LoadingButton"
import { Mail, ArrowLeft, Shield, Clock } from "lucide-react"
import toast from "react-hot-toast"
import { authAPI } from "../services/api"
import OTPInput from "../components/OTPInput"

const ForgotPassword = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [otpTimer, setOtpTimer] = useState(0)
  const [resendTimer, setResendTimer] = useState(0)
  const [remainingAttempts, setRemainingAttempts] = useState(3)

  const validateEmail = () => {
    const newErrors = {}
    
    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateResetForm = () => {
    const newErrors = {}

    if (!formData.otp) {
      newErrors.otp = "OTP is required"
    } else if (formData.otp.length !== 6) {
      newErrors.otp = "OTP must be 6 digits"
    } else if (!/^\d{6}$/.test(formData.otp)) {
      newErrors.otp = "OTP must contain only numbers"
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required"
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const handleOTPChange = (otpValue) => {
    setFormData(prev => ({ ...prev, otp: otpValue }))
    // Clear OTP error when user starts typing
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: "" }))
    }
  }

  const startOtpTimer = () => {
    setOtpTimer(600) // 10 minutes
    const timer = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const startResendTimer = () => {
    setResendTimer(120) // 2 minutes
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()

    if (!validateEmail()) {
      toast.remove()
      toast.error("Please fix the errors below")
      return
    }

    setLoading(true)

    try {
      const response = await authAPI.forgotPassword({ email: formData.email })
      const data = response.data?.data
      if (data?.remainingAttempts !== undefined) {
        setRemainingAttempts(data.remainingAttempts)
      }
      toast.remove()
      toast.success(response.data?.message || "OTP sent to your email successfully!")
      setStep(2)
      startOtpTimer()
      startResendTimer()
    } catch (error) {
      toast.remove()
      toast.error(error.response?.data?.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (!validateResetForm()) {
      toast.remove()
      toast.error("Please fix the errors below")
      return
    }

    setLoading(true)

    try {
      await authAPI.resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      })
      toast.remove()
      toast.success("Password reset successfully! You can now login with your new password.")
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "/login"
      }, 2000)
    } catch (error) {
      toast.remove()
      toast.error(error.response?.data?.message || "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (resendTimer > 0) return

    setLoading(true)
    try {
      const response = await authAPI.resendOTP({ email: formData.email })
      const data = response.data?.data
      if (data?.remainingAttempts !== undefined) {
        setRemainingAttempts(data.remainingAttempts)
      }
      toast.remove()
      toast.success(response.data?.message || "New OTP sent to your email!")
      startOtpTimer()
      startResendTimer()
    } catch (error) {
      toast.remove()
      toast.error(error.response?.data?.message || "Failed to resend OTP")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
        <div className="p-8 text-center border-b border-gray-700">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-red-500">PlayBack</h1>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {step === 1 ? "Forgot Password" : "Reset Password"}
          </h2>
          <p className="text-gray-400">
            {step === 1 
              ? "Enter your email to receive an OTP" 
              : "Enter the OTP and your new password"
            }
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOTP} className="p-8 space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-blue-600 rounded-full">
                <Mail size={32} className="text-white" />
              </div>
            </div>

            <FormInput
              label="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="Enter your registered email"
              required
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
              <Mail size={18} />
            </button>

            <div className="text-center">
              <Link 
                to="/login" 
                className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="p-8 space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-green-600 rounded-full">
                <Shield size={32} className="text-white" />
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-gray-400 mb-2">
                OTP sent to: <span className="text-white font-medium">{formData.email}</span>
              </p>
              <div className="space-y-2">
                {otpTimer > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-yellow-400">
                    <Clock size={16} />
                    <span>OTP expires in {formatTime(otpTimer)}</span>
                  </div>
                )}
                <div className="text-sm text-gray-400">
                  <span className="text-blue-400">{remainingAttempts}</span> attempts remaining today
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Enter Verification Code
              </label>
              <OTPInput
                length={6}
                onComplete={handleOTPChange}
                value={formData.otp}
                disabled={loading}
                error={!!errors.otp}
              />
              {errors.otp && (
                <span className="text-red-400 text-sm block text-center">{errors.otp}</span>
              )}
            </div>

            <FormInput
              label="New Password"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              error={errors.newPassword}
              placeholder="Enter new password"
              required
              disabled={loading}
            />

            <FormInput
              label="Confirm New Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm new password"
              required
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {loading ? "Resetting Password..." : "Reset Password"}
              <Shield size={18} />
            </button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-1"
              >
                <ArrowLeft size={16} />
                Change Email
              </button>
              
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading || resendTimer > 0}
                className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {resendTimer > 0 ? `Resend in ${formatTime(resendTimer)}` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        <div className="p-8 pt-0 text-center border-t border-gray-700">
          <p className="text-gray-400">
            Remember your password?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword