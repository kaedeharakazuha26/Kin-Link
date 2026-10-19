# LINK 🌐

**LINK** is a modern, full-stack Facebook-inspired social media web application designed for fast, real-time social networking. Built with React (Vite) + TypeScript, Tailwind CSS, Shadcn/ui on the frontend, and Node.js + Express + TypeScript on the backend, with Firebase Firestore, ImageKit storage with Sharp compression, and Socket.io for real-time messaging.

---

## 🚀 Key Features

- **🔐 Robust JWT Authentication**: Access tokens & refresh tokens with bcrypt password hashing and token rotation stored in Firestore. Automatic token refresh interceptors on the frontend.
- **📰 Interactive Feed**: Post composer with text, photo/video uploads, like reactions, comment threads, and post sharing.
- **✨ 24-Hour Stories ("My Day")**: Post custom text stories with color gradients or upload images/videos with an Instagram/Facebook-style progress bar and auto-advancing story viewer.
- **👤 Rich User Profiles**: Personalized profile pages, bio, location, customizable cover and avatar photos, user's post timeline, and friends tab.
- **🤝 Friend & Request System**: Send friend requests, accept/reject incoming requests, remove friends, and discover suggested users.
- **💬 Real-Time Chat (Socket.io)**: Live 1-on-1 instant messaging, typing indicators, online/offline status indicators, and image attachments.
- **📱 Responsive UI**: High aesthetics with dark mode ambient accents, responsive mobile navigation drawer, and desktop sidebars.

---

## 🛠️ Tech Stack

### Frontend (`/frontend`)
- **Framework**: React 19 + Vite + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui design patterns
- **Routing**: React Router v7
- **State Management**: Zustand
- **Networking**: Axios (with automatic 401 token refresh interceptor)
- **Real-time**: Socket.io Client
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

### Backend (`/backend`)
- **Runtime**: Node.js + Express + TypeScript
- **Database**: Cloud Firestore (Firebase Admin SDK)
- **Media CDN & Storage**: ImageKit (Real-time image & video optimization, CDN delivery)
- **Authentication**: JWT (`jsonwebtoken`) + `bcryptjs` (Access + Refresh tokens)
- **WebSockets**: Socket.io (real-time chat, typing indicators, user presence)
- **File Uploads**: Multer memory storage

---

## 📂 Project Structure

```text
LINK/
├── backend/                     # Node.js + Express + TypeScript API
│   ├── src/
│   │   ├── config/              # Firebase Admin SDK initialization
│   │   ├── controllers/         # Auth, Post, Story, User, Message controllers
│   │   ├── middleware/          # Auth route protection & JWT verification
│   │   ├── routes/              # Express API route endpoints
│   │   ├── socket/              # Socket.io chat & presence handlers
│   │   ├── types/               # TypeScript models & interfaces
│   │   ├── utils/               # JWT token utilities & upload handlers
│   │   ├── app.ts               # Express application configuration
│   │   └── server.ts            # HTTP & WebSocket server entry point
│   ├── .env.example             # Backend environment template
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                    # React (Vite) + TypeScript App
│   ├── src/
│   │   ├── assets/              # Logos, demo assets, and graphics
│   │   ├── components/          # StoriesBar, StoryViewer, PostCard, Sidebar, etc.
│   │   │   └── ui/              # Shadcn-style components (Button, Input, Avatar)
│   │   ├── pages/               # Feed, Profile, Friends, Messages, Login, Discover
│   │   ├── services/            # Axios API client with auto-refresh
│   │   ├── store/               # Zustand stores (useAuthStore, useSocketStore)
│   │   ├── types/               # Frontend TypeScript interfaces
│   │   ├── App.tsx              # Router & layout entry point
│   │   └── main.tsx             # React root mount
│   ├── .env.example             # Frontend environment template
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── README.md
```

---

## ⚙️ Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher; v24 recommended)
- [npm](https://www.npmjs.com/) (v9 or higher)
- A [Firebase Project](https://console.firebase.google.com/) with **Cloud Firestore** enabled.
- A free [ImageKit](https://imagekit.io/) account for media uploads and CDN optimization.

---

### 1. Backend Setup

1. Open a terminal and navigate to `/backend`:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```

4. **Configure Firebase Firestore (Database)**:
   - Go to your [Firebase Console](https://console.firebase.google.com/) -> **Project Settings** -> **Service accounts**.
   - Click **Generate new private key** and download the JSON file.
   - Place this file inside `/backend` and name it `serviceAccountKey.json`.
   - *(Alternatively, you can paste `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` directly inside `/backend/.env`)*.

5. **Configure ImageKit (Media Storage)**:
   - Log into your [ImageKit.io Dashboard](https://imagekit.io/dashboard).
   - Go to **Developer Options** (in the left navigation).
   - Copy your **Public Key**, **Private Key**, and **URL Endpoint**.
   - Paste them into `/backend/.env`:
     ```env
     IMAGEKIT_PUBLIC_KEY=your_public_key
     IMAGEKIT_PRIVATE_KEY=your_private_key
     IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
     ```

6. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The server runs on `http://localhost:5000` with WebSocket support.*

---

### 2. Frontend Setup

1. Open a second terminal and navigate to `/frontend`:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *The frontend runs on `http://localhost:5173`.*

---

## 🔒 Authentication Flow

1. **Registration / Login**: Users register with `email`, `username`, `fullName`, and `password`. Passwords are encrypted with `bcryptjs`.
2. **Token Generation**:
   - `accessToken`: Short-lived token (15 mins) used for authorized API calls.
   - `refreshToken`: Long-lived token (7 days) stored securely in the user's document in Firestore.
3. **Auto-Refresh**: The frontend Axios client interceptor detects `401 Unauthorized` responses and transparently requests a new access token via `/api/auth/refresh` before retrying the original request.
4. **Route Protection**: Unauthenticated users are redirected to `/login`. Authenticated users cannot re-enter the login view without logging out.

---

## 💬 Real-Time Chat (Socket.io)

- Emits `join_conversation` rooms on entering chat.
- Live real-time bidirectional message events with `send_message` and `new_message`.
- Instant typing indicator (`typing` and `stop_typing` events).
- User presence tracking via `online_users` event broadcast.

---

## 📜 License
MIT License. Built with passion for modern social applications.
