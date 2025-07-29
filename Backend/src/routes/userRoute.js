import { Router } from "express";
import {
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
    unlinkOAuthAccount } from "../controllers/userController.js";
import {upload} from "../middlewares/multer.js"
import { verifyJWT } from "../middlewares/authMiddleware.js";
import passport from "../config/passport.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser)

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT,logoutUser);

router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(verifyJWT,changeCurrentPassword);

router.route("/current-user").get(verifyJWT,getCurrentUser);

router.route("/update-account").patch(verifyJWT,updateAccountDetails);

router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);

router.route("/channel/:username").get(verifyJWT,getUserChannelProfile);

router.route("/history").get(verifyJWT,getWatchHistory);

router.route("/history/:videoId").patch(verifyJWT,addToWatchHistory);

router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(verifyOTPAndResetPassword);
router.route("/resend-otp").post(resendOTP);
router.route("/send-otp").post(sendRegistrationOTP);
router.route("/verify-otp").post(verifyRegistrationOTPOnly);

// OAuth2 Routes
// Google OAuth
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    router.get("/auth/google",
        passport.authenticate("google", { scope: ["profile", "email"] })
    );

    router.get("/auth/google/callback",
        passport.authenticate("google", { failureRedirect: "/api/v1/users/auth/failure" }),
        oauthSuccess
    );
} else {
    router.get("/auth/google", (req, res) => {
        res.status(501).json({ success: false, message: "Google OAuth not configured" });
    });
    router.get("/auth/google/callback", (req, res) => {
        res.status(501).json({ success: false, message: "Google OAuth not configured" });
    });
}

// Facebook OAuth
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    router.get("/auth/facebook",
        passport.authenticate("facebook", { scope: ["email"] })
    );

    router.get("/auth/facebook/callback",
        passport.authenticate("facebook", { failureRedirect: "/api/v1/users/auth/failure" }),
        oauthSuccess
    );
} else {
    router.get("/auth/facebook", (req, res) => {
        res.status(501).json({ success: false, message: "Facebook OAuth not configured" });
    });
    router.get("/auth/facebook/callback", (req, res) => {
        res.status(501).json({ success: false, message: "Facebook OAuth not configured" });
    });
}

// GitHub OAuth
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    router.get("/auth/github",
        passport.authenticate("github", { scope: ["user:email"] })
    );

    router.get("/auth/github/callback",
        passport.authenticate("github", { failureRedirect: "/api/v1/users/auth/failure" }),
        oauthSuccess
    );
} else {
    router.get("/auth/github", (req, res) => {
        res.status(501).json({ success: false, message: "GitHub OAuth not configured" });
    });
    router.get("/auth/github/callback", (req, res) => {
        res.status(501).json({ success: false, message: "GitHub OAuth not configured" });
    });
}

router.get("/auth/failure", oauthFailure);

// OAuth failure route

router.route("/link/:provider").post(verifyJWT, linkOAuthAccount);
router.route("/unlink/:provider").delete(verifyJWT, unlinkOAuthAccount);

export default router;