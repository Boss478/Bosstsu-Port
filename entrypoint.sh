#!/bin/sh
set -e

echo "[entrypoint] Ensuring all upload directories exist..."
mkdir -p /app/public/uploads/portfolio \
         /app/public/uploads/portfolio/gallery \
         /app/public/uploads/gallery/covers \
         /app/public/uploads/gallery/albums \
         /app/public/uploads/games \
         /app/public/uploads/learning \
         /app/public/uploads/tools \
         /app/public/uploads/misc

echo "[entrypoint] Fixing upload permissions..."
find /app/public/uploads -type f -exec chmod 644 {} \; 2>/dev/null || true
find /app/public/uploads -type d -exec chmod 755 {} \; 2>/dev/null || true

echo "[entrypoint] Ready. Starting server..."
exec node server.js