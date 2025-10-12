# 🎬 PlayBack
### *Video Streaming Platform*

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-ISC-blue?style=flat-square)](LICENSE)

**A feature-rich YouTube-like application with modern authentication, video streaming, and social features**

[🚀 Quick Start](#-quick-start) • [📋 Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [📖 API Docs](#-api-overview)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🔐 **Authentication & Security**
- 📧 Email/Password authentication
- 🔑 JWT with refresh tokens
- 🌐 OAuth (Google, Facebook, GitHub)
- 🛡️ Secure session management

### 👤 **User Experience**
- 🖼️ Customizable profiles (avatar, cover)
- 📱 Responsive design
- 🎵 Advanced mini-player with auto-play
- 📈 Watch history tracking
- 🎮 Synchronized video playback
- 🔄 Smart video state management

</td>
<td width="50%">

### 🎥 **Video Management**
- ⬆️ Video & thumbnail upload
- 📂 Category organization
- 👀 View tracking
- 🎯 Smart recommendations
- 🤖 AI-powered video analysis
- 🎬 Advanced video player controls
- 📺 Picture-in-picture support

### 🎭 **Social Features**
- 👍 Likes & comments system
- 📋 Custom playlists
- 🔔 Real-time notifications
- 📊 Creator dashboard
- 🔗 Video sharing functionality
- ⏰ Watch later feature

### 🤖 **AI Features**
- 📝 Video content summarization
- 💬 Interactive Q&A chat
- 🎯 Context-aware responses
- 🧠 Powered by Gemini 2.5 Pro

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

### Backend Architecture
```
Express.js → MongoDB
         → Passport.js → JWT Auth
                      → OAuth
         → Cloudinary
```

**Backend Technologies:**
- Node.js & Express.js
- MongoDB & Mongoose
- Passport.js (JWT + OAuth)
- Multer & Cloudinary
- Nodemailer

**Frontend Technologies:**
- React & Vite
- Tailwind CSS
- Axios & React Router
- React Hot Toast
- Lucide React Icons

**Database & Storage:**
- MongoDB (Local/Atlas)
- Cloudinary Media Storage

---

## 📋 Requirements

> **Prerequisites:** Ensure you have the following installed on your system

- 📦 **Node.js** `18+`
- 🔧 **npm** `9+`
- 🗄️ **MongoDB** (local or Atlas)
- ☁️ **Cloudinary Account** (for media storage)

---

## 🚀 Quick Start

### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/PrashantTarbundiya/PlayBack.git
cd PlayBack
```

### 2️⃣ **Install Dependencies**
```bash
# Backend dependencies
cd Backend && npm install

# Frontend dependencies
cd ../Frontend && npm install
```

### 3️⃣ **Environment Setup**
Create the following environment files:

#### 📂 `Backend/.env`
```env
# 🔧 Server Configuration
PORT=8000
NODE_ENV=development
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
SESSION_SECRET=your-super-secret-session-key

# 🗄️ Database
MONGODB_URI=mongodb://localhost:27017

# 🔐 JWT Configuration  
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# ☁️ Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# 📧 Email Service (Brevo HTTP API)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com

# 🌐 OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_client_id
FACEBOOK_APP_SECRET=your_facebook_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# 🤖 AI Integration (Get from https://makersuite.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key
```

#### 📂 `Frontend/.env`
```env
# 🔗 API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### 4️⃣ **Launch the Applications**

Open **two terminal windows**:

**Terminal 1 - Backend:**
```bash
cd Backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd Frontend && npm run dev
```

🎉 **Success!** Visit `http://localhost:5173` to see your application running!

---

## 📁 Project Structure

<details>
<summary><strong>📂 View Complete Project Structure</strong></summary>

```
📁 PlayBack/
  📁 Backend/
    📄 package-lock.json
    📄 package.json
    📁 public/
      📁 temp/
    📁 src/
      📄 app.js
      📁 config/
        📄 passport.js
      📄 constants.js
      📁 controllers/
        📄 commentController.js
        📄 dashboardController.js
        📄 healthcheckController.js
        📄 likeController.js
        📄 notificationController.js
        📄 playlistController.js
        📄 subscriptionController.js
        📄 tweetController.js
        📄 userController.js
        📄 videoController.js
      📁 db/
        📄 db.js
      📄 index.js
      📁 middlewares/
        📄 authMiddleware.js
        📄 multer.js
      📁 models/
        📄 commentModel.js
        📄 likeModel.js
        📄 notificationModel.js
        📄 playlistModel.js
        📄 subscriptionModel.js
        📄 tweetModel.js
        📄 userModel.js
        📄 videoModel.js
      📁 routes/
        📄 commentRoute.js
        📄 dashboardRoute.js
        📄 healthcheckRoute.js
        📄 likeRoute.js
        📄 notificationRoute.js
        📄 playlistRoute.js
        📄 subscriptionRoute.js
        📄 tweetRoute.js
        📄 userRoute.js
        📄 videoRoute.js
      📁 utils/
        📄 apiErrors.js
        📄 apiResponse.js
        📄 asyncHandler.js
        📄 cloudinary.js
        📄 defaultImages.js
        📄 emailService.js
  📁 Frontend/
    📄 eslint.config.js
    📄 index.html
    📄 package-lock.json
    📄 package.json
    📄 postcss.config.js
    📁 public/
      📄 vite.svg
    📄 README.md
    📁 src/
      📄 App.css
      📄 App.jsx
      📁 assets/
        🖼️ PlayBack.png
      📁 components/
        📁 CommentSection/
          📄 CommentSection.jsx
        📄 FormInput.jsx
        📁 Layout/
          📄 Header.jsx
          📄 Layout.jsx
          📄 MobileSearch.jsx
          📄 Sidebar.jsx
        📄 LoadingButton.jsx
        📁 MiniPlayer/
          📄 MiniPlayer.jsx
        📁 Notifications/
          📄 NotificationDropdown.jsx
        📄 OAuthButtons.jsx
        📄 OTPInput.jsx
        📁 PlaylistModal/
          📄 PlaylistModal.jsx
        📄 ProtectedRoute.jsx
        📁 Settings/
          📄 VideoPreviewSettings.jsx
        📁 Skeleton/
          📄 LoadingScreen.jsx
          📄 Skeleton.jsx
          📄 VideoPlayerSkeleton.jsx
        📁 SubscriptionDropdown/
          📄 SubscriptionDropdown.jsx
        📁 VideoCard/
          📄 VideoCard.jsx
        📁 VideoPlayer/
          📄 SyncedVideoPlayer.jsx
          📄 VideoPlayer.jsx
        📁 VideoSummarizer/
          📄 VideoSummarizer.jsx
        📄 VideoPlayerBehaviorDemo.jsx
        📁 VideoPreview/
          🎨 VideoPreview.css
          📄 VideoPreview.jsx
      📁 contexts/
        📄 AuthContext.jsx
        📄 NotificationContext.jsx
        📄 SyncedVideoContext.jsx
        📄 VideoContext.jsx
        📄 VideoPreviewContext.jsx
      📁 hooks/
        📄 useAuthRedirect.js
        📄 useResponsive.js
        📄 useVideoNavigation.js
        📄 useVideoPreview.js
        📄 useVideoSync.js
      🎨 index.css
      📄 main.jsx
      📁 pages/
        📄 BrowsePlaylists.jsx
        📄 Categories.jsx
        📄 ChannelVideos.jsx
        📄 Dashboard.jsx
        📄 ForgotPassword.jsx
        📄 History.jsx
        📄 Home.jsx
        📄 Library.jsx
        📄 LikedVideos.jsx
        📄 Login.jsx
        📄 Notifications.jsx
        📄 PlaylistDetail.jsx
        📄 Playlists.jsx
        📄 Profile.jsx
        📄 Register.jsx
        📄 Search.jsx
        📄 Settings.jsx
        📄 Trending.jsx
        📄 Tweets.jsx
        📄 Upload.jsx
        📄 VideoPlayer.jsx
        📄 WatchLater.jsx
      📁 services/
        📄 api.js
      📁 utils/
        📄 performance.js
        📄 validation.js
    📄 tailwind.config.js
    📄 vite.config.js
```

</details>

---

## 🔐 OAuth Setup

Configure OAuth providers with these callback URLs:

| Provider | Callback URL |
|----------|-------------|
| 🔍 **Google** | `{BACKEND_URL}/api/v1/users/auth/google/callback` |
| 👤 **Facebook** | `{BACKEND_URL}/api/v1/users/auth/facebook/callback` |
| 🐙 **GitHub** | `{BACKEND_URL}/api/v1/users/auth/github/callback` |

### Success/Error Redirects:
- ✅ **Success**: `{FRONTEND_URL}/login?oauth=success&token=<jwt>`
- ❌ **Error**: `{FRONTEND_URL}/login?error=oauth_failed`

---

## 🤖 AI Video Assistant

### Interactive AI Features
PlayBack includes a powerful AI assistant that uses **Gemini 2.5 Pro** to analyze video content and provide interactive assistance:

#### 📝 Video Content Analysis:
- **Comprehensive Summary**: Detailed analysis of actual video content
- **Key Points**: Important topics and concepts covered
- **Topics Covered**: Categorized subject areas
- **Key Takeaways**: Main insights and learnings
- **Educational Outcomes**: Learning objectives and practical applications
- **Contextual Relevance**: Industry context and target audience analysis

#### 💬 Interactive Q&A:
- **Ask Questions**: Get answers about specific video content
- **Real-time Chat**: Interactive conversation about the video
- **Context-Aware**: AI understands the video content for accurate responses
- **Educational Support**: Perfect for learning and comprehension
- **Formatted Responses**: Rich text formatting with bullet points and sections

#### How it works:
1. Click the floating AI button (bottom-right corner) on any video page
2. AI analyzes the actual video content using Gemini 2.5 Pro
3. View comprehensive analysis in the left panel
4. Ask specific questions in the chat panel on the right
5. Get instant, context-aware answers about the video

#### Setup:
1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your Backend `.env` file as `GEMINI_API_KEY=your-api-key`
3. The floating AI assistant will appear on all video player pages

---

## 📖 API Overview

> **Base URL:** `http://localhost:8000/api/v1`

### 🔐 Authentication & Users (`/users`)

<details>
<summary><strong>Authentication Endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/register` | User registration |
| `POST` | `/login` | User login |
| `POST` | `/logout` | User logout |
| `POST` | `/refresh-token` | Refresh JWT token |
| `GET` | `/current-user` | Get current user |
| `POST` | `/forgot-password` | Password reset |

</details>

### 🎥 Videos (`/videos`)

<details>
<summary><strong>Video Management Endpoints</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | List videos with owner details |
| `POST` | `/` | Upload video (auth required) |
| `GET` | `/:videoId` | Get video by ID |
| `PATCH` | `/:videoId` | Update video (auth) |
| `DELETE` | `/:videoId` | Delete video (auth) |
| `GET` | `/search` | Search videos |

</details>

### 📋 Playlists (`/playlist`)

<details>
<summary><strong>Playlist Management</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/` | Create playlist |
| `GET` | `/:id` | Get playlist |
| `PATCH` | `/add/:videoId/:playlistId` | Add video to playlist |
| `PATCH` | `/remove/:videoId/:playlistId` | Remove video from playlist |

</details>

### 🤖 AI Features (`/ai`)

<details>
<summary><strong>AI-Powered Analysis</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/summarize/:videoId` | Analyze video content and generate summary |
| `POST` | `/ask/:videoId` | Ask questions about video content |

</details>

---

## 🚀 Scripts

### Backend Commands
```bash
npm run dev    # 🔥 Start development server
npm test       # 🧪 Run tests
```

### Frontend Commands
```bash
npm run dev      # 🔥 Start development server  
npm run build    # 📦 Build for production
npm run preview  # 👀 Preview production build
npm run lint     # 🔍 Run ESLint
```

---

## 🌐 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure secure secrets
- [ ] Update `FRONTEND_URL` and `BACKEND_URL`
- [ ] Set `CORS_ORIGIN` to production frontend URL
- [ ] Update OAuth callback URLs
- [ ] Configure email service with app passwords

### Environment Variables
```env
NODE_ENV=production
BACKEND_URL=https://your-api-domain.com
FRONTEND_URL=https://your-app-domain.com
CORS_ORIGIN=https://your-app-domain.com
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. 🍴 Fork the repository
2. 🌿 Create a feature branch (`git checkout -b feature/amazing-feature`)
3. 💻 Commit your changes (`git commit -m 'Add amazing feature'`)
4. 📤 Push to the branch (`git push origin feature/amazing-feature`)
5. 🎯 Open a Pull Request

---

## 📝 License

This project is licensed under the **ISC License**.

---

<div align="center">

### 🌟 **Built with ❤️ by Prashant**

[![GitHub](https://img.shields.io/badge/GitHub-PrashantTarbundiya-black?style=flat-square&logo=github)](https://github.com/PrashantTarbundiya)

**Give this project a ⭐ if you found it helpful!**

</div>

---

<div align="center">
<sub>Made with 💻 and ☕ | © 2025 PlayBack Platform</sub>
</div>
