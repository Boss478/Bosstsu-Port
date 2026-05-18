# ─── Stage 1: Install ALL dependencies ─────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN apk add --no-cache python3 make g++ && \
    npm ci && \
    npm rebuild sharp

# ─── Stage 2: Build Next.js ─────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG MONGODB_URI
ENV MONGODB_URI=$MONGODB_URI
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_ESLINT=false
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npm run build

# ─── Stage 3: Production runner ─────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

RUN chown -R 1001:1001 /app && \
    mkdir -p /app/public/uploads/portfolio \
    /app/public/uploads/gallery/covers \
    /app/public/uploads/gallery/albums \
    /app/public/uploads/games \
    /app/public/uploads/learning \
    /app/public/uploads/tools \
    /app/public/uploads/misc && \
    chown -R 1001:1001 /app/public/uploads && \
    chmod -R 755 /app/public/uploads && \
    mkdir -p /app/.next/cache && \
    chown -R 1001:1001 /app/.next/cache

USER nextjs
EXPOSE 3300

ENV PORT=3300
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]