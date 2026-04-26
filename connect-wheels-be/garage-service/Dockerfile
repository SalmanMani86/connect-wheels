# =====================================================================
# Garage Service — production Dockerfile
# Build context: connect-wheels-be/
# =====================================================================

FROM node:20-alpine AS deps

WORKDIR /app

COPY common/package*.json ./common/
RUN cd common && npm ci --no-audit --no-fund --omit=optional

COPY garage-service/package*.json ./garage-service/
RUN cd garage-service && npm ci --no-audit --no-fund


# =====================================================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=deps /app/common/node_modules ./common/node_modules
COPY --from=deps /app/garage-service/node_modules ./garage-service/node_modules

COPY common/ ./common/
COPY garage-service/ ./garage-service/
COPY proto/ ./proto/

# WARNING: uploads dir is ephemeral on free tiers (Render/Koyeb).
# Files survive only between requests on the same instance.
# For real persistence, switch to Cloudinary / S3 / Render Disk.
# See DEPLOYMENT.md > "Persistent file uploads" section.
RUN mkdir -p /app/garage-service/uploads/garage-covers \
             /app/garage-service/uploads/posts \
             /app/garage-service/uploads/cars

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

WORKDIR /app/garage-service

EXPOSE 3002

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
