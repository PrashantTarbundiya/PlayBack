import { asyncHandler } from "../utils/asyncHandler.js"
import { apiErrors } from "../utils/apiErrors.js"
import { userModel } from "../models/userModel.js"
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js"
import { getDefaultImages, FALLBACK_IMAGES } from "../utils/defaultImages.js"
import { apiResponse } from "../utils/apiResponse.js"
import { videoModel} from "../models/videoModel.js"
import jwt from "jsonwebtoken";
import mongoose from "mongoose"
import { generateOTP, sendOTPEmail, sendRegistrationOTPEmail, sendPasswordResetConfirmationEmail } from "../utils/emailService.js"

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await userModel.findById(userId);
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    }
    catch (error) {
        throw new apiErrors(500, "Error generating access and refresh token");
    }
}

// Store OTPs temporarily for registration (in production, use Redis or database)
const registrationOTPStore = new Map();

const sendRegistrationOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new apiErrors(400, "Email is required");
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new apiErrors(409, "User with this email already exists");
    }

    // Check if 2.5 minutes have passed since last OTP request
    const now = new Date();
    const twoAndHalfMinutesAgo = new Date(now.getTime() - 2.5 * 60 * 1000);
    const existingOTP = registrationOTPStore.get(email.toLowerCase());
    
    if (existingOTP && existingOTP.lastSent && existingOTP.lastSent > twoAndHalfMinutesAgo) {
        const timeRemaining = Math.ceil((existingOTP.lastSent.getTime() + 2.5 * 60 * 1000 - now.getTime()) / 1000);
        throw new apiErrors(429, `Please wait ${timeRemaining} seconds before requesting a new OTP.`);
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP with timestamp
    registrationOTPStore.set(email.toLowerCase(), {
        otp,
        expiry: otpExpiry,
        lastSent: now
    });

    // Try to send OTP via email, but don't fail if email service is not configured
    try {
        const emailResult = await sendRegistrationOTPEmail(email, otp, "New User");
        
        if (!emailResult.success) {
            console.warn("Email service failed, but continuing for development:", emailResult.error);
        }
    } catch (error) {
        console.warn("Email service not configured, continuing for development:", error.message);
    }

    return res.status(200).json(
        new apiResponse(200, {
            developmentOTP: process.env.NODE_ENV === 'development' ? otp : undefined
        }, "OTP sent successfully")
    );
});

const verifyRegistrationOTP = (email, providedOtp) => {
    const storedData = registrationOTPStore.get(email.toLowerCase());
    
    if (!storedData) {
        return false;
    }

    if (Date.now() > storedData.expiry) {
        registrationOTPStore.delete(email.toLowerCase());
        return false;
    }

    if (storedData.otp !== providedOtp) {
        return false;
    }

    registrationOTPStore.delete(email.toLowerCase());
    return true;
};

const verifyRegistrationOTPOnly = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        throw new apiErrors(400, "Email and OTP are required");
    }

    // Verify OTP without registering the user
    if (!verifyRegistrationOTP(email, otp)) {
        throw new apiErrors(400, "Invalid or expired OTP");
    }

    // Re-store the OTP for actual registration (since verifyRegistrationOTP deletes it)
    const newOtp = generateOTP();
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    registrationOTPStore.set(email.toLowerCase(), {
        otp: newOtp,
        expiry: otpExpiry,
        lastSent: new Date(),
        verified: true // Mark as verified
    });

    return res.status(200).json(
        new apiResponse(200, { verified: true }, "OTP verified successfully")
    );
});

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { fullName, email, username, password, otp } = req.body;

    // if(fullName === ""){
    //     return new apiErrors(400,"fullname is require");
    // }

    if (
        [fullName, email, username, password, otp].some((field) => field?.trim() === "")
    ) {
        throw new apiErrors(400, "All fields are required");
    }

    // Verify OTP or check if it was pre-verified
    const storedData = registrationOTPStore.get(email.toLowerCase());
    if (!storedData || (!storedData.verified && !verifyRegistrationOTP(email, otp))) {
        throw new apiErrors(400, "Invalid or expired OTP");
    }
    
    // Clear the OTP data after successful registration
    registrationOTPStore.delete(email.toLowerCase());

    const existedUser = await userModel.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new apiErrors(409, "User with this email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    // Get default images for local registration
    const defaultImages = getDefaultImages(fullName, 'local');
    let avatarUrl = defaultImages.avatar;
    let coverImageUrl = defaultImages.coverImage;

    // Upload avatar if provided
    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (avatar) {
            avatarUrl = avatar.url;
        }
    }

    // Upload cover image if provided
    if (coverImageLocalPath) {
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);
        if (coverImage) {
            coverImageUrl = coverImage.url;
        }
    }

    const user = await userModel.create({
        fullName,
        avatar: avatarUrl,
        coverImage: coverImageUrl,
        email,
        password,
        username: username.toLowerCase(),
        provider: 'local',
        isEmailVerified: true // Since they verified OTP
    })

    const createdUser = await userModel.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new apiErrors(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new apiResponse(200, createdUser, "User register successfully")
    )

})

const loginUser = asyncHandler(async (req, res) => {
    const { email, password, username } = req.body || {};

    if (!username && !email) {
        throw new apiErrors(400, "Username or email is required");
    }

    const user = await userModel.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new apiErrors(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new apiErrors(400, "User or Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await userModel.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new apiResponse(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged in successfully"
            )
        )
});

const logoutUser = asyncHandler(async (req, res) => {
    await userModel.findByIdAndUpdate(
        req.user._id,
        {
            $unset: { refreshToken: 1 }
        },
        {
            new: true,
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new apiResponse(200, {}, "User logged out successfully")
        )
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new apiErrors(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await userModel.findById(decodedToken?._id);

        if (!user) {
            throw new apiErrors(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiErrors(401, "Refresh token is expired or used");
        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user?._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new apiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed successfully"
                )
            )
    } catch (error) {
        throw new apiErrors(401, error.message || "Invalid refresh token")
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { newPassword, oldPassword } = req.body;

    const user = await userModel.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new apiErrors(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: true });

    return res.status(200).json(
        new apiResponse(200, {}, "Password change successfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new apiResponse(200, req.user, "Current user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new apiErrors(400, "All fields are required");
    }

    const user = await userModel.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                user,
                "Account details updated successfully"
            )
        )
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new apiErrors(400, "Avatar file is missing");
    }

    const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath);

    if (!uploadedAvatar?.secure_url) {
        throw new apiErrors(500, "Cloudinary upload failed");
    }

    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        { 
            $set: { 
                avatar: uploadedAvatar.secure_url 
            } 
        },
        { 
            new: true 
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                user, 
                "Avatar updated successfully"
        )
    );
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new apiErrors(400, "Cover image file is missing");
    }

    const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!uploadedCoverImage?.secure_url) {
        throw new apiErrors(500, "Cloudinary upload failed");
    }

    const user = await userModel.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: uploadedCoverImage.secure_url
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken");

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                user,
                "Cover image updated successfully"
            )
        );

});


const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new apiErrors(400, "username is missing");
    }

    const channel = await userModel.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscribers",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ])

    if (!channel?.length) {
        throw new apiErrors(404, "Channel does not exists");
    }

    return res.status(200)
        .json(
            new apiResponse(
                200,
                channel[0],
                "User channel fatched successfully"
            )
        )

});

const getWatchHistory = asyncHandler(async (req, res) => {

    const user = await userModel.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            // Unwind the watchHistory array to preserve order
            $unwind: {
                path: "$watchHistory",
                includeArrayIndex: "watchIndex"
            }
        },
        {
            // Group by video ID to get the most recent watch (lowest index)
            $group: {
                _id: {
                    userId: "$_id",
                    videoId: "$watchHistory"
                },
                fullName: { $first: "$fullName" },
                username: { $first: "$username" },
                email: { $first: "$email" },
                avatar: { $first: "$avatar" },
                coverImage: { $first: "$coverImage" },
                watchHistory: { $first: "$watchHistory" },
                watchIndex: { $min: "$watchIndex" } // Get the most recent watch (lowest index)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "videoData",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$videoData"
        },
        {
            // Sort by watch index (0 is most recent)
            $sort: {
                watchIndex: 1
            }
        },
        {
            $group: {
                _id: "$_id.userId",
                fullName: { $first: "$fullName" },
                username: { $first: "$username" },
                email: { $first: "$email" },
                avatar: { $first: "$avatar" },
                coverImage: { $first: "$coverImage" },
                watchHistory: {
                    $push: "$videoData"
                }
            }
        },
        {
            $project: {
                password: 0,
            }
        }
    ])

    return res.status(200)
        .json(
            new apiResponse(
                200,
                user[0] || { watchHistory: [] },
                "Watch history fetched successfully"
            )
        )
})

const addToWatchHistory = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;

    if (!videoId) {
        throw new apiErrors(400, "Video ID is required");
    }

    // Check if video exists
    const video = await videoModel.findById(videoId);
    
    if (!video) {
        throw new apiErrors(404, "Video not found");
    }

    // Add video to user's watch history (avoid duplicates by removing if exists and adding to front)
    const user = await userModel.findByIdAndUpdate(
        userId,
        {
            $pull: { watchHistory: videoId }, // Remove if exists
        },
        { new: true }
    );

    // Add to front of watch history
    await userModel.findByIdAndUpdate(
        userId,
        {
            $push: {
                watchHistory: {
                    $each: [videoId],
                    $position: 0
                }
            }
        },
        { new: true }
    );

    return res.status(200).json(
        new apiResponse(200, {}, "Video added to watch history successfully")
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new apiErrors(400, "Email is required");
    }

    // Find user by email
    const user = await userModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
        throw new apiErrors(404, "User with this email does not exist");
    }

    // Check if user has exceeded maximum attempts (3 attempts per day)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Reset attempts if last attempt was more than 24 hours ago
    if (!user.resetPasswordLastAttempt || user.resetPasswordLastAttempt < oneDayAgo) {
        user.resetPasswordAttempts = 0;
    }

    if (user.resetPasswordAttempts >= 3) {
        throw new apiErrors(429, "Maximum OTP attempts exceeded. Please try again after 24 hours.");
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user with OTP and increment attempts
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = otpExpiry;
    user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
    user.resetPasswordLastAttempt = now;
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    const emailResult = await sendOTPEmail(user.email, otp, user.fullName);
    
    if (!emailResult.success) {
        throw new apiErrors(500, "Failed to send OTP email. Please try again.");
    }

    const remainingAttempts = 3 - user.resetPasswordAttempts;
    return res.status(200).json(
        new apiResponse(200, {
            email: user.email,
            remainingAttempts: remainingAttempts
        }, `OTP sent to your email successfully. ${remainingAttempts} attempts remaining.`)
    );
});

const verifyOTPAndResetPassword = asyncHandler(async (req, res) => {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
        throw new apiErrors(400, "Email, OTP, and new password are required");
    }

    if (newPassword.length < 6) {
        throw new apiErrors(400, "Password must be at least 6 characters long");
    }

    // Find user by email
    const user = await userModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
        throw new apiErrors(404, "User not found");
    }

    // Check if OTP exists and is not expired
    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpiry) {
        throw new apiErrors(400, "No OTP found. Please request a new one.");
    }

    if (user.resetPasswordOTPExpiry < new Date()) {
        throw new apiErrors(400, "OTP has expired. Please request a new one.");
    }

    if (user.resetPasswordOTP !== otp) {
        throw new apiErrors(400, "Invalid OTP");
    }

    // Reset password and clear all reset-related fields
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    user.resetPasswordAttempts = 0; // Reset attempts counter
    user.resetPasswordLastAttempt = undefined;
    user.refreshToken = undefined; // Invalidate all sessions
    
    await user.save({ validateBeforeSave: true });

    // Send confirmation email
    await sendPasswordResetConfirmationEmail(user.email, user.fullName);

    return res.status(200).json(
        new apiResponse(200, {}, "Password reset successfully")
    );
});

const resendOTP = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new apiErrors(400, "Email is required");
    }

    // Find user by email
    const user = await userModel.findOne({ email: email.toLowerCase() });
    
    if (!user) {
        throw new apiErrors(404, "User with this email does not exist");
    }

    // Check if user has exceeded maximum attempts (3 attempts per day)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago
    
    // Reset attempts if last attempt was more than 24 hours ago
    if (!user.resetPasswordLastAttempt || user.resetPasswordLastAttempt < oneDayAgo) {
        user.resetPasswordAttempts = 0;
    }

    if (user.resetPasswordAttempts >= 3) {
        throw new apiErrors(429, "Maximum OTP attempts exceeded. Please try again after 24 hours.");
    }

    // Check if 2 minutes have passed since last attempt
    if (user.resetPasswordLastAttempt && user.resetPasswordLastAttempt > twoMinutesAgo) {
        const timeRemaining = Math.ceil((user.resetPasswordLastAttempt.getTime() + 2 * 60 * 1000 - now.getTime()) / 1000);
        throw new apiErrors(429, `Please wait ${timeRemaining} seconds before requesting a new OTP.`);
    }

    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Update user with new OTP and increment attempts
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = otpExpiry;
    user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
    user.resetPasswordLastAttempt = now;
    await user.save({ validateBeforeSave: false });

    // Send OTP email
    const emailResult = await sendOTPEmail(user.email, otp, user.fullName);
    
    if (!emailResult.success) {
        throw new apiErrors(500, "Failed to send OTP email. Please try again.");
    }

    const remainingAttempts = 3 - user.resetPasswordAttempts;
    return res.status(200).json(
        new apiResponse(200, {
            email: user.email,
            remainingAttempts: remainingAttempts
        }, `New OTP sent to your email successfully. ${remainingAttempts} attempts remaining.`)
    );
});

// OAuth2 Success Handler
const oauthSuccess = asyncHandler(async (req, res) => {
    try {
        const user = req.user;
        
        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
        }

        // Generate tokens
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

        // Set cookies
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        };

        res.cookie("accessToken", accessToken, options);
        res.cookie("refreshToken", refreshToken, options);

        // Redirect to frontend with success
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?oauth=success&token=${accessToken}`);
    } catch (error) {
        console.error('OAuth success handler error:', error);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }
});

// OAuth2 Failure Handler
const oauthFailure = asyncHandler(async (req, res) => {
    console.error('OAuth authentication failed');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
});

// Link OAuth Account
const linkOAuthAccount = asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const user = req.user;

    if (!user) {
        throw new apiErrors(401, "User not authenticated");
    }

    // Check if account is already linked
    const providerField = `${provider}Id`;
    if (user[providerField]) {
        throw new apiErrors(400, `${provider} account is already linked`);
    }

    // Store user ID in session for linking after OAuth
    req.session.linkUserId = user._id;
    req.session.linkProvider = provider;

    return res.status(200).json(
        new apiResponse(200, { redirectUrl: `/api/v1/users/auth/${provider}` }, "Redirect to OAuth provider")
    );
});

// Unlink OAuth Account
const unlinkOAuthAccount = asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const user = req.user;

    if (!user) {
        throw new apiErrors(401, "User not authenticated");
    }

    // Check if user has a password (can't unlink if no password set)
    if (!user.password && user.provider === provider) {
        throw new apiErrors(400, "Cannot unlink primary authentication method. Please set a password first.");
    }

    const providerField = `${provider}Id`;
    if (!user[providerField]) {
        throw new apiErrors(400, `${provider} account is not linked`);
    }

    // Remove OAuth provider data
    const updateData = {};
    updateData[providerField] = undefined;
    
    // If this was the primary provider, change to local
    if (user.provider === provider) {
        updateData.provider = 'local';
    }

    const updatedUser = await userModel.findByIdAndUpdate(
        user._id,
        { $unset: updateData },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(
        new apiResponse(200, updatedUser, `${provider} account unlinked successfully`)
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    addToWatchHistory,
    forgotPassword,
    verifyOTPAndResetPassword,
    resendOTP,
    sendRegistrationOTP,
    verifyRegistrationOTPOnly,
    oauthSuccess,
    oauthFailure,
    linkOAuthAccount,
    unlinkOAuthAccount
}