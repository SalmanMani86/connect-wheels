# =====================================================================
# Chat Service — production Dockerfile
# Build context: connect-wheels-be/
# =====================================================================

FROM node:20-alpine AS deps

WORKDIR /app

COPY common/package*.json ./common/
RUN cd common && npm ci --no-audit --no-fund --omit=optional

COPY chat-service/package*.json ./chat-service/
RUN cd chat-service && npm ci --no-audit --no-fund


# =====================================================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY --from=deps /app/common/node_modules ./common/node_modules
COPY --from=deps /app/chat-service/node_modules ./chat-service/node_modules

COPY common/ ./common/
COPY chat-service/ ./chat-service/

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

WORKDIR /app/chat-service

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "run", "start"]
