# Connect Wheels – Frontend Implementation Plan

## Overview
This document describes the frontend implementation for the Connect Wheels garage social platform, integrating with the API Gateway and all garage service endpoints.

---

## 1. Architecture

### API flow
```
Frontend (React, port 5173)
    → API Gateway (port 8080)
        → Auth Service (port 3000)    /api/auth/*, /api/user/*
        → Chat Service (port 3001)   /api/chat/*
        → Garage Service (port 3002) /api/garage/*
```

### Frontend base URL
- `http://localhost:8080/api` – all API requests go through the gateway

### Garage API base path
- `/garage/*` – gateway rewrites `/api/garage` → `/api` when proxying to garage service

---

## 2. Implemented Features

### 2.1 Garage API slice (`garageApiSlice.js`)
RTK Query slice with all garage endpoints:

| Category     | Endpoints |
|-------------|-----------|
| Garage CRUD | searchGarages, getUserGarages, getGarage, createGarage, updateGarage, deleteGarage |
| Cars        | getGarageCars, getCar, addCar, updateCar, deleteCar |
| Follow      | followGarage, unfollowGarage, getFollowers, getFollowing |
| Posts       | getGaragePosts, createPost, getPost, updatePost, deletePost |
| Feed        | getFeed (auth), getTrendingPosts |
| Likes       | likePost, unlikePost, getPostLikes |
| Comments    | getPostComments, addComment, updateComment, deleteComment, likeComment, unlikeComment |

### 2.2 Routes
| Path               | Component         | Description                          |
|--------------------|-------------------|--------------------------------------|
| `/`                | Redirect to /feed | Default landing                      |
| `/feed`            | FeedPage          | Personalized feed (auth required)    |
| `/feed/trending`   | FeedPage          | Trending posts                       |
| `/garages`         | GaragesPage       | Search and list garages              |
| `/garages/:id`     | GarageDetailPage  | Garage detail, cars, posts, follow   |
| `/posts/:id`       | PostDetailPage    | Post detail, comments, likes         |
| `/dashboard`       | DashboardPage     | User dashboard                       |
| `/chat`            | ChatPage          | Chat                                 |

### 2.3 Pages

- **Garages** – search, location filter, create garage (auth), card grid
- **Feed** – personalized feed when logged in; trending tab with timeframe
- **Garage Detail** – cover, description, follow, tabs: Cars | Posts; add car/post (owner only)
- **Post Detail** – image, caption, like, comments, nested replies, add comment (auth)

### 2.4 Navigation
- Sidebar: Feed, Garages, Dashboard, Messages, Profile, Rides, Settings

---

## 3. How to Run

### 3.1 Backend (API Gateway + services)

1. **API Gateway** (port 8080):
   ```bash
   cd connect-wheels-be/api-gateway
   npm install && npm run dev
   ```

2. **Garage Service** (port 3002) – needs PostgreSQL:
   ```bash
   cd connect-wheels-be/garage-service
   cp env.example .env
   # Edit .env with your DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE
   npm install && npm run dev-start
   ```

3. **Auth Service** (port 3000) – required for login/register:
   ```bash
   cd connect-wheels-be/auth-service
   npm install && npm start
   ```

4. **Chat Service** (port 3001) – optional for chat:
   ```bash
   cd connect-wheels-be/chat-service
   npm install && npm start
   ```

### 3.2 Frontend
```bash
cd connect-wheels-fe
npm install && npm run dev
```
Runs at `http://localhost:5173`.

---

## 4. Environment

- Frontend uses `http://localhost:8080` for API and expects gateway on 8080.
- For production, set `VITE_API_URL` (or equivalent) and point it to the production gateway.

---

## 5. Notes

- Garage service must be running for garage/feed/post features.
- Auth service must be running for login, protected routes, and feed.
- PostgreSQL must be running and configured in `garage-service/.env`.
- The gateway rewrites `/api/garage` → `/api`, so garage service receives paths like `/api/search`, `/api/feed`, etc.
