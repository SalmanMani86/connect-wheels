# =====================================================================
# Auth Service — production Dockerfile
# Build context: connect-wheels-be/  (the backend root, NOT the service)
# Build command (from connect-wheels-be/):
#   docker build -f auth-service/Dockerfile -t cw-auth .
# =====================================================================

FROM node:20-alpine AS deps

WORKDIR /app

# 1) Install common module deps (used by JWT middleware, kafka client etc.)
COPY common/package*.json ./common/
RUN cd common && npm ci --no-audit --no-fund --omit=optional

# 2) Install auth-service deps (use ci for deterministic, lockfile-based install)
COPY auth-service/package*.json ./auth-service/
RUN cd auth-service && npm ci --no-audit --no-fund


# =====================================================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

WORKDIR /app

# Install dumb-init for proper signal handling (PID 1 problem)
RUN apk add --no-cache dumb-init

# Copy node_modules from deps stage
COPY --from=deps /app/common/node_modules ./common/node_modules
COPY --from=deps /app/auth-service/node_modules ./auth-service/node_modules

# Copy source code last (best layer caching)
COPY common/ ./common/
COPY auth-service/ ./auth-service/
COPY proto/ ./proto/

# Run as non-root user for security
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

WORKDIR /app/auth-service

# 3000 = HTTP, 50051 = gRPC (only used in local docker-compose; on Render only PORT is exposed)
EXPOSE 3000 50051

# dumb-init forwards SIGTERM/SIGINT properly — important for graceful shutdown on Render
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
