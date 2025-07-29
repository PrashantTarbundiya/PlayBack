import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { userModel } from '../models/userModel.js';
import { uploadFromUrlToCloudinary } from '../utils/cloudinary.js';
import { getDefaultImages, FALLBACK_IMAGES } from '../utils/defaultImages.js';

// JWT Strategy for API authentication
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.ACCESS_TOKEN_SECRET
}, async (payload, done) => {
    try {
        const user = await userModel.findById(payload._id).select('-password -refreshToken');
        if (user) {
            return done(null, user);
        }
        return done(null, false);
    } catch (error) {
        return done(error, false);
    }
}));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v1/users/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with this Google ID
        let user = await userModel.findOne({ googleId: profile.id });
        
        if (user) {
            return done(null, user);
        }

        // Check if user exists with same email
        user = await userModel.findOne({ email: profile.emails[0].value });
        
        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.provider = 'google';
            user.isEmailVerified = true;
            await user.save({ validateBeforeSave: false });
            return done(null, user);
        }

        // Create new user
        const defaultImages = getDefaultImages(profile.displayName, 'google');
        const avatar = profile.photos[0]?.value;
        let avatarUrl = defaultImages.avatar;

        // Upload avatar to cloudinary if it's a URL from OAuth provider
        if (avatar && avatar.startsWith('http')) {
            try {
                const uploadResult = await uploadFromUrlToCloudinary(avatar);
                avatarUrl = uploadResult?.url || avatar;
            } catch (error) {
                console.warn('Failed to upload Google avatar to Cloudinary:', error.message);
                avatarUrl = avatar || defaultImages.avatar;
            }
        }

        // Generate unique username
        let username = profile.emails[0].value.split('@')[0].toLowerCase();
        let usernameExists = await userModel.findOne({ username });
        let counter = 1;
        
        while (usernameExists) {
            username = `${profile.emails[0].value.split('@')[0].toLowerCase()}${counter}`;
            usernameExists = await userModel.findOne({ username });
            counter++;
        }

        const newUser = await userModel.create({
            googleId: profile.id,
            username,
            email: profile.emails[0].value,
            fullName: profile.displayName,
            avatar: avatarUrl,
            coverImage: defaultImages.coverImage,
            provider: 'google',
            isEmailVerified: true
        });

        return done(null, newUser);
    } catch (error) {
        return done(error, null);
    }
    }));
} else {
    console.warn('Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET required');
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v1/users/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'photos', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with this Facebook ID
        let user = await userModel.findOne({ facebookId: profile.id });
        
        if (user) {
            return done(null, user);
        }

        // Check if user exists with same email
        const email = profile.emails?.[0]?.value;
        if (email) {
            user = await userModel.findOne({ email });
            
            if (user) {
                user.facebookId = profile.id;
                user.provider = 'facebook';
                user.isEmailVerified = true;
                await user.save({ validateBeforeSave: false });
                return done(null, user);
            }
        }

        // Create new user
        const defaultImages = getDefaultImages(profile.displayName, 'facebook');
        const avatar = profile.photos[0]?.value;
        let avatarUrl = defaultImages.avatar;

        // Upload avatar to cloudinary if it's a URL from OAuth provider
        if (avatar && avatar.startsWith('http')) {
            try {
                const uploadResult = await uploadFromUrlToCloudinary(avatar);
                avatarUrl = uploadResult?.url || avatar;
            } catch (error) {
                console.warn('Failed to upload Facebook avatar to Cloudinary:', error.message);
                avatarUrl = avatar || defaultImages.avatar;
            }
        }

        // Generate unique username
        let username = email ? email.split('@')[0].toLowerCase() : `facebook_${profile.id}`;
        let usernameExists = await userModel.findOne({ username });
        let counter = 1;
        
        while (usernameExists) {
            username = email ? `${email.split('@')[0].toLowerCase()}${counter}` : `facebook_${profile.id}_${counter}`;
            usernameExists = await userModel.findOne({ username });
            counter++;
        }

        const newUser = await userModel.create({
            facebookId: profile.id,
            username,
            email: email || `facebook_${profile.id}@facebook.local`,
            fullName: profile.displayName,
            avatar: avatarUrl,
            coverImage: defaultImages.coverImage,
            provider: 'facebook',
            isEmailVerified: !!email
        });

        return done(null, newUser);
    } catch (error) {
        return done(error, null);
    }
    }));
} else {
    console.warn('Facebook OAuth not configured - FACEBOOK_APP_ID and FACEBOOK_APP_SECRET required');
}

// GitHub OAuth Strategy
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL || 'http://localhost:8000'}/api/v1/users/auth/github/callback`
    }, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user already exists with this GitHub ID
        let user = await userModel.findOne({ githubId: profile.id });
        
        if (user) {
            return done(null, user);
        }

        // Check if user exists with same email
        const email = profile.emails?.[0]?.value;
        if (email) {
            user = await userModel.findOne({ email });
            
            if (user) {
                // Link GitHub account to existing user
                user.githubId = profile.id;
                user.provider = 'github';
                user.isEmailVerified = true;
                await user.save({ validateBeforeSave: false });
                return done(null, user);
            }
        }

        // Create new user
        const defaultImages = getDefaultImages(profile.displayName || profile.username, 'github');
        const avatar = profile.photos[0]?.value;
        let avatarUrl = defaultImages.avatar;

        // Upload avatar to cloudinary if it's a URL from OAuth provider
        if (avatar && avatar.startsWith('http')) {
            try {
                const uploadResult = await uploadFromUrlToCloudinary(avatar);
                avatarUrl = uploadResult?.url || avatar;
            } catch (error) {
                console.warn('Failed to upload GitHub avatar to Cloudinary:', error.message);
                avatarUrl = avatar || defaultImages.avatar;
            }
        }

        // Generate unique username
        let username = profile.username?.toLowerCase() || (email ? email.split('@')[0].toLowerCase() : `github_${profile.id}`);
        let usernameExists = await userModel.findOne({ username });
        let counter = 1;
        
        while (usernameExists) {
            const baseUsername = profile.username?.toLowerCase() || (email ? email.split('@')[0].toLowerCase() : `github_${profile.id}`);
            username = `${baseUsername}${counter}`;
            usernameExists = await userModel.findOne({ username });
            counter++;
        }

        const newUser = await userModel.create({
            githubId: profile.id,
            username,
            email: email || `github_${profile.id}@github.local`,
            fullName: profile.displayName || profile.username,
            avatar: avatarUrl,
            coverImage: defaultImages.coverImage,
            provider: 'github',
            isEmailVerified: !!email
        });

        return done(null, newUser);
    } catch (error) {
        return done(error, null);
    }
    }));
} else {
    console.warn('GitHub OAuth not configured - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET required');
}

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await userModel.findById(id).select('-password -refreshToken');
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

export default passport;