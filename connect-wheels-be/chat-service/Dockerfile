FROM node:20-alpine

WORKDIR /app

# Install common module dependencies first (layer caching)
COPY common/package*.json ./common/
RUN cd common && npm install

# Copy common source
COPY common/ ./common/

# Install chat-service dependencies
COPY chat-service/package*.json ./chat-service/
RUN cd chat-service && npm install

# Copy chat-service source
COPY chat-service/ ./chat-service/

WORKDIR /app/chat-service

EXPOSE 3001

CMD ["npm", "run", "start"]
