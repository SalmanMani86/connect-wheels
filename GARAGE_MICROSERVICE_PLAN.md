# 🚗 Garage Social Microservice - Complete Implementation Plan

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Database Schema & Relationships](#database-schema--relationships)
4. [API Endpoints Documentation](#api-endpoints-documentation)
5. [Implementation Phases](#implementation-phases)
6. [Technology Stack](#technology-stack)
7. [Communication Patterns](#communication-patterns)
8. [Frontend Architecture](#frontend-architecture)
9. [Real-time Features](#real-time-features)
10. [Setup & Installation](#setup--installation)
11. [Testing Strategy](#testing-strategy)
12. [Deployment Plan](#deployment-plan)

---

## 🎯 Project Overview

### Vision
Transform the basic garage service into a **full-featured social platform** where car enthusiasts can:
- Create and manage multiple garages
- Showcase their car collections
- Post photos and updates about their vehicles
- Follow other garages and car enthusiasts
- Engage through likes, comments, and shares
- Receive real-time notifications
- Discover trending content

### Current State vs Future State

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CURRENT STATE                              │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Basic garage creation                                           │
│  ✓ Garage entity with owner reference                              │
│  ✓ Car entity (basic)                                              │
│  ✓ User-garage follow relationship (basic)                         │
│  ✓ gRPC communication with auth service                            │
│  ✓ Kafka consumer for user deletion                                │
│  ✗ No posts/feed system                                            │
│  ✗ No social interactions (likes, comments)                        │
│  ✗ No notifications                                                 │
│  ✗ No real-time updates                                            │
│  ✗ No image uploads                                                 │
│  ✗ Minimal API endpoints                                           │
└─────────────────────────────────────────────────────────────────────┘

                              ⬇️  TRANSFORMATION

┌─────────────────────────────────────────────────────────────────────┐
│                          FUTURE STATE                               │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Complete garage management (CRUD)                               │
│  ✓ Enhanced car profiles with detailed specs                       │
│  ✓ Post creation with multiple images/videos                       │
│  ✓ Personalized feed from followed garages                         │
│  ✓ Social interactions (likes, comments, replies)                  │
│  ✓ Real-time notifications via Socket.IO                           │
│  ✓ Follow/unfollow system with stats                               │
│  ✓ Image upload and optimization                                   │
│  ✓ Search and discovery features                                   │
│  ✓ Trending algorithm                                              │
│  ✓ Comprehensive REST API                                          │
│  ✓ Event-driven architecture with Kafka                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ System Architecture

### Microservices Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        CONNECT-WHEELS PLATFORM                           │
└──────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────┐
                         │   API GATEWAY   │
                         │   Port: 8080    │
                         └────────┬────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        │                         │                         │
┌───────▼────────┐    ┌──────────▼───────┐    ┌───────────▼──────────┐
│  AUTH SERVICE  │    │  CHAT SERVICE    │    │  GARAGE SERVICE      │
│  Port: 3000    │    │  Port: 3001      │    │  Port: 3002          │
│                │    │                  │    │                      │
│  • Users       │    │  • Chats         │    │  • Garages           │
│  • Auth        │    │  • Messages      │    │  • Cars              │
│  • OAuth       │    │  • Real-time     │    │  • Posts             │
│                │    │                  │    │  • Comments          │
│  PostgreSQL    │    │  MongoDB         │    │  • Likes             │
│  + TypeORM     │    │  + Socket.IO     │    │  • Follows           │
│                │    │                  │    │  • Notifications     │
│  gRPC Server   │    │                  │    │                      │
└────────┬───────┘    └──────────────────┘    │  PostgreSQL          │
         │                                     │  + TypeORM           │
         │                                     │                      │
         │            ┌────────────────────────┤  gRPC Client         │
         │            │  gRPC Call             │  Socket.IO Server    │
         └────────────┤  (checkUser)           └──────────┬───────────┘
                      │                                   │
                      └───────────────────────────────────┘

                ┌──────────────────────────────────────┐
                │         KAFKA MESSAGE BUS            │
                │                                      │
                │  Topics:                             │
                │  • user-deleted                      │
                │  • user-deleted.dlq                  │
                │  • garage-created        [NEW]       │
                │  • post-created          [NEW]       │
                │  • post-liked            [NEW]       │
                │  • garage-followed       [NEW]       │
                └──────────────────────────────────────┘

                ┌──────────────────────────────────────┐
                │      SHARED COMMON MODULES           │
                │                                      │
                │  • Auth Middleware                   │
                │  • Kafka Client & Producers          │
                │  • Retry Logic & DLQ                 │
                └──────────────────────────────────────┘
```

### Request Flow Diagram

```
┌─────────┐                                                    ┌─────────┐
│         │  1. POST /api/garage/123/posts                    │         │
│  USER   │ ───────────────────────────────────────────────► │ GATEWAY │
│ (React) │                                                    │         │
└─────────┘                                                    └────┬────┘
                                                                    │
                     ┌──────────────────────────────────────────────┘
                     │ 2. Proxy to Garage Service
                     │    /api/posts
                     ▼
            ┌─────────────────┐
            │ GARAGE SERVICE  │
            │                 │
            │ 3. Validate JWT │───────────┐
            └────────┬────────┘            │
                     │                     │ 4. Check User Exists
                     │                     │    (gRPC Call)
                     │                     ▼
                     │            ┌─────────────────┐
                     │            │  AUTH SERVICE   │
                     │            │  (gRPC Server)  │
                     │            └────────┬────────┘
                     │                     │
                     │ 5. User Valid ◄─────┘
                     │
                     ▼
            ┌─────────────────┐
            │   PostgreSQL    │
            │                 │
            │ 6. Save Post    │
            │    + Media      │
            └────────┬────────┘
                     │
                     │ 7. Post Created
                     ▼
            ┌─────────────────┐
            │  KAFKA PRODUCER │
            │                 │
            │ 8. Publish      │
            │   post.created  │
            └────────┬────────┘
                     │
                     ▼
            ┌─────────────────┐
            │  SOCKET.IO      │
            │                 │
            │ 9. Emit to      │
            │   Followers     │
            └────────┬────────┘
                     │
                     │ 10. Real-time notification
                     ▼
            ┌─────────────────┐
            │   FOLLOWERS     │
            │   (WebSocket)   │
            └─────────────────┘
```

---

## 🗄️ Database Schema & Relationships

### Complete ER Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    GARAGE SERVICE DATABASE SCHEMA                        │
│                           (PostgreSQL)                                   │
└──────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│     users       │ ◄──── External Reference (Auth Service Database)
├─────────────────┤
│ id (PK)         │
│ email           │
│ name            │
│ profilePicture  │
└────────┬────────┘
         │
         │ 1:N (One user owns many garages)
         │
         ▼
┌──────────────────────────────┐
│         garages              │
├──────────────────────────────┤
│ id (PK)                      │
│ name (UNIQUE)                │
│ description                  │
│ pictureUrl                   │
│ coverImageUrl                │
│ location                     │
│ ownerId (FK) ────────────────┘
│ followersCount               │
│ postsCount                   │
│ carsCount                    │
│ createdAt                    │
│ updatedAt                    │
└───┬──────────┬───────┬───────┘
    │          │       │
    │ 1:N      │ 1:N   │ N:M (through user_garage_follows)
    │          │       │
    ▼          ▼       ▼
┌──────┐  ┌──────┐  ┌─────────────────────┐
│ cars │  │posts │  │ user_garage_follows │
└──────┘  └──────┘  ├─────────────────────┤
    │         │     │ userId (PK, FK)     │
    │         │     │ garageId (PK, FK)   │
    │         │     │ createdAt           │
    │         │     └─────────────────────┘
    │         │
    │         │ 1:N (One post has many media/likes/comments)
    │         │
    ▼         ▼
┌───────────────────────────────────────────────────────────┐
│ cars                                                      │
├───────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ garageId (FK) ─────► garages.id                          │
│ make                                                      │
│ model                                                     │
│ year                                                      │
│ color                                                     │
│ vin (UNIQUE)                                             │
│ mileage                                                   │
│ engineType                                               │
│ transmission                                             │
│ pictureUrl                                               │
│ description                                              │
│ createdAt                                                │
│ updatedAt                                                │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ posts                                                     │
├───────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ garageId (FK) ─────► garages.id                          │
│ title                                                     │
│ caption                                                   │
│ content                                                   │
│ likesCount                                               │
│ commentsCount                                            │
│ sharesCount                                              │
│ viewsCount                                               │
│ isPublished                                              │
│ createdAt                                                │
│ updatedAt                                                │
└───┬──────────┬──────────┬────────────────────────────────┘
    │          │          │
    │ 1:N      │ 1:N      │ 1:N
    │          │          │
    ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌──────────────┐
│post     │ │post     │ │post_comments │
│_media   │ │_likes   │ └──────────────┘
└─────────┘ └─────────┘        │
                               │ 1:N
                               │
                               ▼
                        ┌──────────────┐
                        │comment_likes │
                        └──────────────┘

┌───────────────────────────────────────────────────────────┐
│ post_media                                                │
├───────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ postId (FK) ─────► posts.id                              │
│ mediaUrl                                                  │
│ mediaType (image/video)                                  │
│ thumbnailUrl                                             │
│ displayOrder                                             │
│ width                                                     │
│ height                                                    │
│ createdAt                                                │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ post_likes                                                │
├───────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ postId (FK) ─────► posts.id                              │
│ userId (FK) ─────► users.id                              │
│ createdAt                                                │
│ UNIQUE(postId, userId)                                   │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ post_comments                                             │
├───────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ postId (FK) ─────► posts.id                              │
│ userId (FK) ─────► users.id                              │
│ parentCommentId (FK) ─────► post_comments.id (nullable)  │
│ content                                                   │
│ likesCount                                               │
│ repliesCount                                             │
│ isEdited                                                 │
│ createdAt                                                │
│ updatedAt                                                │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ comment_likes                                             │
├───────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ commentId (FK) ─────► post_comments.id                   │
│ userId (FK) ─────► users.id                              │
│ createdAt                                                │
│ UNIQUE(commentId, userId)                                │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│ notifications                                             │
├───────────────────────────────────────────────────────────┤
│ id (PK)                                                   │
│ userId (FK) ─────► users.id (recipient)                  │
│ actorId (FK) ─────► users.id (who triggered)             │
│ type (like/comment/follow/mention/reply/post)            │
│ entityType (post/comment/garage)                         │
│ entityId (generic ID)                                    │
│ message                                                   │
│ isRead                                                    │
│ createdAt                                                │
└───────────────────────────────────────────────────────────┘
```

### Relationship Cardinality

```
┌─────────────────────────────────────────────────────────────┐
│ RELATIONSHIP TYPE │ FROM          │ TO              │ TYPE  │
├───────────────────┼───────────────┼─────────────────┼───────┤
│ Ownership         │ users         │ garages         │ 1:N   │
│ Garage Cars       │ garages       │ cars            │ 1:N   │
│ Garage Posts      │ garages       │ posts           │ 1:N   │
│ Post Media        │ posts         │ post_media      │ 1:N   │
│ Post Comments     │ posts         │ post_comments   │ 1:N   │
│ Comment Replies   │ post_comments │ post_comments   │ 1:N   │
│ Comment Likes     │ post_comments │ comment_likes   │ 1:N   │
│ Following         │ users         │ garages         │ N:M   │
│ Post Likes        │ users         │ posts           │ N:M   │
│ Comment Likes     │ users         │ post_comments   │ N:M   │
│ Notifications     │ users         │ notifications   │ 1:N   │
└─────────────────────────────────────────────────────────────┘
```

### Database Indexes Strategy

```sql
-- Garages
CREATE INDEX idx_garages_owner ON garages(ownerId);
CREATE INDEX idx_garages_name ON garages(name);
CREATE INDEX idx_garages_created ON garages(createdAt DESC);

-- Cars
CREATE INDEX idx_cars_garage ON cars(garageId);
CREATE INDEX idx_cars_make_model ON cars(make, model);
CREATE INDEX idx_cars_year ON cars(year);

-- Posts
CREATE INDEX idx_posts_garage ON posts(garageId);
CREATE INDEX idx_posts_created ON posts(createdAt DESC);
CREATE INDEX idx_posts_likes ON posts(likesCount DESC);
CREATE INDEX idx_posts_published ON posts(isPublished, createdAt DESC);

-- Comments
CREATE INDEX idx_comments_post ON post_comments(postId, createdAt);
CREATE INDEX idx_comments_user ON post_comments(userId);
CREATE INDEX idx_comments_parent ON post_comments(parentCommentId);

-- Follows
CREATE INDEX idx_follows_user ON user_garage_follows(userId);
CREATE INDEX idx_follows_garage ON user_garage_follows(garageId);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(userId, isRead, createdAt DESC);
```

---

## 🔌 API Endpoints Documentation

### Base URL
```
Production: https://api.connectwheels.com/api/garage
Development: http://localhost:8080/api/garage
```

### Authentication
All endpoints (except public views) require JWT authentication via Bearer token:
```
Authorization: Bearer <jwt_token>
```

---

### 📦 Garage Management Endpoints

#### 1. Create Garage
```http
POST /api/garage/create-garage
```

**Request Body:**
```json
{
  "garageName": "Speed Demons Garage",
  "description": "Home of classic muscle cars",
  "pictureUrl": "https://cdn.example.com/garage-profile.jpg",
  "coverImageUrl": "https://cdn.example.com/garage-cover.jpg",
  "location": "Los Angeles, CA",
  "userID": 123
}
```

**Response:**
```json
{
  "message": "Garage created successfully",
  "garageID": 45,
  "garage": {
    "id": 45,
    "name": "Speed Demons Garage",
    "ownerId": 123,
    "followersCount": 0,
    "postsCount": 0,
    "carsCount": 0,
    "createdAt": "2026-01-07T10:30:00Z"
  }
}
```

---

#### 2. Get Garage by ID
```http
GET /api/garage/:garageId
```

**Response:**
```json
{
  "garage": {
    "id": 45,
    "name": "Speed Demons Garage",
    "description": "Home of classic muscle cars",
    "pictureUrl": "https://cdn.example.com/garage-profile.jpg",
    "coverImageUrl": "https://cdn.example.com/garage-cover.jpg",
    "location": "Los Angeles, CA",
    "ownerId": 123,
    "owner": {
      "id": 123,
      "name": "John Doe",
      "profilePicture": "https://cdn.example.com/user-123.jpg"
    },
    "followersCount": 245,
    "postsCount": 18,
    "carsCount": 5,
    "isFollowing": true,
    "createdAt": "2026-01-07T10:30:00Z"
  }
}
```

---

#### 3. Update Garage
```http
PUT /api/garage/:garageId
```

**Request Body:**
```json
{
  "description": "Updated description",
  "location": "San Francisco, CA"
}
```

---

#### 4. Delete Garage
```http
DELETE /api/garage/:garageId
```

**Response:**
```json
{
  "message": "Garage deleted successfully"
}
```

---

#### 5. Get User's Garages
```http
GET /api/garage/user/:userId
```

**Response:**
```json
{
  "garages": [
    {
      "id": 45,
      "name": "Speed Demons Garage",
      "pictureUrl": "...",
      "followersCount": 245,
      "postsCount": 18,
      "carsCount": 5
    }
  ],
  "total": 1
}
```

---

#### 6. Search Garages
```http
GET /api/garage/search?q=muscle&location=LA&page=1&limit=10
```

**Response:**
```json
{
  "garages": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5
  }
}
```

---

### 🚗 Car Management Endpoints

#### 7. Add Car to Garage
```http
POST /api/garage/:garageId/cars
```

**Request Body:**
```json
{
  "make": "Ford",
  "model": "Mustang",
  "year": 1969,
  "color": "Red",
  "vin": "1FABP40E9SF123456",
  "mileage": 45000,
  "engineType": "V8 5.0L",
  "transmission": "Manual",
  "pictureUrl": "https://cdn.example.com/car-123.jpg",
  "description": "Classic Boss 429 Mustang"
}
```

**Response:**
```json
{
  "message": "Car added successfully",
  "car": {
    "id": 789,
    "garageId": 45,
    "make": "Ford",
    "model": "Mustang",
    "year": 1969,
    "createdAt": "2026-01-07T11:00:00Z"
  }
}
```

---

#### 8. Get Garage Cars
```http
GET /api/garage/:garageId/cars
```

**Response:**
```json
{
  "cars": [
    {
      "id": 789,
      "make": "Ford",
      "model": "Mustang",
      "year": 1969,
      "pictureUrl": "...",
      "color": "Red"
    }
  ],
  "total": 5
}
```

---

#### 9. Get Single Car
```http
GET /api/garage/:garageId/cars/:carId
```

---

#### 10. Update Car
```http
PUT /api/garage/:garageId/cars/:carId
```

---

#### 11. Delete Car
```http
DELETE /api/garage/:garageId/cars/:carId
```

---

### 📸 Post Management Endpoints

#### 12. Create Post
```http
POST /api/garage/:garageId/posts
Content-Type: multipart/form-data
```

**Form Data:**
```
title: "Just installed new exhaust!"
caption: "Custom titanium exhaust system"
content: "Full description here..."
images: [File, File, File]
```

**Response:**
```json
{
  "message": "Post created successfully",
  "post": {
    "id": 567,
    "garageId": 45,
    "title": "Just installed new exhaust!",
    "caption": "Custom titanium exhaust system",
    "likesCount": 0,
    "commentsCount": 0,
    "media": [
      {
        "id": 1,
        "mediaUrl": "https://cdn.example.com/post-567-1.jpg",
        "mediaType": "image",
        "displayOrder": 0
      }
    ],
    "createdAt": "2026-01-07T12:00:00Z"
  }
}
```

---

#### 13. Get Garage Posts (Feed)
```http
GET /api/garage/:garageId/posts?page=1&limit=10
```

**Response:**
```json
{
  "posts": [
    {
      "id": 567,
      "title": "Just installed new exhaust!",
      "caption": "Custom titanium exhaust system",
      "media": [...],
      "likesCount": 45,
      "commentsCount": 12,
      "isLiked": false,
      "garage": {
        "id": 45,
        "name": "Speed Demons Garage",
        "pictureUrl": "..."
      },
      "createdAt": "2026-01-07T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 18,
    "totalPages": 2
  }
}
```

---

#### 14. Get Single Post
```http
GET /api/garage/posts/:postId
```

---

#### 15. Update Post
```http
PUT /api/garage/posts/:postId
```

---

#### 16. Delete Post
```http
DELETE /api/garage/posts/:postId
```

---

#### 17. Get Personalized Feed
```http
GET /api/garage/feed?page=1&limit=20
```

**Description:** Returns posts from garages the user follows

**Response:**
```json
{
  "feed": [
    {
      "id": 567,
      "title": "...",
      "garage": {...},
      "media": [...],
      "likesCount": 45,
      "commentsCount": 12,
      "createdAt": "2026-01-07T12:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

#### 18. Get Trending Posts
```http
GET /api/garage/feed/trending?timeframe=week&page=1&limit=20
```

**Query Parameters:**
- `timeframe`: `day` | `week` | `month` | `all`

**Algorithm:** Sorts by weighted score:
```
score = (likesCount * 2) + (commentsCount * 3) + (viewsCount * 0.1) - age_penalty
```

---

### ❤️ Social Interaction Endpoints

#### 19. Follow Garage
```http
POST /api/garage/:garageId/follow
```

**Response:**
```json
{
  "message": "Successfully followed garage",
  "isFollowing": true,
  "followersCount": 246
}
```

---

#### 20. Unfollow Garage
```http
DELETE /api/garage/:garageId/unfollow
```

---

#### 21. Get Followers
```http
GET /api/garage/:garageId/followers?page=1&limit=20
```

**Response:**
```json
{
  "followers": [
    {
      "userId": 123,
      "name": "John Doe",
      "profilePicture": "...",
      "followedAt": "2026-01-05T10:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

#### 22. Get Following
```http
GET /api/garage/user/:userId/following?page=1&limit=20
```

---

#### 23. Like Post
```http
POST /api/garage/posts/:postId/like
```

**Response:**
```json
{
  "message": "Post liked",
  "isLiked": true,
  "likesCount": 46
}
```

---

#### 24. Unlike Post
```http
DELETE /api/garage/posts/:postId/unlike
```

---

#### 25. Get Post Likes
```http
GET /api/garage/posts/:postId/likes?page=1&limit=20
```

**Response:**
```json
{
  "likes": [
    {
      "userId": 123,
      "name": "John Doe",
      "profilePicture": "...",
      "likedAt": "2026-01-07T12:30:00Z"
    }
  ],
  "total": 46
}
```

---

### 💬 Comment Endpoints

#### 26. Add Comment
```http
POST /api/garage/posts/:postId/comments
```

**Request Body:**
```json
{
  "content": "Amazing build! What exhaust brand?",
  "parentCommentId": null
}
```

**Response:**
```json
{
  "message": "Comment added",
  "comment": {
    "id": 234,
    "postId": 567,
    "userId": 123,
    "content": "Amazing build! What exhaust brand?",
    "likesCount": 0,
    "repliesCount": 0,
    "user": {
      "id": 123,
      "name": "John Doe",
      "profilePicture": "..."
    },
    "createdAt": "2026-01-07T13:00:00Z"
  }
}
```

---

#### 27. Get Post Comments
```http
GET /api/garage/posts/:postId/comments?page=1&limit=20&sort=recent
```

**Query Parameters:**
- `sort`: `recent` | `popular` | `oldest`

**Response:**
```json
{
  "comments": [
    {
      "id": 234,
      "content": "Amazing build!",
      "likesCount": 5,
      "repliesCount": 2,
      "isLiked": false,
      "user": {...},
      "replies": [
        {
          "id": 235,
          "content": "Thanks! It's a Borla system",
          "user": {...},
          "createdAt": "2026-01-07T13:10:00Z"
        }
      ],
      "createdAt": "2026-01-07T13:00:00Z"
    }
  ],
  "pagination": {...}
}
```

---

#### 28. Update Comment
```http
PUT /api/garage/comments/:commentId
```

**Request Body:**
```json
{
  "content": "Updated comment text"
}
```

---

#### 29. Delete Comment
```http
DELETE /api/garage/comments/:commentId
```

---

#### 30. Like Comment
```http
POST /api/garage/comments/:commentId/like
```

---

#### 31. Unlike Comment
```http
DELETE /api/garage/comments/:commentId/unlike
```

---

### 🔔 Notification Endpoints

#### 32. Get Notifications
```http
GET /api/garage/notifications?page=1&limit=20&filter=unread
```

**Query Parameters:**
- `filter`: `all` | `unread` | `read`

**Response:**
```json
{
  "notifications": [
    {
      "id": 456,
      "type": "like",
      "message": "John Doe liked your post",
      "actor": {
        "id": 123,
        "name": "John Doe",
        "profilePicture": "..."
      },
      "entityType": "post",
      "entityId": 567,
      "isRead": false,
      "createdAt": "2026-01-07T14:00:00Z"
    },
    {
      "id": 457,
      "type": "comment",
      "message": "Jane Smith commented on your post",
      "actor": {...},
      "entityType": "post",
      "entityId": 567,
      "isRead": false,
      "createdAt": "2026-01-07T14:05:00Z"
    }
  ],
  "pagination": {...}
}
```

---

#### 33. Mark Notification as Read
```http
PUT /api/garage/notifications/:notificationId/read
```

---

#### 34. Mark All Notifications as Read
```http
PUT /api/garage/notifications/read-all
```

---

#### 35. Get Unread Count
```http
GET /api/garage/notifications/unread-count
```

**Response:**
```json
{
  "unreadCount": 7
}
```

---

## 📡 Real-time Features

### Socket.IO Events

#### Client → Server Events

```javascript
// Like a post
socket.emit('post:like', { postId: 567, userId: 123 });

// Comment on a post
socket.emit('post:comment', { 
  postId: 567, 
  userId: 123, 
  content: 'Great car!' 
});

// Follow a garage
socket.emit('garage:follow', { garageId: 45, userId: 123 });

// Join post room for real-time updates
socket.emit('post:join', { postId: 567 });

// Leave post room
socket.emit('post:leave', { postId: 567 });
```

#### Server → Client Events

```javascript
// New notification
socket.on('notification:new', (notification) => {
  console.log(notification);
  /*
  {
    id: 456,
    type: 'like',
    message: 'John Doe liked your post',
    actor: {...},
    createdAt: '2026-01-07T14:00:00Z'
  }
  */
});

// Post liked (real-time counter update)
socket.on('post:liked', (data) => {
  console.log(data);
  /*
  {
    postId: 567,
    likesCount: 47,
    likedBy: { id: 123, name: 'John Doe' }
  }
  */
});

// New comment added
socket.on('post:commented', (data) => {
  console.log(data);
  /*
  {
    postId: 567,
    comment: { id: 234, content: '...', user: {...} },
    commentsCount: 13
  }
  */
});

// Garage followed
socket.on('garage:followed', (data) => {
  console.log(data);
  /*
  {
    garageId: 45,
    followersCount: 247,
    followedBy: { id: 123, name: 'John Doe' }
  }
  */
});

// New post in feed
socket.on('feed:update', (post) => {
  console.log(post);
  // New post from followed garage
});
```

### WebSocket Connection Flow

```
┌─────────┐                                      ┌──────────────┐
│ Client  │                                      │ Socket.IO    │
│ (React) │                                      │ Server       │
└────┬────┘                                      └──────┬───────┘
     │                                                  │
     │ 1. Connect with JWT token                       │
     ├─────────────────────────────────────────────────►
     │                                                  │
     │                   2. Authenticate & Join rooms  │
     │◄─────────────────────────────────────────────────┤
     │                      (user:123, garage:45)      │
     │                                                  │
     │ 3. Subscribe to notifications                   │
     ├─────────────────────────────────────────────────►
     │                                                  │
     │                                                  │
     │◄─────────── 4. Real-time updates ───────────────┤
     │              (likes, comments, follows)         │
     │                                                  │
     │ 5. Emit events (like, comment)                  │
     ├─────────────────────────────────────────────────►
     │                                                  │
     │                   6. Broadcast to relevant users│
     │◄─────────────────────────────────────────────────┤
     │                                                  │
```

---

## 🔄 Communication Patterns

### 1. gRPC Communication

**Garage Service → Auth Service**

```typescript
// Check if user exists before creating garage
const userExists = await checkUserGrpc(userId);

// Get user details for post display
const userDetails = await getUserDetailsGrpc(userId);
```

**Proto Definition (user.proto):**
```protobuf
syntax = "proto3";

service UserService {
  rpc CheckUser (UserIdRequest) returns (UserExistsResponse);
  rpc GetUserDetails (UserIdRequest) returns (UserDetailsResponse);
  rpc GetMultipleUsers (UserIdsRequest) returns (UsersResponse);
}

message UserIdRequest {
  int32 userId = 1;
}

message UserExistsResponse {
  bool exists = 1;
}

message UserDetailsResponse {
  int32 id = 1;
  string name = 2;
  string email = 3;
  string profilePicture = 4;
}

message UserIdsRequest {
  repeated int32 userIds = 1;
}

message UsersResponse {
  repeated UserDetailsResponse users = 1;
}
```

---

### 2. Kafka Event-Driven Architecture

#### Events Produced by Garage Service

```javascript
// 1. Garage Created
{
  topic: 'garage.created',
  key: garageId.toString(),
  value: {
    garageId: 45,
    ownerId: 123,
    name: 'Speed Demons Garage',
    createdAt: '2026-01-07T10:30:00Z'
  }
}

// 2. Post Created
{
  topic: 'post.created',
  key: postId.toString(),
  value: {
    postId: 567,
    garageId: 45,
    ownerId: 123,
    title: 'New exhaust install',
    createdAt: '2026-01-07T12:00:00Z'
  }
}

// 3. Post Liked
{
  topic: 'post.liked',
  key: postId.toString(),
  value: {
    postId: 567,
    userId: 123,
    garageId: 45,
    ownerId: 456, // post owner
    createdAt: '2026-01-07T14:00:00Z'
  }
}

// 4. Post Commented
{
  topic: 'post.commented',
  key: postId.toString(),
  value: {
    postId: 567,
    commentId: 234,
    userId: 123,
    garageId: 45,
    ownerId: 456,
    content: 'Amazing build!',
    createdAt: '2026-01-07T14:05:00Z'
  }
}

// 5. Garage Followed
{
  topic: 'garage.followed',
  key: garageId.toString(),
  value: {
    garageId: 45,
    userId: 123,
    ownerId: 456,
    createdAt: '2026-01-07T14:10:00Z'
  }
}
```

#### Events Consumed by Garage Service

```javascript
// From Auth Service
{
  topic: 'user.deleted',
  key: userId.toString(),
  value: {
    userId: 123,
    deletedAt: '2026-01-07T15:00:00Z'
  }
}
// Action: Delete all garages owned by user

{
  topic: 'user.updated',
  key: userId.toString(),
  value: {
    userId: 123,
    name: 'Updated Name',
    profilePicture: '...',
    updatedAt: '2026-01-07T15:05:00Z'
  }
}
// Action: Update cached user data
```

---

### 3. REST API Gateway Routing

```typescript
// API Gateway routes all /api/garage/* requests to Garage Service

// Request: POST /api/garage/create-garage
// Gateway proxies to: http://garage-service:3002/api/create-garage

// Request: GET /api/garage/123/posts
// Gateway proxies to: http://garage-service:3002/api/123/posts
```

---

## 🎨 Frontend Architecture

### Page Structure

```
src/
├── pages/
│   ├── garages/
│   │   ├── GaragesPage.jsx          # Browse all garages
│   │   ├── GarageProfilePage.jsx    # Single garage view
│   │   ├── GarageCreatePage.jsx     # Create new garage
│   │   └── GarageEditPage.jsx       # Edit garage (owner only)
│   ├── feed/
│   │   ├── FeedPage.jsx             # Personalized feed
│   │   └── ExplorePage.jsx          # Discover/trending
│   ├── posts/
│   │   └── PostDetailPage.jsx       # Single post view
│   └── notifications/
│       └── NotificationsPage.jsx    # Notification center
```

### Component Hierarchy

```
App.jsx
│
├── Layout.jsx
│   ├── Navbar.jsx
│   │   ├── NotificationBell.jsx  [Badge with unread count]
│   │   └── SearchBar.jsx
│   │
│   ├── Sidebar.jsx
│   │   ├── Navigation
│   │   └── GarageQuickLinks
│   │
│   └── <Outlet/> (React Router)
│
├── GaragesPage.jsx
│   ├── GarageGrid.jsx
│   │   └── GarageCard.jsx [x multiple]
│   │       ├── GarageFollowButton.jsx
│   │       └── GarageStats.jsx
│   └── GarageFilters.jsx
│
├── GarageProfilePage.jsx
│   ├── GarageHeader.jsx
│   │   ├── Cover Image
│   │   ├── Profile Picture
│   │   ├── GarageStats.jsx
│   │   └── GarageFollowButton.jsx
│   │
│   ├── GarageTabs.jsx
│   │   ├── Tab: Posts
│   │   │   └── PostList.jsx
│   │   │       └── PostCard.jsx [x multiple]
│   │   │
│   │   ├── Tab: Cars
│   │   │   └── CarGallery.jsx
│   │   │       └── CarCard.jsx [x multiple]
│   │   │
│   │   └── Tab: Followers
│   │       └── FollowersList.jsx
│   │
│   └── PostCreateModal.jsx (owner only)
│
├── FeedPage.jsx
│   ├── FeedFilter.jsx (Trending/Following/Latest)
│   ├── PostList.jsx
│   │   └── PostCard.jsx [x multiple]
│   │       ├── PostImageGallery.jsx
│   │       ├── PostActions.jsx
│   │       │   ├── LikeButton.jsx
│   │       │   ├── CommentButton.jsx
│   │       │   └── ShareButton.jsx
│   │       └── CommentSection.jsx
│   │           ├── CommentForm.jsx
│   │           └── CommentItem.jsx [x multiple]
│   │               ├── CommentActions.jsx
│   │               └── CommentReplies.jsx
│   │
│   └── FollowSuggestions.jsx (sidebar)
│
└── NotificationsPage.jsx
    ├── NotificationFilters.jsx
    └── NotificationList.jsx
        └── NotificationItem.jsx [x multiple]
```

### Redux State Structure

```javascript
// Store structure
{
  user: {
    currentUser: { id, name, email, ... },
    token: 'jwt_token',
    isAuthenticated: true
  },
  
  garages: {
    list: [...],
    current: { id: 45, name: '...', ... },
    userGarages: [...],
    loading: false,
    error: null
  },
  
  posts: {
    feed: [...],
    trending: [...],
    garagePosts: {...}, // Keyed by garageId
    current: { id: 567, title: '...', ... },
    loading: false
  },
  
  notifications: {
    list: [...],
    unreadCount: 7,
    loading: false
  },
  
  socket: {
    connected: true,
    rooms: ['user:123', 'garage:45']
  }
}
```

### Redux API Slices (RTK Query)

```javascript
// garageApiSlice.js
export const garageApi = createApi({
  reducerPath: 'garageApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Garage', 'Post', 'Comment', 'Notification'],
  endpoints: (builder) => ({
    // Garages
    getGarages: builder.query({ ... }),
    getGarageById: builder.query({ ... }),
    createGarage: builder.mutation({ ... }),
    updateGarage: builder.mutation({ ... }),
    deleteGarage: builder.mutation({ ... }),
    
    // Posts
    getGaragePosts: builder.query({ ... }),
    getPostById: builder.query({ ... }),
    createPost: builder.mutation({ ... }),
    getFeed: builder.query({ ... }),
    getTrendingPosts: builder.query({ ... }),
    
    // Social
    followGarage: builder.mutation({ ... }),
    unfollowGarage: builder.mutation({ ... }),
    likePost: builder.mutation({ ... }),
    unlikePost: builder.mutation({ ... }),
    
    // Comments
    getPostComments: builder.query({ ... }),
    addComment: builder.mutation({ ... }),
    updateComment: builder.mutation({ ... }),
    deleteComment: builder.mutation({ ... }),
    
    // Notifications
    getNotifications: builder.query({ ... }),
    markAsRead: builder.mutation({ ... }),
    getUnreadCount: builder.query({ ... })
  })
});
```

### Socket Context

```javascript
// GarageSocketContext.jsx
const GarageSocketContext = createContext();

export const GarageSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const newSocket = io('http://localhost:8080', {
      path: '/socket.io',
      auth: { token }
    });
    
    // Subscribe to events
    newSocket.on('notification:new', (notification) => {
      dispatch(addNotification(notification));
      showToast(notification.message);
    });
    
    newSocket.on('post:liked', (data) => {
      dispatch(updatePostLikes(data));
    });
    
    newSocket.on('post:commented', (data) => {
      dispatch(addCommentToPost(data));
    });
    
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, []);
  
  return (
    <GarageSocketContext.Provider value={socket}>
      {children}
    </GarageSocketContext.Provider>
  );
};
```

---

## 🚀 Implementation Phases

### **Phase 1: Core Garage Features (Week 1-2)**

#### Backend Tasks
- [x] Enhance Garage entity with new fields
- [ ] Create TypeORM migrations for garage table updates
- [ ] Implement CRUD service methods for garages
- [ ] Create garage controller endpoints
- [ ] Add garage routes to Express router
- [ ] Implement garage search functionality
- [ ] Add car entity enhancements (VIN, mileage, etc.)
- [ ] Create car CRUD operations
- [ ] Add validation middleware for garage/car inputs

#### Frontend Tasks
- [ ] Create GarageCard component
- [ ] Create GarageProfile page
- [ ] Create GarageHeader component with stats
- [ ] Create GarageCreateForm with validation
- [ ] Create GarageEditForm (owner authorization)
- [ ] Create CarCard component
- [ ] Create CarGallery component
- [ ] Create CarForm for adding/editing cars
- [ ] Implement garageApiSlice with RTK Query
- [ ] Add garage routes to React Router

#### Testing
- [ ] Unit tests for garage service methods
- [ ] Integration tests for garage API endpoints
- [ ] Frontend component tests with React Testing Library

---

### **Phase 2: Follow System (Week 3)**

#### Backend Tasks
- [ ] Verify user_garage_follows entity
- [ ] Implement follow/unfollow service methods
- [ ] Create social controller for follow operations
- [ ] Add followers/following list endpoints
- [ ] Implement follower count updates (triggers/transactions)
- [ ] Add indexes for follow queries
- [ ] Publish Kafka events for follows
- [ ] Create gRPC method to get user details in bulk

#### Frontend Tasks
- [ ] Create GarageFollowButton component
- [ ] Create FollowersList component
- [ ] Create FollowingList component
- [ ] Add follow/unfollow mutations to API slice
- [ ] Implement optimistic UI updates for follows
- [ ] Create GarageStats component with live counts
- [ ] Add follow suggestions component

#### Testing
- [ ] Test follow/unfollow race conditions
- [ ] Test follower count accuracy
- [ ] Test follow state persistence

---

### **Phase 3: Posts & Feed (Week 4-5)**

#### Backend Tasks
- [ ] Create post entity and migration
- [ ] Create post_media entity and migration
- [ ] Implement image upload middleware (multer)
- [ ] Integrate file storage (AWS S3 or Cloudinary)
- [ ] Create post service with CRUD operations
- [ ] Implement feed service (posts from followed garages)
- [ ] Implement trending algorithm
- [ ] Create post controller endpoints
- [ ] Add post routes
- [ ] Publish Kafka events for post creation
- [ ] Implement pagination for feeds
- [ ] Add post view counting

#### Frontend Tasks
- [ ] Create PostCard component with image gallery
- [ ] Create PostCreate modal with image upload
- [ ] Create PostImageGallery component (carousel)
- [ ] Create FeedPage with infinite scroll
- [ ] Create ExplorePage for trending posts
- [ ] Create PostDetailPage
- [ ] Implement postApiSlice
- [ ] Add image preview before upload
- [ ] Create FeedFilter component (trending/following)
- [ ] Add loading skeletons for posts

#### Testing
- [ ] Test image upload functionality
- [ ] Test feed pagination
- [ ] Test trending algorithm accuracy
- [ ] Test post creation with multiple images

---

### **Phase 4: Engagement - Likes & Comments (Week 6)**

#### Backend Tasks
- [ ] Create post_likes entity and migration
- [ ] Create post_comments entity and migration
- [ ] Create comment_likes entity and migration
- [ ] Implement like service (posts & comments)
- [ ] Implement comment service with nested replies
- [ ] Create like/unlike endpoints
- [ ] Create comment CRUD endpoints
- [ ] Update likes/comments counts with transactions
- [ ] Publish Kafka events for likes/comments
- [ ] Add indexes for like/comment queries

#### Frontend Tasks
- [ ] Create LikeButton component with animation
- [ ] Create CommentSection component
- [ ] Create CommentForm component
- [ ] Create CommentItem component (with replies)
- [ ] Create CommentActions component (like, reply, delete)
- [ ] Implement nested comment threading UI
- [ ] Add like/unlike mutations
- [ ] Add comment mutations
- [ ] Implement optimistic UI updates for likes
- [ ] Add comment editing functionality

#### Testing
- [ ] Test like/unlike race conditions
- [ ] Test nested comment display
- [ ] Test comment edit/delete authorization
- [ ] Test like count accuracy

---

### **Phase 5: Real-time & Notifications (Week 7)**

#### Backend Tasks
- [ ] Create notifications entity and migration
- [ ] Set up Socket.IO server in garage service
- [ ] Implement socket authentication middleware
- [ ] Create socket event handlers
- [ ] Implement notification service
- [ ] Create notification controller
- [ ] Add notification routes
- [ ] Implement notification creation on likes/comments/follows
- [ ] Add socket rooms for users and garages
- [ ] Broadcast real-time updates via Socket.IO
- [ ] Implement notification read/unread status

#### Frontend Tasks
- [ ] Create GarageSocketContext
- [ ] Create NotificationBell component with badge
- [ ] Create NotificationList component
- [ ] Create NotificationItem component
- [ ] Implement socket connection in React
- [ ] Subscribe to real-time events
- [ ] Add notification toast/snackbar system
- [ ] Implement unread count badge
- [ ] Create NotificationsPage
- [ ] Add mark as read functionality
- [ ] Implement real-time post like counter updates

#### Testing
- [ ] Test WebSocket connection/disconnection
- [ ] Test notification delivery
- [ ] Test real-time counter updates
- [ ] Test notification read status sync

---

### **Phase 6: Search & Discovery (Week 8)**

#### Backend Tasks
- [ ] Implement full-text search for garages
- [ ] Add search indexes (PostgreSQL full-text search)
- [ ] Create search service with filters
- [ ] Implement location-based search
- [ ] Create discover/explore endpoint
- [ ] Implement recommendation algorithm
- [ ] Add garage verification badge system
- [ ] Create popular garages endpoint

#### Frontend Tasks
- [ ] Create SearchBar component with autocomplete
- [ ] Create SearchResultsPage
- [ ] Create ExploreFilters component
- [ ] Implement search suggestions
- [ ] Create PopularGarages component
- [ ] Add location-based filtering
- [ ] Create GarageRecommendations component
- [ ] Implement search history

#### Testing
- [ ] Test search accuracy
- [ ] Test search performance
- [ ] Test filter combinations
- [ ] Test recommendation relevance

---

### **Phase 7: Polish & Optimization (Week 9-10)**

#### Backend Tasks
- [ ] Add rate limiting middleware
- [ ] Implement caching with Redis
- [ ] Optimize database queries
- [ ] Add database connection pooling
- [ ] Implement API versioning
- [ ] Add comprehensive error handling
- [ ] Create API documentation (Swagger)
- [ ] Add logging and monitoring
- [ ] Implement backup strategies
- [ ] Performance testing and optimization

#### Frontend Tasks
- [ ] Add loading states everywhere
- [ ] Implement error boundaries
- [ ] Add offline support (service worker)
- [ ] Optimize image loading (lazy load)
- [ ] Add responsive design for mobile
- [ ] Implement dark mode
- [ ] Add accessibility features (ARIA labels)
- [ ] Optimize bundle size (code splitting)
- [ ] Add analytics tracking
- [ ] Create user onboarding flow

#### Testing
- [ ] End-to-end testing with Cypress
- [ ] Load testing with Artillery
- [ ] Security testing (SQL injection, XSS)
- [ ] Accessibility testing
- [ ] Cross-browser testing

---

## 🛠️ Technology Stack

### Backend
```yaml
Language: TypeScript
Runtime: Node.js 18+
Framework: Express.js
ORM: TypeORM
Database: PostgreSQL 14+
Message Queue: Apache Kafka
RPC: gRPC
Real-time: Socket.IO
File Upload: Multer
Image Storage: AWS S3 / Cloudinary
Authentication: JWT
Validation: express-validator
Testing: Jest, Supertest
```

### Frontend
```yaml
Language: JavaScript (ES6+)
Framework: React 18+
State Management: Redux Toolkit
API Client: RTK Query
Routing: React Router v6
UI Library: Material-UI / Tailwind CSS
Real-time: Socket.IO Client
Form Handling: React Hook Form
Validation: Yup / Zod
Image Upload: react-dropzone
Testing: Jest, React Testing Library, Cypress
Build Tool: Vite
```

### DevOps
```yaml
Containerization: Docker
Orchestration: Docker Compose
CI/CD: GitHub Actions
Monitoring: Prometheus + Grafana
Logging: Winston + ELK Stack
Reverse Proxy: Nginx
```

---

## 📁 Detailed File Structure

### Backend (Garage Service)

```
garage-service/
├── src/
│   ├── entity/
│   │   ├── garage.ts                    [Enhanced]
│   │   ├── car.ts                       [Enhanced]
│   │   ├── user-garage-follow.ts        [Exists]
│   │   ├── post.ts                      [NEW]
│   │   ├── post-media.ts                [NEW]
│   │   ├── post-like.ts                 [NEW]
│   │   ├── post-comment.ts              [NEW]
│   │   ├── comment-like.ts              [NEW]
│   │   └── notification.ts              [NEW]
│   │
│   ├── service/
│   │   ├── garage-service.ts            [Expand]
│   │   ├── car-service.ts               [NEW]
│   │   ├── post-service.ts              [NEW]
│   │   ├── comment-service.ts           [NEW]
│   │   ├── like-service.ts              [NEW]
│   │   ├── follow-service.ts            [NEW]
│   │   ├── feed-service.ts              [NEW]
│   │   ├── notification-service.ts      [NEW]
│   │   ├── upload-service.ts            [NEW]
│   │   └── search-service.ts            [NEW]
│   │
│   ├── controller/
│   │   ├── garage-controller.ts         [Expand]
│   │   ├── car-controller.ts            [NEW]
│   │   ├── post-controller.ts           [NEW]
│   │   ├── comment-controller.ts        [NEW]
│   │   ├── social-controller.ts         [NEW]
│   │   ├── feed-controller.ts           [NEW]
│   │   └── notification-controller.ts   [NEW]
│   │
│   ├── routes/
│   │   ├── index.ts                     [NEW - Route aggregator]
│   │   ├── garage-routes.ts             [Expand]
│   │   ├── car-routes.ts                [NEW]
│   │   ├── post-routes.ts               [NEW]
│   │   ├── comment-routes.ts            [NEW]
│   │   ├── social-routes.ts             [NEW]
│   │   ├── feed-routes.ts               [NEW]
│   │   └── notification-routes.ts       [NEW]
│   │
│   ├── middleware/
│   │   ├── auth-middleware.ts           [Use common]
│   │   ├── upload-middleware.ts         [NEW]
│   │   ├── validation-middleware.ts     [NEW]
│   │   ├── rate-limit-middleware.ts     [NEW]
│   │   └── error-middleware.ts          [NEW]
│   │
│   ├── validators/
│   │   ├── garage-validator.ts          [Exists]
│   │   ├── car-validator.ts             [NEW]
│   │   ├── post-validator.ts            [NEW]
│   │   ├── comment-validator.ts         [NEW]
│   │   └── social-validator.ts          [NEW]
│   │
│   ├── dtos/
│   │   ├── garage-dto.ts                [Exists]
│   │   ├── car-dto.ts                   [NEW]
│   │   ├── post-dto.ts                  [NEW]
│   │   ├── comment-dto.ts               [NEW]
│   │   └── notification-dto.ts          [NEW]
│   │
│   ├── socket/
│   │   ├── socket-server.ts             [NEW]
│   │   ├── socket-handler.ts            [NEW]
│   │   ├── socket-middleware.ts         [NEW]
│   │   └── socket-events.ts             [NEW]
│   │
│   ├── messaging/
│   │   ├── kafka/
│   │   │   ├── producers/
│   │   │   │   ├── garage-producer.ts   [NEW]
│   │   │   │   ├── post-producer.ts     [NEW]
│   │   │   │   └── social-producer.ts   [NEW]
│   │   │   └── consumers/
│   │   │       ├── index.ts             [Exists]
│   │   │       ├── user-event-consumer.ts [Exists]
│   │   │       └── notification-consumer.ts [NEW]
│   │
│   ├── grpc/
│   │   ├── clients/
│   │   │   └── user-client.ts           [Exists]
│   │   └── services/
│   │       └── user-grpc-service.ts     [Exists]
│   │
│   ├── utils/
│   │   ├── image-processor.ts           [NEW]
│   │   ├── pagination.ts                [NEW]
│   │   ├── trending-algorithm.ts        [NEW]
│   │   ├── validation-helper.ts         [NEW]
│   │   └── response-formatter.ts        [NEW]
│   │
│   ├── migration/
│   │   ├── 1752059489650-create-garage.ts     [Exists]
│   │   ├── 1758000000000-enhance-garage.ts    [NEW]
│   │   ├── 1758000000001-create-posts.ts      [NEW]
│   │   ├── 1758000000002-create-post-media.ts [NEW]
│   │   ├── 1758000000003-create-likes.ts      [NEW]
│   │   ├── 1758000000004-create-comments.ts   [NEW]
│   │   └── 1758000000005-create-notifications.ts [NEW]
│   │
│   ├── config/
│   │   ├── database.ts                  [NEW]
│   │   ├── kafka.ts                     [NEW]
│   │   ├── socket.ts                    [NEW]
│   │   └── storage.ts                   [NEW]
│   │
│   ├── types/
│   │   ├── express.d.ts                 [NEW]
│   │   ├── garage.types.ts              [NEW]
│   │   ├── post.types.ts                [NEW]
│   │   └── notification.types.ts        [NEW]
│   │
│   ├── data-source.ts                   [Exists]
│   └── index.ts                         [Exists - Update]
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── controllers/
│   │   └── utils/
│   ├── integration/
│   │   └── api/
│   └── e2e/
│
├── .env.example
├── package.json
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

### Frontend

```
connect-wheels-fe/
├── src/
│   ├── pages/
│   │   ├── garages/
│   │   │   ├── GaragesPage.jsx          [NEW]
│   │   │   ├── GarageProfilePage.jsx    [NEW]
│   │   │   ├── GarageCreatePage.jsx     [NEW]
│   │   │   └── GarageEditPage.jsx       [NEW]
│   │   ├── feed/
│   │   │   ├── FeedPage.jsx             [NEW]
│   │   │   └── ExplorePage.jsx          [NEW]
│   │   ├── posts/
│   │   │   └── PostDetailPage.jsx       [NEW]
│   │   ├── notifications/
│   │   │   └── NotificationsPage.jsx    [NEW]
│   │   ├── dashboard.jsx                [Exists]
│   │   ├── chat.jsx                     [Exists]
│   │   └── not-found.jsx                [Exists]
│   │
│   ├── components/
│   │   ├── garage/
│   │   │   ├── GarageCard.jsx           [NEW]
│   │   │   ├── GarageProfile.jsx        [NEW]
│   │   │   ├── GarageHeader.jsx         [NEW]
│   │   │   ├── GarageStats.jsx          [NEW]
│   │   │   ├── GarageFollowButton.jsx   [NEW]
│   │   │   ├── GarageForm.jsx           [NEW]
│   │   │   ├── GarageGrid.jsx           [NEW]
│   │   │   └── GarageTabs.jsx           [NEW]
│   │   │
│   │   ├── car/
│   │   │   ├── CarCard.jsx              [NEW]
│   │   │   ├── CarForm.jsx              [NEW]
│   │   │   ├── CarGallery.jsx           [NEW]
│   │   │   └── CarSpecs.jsx             [NEW]
│   │   │
│   │   ├── post/
│   │   │   ├── PostCard.jsx             [NEW]
│   │   │   ├── PostCreate.jsx           [NEW]
│   │   │   ├── PostDetail.jsx           [NEW]
│   │   │   ├── PostActions.jsx          [NEW]
│   │   │   ├── PostImageGallery.jsx     [NEW]
│   │   │   ├── PostList.jsx             [NEW]
│   │   │   └── PostStats.jsx            [NEW]
│   │   │
│   │   ├── comment/
│   │   │   ├── CommentSection.jsx       [NEW]
│   │   │   ├── CommentItem.jsx          [NEW]
│   │   │   ├── CommentForm.jsx          [NEW]
│   │   │   ├── CommentActions.jsx       [NEW]
│   │   │   └── CommentReplies.jsx       [NEW]
│   │   │
│   │   ├── notification/
│   │   │   ├── NotificationBell.jsx     [NEW]
│   │   │   ├── NotificationList.jsx     [NEW]
│   │   │   ├── NotificationItem.jsx     [NEW]
│   │   │   └── NotificationBadge.jsx    [NEW]
│   │   │
│   │   ├── social/
│   │   │   ├── LikeButton.jsx           [NEW]
│   │   │   ├── FollowButton.jsx         [NEW]
│   │   │   ├── ShareButton.jsx          [NEW]
│   │   │   ├── FollowersList.jsx        [NEW]
│   │   │   └── FollowSuggestions.jsx    [NEW]
│   │   │
│   │   ├── common/
│   │   │   ├── ImageUpload.jsx          [NEW]
│   │   │   ├── SearchBar.jsx            [NEW]
│   │   │   ├── Pagination.jsx           [NEW]
│   │   │   ├── LoadingSpinner.jsx       [NEW]
│   │   │   ├── ErrorBoundary.jsx        [NEW]
│   │   │   └── InfiniteScroll.jsx       [NEW]
│   │   │
│   │   ├── layout.jsx                   [Exists]
│   │   ├── navbar.jsx                   [Exists - Update]
│   │   └── sidebar.jsx                  [Exists - Update]
│   │
│   ├── redux/
│   │   ├── slices/
│   │   │   ├── apiSlice.js              [Exists]
│   │   │   ├── userSlice.js             [Exists]
│   │   │   ├── chatApiSlice.js          [Exists]
│   │   │   ├── chatStateSlice.js        [Exists]
│   │   │   ├── garageApiSlice.js        [NEW]
│   │   │   ├── garageSlice.js           [NEW]
│   │   │   ├── postApiSlice.js          [NEW]
│   │   │   ├── postSlice.js             [NEW]
│   │   │   ├── notificationApiSlice.js  [NEW]
│   │   │   └── notificationSlice.js     [NEW]
│   │   ├── baseQueryWithReauth.js       [Exists]
│   │   └── store.js                     [Exists - Update]
│   │
│   ├── contexts/
│   │   ├── SocketContext.jsx            [Exists]
│   │   └── GarageSocketContext.jsx      [NEW]
│   │
│   ├── hooks/
│   │   ├── useUserDetails.js            [Exists]
│   │   ├── useGarageSocket.js           [NEW]
│   │   ├── useInfiniteScroll.js         [NEW]
│   │   ├── useDebounce.js               [NEW]
│   │   └── useImageUpload.js            [NEW]
│   │
│   ├── services/
│   │   ├── socketService.js             [Exists]
│   │   ├── garageSocketService.js       [NEW]
│   │   └── uploadService.js             [NEW]
│   │
│   ├── utils/
│   │   ├── dateFormatter.js             [NEW]
│   │   ├── imageOptimizer.js            [NEW]
│   │   └── validators.js                [NEW]
│   │
│   ├── routes/
│   │   ├── protected-route.jsx          [Exists]
│   │   └── public-route.jsx             [Exists]
│   │
│   ├── App.jsx                          [Exists - Update routes]
│   ├── main.jsx                         [Exists]
│   └── index.css                        [Exists]
│
├── public/
├── tests/
│   ├── components/
│   └── integration/
├── .env.example
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🧪 Testing Strategy

### Backend Testing

#### Unit Tests
```javascript
// garage-service.test.ts
describe('GarageService', () => {
  describe('createGarage', () => {
    it('should create a garage with valid data', async () => {
      // Test implementation
    });
    
    it('should throw error if user does not exist', async () => {
      // Test implementation
    });
    
    it('should throw error if garage name exists', async () => {
      // Test implementation
    });
  });
});

// post-service.test.ts
describe('PostService', () => {
  describe('createPost', () => {
    it('should create post with images', async () => {});
    it('should increment garage posts count', async () => {});
  });
  
  describe('getFeed', () => {
    it('should return posts from followed garages', async () => {});
    it('should paginate correctly', async () => {});
  });
});
```

#### Integration Tests
```javascript
// garage-api.test.ts
describe('Garage API', () => {
  describe('POST /api/garage/create-garage', () => {
    it('should create garage with authentication', async () => {
      const response = await request(app)
        .post('/api/garage/create-garage')
        .set('Authorization', `Bearer ${token}`)
        .send(garageData);
      
      expect(response.status).toBe(200);
      expect(response.body.garageID).toBeDefined();
    });
    
    it('should return 401 without authentication', async () => {});
    it('should return 400 with invalid data', async () => {});
  });
});
```

#### E2E Tests
```javascript
// garage-flow.e2e.ts
describe('Garage User Flow', () => {
  it('should allow user to create garage, add car, and create post', async () => {
    // 1. Login
    // 2. Create garage
    // 3. Add car to garage
    // 4. Create post with images
    // 5. Verify post appears in feed
  });
});
```

### Frontend Testing

#### Component Tests
```javascript
// GarageCard.test.jsx
describe('GarageCard', () => {
  it('should render garage information', () => {
    render(<GarageCard garage={mockGarage} />);
    expect(screen.getByText('Speed Demons Garage')).toBeInTheDocument();
  });
  
  it('should call follow handler when follow button clicked', () => {
    const handleFollow = jest.fn();
    render(<GarageCard garage={mockGarage} onFollow={handleFollow} />);
    fireEvent.click(screen.getByText('Follow'));
    expect(handleFollow).toHaveBeenCalledWith(mockGarage.id);
  });
});
```

#### Integration Tests with Cypress
```javascript
// garage-profile.cy.js
describe('Garage Profile Page', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/garage/45');
  });
  
  it('should display garage information', () => {
    cy.contains('Speed Demons Garage').should('be.visible');
    cy.contains('245 followers').should('be.visible');
  });
  
  it('should allow following garage', () => {
    cy.get('[data-testid="follow-button"]').click();
    cy.contains('246 followers').should('be.visible');
    cy.get('[data-testid="follow-button"]').should('contain', 'Following');
  });
  
  it('should display garage posts', () => {
    cy.get('[data-testid="post-card"]').should('have.length.at.least', 1);
  });
});
```

---

## 🚢 Deployment Plan

### Docker Setup

#### Garage Service Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3002

CMD ["npm", "start"]
```

#### Docker Compose (Development)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: connectwheels_garage
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    ports:
      - "2181:2181"
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  garage-service:
    build: ./garage-service
    ports:
      - "3002:3002"
    depends_on:
      - postgres
      - kafka
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/connectwheels_garage
      KAFKA_BROKERS: kafka:9092
      AUTH_SERVICE_URL: http://auth-service:3000

  api-gateway:
    build: ./api-gateway
    ports:
      - "8080:8080"
    depends_on:
      - garage-service
    environment:
      GARAGE_SERVICE_URL: http://garage-service:3002

volumes:
  postgres_data:
```

### Environment Variables

#### Garage Service (.env)
```env
# Server
PORT=3002
NODE_ENV=production

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=connectwheels_garage
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Kafka
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=garage-service
KAFKA_GROUP_ID=garage-service-group

# gRPC
AUTH_SERVICE_GRPC_URL=localhost:50051

# Socket.IO
SOCKET_IO_PORT=3002
SOCKET_IO_PATH=/socket.io
CORS_ORIGIN=http://localhost:5173

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/jpg
AWS_S3_BUCKET=connectwheels-media
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1

# JWT
JWT_SECRET=your_jwt_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/garage-service.yml
name: Garage Service CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'connect-wheels-be/garage-service/**'
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd connect-wheels-be/garage-service
          npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:integration
  
  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          cd connect-wheels-be/garage-service
          docker build -t garage-service:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          docker tag garage-service:${{ github.sha }} your-registry/garage-service:latest
          docker push your-registry/garage-service:latest
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        run: |
          # Your deployment script
```

---

## 📊 Monitoring & Logging

### Logging Setup
```typescript
// logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### Health Check Endpoint
```typescript
// health-controller.ts
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'garage-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: databaseHealthy ? 'connected' : 'disconnected',
    kafka: kafkaHealthy ? 'connected' : 'disconnected',
  });
});
```

---

## 📚 API Documentation

API documentation will be auto-generated using **Swagger/OpenAPI** and accessible at:
```
http://localhost:3002/api-docs
```

---

## 🎓 Learning Resources

### TypeORM
- [Official Documentation](https://typeorm.io/)
- Relations, migrations, query builder

### Socket.IO
- [Official Documentation](https://socket.io/docs/v4/)
- Rooms, authentication, events

### Apache Kafka
- [Official Documentation](https://kafka.apache.org/documentation/)
- Producers, consumers, topics

### Redux Toolkit
- [Official Documentation](https://redux-toolkit.js.org/)
- RTK Query, createSlice, thunks

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is proprietary and confidential.

---

## 👥 Team & Support

- **Project Lead:** [Your Name]
- **Backend Team:** [Team Members]
- **Frontend Team:** [Team Members]
- **DevOps:** [Team Members]

For questions or support, contact: support@connectwheels.com

---

## 🎯 Success Metrics

### KPIs to Track
- [ ] User engagement (daily active users)
- [ ] Number of garages created
- [ ] Posts per day
- [ ] Average likes/comments per post
- [ ] Follower growth rate
- [ ] Real-time notification delivery rate
- [ ] API response times (<200ms p95)
- [ ] Error rates (<0.1%)
- [ ] User retention rate

---

## 🚀 Next Steps

1. Review this plan with the team
2. Set up project management board (Jira/Trello)
3. Assign tasks for Phase 1
4. Set up development environment
5. Begin implementation

---

**Last Updated:** January 7, 2026
**Version:** 1.0.0
**Status:** Planning Phase




