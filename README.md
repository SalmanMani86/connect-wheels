# 🚗 Connect Wheels

A full-stack social platform for car enthusiasts. Create your garage, showcase your cars with photos, share build posts, follow other garages, message owners directly, and discover trending builds from the community.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏠 **Garages** | Create and manage your personal garage profile with a cover image |
| 🚙 **Cars** | Add cars with up to 5 photos, specs (make, model, year, color, engine, transmission) |
| 📝 **Posts** | Share build updates and stories — with likes and comments |
| 📰 **Feed** | Follow garages to see their posts · Browse all cars on the platform |
| 🔥 **Trending** | Discover the most liked posts this week, month, or all time |
| 💬 **Messages** | Real-time chat between users powered by Socket.IO |
| 🔔 **Notifications** | Get notified on follows, likes, and comments |
| 📊 **Dashboard** | Personal stats, onboarding guide, content charts, and garage overview |
| 🔍 **Search** | Search garages by name/location · Search cars by make, model, color |
| 🔐 **Auth** | Email/password signup + Google OAuth |
| 📱 **Responsive** | Fully mobile-friendly with bottom navigation on small screens |

---

## 🏗️ Architecture

```
Frontend (React/Vite  :5173)
          │
          ▼
  API Gateway (Express  :8080)
    │
    ├── /api/auth/*   ──► Auth Service    (:3000)  PostgreSQL · JWT · Google OAuth · gRPC server · Kafka
    ├── /api/user/*   ──► Auth Service    (:3000)
    ├── /api/chat/*   ──► Chat Service    (:3001)  MongoDB · Socket.IO · REST
    ├── /socket.io    ──► Chat Service    (:3001)  WebSocket pass-through
    └── /api/garage/* ──► Garage Service  (:3002)  PostgreSQL · TypeORM · Multer · gRPC client · Kafka consumer

Shared:  common/  — Kafka producer/consumer/DLQ, JWT auth middleware
Proto:   proto/user.proto  — gRPC contract (Auth ↔ Garage)
```

---

## 🛠️ Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 7 |
| UI Library | Material UI (MUI v7) |
| State / API | Redux Toolkit v2 + RTK Query |
| Routing | React Router DOM v7 |
| Real-time | Socket.IO client v4 |
| Charts | Recharts |
| Forms | Formik + Yup |

### Backend — Microservices
| Service | Port | Database | Key Libraries |
|---|---|---|---|
| API Gateway | 8080 | — | Express, http-proxy-middleware |
| Auth Service | 3000 | PostgreSQL | TypeORM, bcrypt, JWT, Passport (Google OAuth), gRPC |
| Chat Service | 3001 | MongoDB | Mongoose, Socket.IO, Express |
| Garage Service | 3002 | PostgreSQL | TypeORM, Multer, gRPC client, Kafka |

### Infrastructure / Shared
- **Kafka** — async event messaging between services (e.g. user created → garage service notified)
- **gRPC** — sync communication between Auth ↔ Garage service (user lookups)
- **Multer** — image uploads saved to disk (`uploads/` folder per service)
- **JWT** — stateless auth tokens validated by a shared middleware in `common/`

---

## 📁 Project Structure

```
connect-wheels/
├── connect-wheels-fe/          # React frontend
│   └── src/
│       ├── pages/              # Dashboard, Feed, Garages, Chat, Settings …
│       ├── components/         # Navbar, Sidebar, Chat components, Layout
│       ├── redux/slices/       # RTK Query API slices (garage, chat, user)
│       └── utils/              # imageUrl resolver, uploadUtils
│
└── connect-wheels-be/          # Backend monorepo
    ├── api-gateway/            # Reverse proxy (Express)
    ├── auth-service/           # User registration, login, Google OAuth
    ├── chat-service/           # Real-time messaging (Socket.IO + MongoDB)
    ├── garage-service/         # Garages, Cars, Posts, Feed, Notifications
    ├── common/                 # Shared JWT middleware, Kafka client
    └── proto/                  # gRPC proto definitions
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (running locally)
- MongoDB (running locally, for chat)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/connect-wheels.git
cd connect-wheels
```

### 2. Auth Service (port 3000)
```bash
cd connect-wheels-be/auth-service
cp env.example .env        # fill in DB_USERNAME, DB_PASSWORD, DB_DATABASE, JWT_SECRET
npm install
npm run start
```

### 3. Garage Service (port 3002)
```bash
cd ../garage-service
cp env.example .env        # fill in DB credentials
npm install
npm run start
```

### 4. Chat Service (port 3001)
```bash
cd ../chat-service
cp env.example .env        # fill in MONGODB_URI, JWT_SECRET
npm install
npm run start
```

### 5. API Gateway (port 8080)
```bash
cd ../api-gateway
npm install
npm run start
```

### 6. Frontend (port 5173)
```bash
cd ../../connect-wheels-fe
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Environment Variables

Each service has an `env.example` file. Key variables:

**Auth & Garage Services:**
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_pg_user
DB_PASSWORD=your_pg_password
DB_DATABASE=your_db_name
JWT_SECRET=your_secret_key
PORT=3000   # or 3002
```

**Chat Service:**
```
MONGODB_URI=mongodb://localhost:27017/connect-wheels-chat
JWT_SECRET=your_secret_key   # must match auth service
PORT=3001
```

> ⚠️ Never commit `.env` files. They are in `.gitignore`.

---

## 📸 Image Storage

Uploaded images are saved to the `uploads/` folder on the Garage Service's disk:

```
garage-service/uploads/
  ├── garage-covers/   ← garage cover images
  ├── posts/           ← post media
  └── cars/            ← car photos
```

The database stores only the relative URL path (e.g. `/api/garage/uploads/cars/car-123.jpg`). The API gateway proxies file requests to the garage service which serves them via `express.static`.

> In production, replace the local disk storage with **AWS S3** or **Cloudinary**.

---

## 📄 License

MIT
