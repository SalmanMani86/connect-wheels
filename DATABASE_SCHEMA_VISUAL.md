# 🗄️ Garage Microservice - Database Schema Visual Guide

## PostgreSQL Database Tables

---

## 📦 Table: `garages`

**Purpose:** Store garage information (user's car collection spaces)

```sql
CREATE TABLE garages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    pictureUrl VARCHAR(500),
    coverImageUrl VARCHAR(500),
    location VARCHAR(255),
    ownerId INTEGER NOT NULL,
    followersCount INTEGER DEFAULT 0,
    postsCount INTEGER DEFAULT 0,
    carsCount INTEGER DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_garage_owner FOREIGN KEY (ownerId) 
        REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_garages_owner ON garages(ownerId);
CREATE INDEX idx_garages_name ON garages(name);
CREATE INDEX idx_garages_created ON garages(createdAt DESC);
CREATE INDEX idx_garages_followers ON garages(followersCount DESC);
```

### Example Data
```json
{
  "id": 1,
  "name": "Speed Demons Garage",
  "description": "Home of classic American muscle cars",
  "pictureUrl": "https://cdn.example.com/garage-1-profile.jpg",
  "coverImageUrl": "https://cdn.example.com/garage-1-cover.jpg",
  "location": "Los Angeles, CA",
  "ownerId": 123,
  "followersCount": 245,
  "postsCount": 18,
  "carsCount": 5,
  "createdAt": "2026-01-01T10:00:00Z",
  "updatedAt": "2026-01-07T15:30:00Z"
}
```

---

## 🚗 Table: `cars`

**Purpose:** Store individual car information within garages

```sql
CREATE TABLE cars (
    id SERIAL PRIMARY KEY,
    garageId INTEGER NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    color VARCHAR(50),
    vin VARCHAR(17) UNIQUE,
    mileage INTEGER,
    engineType VARCHAR(100),
    transmission VARCHAR(50),
    pictureUrl VARCHAR(500),
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_car_garage FOREIGN KEY (garageId) 
        REFERENCES garages(id) ON DELETE CASCADE,
    CONSTRAINT chk_year CHECK (year >= 1886 AND year <= EXTRACT(YEAR FROM CURRENT_DATE) + 2),
    CONSTRAINT chk_mileage CHECK (mileage >= 0)
);

-- Indexes
CREATE INDEX idx_cars_garage ON cars(garageId);
CREATE INDEX idx_cars_make_model ON cars(make, model);
CREATE INDEX idx_cars_year ON cars(year DESC);
CREATE INDEX idx_cars_vin ON cars(vin);
```

### Example Data
```json
{
  "id": 789,
  "garageId": 1,
  "make": "Ford",
  "model": "Mustang Boss 429",
  "year": 1969,
  "color": "Candy Apple Red",
  "vin": "9F02M123456",
  "mileage": 45000,
  "engineType": "V8 7.0L Boss 429",
  "transmission": "4-Speed Manual",
  "pictureUrl": "https://cdn.example.com/car-789.jpg",
  "description": "Rare Boss 429 Mustang with original engine",
  "createdAt": "2026-01-02T14:20:00Z"
}
```

---

## 👥 Table: `user_garage_follows`

**Purpose:** Many-to-many relationship between users and garages (follow system)

```sql
CREATE TABLE user_garage_follows (
    userId INTEGER NOT NULL,
    garageId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (userId, garageId),
    
    CONSTRAINT fk_follow_user FOREIGN KEY (userId) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_follow_garage FOREIGN KEY (garageId) 
        REFERENCES garages(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_follows_user ON user_garage_follows(userId);
CREATE INDEX idx_follows_garage ON user_garage_follows(garageId);
CREATE INDEX idx_follows_created ON user_garage_follows(createdAt DESC);
```

### Example Data
```json
[
  {
    "userId": 456,
    "garageId": 1,
    "createdAt": "2026-01-03T09:15:00Z"
  },
  {
    "userId": 789,
    "garageId": 1,
    "createdAt": "2026-01-04T16:45:00Z"
  }
]
```

---

## 📸 Table: `posts`

**Purpose:** Store posts/updates about cars and garages

```sql
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    garageId INTEGER NOT NULL,
    title VARCHAR(255),
    caption TEXT,
    content TEXT,
    likesCount INTEGER DEFAULT 0,
    commentsCount INTEGER DEFAULT 0,
    sharesCount INTEGER DEFAULT 0,
    viewsCount INTEGER DEFAULT 0,
    isPublished BOOLEAN DEFAULT true,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_post_garage FOREIGN KEY (garageId) 
        REFERENCES garages(id) ON DELETE CASCADE,
    CONSTRAINT chk_counts CHECK (
        likesCount >= 0 AND 
        commentsCount >= 0 AND 
        sharesCount >= 0 AND 
        viewsCount >= 0
    )
);

-- Indexes
CREATE INDEX idx_posts_garage ON posts(garageId);
CREATE INDEX idx_posts_created ON posts(createdAt DESC);
CREATE INDEX idx_posts_likes ON posts(likesCount DESC);
CREATE INDEX idx_posts_published ON posts(isPublished, createdAt DESC);
CREATE INDEX idx_posts_trending ON posts(likesCount DESC, commentsCount DESC, createdAt DESC);
```

### Example Data
```json
{
  "id": 567,
  "garageId": 1,
  "title": "Just installed new titanium exhaust!",
  "caption": "Custom Borla exhaust system - sounds amazing! 🔥",
  "content": "After months of research, finally installed the Borla titanium exhaust system. The sound is incredible and saved 15lbs over stock!",
  "likesCount": 145,
  "commentsCount": 23,
  "sharesCount": 8,
  "viewsCount": 1250,
  "isPublished": true,
  "createdAt": "2026-01-07T12:00:00Z",
  "updatedAt": "2026-01-07T12:00:00Z"
}
```

---

## 🖼️ Table: `post_media`

**Purpose:** Store multiple images/videos for each post

```sql
CREATE TABLE post_media (
    id SERIAL PRIMARY KEY,
    postId INTEGER NOT NULL,
    mediaUrl VARCHAR(500) NOT NULL,
    mediaType VARCHAR(20) NOT NULL,
    thumbnailUrl VARCHAR(500),
    displayOrder INTEGER DEFAULT 0,
    width INTEGER,
    height INTEGER,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_media_post FOREIGN KEY (postId) 
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT chk_media_type CHECK (mediaType IN ('image', 'video')),
    CONSTRAINT chk_display_order CHECK (displayOrder >= 0)
);

-- Indexes
CREATE INDEX idx_media_post ON post_media(postId, displayOrder);
CREATE INDEX idx_media_type ON post_media(mediaType);
```

### Example Data
```json
[
  {
    "id": 1001,
    "postId": 567,
    "mediaUrl": "https://cdn.example.com/posts/567/image-1.jpg",
    "mediaType": "image",
    "thumbnailUrl": "https://cdn.example.com/posts/567/thumb-1.jpg",
    "displayOrder": 0,
    "width": 1920,
    "height": 1080,
    "createdAt": "2026-01-07T12:00:00Z"
  },
  {
    "id": 1002,
    "postId": 567,
    "mediaUrl": "https://cdn.example.com/posts/567/image-2.jpg",
    "mediaType": "image",
    "thumbnailUrl": "https://cdn.example.com/posts/567/thumb-2.jpg",
    "displayOrder": 1,
    "width": 1920,
    "height": 1080,
    "createdAt": "2026-01-07T12:00:05Z"
  }
]
```

---

## ❤️ Table: `post_likes`

**Purpose:** Track which users liked which posts

```sql
CREATE TABLE post_likes (
    id SERIAL PRIMARY KEY,
    postId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_post_like_post FOREIGN KEY (postId) 
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_post_like_user FOREIGN KEY (userId) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_post_like UNIQUE (postId, userId)
);

-- Indexes
CREATE INDEX idx_post_likes_post ON post_likes(postId);
CREATE INDEX idx_post_likes_user ON post_likes(userId);
CREATE INDEX idx_post_likes_created ON post_likes(createdAt DESC);
```

### Example Data
```json
[
  {
    "id": 2001,
    "postId": 567,
    "userId": 456,
    "createdAt": "2026-01-07T12:30:00Z"
  },
  {
    "id": 2002,
    "postId": 567,
    "userId": 789,
    "createdAt": "2026-01-07T13:15:00Z"
  }
]
```

---

## 💬 Table: `post_comments`

**Purpose:** Store comments on posts (supports nested replies)

```sql
CREATE TABLE post_comments (
    id SERIAL PRIMARY KEY,
    postId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    parentCommentId INTEGER,
    content TEXT NOT NULL,
    likesCount INTEGER DEFAULT 0,
    repliesCount INTEGER DEFAULT 0,
    isEdited BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_comment_post FOREIGN KEY (postId) 
        REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (userId) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_parent FOREIGN KEY (parentCommentId) 
        REFERENCES post_comments(id) ON DELETE CASCADE,
    CONSTRAINT chk_content_length CHECK (LENGTH(content) <= 5000),
    CONSTRAINT chk_counts CHECK (likesCount >= 0 AND repliesCount >= 0)
);

-- Indexes
CREATE INDEX idx_comments_post ON post_comments(postId, createdAt);
CREATE INDEX idx_comments_user ON post_comments(userId);
CREATE INDEX idx_comments_parent ON post_comments(parentCommentId);
CREATE INDEX idx_comments_created ON post_comments(createdAt DESC);
CREATE INDEX idx_comments_likes ON post_comments(likesCount DESC);
```

### Example Data
```json
{
  "id": 3001,
  "postId": 567,
  "userId": 456,
  "parentCommentId": null,
  "content": "Amazing build! What exhaust brand is that?",
  "likesCount": 5,
  "repliesCount": 2,
  "isEdited": false,
  "createdAt": "2026-01-07T13:00:00Z",
  "updatedAt": "2026-01-07T13:00:00Z"
}
```

### Nested Reply Example
```json
{
  "id": 3002,
  "postId": 567,
  "userId": 123,
  "parentCommentId": 3001,
  "content": "Thanks! It's a Borla S-Type system. Highly recommend!",
  "likesCount": 2,
  "repliesCount": 0,
  "isEdited": false,
  "createdAt": "2026-01-07T13:10:00Z",
  "updatedAt": "2026-01-07T13:10:00Z"
}
```

---

## 👍 Table: `comment_likes`

**Purpose:** Track which users liked which comments

```sql
CREATE TABLE comment_likes (
    id SERIAL PRIMARY KEY,
    commentId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_comment_like_comment FOREIGN KEY (commentId) 
        REFERENCES post_comments(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_like_user FOREIGN KEY (userId) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT unique_comment_like UNIQUE (commentId, userId)
);

-- Indexes
CREATE INDEX idx_comment_likes_comment ON comment_likes(commentId);
CREATE INDEX idx_comment_likes_user ON comment_likes(userId);
CREATE INDEX idx_comment_likes_created ON comment_likes(createdAt DESC);
```

### Example Data
```json
[
  {
    "id": 4001,
    "commentId": 3001,
    "userId": 789,
    "createdAt": "2026-01-07T13:05:00Z"
  },
  {
    "id": 4002,
    "commentId": 3001,
    "userId": 234,
    "createdAt": "2026-01-07T13:20:00Z"
  }
]
```

---

## 🔔 Table: `notifications`

**Purpose:** Store user notifications for social interactions

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    userId INTEGER NOT NULL,
    actorId INTEGER,
    type VARCHAR(50) NOT NULL,
    entityType VARCHAR(50),
    entityId INTEGER,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_notification_user FOREIGN KEY (userId) 
        REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_notification_actor FOREIGN KEY (actorId) 
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_notification_type CHECK (
        type IN ('like', 'comment', 'follow', 'mention', 'reply', 'post')
    ),
    CONSTRAINT chk_entity_type CHECK (
        entityType IN ('post', 'comment', 'garage')
    )
);

-- Indexes
CREATE INDEX idx_notifications_user ON notifications(userId, isRead, createdAt DESC);
CREATE INDEX idx_notifications_actor ON notifications(actorId);
CREATE INDEX idx_notifications_entity ON notifications(entityType, entityId);
CREATE INDEX idx_notifications_created ON notifications(createdAt DESC);
CREATE INDEX idx_notifications_unread ON notifications(userId, isRead) WHERE isRead = false;
```

### Example Data
```json
[
  {
    "id": 5001,
    "userId": 123,
    "actorId": 456,
    "type": "like",
    "entityType": "post",
    "entityId": 567,
    "message": "John Doe liked your post",
    "isRead": false,
    "createdAt": "2026-01-07T14:00:00Z"
  },
  {
    "id": 5002,
    "userId": 123,
    "actorId": 456,
    "type": "comment",
    "entityType": "post",
    "entityId": 567,
    "message": "John Doe commented on your post",
    "isRead": false,
    "createdAt": "2026-01-07T14:05:00Z"
  },
  {
    "id": 5003,
    "userId": 123,
    "actorId": 789,
    "type": "follow",
    "entityType": "garage",
    "entityId": 1,
    "message": "Jane Smith started following your garage",
    "isRead": true,
    "createdAt": "2026-01-07T14:10:00Z"
  }
]
```

---

## 🔗 Relationship Diagram (Detailed)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPLETE RELATIONSHIP MAP                       │
└─────────────────────────────────────────────────────────────────────┘

                        ┌──────────────┐
                        │    users     │ (Auth Service DB)
                        ├──────────────┤
                        │ id (PK)      │
                        │ name         │
                        │ email        │
                        │ profilePic   │
                        └──────┬───────┘
                               │
                ┏━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┓
                ┃                              ┃
    ┌───────────▼──────────┐        ┌─────────▼────────┐
    │  user_garage_follows │        │  notifications   │
    ├──────────────────────┤        ├──────────────────┤
    │ userId (PK,FK) ──────┼───┐    │ id (PK)          │
    │ garageId (PK,FK)     │   │    │ userId (FK) ─────┼──┐
    │ createdAt            │   │    │ actorId (FK) ────┼──┤
    └─────────┬────────────┘   │    │ type             │  │
              │                │    │ entityType       │  │
              │                │    │ entityId         │  │
              │                │    │ message          │  │
    ┌─────────▼──────────┐    │    │ isRead           │  │
    │      garages       │    │    │ createdAt        │  │
    ├────────────────────┤    │    └──────────────────┘  │
    │ id (PK)            │    │                           │
    │ name (UNIQUE)      │    └───────────────────────────┤
    │ description        │                                │
    │ pictureUrl         │◄───────────────────────────────┘
    │ coverImageUrl      │
    │ location           │
    │ ownerId (FK) ──────┼────► users.id
    │ followersCount     │
    │ postsCount         │
    │ carsCount          │
    │ createdAt          │
    │ updatedAt          │
    └──────┬─────┬───────┘
           │     │
           │     └──────────────┐
           │                    │
    ┌──────▼─────┐       ┌──────▼───────┐
    │   cars     │       │    posts     │
    ├────────────┤       ├──────────────┤
    │ id (PK)    │       │ id (PK)      │
    │ garageId   │       │ garageId(FK) │
    │ make       │       │ title        │
    │ model      │       │ caption      │
    │ year       │       │ content      │
    │ color      │       │ likesCount   │
    │ vin        │       │ commentsC    │
    │ mileage    │       │ sharesCount  │
    │ engineType │       │ viewsCount   │
    │ transmiss  │       │ isPublished  │
    │ pictureUrl │       │ createdAt    │
    │ descr      │       │ updatedAt    │
    │ createdAt  │       └────┬─────┬───┘
    └────────────┘            │     │
                              │     └────────────┐
                              │                  │
                   ┏━━━━━━━━━━┻━━━━━━━━┓         │
                   ┃                   ┃         │
           ┌───────▼──────┐    ┌───────▼──────┐ │
           │ post_media   │    │ post_likes   │ │
           ├──────────────┤    ├──────────────┤ │
           │ id (PK)      │    │ id (PK)      │ │
           │ postId (FK)  │    │ postId (FK)  │ │
           │ mediaUrl     │    │ userId (FK)──┼─┼──► users.id
           │ mediaType    │    │ createdAt    │ │
           │ thumbnailUrl │    └──────────────┘ │
           │ displayOrder │                     │
           │ width        │                     │
           │ height       │                     │
           │ createdAt    │                     │
           └──────────────┘            ┌────────▼───────┐
                                       │ post_comments  │
                                       ├────────────────┤
                                       │ id (PK)        │
                                       │ postId (FK)    │
                                       │ userId (FK) ───┼──► users.id
                                       │ parentComment  │
                                       │   Id (FK) ─────┼──┐
                                       │ content        │  │
                                       │ likesCount     │  │ Self-reference
                                       │ repliesCount   │  │ for nested
                                       │ isEdited       │  │ comments
                                       │ createdAt      │  │
                                       │ updatedAt      │◄─┘
                                       └────────┬───────┘
                                                │
                                                │
                                       ┌────────▼────────┐
                                       │ comment_likes   │
                                       ├─────────────────┤
                                       │ id (PK)         │
                                       │ commentId (FK)  │
                                       │ userId (FK) ────┼──► users.id
                                       │ createdAt       │
                                       └─────────────────┘
```

---

## 📊 Cardinality Quick Reference

| Relationship                  | Type  | Description                          |
|-------------------------------|-------|--------------------------------------|
| users → garages               | 1:N   | One user owns many garages           |
| garages → cars                | 1:N   | One garage has many cars             |
| garages → posts               | 1:N   | One garage has many posts            |
| posts → post_media            | 1:N   | One post has many media items        |
| posts → post_comments         | 1:N   | One post has many comments           |
| post_comments → post_comments | 1:N   | One comment has many replies (self)  |
| users ↔ garages (follows)     | N:M   | Many users follow many garages       |
| users ↔ posts (likes)         | N:M   | Many users like many posts           |
| users ↔ comments (likes)      | N:M   | Many users like many comments        |
| users → notifications         | 1:N   | One user receives many notifications |

---

## 🔍 Common Query Patterns

### 1. Get Garage with Stats
```sql
SELECT 
    g.*,
    COUNT(DISTINCT c.id) as actual_cars_count,
    COUNT(DISTINCT p.id) as actual_posts_count,
    COUNT(DISTINCT f.userId) as actual_followers_count
FROM garages g
LEFT JOIN cars c ON c.garageId = g.id
LEFT JOIN posts p ON p.garageId = g.id
LEFT JOIN user_garage_follows f ON f.garageId = g.id
WHERE g.id = 1
GROUP BY g.id;
```

### 2. Get User's Feed (Posts from Followed Garages)
```sql
SELECT 
    p.*,
    g.name as garageName,
    g.pictureUrl as garagePicture,
    (SELECT COUNT(*) FROM post_likes pl WHERE pl.postId = p.id AND pl.userId = $userId) as isLiked
FROM posts p
INNER JOIN garages g ON g.id = p.garageId
INNER JOIN user_garage_follows f ON f.garageId = g.id
WHERE f.userId = $userId
ORDER BY p.createdAt DESC
LIMIT 20 OFFSET 0;
```

### 3. Get Trending Posts
```sql
SELECT 
    p.*,
    g.name as garageName,
    (p.likesCount * 2 + p.commentsCount * 3 + p.viewsCount * 0.1) as trendingScore
FROM posts p
INNER JOIN garages g ON g.id = p.garageId
WHERE p.createdAt > NOW() - INTERVAL '7 days'
ORDER BY trendingScore DESC, p.createdAt DESC
LIMIT 20;
```

### 4. Get Post with Comments (Nested)
```sql
-- Top-level comments
SELECT 
    c.*,
    u.name as userName,
    u.profilePicture as userPicture,
    (SELECT COUNT(*) FROM comment_likes cl WHERE cl.commentId = c.id AND cl.userId = $userId) as isLiked
FROM post_comments c
INNER JOIN users u ON u.id = c.userId
WHERE c.postId = $postId AND c.parentCommentId IS NULL
ORDER BY c.createdAt DESC;

-- Replies for a comment
SELECT 
    c.*,
    u.name as userName,
    u.profilePicture as userPicture
FROM post_comments c
INNER JOIN users u ON u.id = c.userId
WHERE c.parentCommentId = $commentId
ORDER BY c.createdAt ASC;
```

### 5. Get User's Notifications
```sql
SELECT 
    n.*,
    u.name as actorName,
    u.profilePicture as actorPicture
FROM notifications n
LEFT JOIN users u ON u.id = n.actorId
WHERE n.userId = $userId
ORDER BY n.createdAt DESC
LIMIT 20 OFFSET 0;
```

### 6. Search Garages
```sql
SELECT 
    g.*,
    ts_rank(to_tsvector('english', g.name || ' ' || COALESCE(g.description, '')), 
            plainto_tsquery('english', $searchQuery)) as rank
FROM garages g
WHERE to_tsvector('english', g.name || ' ' || COALESCE(g.description, '')) 
      @@ plainto_tsquery('english', $searchQuery)
ORDER BY rank DESC, g.followersCount DESC
LIMIT 20;
```

---

## 🛡️ Database Triggers (Optional Optimizations)

### 1. Auto-update Garage Stats on Car Insert/Delete
```sql
CREATE OR REPLACE FUNCTION update_garage_cars_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE garages SET carsCount = carsCount + 1 WHERE id = NEW.garageId;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE garages SET carsCount = carsCount - 1 WHERE id = OLD.garageId;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_garage_cars_count
AFTER INSERT OR DELETE ON cars
FOR EACH ROW EXECUTE FUNCTION update_garage_cars_count();
```

### 2. Auto-update Post Comments Count
```sql
CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET commentsCount = commentsCount + 1 WHERE id = NEW.postId;
        IF NEW.parentCommentId IS NOT NULL THEN
            UPDATE post_comments SET repliesCount = repliesCount + 1 
            WHERE id = NEW.parentCommentId;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET commentsCount = commentsCount - 1 WHERE id = OLD.postId;
        IF OLD.parentCommentId IS NOT NULL THEN
            UPDATE post_comments SET repliesCount = repliesCount - 1 
            WHERE id = OLD.parentCommentId;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_comments_count
AFTER INSERT OR DELETE ON post_comments
FOR EACH ROW EXECUTE FUNCTION update_post_comments_count();
```

### 3. Auto-update Garage Followers Count
```sql
CREATE OR REPLACE FUNCTION update_garage_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE garages SET followersCount = followersCount + 1 WHERE id = NEW.garageId;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE garages SET followersCount = followersCount - 1 WHERE id = OLD.garageId;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_garage_followers_count
AFTER INSERT OR DELETE ON user_garage_follows
FOR EACH ROW EXECUTE FUNCTION update_garage_followers_count();
```

---

## 📈 Performance Considerations

### Index Strategy
1. **Primary Keys**: Automatic indexes on all PKs
2. **Foreign Keys**: Indexed for JOIN operations
3. **Sorting Columns**: createdAt DESC for timeline queries
4. **Count Columns**: likesCount, followersCount for trending
5. **Search Columns**: Full-text search indexes
6. **Composite Indexes**: (userId, isRead, createdAt) for notifications

### Partitioning (For Scale)
```sql
-- Partition notifications by month (for high-volume tables)
CREATE TABLE notifications (
    id SERIAL,
    userId INTEGER NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ...
) PARTITION BY RANGE (createdAt);

CREATE TABLE notifications_2026_01 PARTITION OF notifications
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE notifications_2026_02 PARTITION OF notifications
    FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

### Connection Pooling
```typescript
// TypeORM connection pool config
{
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  extra: {
    max: 20,              // Maximum pool size
    min: 5,               // Minimum pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}
```

---

## 🔒 Security Considerations

1. **Row-Level Security**: Ensure users can only modify their own data
2. **SQL Injection**: Use parameterized queries (TypeORM handles this)
3. **Data Validation**: Constraints at DB level + application level
4. **Sensitive Data**: Never store passwords (handled by auth service)
5. **Audit Logging**: Track who modified what and when

---

**Last Updated:** January 7, 2026
**Database Version:** PostgreSQL 14+
**Schema Version:** 1.0.0



