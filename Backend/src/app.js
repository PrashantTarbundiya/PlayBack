import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "./config/passport.js";
import { apiErrors } from "./utils/apiErrors.js";

const app = express();
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials :true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({ extended: true,limit:"16kb"}));
app.use(express.static("public"))
app.use(cookieParser())

// Session configuration for OAuth
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//routes import
import userRouter from "./routes/userRoute.js"
import healthcheckRouter from "./routes/healthcheckRoute.js"
import tweetRouter from "./routes/tweetRoute.js"
import subscriptionRouter from "./routes/subscriptionRoute.js"
import videoRouter from "./routes/videoRoute.js"
import commentRouter from "./routes/commentRoute.js"
import likeRouter from "./routes/likeRoute.js"
import playlistRouter from "./routes/playlistRoute.js"
import dashboardRouter from "./routes/dashboardRoute.js"
import notificationRouter from "./routes/notificationRoute.js"

//routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter)
app.use("/api/v1/users", userRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlist", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)
app.use("/api/v1/notifications", notificationRouter)


app.use((err, req, res, next) => {
    if (err.statusCode) {
        return res.status(err.statusCode).json(
            new apiErrors(err.statusCode, err.message, err.errors || [])
        );
    }

    console.error(err.stack);
    return res.status(500).json(
        new apiErrors(500, "Internal server error")
    );
});

export { app }