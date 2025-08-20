"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import FormInput from "../components/FormInput"
import LoadingButton from "../components/LoadingButton"
import { User, Mail, Lock, AtSign, ArrowRight, ArrowLeft, Shield, AlertTriangle } from "lucide-react"
import toast from "react-hot-toast"
import { authAPI } from "../services/api"
import OTPInput from "../components/OTPInput"
import OAuthButtons from "../components/OAuthButtons"

const Register = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    avatar: null,
    coverImage: null,
    otp: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)
  const [autoOtpSent, setAutoOtpSent] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)

  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    calculatePasswordStrength(formData.password)
  }, [formData.password])

  useEffect(() => {
    let interval = null
    if (cooldownTime > 0) {
      interval = setInterval(() => {
        setCooldownTime(cooldownTime => cooldownTime - 1)
      }, 1000)
    } else if (cooldownTime === 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [cooldownTime])

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[a-z]/.test(password)) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1
    setPasswordStrength(strength)
  }

  const validateStep1 = () => {
    const newErrors = {}
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required"
    if (!formData.username.trim()) newErrors.username = "Username is required"
    if (!formData.email) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email"
    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 8) newErrors.password = "Password must be at least 8 characters"
    else if (passwordStrength < 3) newErrors.password = "Password is too weak"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = () => {
    const newErrors = {}
    if (!acceptedDisclaimer) newErrors.disclaimer = "You must accept the development disclaimer"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep3 = () => {
    const newErrors = {}
    if (!formData.otp) newErrors.otp = "OTP is required"
    else if (formData.otp.length !== 6) newErrors.otp = "OTP must be 6 digits"
    else if (!/^\d{6}$/.test(formData.otp)) newErrors.otp = "OTP must contain only numbers"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep4 = () => {
    // Images are now optional, so no validation needed
    return true
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    if (files) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleNextStep = async () => {
    if (step === 1 && validateStep1()) {
      setStep(2)
    } else if (step === 2 && validateStep2()) {
      setStep(3)
      // Auto-send OTP when reaching step 3
      if (!autoOtpSent) {
        sendOTP()
        setAutoOtpSent(true)
      }
    } else if (step === 3 && validateStep3()) {
      // Verify OTP before proceeding to step 4
      await verifyOTP()
    }
  }

  const verifyOTP = async () => {
    if (!formData.otp || formData.otp.length !== 6) {
      toast.remove()
      toast.error("Please enter a valid 6-digit OTP")
      return
    }

    setVerifyingOtp(true)
    try {
      await authAPI.verifyOTP({
        email: formData.email,
        otp: formData.otp
      })
      
      setStep(4)
      toast.remove()
      toast.success("OTP verified successfully!")
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Invalid or expired OTP"
      toast.remove()
      toast.error(errorMessage)
      setErrors({ otp: errorMessage })
    } finally {
      setVerifyingOtp(false)
    }
  }

  const sendOTP = async () => {
    setOtpLoading(true)
    try {
      const response = await authAPI.sendOTP({ email: formData.email })
      setOtpSent(true)
      setCooldownTime(150) // Set 2.5 minutes (150 seconds) cooldown
      
      // Check if there's a development OTP
      if (response.data?.data?.developmentOTP) {
        toast.remove()
        toast.success(`Development OTP: ${response.data.data.developmentOTP}`, {
          duration: 10000,
          style: {
            background: '#fef3cd',
            color: '#856404',
            border: '1px solid #ffeaa7'
          }
        })
      } else {
        toast.remove()
        toast.success('OTP sent to your email!')
      }
    } catch (error) {
      toast.remove()
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleOTPChange = (otpValue) => {
    setFormData(prev => ({ ...prev, otp: otpValue }))
    // Clear OTP error when user starts typing
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: "" }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateStep4()) {
      return
    }

    setLoading(true)
    try {
      const form = new FormData()
      form.append("fullName", formData.fullName)
      form.append("username", formData.username)
      form.append("email", formData.email)
      form.append("password", formData.password)
      form.append("otp", formData.otp)
      
      // Only append images if they are provided
      if (formData.avatar) {
        form.append("avatar", formData.avatar)
      }
      if (formData.coverImage) {
        form.append("coverImage", formData.coverImage)
      }

      await register(form)
      navigate("/", { replace: true })
    } catch (error) {
      // console.error("Registration error:", error)
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
          <h2 className="text-2xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-400">Join PlayBack and start sharing your videos</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {step === 1 && (
            <>
              {/* OAuth Buttons at the top */}
              <div className="space-y-3">
                <OAuthButtons loading={loading} />
                
                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-gray-800 text-gray-400">Or create account with email</span>
                  </div>
                </div>
              </div>

              <FormInput
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                placeholder="Enter full name"
                required
              />
              <FormInput
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                error={errors.username}
                placeholder="Choose a username"
                required
              />
              <FormInput
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                placeholder="Enter email"
                required
              />
              <div className="space-y-2">
                <FormInput
                  label="Password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  placeholder="Create a strong password"
                  required
                />
                {formData.password && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor:
                            passwordStrength >= 4
                              ? "#10b981"
                              : passwordStrength >= 2
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">
                      Strength: {["Very Weak", "Weak", "Fair", "Good", "Strong"][passwordStrength]}
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={18} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-yellow-500 mt-1" size={20} />
                  <div>
                    <h3 className="text-yellow-500 font-medium mb-2">Development Phase Disclaimer</h3>
                    <div className="text-sm text-gray-300 space-y-2">
                      <p>⚠️ This platform is currently in development phase.</p>
                      <p>📹 Upload limit: Maximum 100 videos per user</p>
                      <p>🔄 Data may be reset during updates</p>
                      <p>🐛 You may encounter bugs and issues</p>
                      <p>🚀 Features are being actively developed</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedDisclaimer}
                    onChange={(e) => setAcceptedDisclaimer(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">
                    I understand and accept that this platform is in development phase and agree to the limitations mentioned above.
                  </span>
                </label>
                {errors.disclaimer && <span className="text-red-400 text-sm">{errors.disclaimer}</span>}
              </div>

              <div className="flex justify-between items-center gap-4 mt-6">
                <button
                  type="button"
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  onClick={() => setStep(1)}
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!acceptedDisclaimer}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <Shield className="mx-auto mb-4 text-blue-500" size={48} />
                <h3 className="text-xl font-bold text-white mb-2">Email Verification</h3>
                <p className="text-gray-400">
                  {otpSent
                    ? "We've sent a verification code to your email address"
                    : "Sending verification code to your email..."
                  }
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Enter Verification Code
                  </label>
                  <OTPInput
                    length={6}
                    onComplete={handleOTPChange}
                    value={formData.otp}
                    disabled={verifyingOtp}
                    error={!!errors.otp}
                  />
                  {errors.otp && (
                    <span className="text-red-400 text-sm block text-center">{errors.otp}</span>
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    {otpSent && (
                      <span className="text-green-400">✓ OTP Sent!</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    Didn't receive? {" "}
                    <button
                      type="button"
                      onClick={sendOTP}
                      disabled={otpLoading || cooldownTime > 0}
                      className="text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {otpLoading
                        ? "Sending..."
                        : cooldownTime > 0
                          ? `Resend in ${formatTime(cooldownTime)}`
                          : "Resend"
                      }
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center gap-4 mt-6">
                <button
                  type="button"
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  onClick={() => setStep(2)}
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!formData.otp || formData.otp.length !== 6 || verifyingOtp}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {verifyingOtp ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify OTP <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Upload Avatar (Optional)</label>
                <p className="text-xs text-gray-400 mb-2">If not provided, a default avatar will be generated based on your name</p>
                <input
                  type="file"
                  name="avatar"
                  accept="image/*"
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white file:bg-gray-700 file:border-0 file:px-4 file:py-2 file:rounded file:text-white file:cursor-pointer hover:border-gray-500 transition-colors duration-200"
                />
                {errors.avatar && <span className="text-red-400 text-sm">{errors.avatar}</span>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Upload Cover Image (Optional)</label>
                <p className="text-xs text-gray-400 mb-2">If not provided, a default cover image will be used</p>
                <input
                  type="file"
                  name="coverImage"
                  accept="image/*"
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white file:bg-gray-700 file:border-0 file:px-4 file:py-2 file:rounded file:text-white file:cursor-pointer hover:border-gray-500 transition-colors duration-200"
                />
                {errors.coverImage && <span className="text-red-400 text-sm">{errors.coverImage}</span>}
              </div>

              <div className="flex justify-between items-center gap-4 mt-6">
                <button
                  type="button"
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                  onClick={() => setStep(3)}
                  disabled={loading}
                >
                  <ArrowLeft size={18} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? "Creating..." : "Create Account"} <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}
        </form>

        <div className="p-8 pt-0 text-center border-t border-gray-700">
          <p className="text-gray-400">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
