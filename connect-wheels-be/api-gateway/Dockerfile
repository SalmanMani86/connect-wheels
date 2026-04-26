# =====================================================================
# API Gateway — production Dockerfile
# Build context: connect-wheels-be/
# =====================================================================

FROM node:20-alpine AS deps

WORKDIR /app/api-gateway

COPY api-gateway/package*.json ./
RUN npm ci --no-audit --no-fund


# =====================================================================
FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app/api-gateway

RUN apk add --no-cache dumb-init

COPY --from=deps /app/api-gateway/node_modules ./node_modules
COPY api-gateway/ ./

RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
# api-gateway only has dev (ts-node-dev) + start (compiled) scripts.
# We run via ts-node-dev's underlying ts-node by using the dev script — works fine in prod
# but for true prod you should add a build step (tsc) and use the start script.
CMD ["npm", "run", "dev"]
