FROM node:20-alpine

WORKDIR /app/api-gateway

# Install dependencies
COPY api-gateway/package*.json ./
RUN npm install

# Copy api-gateway source
COPY api-gateway/ ./

EXPOSE 8080

# Use dev script since api-gateway uses ts-node-dev (no compiled JS in repo)
CMD ["npm", "run", "dev"]
