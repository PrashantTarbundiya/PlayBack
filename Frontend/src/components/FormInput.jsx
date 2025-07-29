"use client"

import { useState } from "react"
import { Eye, EyeOff, AlertCircle } from "lucide-react"

const FormInput = ({
  label,
  type = "text",
  name,
  value,
  onChange,
  error = "",
  placeholder = "",
  required = false,
  disabled = false,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)

  const isPassword = type === "password"
  const inputType = isPassword && showPassword ? "text" : type

  return (
    <div className={`mb-4 ${error ? 'text-red-400' : ''}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-2">
          {label} {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setIsFocused(true)
            // Prevent text selection on focus for supported input types
            try {
              if (inputType === 'text' || inputType === 'password') {
                e.target.setSelectionRange(e.target.value.length, e.target.value.length)
              }
            } catch (error) {
              // Ignore errors for input types that don't support selection
            }
          }}
          onBlur={() => setIsFocused(false)}
          onClick={(e) => {
            // Prevent text selection on click for supported input types
            try {
              if (inputType === 'text' || inputType === 'password') {
                e.target.setSelectionRange(e.target.value.length, e.target.value.length)
              }
            } catch (error) {
              // Ignore errors for input types that don't support selection
            }
          }}
          onMouseUp={(e) => {
            // Prevent text selection on mouse up
            e.preventDefault()
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed ${
            error
              ? 'border-red-400 focus:ring-red-400'
              : 'border-gray-600 hover:border-gray-500'
          } ${isPassword ? 'pr-12' : ''}`}
          style={{ userSelect: 'none' }}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={disabled}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 text-red-400 text-sm" id={`${name}-error`}>
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

export default FormInput
