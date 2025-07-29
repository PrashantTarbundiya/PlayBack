import { useState, useRef, useEffect } from 'react'

const OTPInput = ({ length = 6, onComplete, value = '', disabled = false, error = false }) => {
  const [otp, setOtp] = useState(new Array(length).fill(''))
  const inputRefs = useRef([])

  // Initialize refs
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length)
  }, [length])

  // Update OTP when value prop changes
  useEffect(() => {
    if (value) {
      const otpArray = value.split('').slice(0, length)
      while (otpArray.length < length) {
        otpArray.push('')
      }
      setOtp(otpArray)
    } else {
      setOtp(new Array(length).fill(''))
    }
  }, [value, length])

  const handleChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, '') // Only allow numbers
    
    if (value.length <= 1) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      // Call onComplete when all fields are filled
      const otpString = newOtp.join('')
      if (onComplete) {
        onComplete(otpString)
      }

      // Move to next input if current field is filled
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus()
      }
    }
  }

  const handleKeyDown = (e, index) => {
    // Move to previous input on backspace if current field is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    
    // Move to next input on arrow right
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
    
    // Move to previous input on arrow left
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }

    // Allow only numbers, backspace, delete, arrow keys, and tab
    if (!/[0-9]/.test(e.key) && 
        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
      e.preventDefault()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '')
    
    if (pasteData) {
      const pasteArray = pasteData.split('').slice(0, length)
      const newOtp = [...otp]
      
      pasteArray.forEach((digit, index) => {
        if (index < length) {
          newOtp[index] = digit
        }
      })
      
      // Fill remaining with empty strings
      for (let i = pasteArray.length; i < length; i++) {
        newOtp[i] = ''
      }
      
      setOtp(newOtp)
      
      // Focus on the next empty field or the last field
      const nextEmptyIndex = newOtp.findIndex(digit => digit === '')
      const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : length - 1
      inputRefs.current[focusIndex]?.focus()

      // Call onComplete
      if (onComplete) {
        onComplete(newOtp.join(''))
      }
    }
  }

  const handleFocus = (index) => {
    // Select all text when focusing
    inputRefs.current[index]?.select()
  }

  return (
    <div className="flex justify-center gap-2 mb-4">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(ref) => (inputRefs.current[index] = ref)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-lg bg-gray-800 text-white transition-all duration-200 focus:outline-none ${
            error
              ? 'border-red-500 focus:border-red-400'
              : 'border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
          } ${
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500'
          }`}
          autoComplete="off"
        />
      ))}
    </div>
  )
}

export default OTPInput