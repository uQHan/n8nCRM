# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Build-time config (used by next.config.ts rewrites during `next build`)
ARG SPRING_BACKEND_INTERNAL_URL
ENV SPRING_BACKEND_INTERNAL_URL=$SPRING_BACKEND_INTERNAL_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Runtime config (useful for server-side code; rewrites are typically baked at build)
ARG SPRING_BACKEND_INTERNAL_URL
ENV SPRING_BACKEND_INTERNAL_URL=$SPRING_BACKEND_INTERNAL_URL

# Copy only the production artifacts
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]