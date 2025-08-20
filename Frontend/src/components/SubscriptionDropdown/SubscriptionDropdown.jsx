import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, Users, Settings, ChevronDown } from 'lucide-react';
import { subscriptionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const SubscriptionDropdown = ({ 
  channelId, 
  isSubscribed, 
  onSubscriptionChange,
  className = "",
  size = "default" // "small", "default", "large"
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState('all');
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Size configurations 
  const sizeConfig = {
    small: {
      button: "px-3 py-1.5 text-sm",
      icon: 14,
      dropdown: "w-40"
    },
    default: {
      button: "px-4 py-2 text-base",
      icon: 16,
      dropdown: "w-44"
    },
    large: {
      button: "px-6 py-3 text-lg",
      icon: 18,
      dropdown: "w-48"
    }
  };

  const config = sizeConfig[size];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load notification preference from localStorage
  useEffect(() => {
    if (channelId && isSubscribed) {
      const savedPreference = localStorage.getItem(`notification_pref_${channelId}`);
      if (savedPreference) {
        setNotificationPreference(savedPreference);
      }
    }
  }, [channelId, isSubscribed]);

  const handleSubscriptionToggle = async () => {
    if (!user) {
      toast.remove()
      toast.error("Please login to subscribe");
      return;
    }

    if (!channelId) {
      toast.remove()
      toast.error("Channel information not available");
      return;
    }

    setLoading(true);
    try {
      const response = await subscriptionAPI.toggleSubscription(channelId);
      const newSubscriptionStatus = response?.data?.subscribed !== undefined
        ? response.data.subscribed
        : !isSubscribed;

      // Update parent component
      if (onSubscriptionChange) {
        onSubscriptionChange(newSubscriptionStatus);
      }

      // Clear notification preference if unsubscribing
      if (!newSubscriptionStatus) {
        localStorage.removeItem(`notification_pref_${channelId}`);
        setNotificationPreference('all');
      }

      toast.remove()
      toast.success(newSubscriptionStatus ? "Subscribed!" : "Unsubscribed");
      setIsOpen(false);
    } catch (error) {
      console.error("Subscription error:", error);
      let errorMessage = "Failed to update subscription";
      if (error.response?.status === 401) {
        errorMessage = "Please login to subscribe";
      } else if (error.response?.status === 404) {
        errorMessage = "Channel not found";
      }
      toast.remove()
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationPreferenceChange = (preference) => {
    setNotificationPreference(preference);
    localStorage.setItem(`notification_pref_${channelId}`, preference);
    setIsOpen(false);
    
    // Show feedback based on preference
    const messages = {
      all: "You'll get all notifications from this channel",
      personalised: "You'll get personalized notifications",
      none: "Notifications turned off for this channel"
    };
    
    toast.remove()
    toast.success(messages[preference]);
  };

  const getNotificationIcon = () => {
    if (!isSubscribed) return <Bell size={config.icon} />;
    
    switch (notificationPreference) {
      case 'all':
        return <Bell size={config.icon} />;
      case 'personalised':
        return <Settings size={config.icon} />;
      case 'none':
        return <BellOff size={config.icon} />;
      default:
        return <Bell size={config.icon} />;
    }
  };

  const getButtonText = () => {
    if (loading) return "Loading...";
    if (!isSubscribed) return "Subscribe";
    
    switch (notificationPreference) {
      case 'all':
        return "Subscribed";
      case 'personalised':
        return "Subscribed";
      case 'none':
        return "Subscribed";
      default:
        return "Subscribed";
    }
  };

  const getButtonStyle = () => {
    if (loading) {
      return "bg-gray-600 text-gray-400 cursor-not-allowed";
    }
    
    if (!isSubscribed) {
      return "bg-red-600 hover:bg-red-700 text-white hover:shadow-lg hover:shadow-red-500/30";
    }
    
    return "bg-gray-700 hover:bg-gray-600 text-white shadow-lg shadow-gray-500/20";
  };

  if (!user) {
    return (
      <button
        onClick={handleSubscriptionToggle}
        className={`btn-animate flex items-center gap-2 ${config.button} rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 bg-red-600 hover:bg-red-700 text-white hover:shadow-lg hover:shadow-red-500/30 ${className}`}
      >
        <Bell size={config.icon} />
        <span>Subscribe</span>
      </button>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Subscribe Button */}
      <button
        onClick={isSubscribed ? () => setIsOpen(!isOpen) : handleSubscriptionToggle}
        disabled={loading}
        className={`btn-animate flex items-center gap-2 ${config.button} rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${getButtonStyle()}`}
      >
        <span className={`transition-all duration-300 ${isSubscribed ? 'transform scale-110' : ''}`}>
          {getNotificationIcon()}
        </span>
        <span className="transition-all duration-200">
          {getButtonText()}
        </span>
        {isSubscribed && (
          <ChevronDown 
            size={config.icon - 2} 
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </button>

      {/* Dropdown Menu */}
      {isSubscribed && isOpen && (
        <div className={`absolute top-full left-0 mt-2 ${config.dropdown} bg-[#1c1c1c] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden dropdown-enter`}>
          {/* Notification Preferences */}
          <div className="py-1">
            <button
              onClick={() => handleNotificationPreferenceChange('all')}
              className={`w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm ${
                notificationPreference === 'all' ? 'bg-gray-700 text-white' : 'text-gray-300'
              }`}
            >
              <Bell size={14} />
              <span className="font-medium">All</span>
            </button>

            <button
              onClick={() => handleNotificationPreferenceChange('personalised')}
              className={`w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm ${
                notificationPreference === 'personalised' ? 'bg-gray-700 text-white' : 'text-gray-300'
              }`}
            >
              <Settings size={14} />
              <span className="font-medium">Personalised</span>
            </button>

            <button
              onClick={() => handleNotificationPreferenceChange('none')}
              className={`w-full px-3 py-2 text-left hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm ${
                notificationPreference === 'none' ? 'bg-gray-700 text-white' : 'text-gray-300'
              }`}
            >
              <BellOff size={14} />
              <span className="font-medium">None</span>
            </button>

            {/* Unsubscribe Option */}
            <div className="border-t border-gray-700 mt-1 pt-1">
              <button
                onClick={handleSubscriptionToggle}
                disabled={loading}
                className="w-full px-3 py-2 text-left hover:bg-red-600/20 transition-colors flex items-center gap-2 text-red-400 hover:text-red-300 text-sm"
              >
                <Users size={14} />
                <span className="font-medium">Unsubscribe</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionDropdown;