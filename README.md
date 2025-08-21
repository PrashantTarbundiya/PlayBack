## PlayBack — Video Streaming Platform

Modern YouTube‑like app with authentication (email/password + OAuth), video upload/streaming, playlists (including Watch Later), likes, comments, subscriptions, notifications, dashboard analytics, and more. Monorepo includes an Express + MongoDB backend and a React + Vite + Tailwind frontend.

### Contents
- Features
- Tech Stack
- Requirements
- Project Structure
- Quick Start
- Environment Variables
  - Backend .env
  - Frontend .env
- Running the Apps
- Scripts
- OAuth Setup (Google, Facebook, GitHub)
- API Overview
- Frontend Notes
- Deployment Notes
- License

## Features
- Authentication: email/password, JWT, refresh tokens, secure sessions for OAuth
- Social login: Google, Facebook, GitHub
- User profiles: avatar, cover image, account updates, password change, watch history
- Videos: upload (video + thumbnail), categories, recommendations, watch next, publish toggle, views
- Playlists: create/update/delete, add/remove videos, public/private visibility, saved playlists, Watch Later
- Social: likes (videos, comments), comments (CRUD), subscriptions, notifications
- Dashboard: channel stats and video management

## Tech Stack
- Backend: Node.js, Express, Mongoose, Passport (JWT + OAuth), Multer, Cloudinary, Nodemailer, CORS, Cookie/Session
- Frontend: React, Vite, React Router, Tailwind CSS , Axios, react-hot-toast, lucide-react
- DB/Storage: MongoDB (local/Atlas), Cloudinary for media

## Requirements
- Node.js 18+
- npm 9+
- MongoDB instance (local or Atlas)
- Cloudinary account (for media storage)

## Project Structure
```text
PlayBack/
  Backend/
    package-lock.json
    package.json
    public/
      temp/
    src/
      app.js
      config/
        passport.js
      constants.js
      controllers/
        commentController.js
        dashboardController.js
        healthcheckController.js
        likeController.js
        notificationController.js
        playlistController.js
        subscriptionController.js
        tweetController.js
        userController.js
        videoController.js
      db/
        db.js
      index.js
      middlewares/
        authMiddleware.js
        multer.js
      models/
        commentModel.js
        likeModel.js
        notificationModel.js
        playlistModel.js
        subscriptionModel.js
        tweetModel.js
        userModel.js
        videoModel.js
      routes/
        commentRoute.js
        dashboardRoute.js
        healthcheckRoute.js
        likeRoute.js
        notificationRoute.js
        playlistRoute.js
        subscriptionRoute.js
        tweetRoute.js
        userRoute.js
        videoRoute.js
      utils/
        apiErrors.js
        apiResponse.js
        asyncHandler.js
        cloudinary.js
        defaultImages.js
        emailService.js
  Frontend/
    eslint.config.js
    index.html
    package-lock.json
    package.json
    postcss.config.js
    public/
      vite.svg
    README.md
    src/
      App.css
      App.jsx
      assets/
        PlayBack.png
      components/
        CommentSection/
          CommentSection.jsx
        FormInput.jsx
        Layout/
          Header.jsx
          Layout.jsx
          MobileSearch.jsx
          Sidebar.jsx
        LoadingButton.jsx
        MiniPlayer/
          MiniPlayer.jsx
        Notifications/
          NotificationDropdown.jsx
        OAuthButtons.jsx
        OTPInput.jsx
        PlaylistModal/
          PlaylistModal.jsx
        ProtectedRoute.jsx
        Settings/
          VideoPreviewSettings.jsx
        Skeleton/
          LoadingScreen.jsx
          Skeleton.jsx
          VideoPlayerSkeleton.jsx
        SubscriptionDropdown/
          SubscriptionDropdown.jsx
        VideoCard/
          VideoCard.jsx
        VideoPlayer/
          SyncedVideoPlayer.jsx
          VideoPlayer.jsx
        VideoPreview/
          VideoPreview.css
          VideoPreview.jsx
      contexts/
        AuthContext.jsx
        NotificationContext.jsx
        SyncedVideoContext.jsx
        VideoContext.jsx
        VideoPreviewContext.jsx
      hooks/
        useAuthRedirect.js
        useResponsive.js
        useVideoNavigation.js
        useVideoPreview.js
      index.css
      main.jsx
      pages/
        BrowsePlaylists.jsx
        Categories.jsx
        ChannelVideos.jsx
        Dashboard.jsx
        ForgotPassword.jsx
        History.jsx
        Home.jsx
        Library.jsx
        LikedVideos.jsx
        Login.jsx
        Notifications.jsx
        PlaylistDetail.jsx
        Playlists.jsx
        Profile.jsx
        Register.jsx
        Search.jsx
        Settings.jsx
        Trending.jsx
        Tweets.jsx
        Upload.jsx
        VideoPlayer.jsx
        WatchLater.jsx
      services/
        api.js
      utils/
        performance.js
        validation.js
    tailwind.config.js
    vite.config.js
```

## Quick Start
```bash
# 1) Clone
git clone https://github.com/PrashantTarbundiya/PlayBack.git
cd PlayBack

# 2) Install deps
cd Backend && npm install
cd ../Frontend && npm install

# 3) Configure env files
#   - Create Backend/.env (see below)
#   - Create Frontend/.env (see below)

# 4) Run (two terminals)
cd Backend && npm run dev
cd Frontend && npm run dev
```

## Environment Variables

### Backend/.env
```env
# Server
PORT=8000
NODE_ENV=development
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=replace-with-strong-random-string

# MongoDB
# Provide connection WITHOUT database name; DB name is appended internally
MONGODB_URI=mongodb://localhost:27017

# JWT
ACCESS_TOKEN_SECRET=replace-with-strong-secret
REFRESH_TOKEN_SECRET=replace-with-strong-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Nodemailer - Gmail example uses App Password)
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-gmail-app-password

# OAuth (enable providers you want)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

FACEBOOK_APP_ID=your_facebook_client_id
FACEBOOK_APP_SECRET=your_facebook_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
```

Notes
- `MONGODB_URI` must not include the DB name; the code appends `/Youtube` via `DB_NAME` (database name: `Youtube`).
- `CORS_ORIGIN` should match your frontend URL exactly.
- When `NODE_ENV=production`, cookies are sent as `secure` and sessions adjust accordingly.

### Frontend/.env
```env
# Point to backend API base (include /api/v1)
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Running the Apps
- Backend
  - Directory: `Backend`
  - Script: `npm run dev`
  - Default: `http://localhost:8000`

- Frontend
  - Directory: `Frontend`
  - Script: `npm run dev`
  - Default: `http://localhost:5173`

## Scripts
- Backend (`Backend/package.json`)
  - `npm run dev`: start dev server with nodemon and dotenv (`./src/index.js`)
  - `npm test`: placeholder

- Frontend (`Frontend/package.json`)
  - `npm run dev`: start Vite dev server
  - `npm run build`: build for production
  - `npm run preview`: preview production build
  - `npm run lint`: run ESLint

## OAuth Setup (Google, Facebook, GitHub)
Set the providers’ Callback URLs to the following (replace host for production):
- Google: `{BACKEND_URL}/api/v1/users/auth/google/callback`
- Facebook: `{BACKEND_URL}/api/v1/users/auth/facebook/callback`
- GitHub: `{BACKEND_URL}/api/v1/users/auth/github/callback`

On success, backend redirects to `{FRONTEND_URL}/login?oauth=success&token=<jwt>`.
On failure, it redirects to `{FRONTEND_URL}/login?error=oauth_failed`.

## API Overview
Base URL: `http://localhost:8000/api/v1`

### Auth and Users (`/users`)
- `POST /register` multipart fields: `avatar`, `coverImage`
- `POST /login`, `POST /logout`
- `POST /refresh-token`
- `POST /change-password`
- `GET /current-user`
- `PATCH /update-account`
- `PATCH /avatar` multipart `avatar`
- `PATCH /cover-image` multipart `coverImage`
- `GET /channel/:username`
- History: `GET /history`, `PATCH /history/:videoId`
- Password reset & OTP: `POST /forgot-password`, `POST /reset-password`, `POST /resend-otp`, `POST /send-otp`, `POST /verify-otp`
- OAuth: `/auth/google`, `/auth/facebook`, `/auth/github` (+ `/callback` for each)
- Link/unlink OAuth: `POST /link/:provider`, `DELETE /unlink/:provider`

### Videos (`/videos`)
- `GET /` list (with owner details); `GET /all` basic list
- `GET /search` search
- `GET /categories` categories
- `GET /recommendations` (auth)
- `GET /watch-next/:videoId`
- `POST /` upload (auth, multipart fields: `videoFile`, `thumbnail`)
- `GET /:videoId`, `PATCH /:videoId` (auth, multipart `thumbnail`), `DELETE /:videoId` (auth)
- `GET /user/:username` user videos
- `PATCH /toggle/publish/:videoId` (auth)
- `PATCH /views/:videoId` increment views

### Playlists (`/playlist`)
- `POST /` create, `GET /:id`, `PATCH /:id`, `DELETE /:id`
- `PATCH /add/:videoId/:playlistId`, `PATCH /remove/:videoId/:playlistId`
- `GET /user/:userId`
- `POST /save/:playlistId`, `POST /unsave/:playlistId`, `GET /saved`
- `GET /public` paginated public playlists
- `GET /check/:videoId` check video membership

### Likes (`/likes`) and Comments (`/comments`)
- Likes: `POST /toggle/v/:videoId`, `POST /toggle/c/:commentId`, `POST /toggle/t/:tweetId`, `GET /videos`
- Comments: `GET /:videoId`, `POST /:videoId`, `PATCH /c/:commentId`, `DELETE /c/:commentId`

### Subscriptions (`/subscriptions`) and Notifications (`/notifications`)
- Subscriptions: `POST /c/:channelId`, `GET /s/:subscriberId`, `GET /u/:channelId`
- Notifications (all require auth):
  - `GET /` get notifications
  - `GET /unread-count` unread count
  - `PATCH /mark-all-read` mark all as read
  - `DELETE /clear-all` clear all notifications
  - `PATCH /:notificationId/read` mark one as read
  - `DELETE /:notificationId` delete one

### Dashboard (`/dashboard`) and Tweets (`/tweets`)
- Dashboard: `GET /stats`, `GET /videos` (auth)
- Tweets: `GET /`, `POST /` (auth), `PATCH /:tweetId` (auth), `DELETE /:tweetId` (auth), `GET /user/:userId`

## Frontend Notes
- API client: `src/services/api.js` with Axios, base URL `VITE_API_BASE_URL`
- Auth: JWT stored in `localStorage` and attached as `Authorization: Bearer <token>`
- Toasts: unified error handling via Axios interceptor + `react-hot-toast`
- UI: Tailwind CSS, responsive layout, mini‑player, skeletons, playlists modal, notification dropdown

## Deployment Notes
- Set `NODE_ENV=production`, secure secrets, and correct `FRONTEND_URL`/`BACKEND_URL`
- CORS: set `CORS_ORIGIN` to your deployed frontend URL
- Sessions: ensure `SESSION_SECRET` is strong; cookies are `secure` in production
- OAuth: update provider callback URLs to your production backend host
- Emails: prefer provider SMTP creds or app passwords; avoid plain user passwords


## License
ISC — © Prashant
