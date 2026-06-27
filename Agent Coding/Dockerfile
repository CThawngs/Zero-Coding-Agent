FROM node:20-slim

WORKDIR /app

# Copy backend
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

COPY backend/ ./backend/

# Build frontend
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
RUN cd frontend && npx vite build --outDir dist

# Backend serves frontend from data/public or dist
RUN mkdir -p backend/public && cp -r frontend/dist/* backend/public/ 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=8080
ENV DATA_DIR=/app/data

EXPOSE 8080

CMD ["node", "backend/src/app.js"]
