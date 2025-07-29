"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import FormInput from "../components/FormInput"
import LoadingButton from "../components/LoadingButton"
import OAuthButtons from "../components/OAuthButtons"
import { Mail, Lock, ArrowRight } from "lucide-react"
import toast from "react-hot-toast"

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const { login, isAuthenticated, handleOAuthCallback } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || "/"

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  // Handle OAuth2 callback
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const oauthSuccess = urlParams.get('oauth')
    const token = urlParams.get('token')
    const error = urlParams.get('error')

    if (oauthSuccess === 'success' && token) {
      // Use the proper OAuth callback handler
      handleOAuthCallback(token)
        .then(() => {
          navigate(from, { replace: true })
        })
        .catch((error) => {
          console.error('OAuth callback failed:', error)
        })
        .finally(() => {
          // Clean up URL
          window.history.replaceState({}, document.title, location.pathname)
        })
    } else if (error) {
      if (error === 'oauth_failed') {
        toast.error('OAuth authentication failed. Please try again.')
      }
      // Clean up URL
      window.history.replaceState({}, document.title, location.pathname)
    }
  }, [location.search, navigate, from, handleOAuthCallback])

  const validateForm = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Please fix the errors below")
      return
    }

    setLoading(true)

    try {
      await login(formData)
      // Success handling is done in the login function
      navigate(from, { replace: true })
    } catch (error) {
      // Error handling is done in the login function
      console.error("Login error:", error)
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
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-gray-400">Sign in to continue to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* OAuth Buttons at the top */}
          <div className="space-y-3">
            <OAuthButtons loading={loading} />
            
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gray-800 text-gray-400">Or continue with email</span>
              </div>
            </div>
          </div>

          <FormInput
            label="Email Address"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter your email"
            required
            disabled={loading}
          />

          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter your password"
            required
            disabled={loading}
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={loading}
                  className="sr-only"
                />
                <div className={`w-4 h-4 border-2 rounded transition-colors duration-200 ${
                  rememberMe
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-400 bg-transparent'
                }`}>
                  {rememberMe && (
                    <svg className="w-3 h-3 text-white absolute top-0.5 left-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm text-gray-300">Remember me</span>
            </label>
            <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300 transition-colors duration-200">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            {loading ? "Signing In..." : "Sign In"}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="p-8 pt-0 text-center border-t border-gray-700">
          <p className="text-gray-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200">
              Create one here
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
