# ============================================================
# PDF OCR Frontend - Production Dockerfile
# Build: Vite + React + TypeScript → Nginx static server
# ============================================================

# ── Stage 1: Node builder ────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests first (layer cache — only reinstalls when deps change)
COPY package.json package-lock.json ./

# Clean install (uses package-lock.json for reproducible builds)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the production bundle
# VITE_API_URL is injected at BUILD TIME via --build-arg
ARG VITE_API_URL=https://ai-doc-retrieval-backend.arffys.com
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build


# ── Stage 2: Nginx runtime ───────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx runs as non-root by default on Alpine (nginx user)
# Make sure nginx user can write to cache/pid dirs
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginx:nginx /var/run/nginx.pid

USER nginx

# Health check — pings /ping defined in nginx.conf
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ping || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
