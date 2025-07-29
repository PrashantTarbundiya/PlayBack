import React from 'react';
import { FaGoogle, FaFacebook, FaGithub } from 'react-icons/fa';

const OAuthButtons = ({ loading = false, className = "" }) => {
  const handleOAuthLogin = (provider) => {
    if (loading) return;
    
    // Get the API URL from environment or use default
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const oauthUrl = `${apiUrl}/api/v1/users/auth/${provider}`;
    
    // Direct redirect to backend OAuth endpoint
    window.location.href = oauthUrl;
  };

  const oauthProviders = [
    {
      name: 'Google',
      provider: 'google',
      icon: FaGoogle,
      bgColor: 'bg-red-600 hover:bg-red-700',
      textColor: 'text-white',
      borderColor: 'hover:border-red-400'
    },
    {
      name: 'Facebook',
      provider: 'facebook',
      icon: FaFacebook,
      bgColor: 'bg-blue-600 hover:bg-blue-700',
      textColor: 'text-white',
      borderColor: 'hover:border-blue-400'
    },
    {
      name: 'GitHub',
      provider: 'github',
      icon: FaGithub,
      bgColor: 'bg-white hover:bg-gray-100',
      textColor: 'text-gray-900',
      borderColor: 'hover:border-gray-400'
    }
  ];

  return (
    <div className={`flex justify-center gap-3 ${className}`}>
      {oauthProviders.map(({ name, provider, icon: Icon, bgColor, textColor, borderColor }) => (
        <button
          key={provider}
          type="button"
          onClick={() => handleOAuthLogin(provider)}
          disabled={loading}
          title={`Continue with ${name}`}
          className={`
            w-12 h-12 flex items-center justify-center
            ${bgColor} ${textColor}
            rounded-full font-medium transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            hover:shadow-lg transform hover:scale-110 active:scale-95
            border-2 border-gray-300 ${borderColor}
          `}
        >
          <Icon size={20} />
        </button>
      ))}
    </div>
  );
};

export default OAuthButtons;