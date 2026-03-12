FROM node:20-alpine

WORKDIR /app

# Install common module dependencies first (layer caching)
COPY common/package*.json ./common/
RUN cd common && npm install

# Copy common source
COPY common/ ./common/

# Install garage-service dependencies
COPY garage-service/package*.json ./garage-service/
RUN cd garage-service && npm install

# Copy garage-service source and shared proto files
COPY garage-service/ ./garage-service/
COPY proto/ ./proto/

# Create uploads directory for multer file storage
RUN mkdir -p /app/garage-service/uploads

WORKDIR /app/garage-service

EXPOSE 3002

CMD ["npm", "run", "start"]
