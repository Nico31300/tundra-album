# Stage 1: Build frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Production
FROM node:22-alpine
WORKDIR /app
COPY backend/package*.json ./backend/
RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    cd backend && npm ci --omit=dev && \
    apk del .build-deps
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
ENV NODE_ENV=production \
    DATABASE_PATH=/data/tundra.db
EXPOSE 3001
CMD ["node", "backend/src/server.js"]
