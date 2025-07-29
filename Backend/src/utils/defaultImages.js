// Default images for OAuth users
export const getDefaultImages = (fullName, provider) => {
    // Generate a simple avatar using UI Avatars service
    const initials = fullName
        ? fullName.split(' ').map(name => name[0]).join('').toUpperCase().slice(0, 2)
        : 'U';
    
    // Color scheme based on provider
    const providerColors = {
        google: { bg: '4285f4', color: 'ffffff' },
        facebook: { bg: '1877f2', color: 'ffffff' },
        github: { bg: '333333', color: 'ffffff' },
        local: { bg: '6366f1', color: 'ffffff' }
    };
    
    const colors = providerColors[provider] || providerColors.local;
    
    const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=${colors.bg}&color=${colors.color}&bold=true`;
    
    const defaultCoverImage = `https://via.placeholder.com/800x200/${colors.bg}/${colors.color}?text=PlayBack`;
    
    return {
        avatar: defaultAvatar,
        coverImage: defaultCoverImage
    };
};

// Fallback images if external services fail
export const FALLBACK_IMAGES = {
    avatar: 'https://via.placeholder.com/200x200/6366f1/ffffff?text=U',
    coverImage: 'https://via.placeholder.com/800x200/6366f1/ffffff?text=PlayBack'
};