export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password) => {
  const minLength = password.length >= 8
  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  return {
    minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumbers,
    strength: [minLength, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length,
  }
}

export const validateUsername = (username) => {
  const minLength = username.length >= 3
  const maxLength = username.length <= 20
  const validChars = /^[a-zA-Z0-9_]+$/.test(username)
  const notStartsWithNumber = !/^\d/.test(username)

  return {
    minLength,
    maxLength,
    validChars,
    notStartsWithNumber,
    isValid: minLength && maxLength && validChars && notStartsWithNumber,
  }
}

export const validateFullName = (fullName) => {
  const minLength = fullName.trim().length >= 2
  const maxLength = fullName.trim().length <= 50
  const validChars = /^[a-zA-Z\s]+$/.test(fullName.trim())

  return {
    minLength,
    maxLength,
    validChars,
    isValid: minLength && maxLength && validChars,
  }
}
