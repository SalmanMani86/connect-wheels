# 🚀 Getting Started - Garage Service Backend

## Where to Start

This guide shows the **exact order** to implement the garage service backend based on the [GARAGE_MICROSERVICE_PLAN.md](/GARAGE_MICROSERVICE_PLAN.md).

---

## 📍 Current State

| Component | Status | Location |
|-----------|--------|----------|
| Garage entity | ✅ Basic (needs enhancement) | `src/entity/garage.ts` |
| Car entity | ✅ Basic (needs enhancement) | `src/entity/car.ts` |
| UserGarageFollow | ✅ Exists | `src/entity/user-garage-follow.ts` |
| Garage service | ⚠️ Partial (create + delete only) | `src/service/garage-service.ts` |
| Garage controller | ⚠️ Partial | `src/controller/garage-controller.ts` |
| Garage routes | ⚠️ Partial (create only) | `src/routes/garage-routes.ts` |
| Car service | ❌ Missing | Create `src/service/car-service.ts` |
| gRPC user check | ✅ Exists | `src/grpc/services/user-grpc-service.ts` |
| Kafka consumer | ✅ Exists | `src/messaging/kafka/consumers/` |

---

## 🎯 Phase 1 Implementation Order

### Step 1: Enhance Entities (Start Here!)
1. **`src/entity/garage.ts`** - Add: description, coverImageUrl, location, followersCount, postsCount, carsCount, updatedAt
2. **`src/entity/car.ts`** - Add: color, vin, mileage, engineType, transmission, description, createdAt, updatedAt

> **Note:** With `synchronize: true` in data-source, TypeORM auto-updates the DB schema. For production, use migrations.

### Step 2: Expand Garage Service
3. **`src/service/garage-service.ts`** - Add methods:
   - `getGarageById(id)`
   - `updateGarage(id, data)`
   - `deleteGarage(id)`
   - `getUserGarages(userId)`
   - `searchGarages(query, filters)`

### Step 3: Create Car Service
4. **`src/service/car-service.ts`** - Create with:
   - `addCar(garageId, carData)`
   - `getGarageCars(garageId)`
   - `getCarById(garageId, carId)`
   - `updateCar(carId, data)`
   - `deleteCar(carId)`

### Step 4: Update Controllers
5. **`src/controller/garage-controller.ts`** - Add handlers for get, update, delete, search, user garages
6. **`src/controller/car-controller.ts`** - Create with CRUD handlers

### Step 5: Update Routes
7. **`src/routes/garage-routes.ts`** - Add all garage endpoints
8. **`src/routes/car-routes.ts`** - Create car routes
9. **`src/routes/index.ts`** - Create route aggregator (optional)
10. **`src/index.ts`** - Mount routes at `/api` (for API Gateway compatibility)

### Step 6: DTOs & Validators
11. **`src/dtos/garage-dto.ts`** - Extend with new fields
12. **`src/dtos/car-dto.ts`** - Create
13. **`src/validator/car-validator.ts`** - Create for car validation

---

## 🔌 API Gateway Path Mapping

When the API Gateway receives `POST /api/garage/create-garage`, it rewrites to `/api/create-garage` and forwards to the garage service.

**Garage service must mount routes at `/api`** so that:
- Gateway: `GET /api/garage/123` → Garage: `GET /api/123`
- Gateway: `POST /api/garage/create-garage` → Garage: `POST /api/create-garage`
- Gateway: `GET /api/garage/123/cars` → Garage: `GET /api/123/cars`

---

## 🏃 Quick Start Commands

```bash
# From connect-wheels-be/garage-service
cd connect-wheels-be/garage-service

# Install dependencies (if needed)
npm install

# Start PostgreSQL (ensure it's running)
# Default: localhost:5432, user: postgres, db: postgres

# Run the service
npm run dev-start
# or
npm start
```

**Service runs on:** `http://localhost:3002` (set `PORT` in env to override)  
**Via Gateway:** `http://localhost:8080/api/garage/*`

---

## 📁 File Structure After Phase 1

```
garage-service/
├── src/
│   ├── entity/
│   │   ├── garage.ts          ✅ Enhanced
│   │   ├── car.ts             ✅ Enhanced
│   │   └── user-garage-follow.ts
│   ├── service/
│   │   ├── garage-service.ts  ✅ Expanded
│   │   └── car-service.ts     🆕 New
│   ├── controller/
│   │   ├── garage-controller.ts  ✅ Expanded
│   │   └── car-controller.ts     🆕 New
│   ├── routes/
│   │   ├── garage-routes.ts   ✅ Expanded
│   │   ├── car-routes.ts      🆕 New
│   │   └── index.ts           🆕 New (aggregator)
│   ├── dtos/
│   │   ├── garage-dto.ts     ✅ Extended
│   │   └── car-dto.ts        🆕 New
│   └── validator/
│       ├── garage-validator.ts
│       └── car-validator.ts  🆕 New
```

---

## ⏭️ Next Phases (After Phase 1)

- **Phase 2:** Follow system (follow/unfollow, followers list)
- **Phase 3:** Posts & Feed (post entity, media, feed service)
- **Phase 4:** Likes & Comments
- **Phase 5:** Real-time & Notifications (Socket.IO)
- **Phase 6:** Search & Discovery

---

## 🧪 Test Your Setup

```bash
# Health check (direct to garage service)
curl http://localhost:3002/health

# Via API Gateway
curl http://localhost:8080/api/garage/... 
# (needs gateway running and garage service registered)
```

---

**Start with Step 1 (entity enhancements) and work through in order!**
