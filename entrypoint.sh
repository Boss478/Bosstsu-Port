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


echo "[entrypoint] Ready. Starting server..."
exec node server.js