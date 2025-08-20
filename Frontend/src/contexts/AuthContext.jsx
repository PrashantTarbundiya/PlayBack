"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { authAPI } from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Token validation failed:", error);
        localStorage.removeItem("token");
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setLoading(false);
  }, []);

  // Handle OAuth2 callback
  const handleOAuthCallback = useCallback(async (token) => {
    try {
      localStorage.setItem("token", token);
      const response = await authAPI.getCurrentUser();
      setUser(response.data.data);
      setIsAuthenticated(true);
      toast.remove()
      toast.success(`Welcome back, ${response.data.data.fullName}!`);
      return { success: true, user: response.data.data };
    } catch (error) {
      console.error("OAuth callback failed:", error);
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
      const errorMessage = error.response?.data?.message || "OAuth authentication failed";
      toast.remove()
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const response = await authAPI.login(
        credentials.email,
        credentials.password
      );
      const { accessToken, user: userData } = response.data.data;

      localStorage.setItem("token", accessToken);
      setUser(userData);
      setIsAuthenticated(true);
      toast.remove()
      toast.success(`Welcome back, ${userData.fullName}!`);
      return { success: true, user: userData };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please try again.";
      toast.remove()
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const register = useCallback(async (formData) => {
    try {
      const response = await authAPI.register(formData);
      const newUser = response.data.data;
      const accessToken = localStorage.getItem("token"); // token set via cookie OR fallback

      if (!newUser) {
        throw new Error("User registration failed: Invalid response");
      }

      setUser(newUser);
      setIsAuthenticated(true);
      toast.remove()
      toast.success(`Welcome to PlayBack, ${newUser.fullName}!`);
      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Registration failed. Please try again.";
      toast.remove()
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (_) {
      // Ignore error
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      setIsAuthenticated(false);
      toast.remove()
      toast.success("Logged out successfully");
    }
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus,
    handleOAuthCallback,
  }), [user, loading, isAuthenticated, login, register, logout, updateUser, checkAuthStatus, handleOAuthCallback]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
