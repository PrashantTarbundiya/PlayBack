"use client"

import { useAuth } from "../contexts/AuthContext"
import { Navigate, useLocation } from "react-router-dom"
import LoadingScreen from "./Skeleton/LoadingScreen"

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingScreen message="Checking authentication..." />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
