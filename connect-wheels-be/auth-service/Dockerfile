FROM node:20-alpine

WORKDIR /app

# Install common module dependencies first (layer caching)
COPY common/package*.json ./common/
RUN cd common && npm install

# Copy common source
COPY common/ ./common/

# Install auth-service dependencies
COPY auth-service/package*.json ./auth-service/
RUN cd auth-service && npm install

# Copy auth-service source and shared proto files
COPY auth-service/ ./auth-service/
COPY proto/ ./proto/

WORKDIR /app/auth-service

EXPOSE 3000 50051

CMD ["npm", "run", "start"]
