# Multi-stage build for production optimization
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Dependencies stage
FROM base AS dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Build the TypeScript code
RUN pnpm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install pnpm in runner stage
RUN npm install -g pnpm

# Copy necessary files
COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Set environment to production
ENV NODE_ENV=production

# Expose the port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/main.js"]
