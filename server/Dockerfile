# ============================================================
# AI Scrum Assistant — Production Dockerfile
# ============================================================
# Multi-stage build for smaller, more secure production image.
#
# Build:  docker build -t ai-scrum-server .
# Run:    docker run -p 2000:2000 --env-file .env ai-scrum-server
# ============================================================

# ── Stage 1: Install all dependencies ──────────────────────────
FROM node:20-alpine AS deps

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy package files first (layer caching — only re-runs if deps change)
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (prod + dev, with postinstall scripts)
RUN pnpm install --frozen-lockfile

# ── Stage 2: Production image ──────────────────────────────────
FROM node:20-alpine AS production

# Security: don't run as root
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

# Copy source code
COPY src/ ./src/

# Copy node_modules from deps stage (already fully installed)
COPY --from=deps /app/node_modules ./node_modules

# Copy package.json (needed for runtime metadata)
COPY package.json ./

# Set ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose the server port
EXPOSE 2000

# Health check — verify the server is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:2000/ || exit 1

# Start the server
CMD ["node", "src/index.js"]
