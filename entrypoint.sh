#!/bin/sh
set -e

echo "[entrypoint] Fixing upload permissions..."
find /app/public/uploads -type f -exec chmod 644 {} \; 2>/dev/null || true
find /app/public/uploads -type d -exec chmod 755 {} \; 2>/dev/null || true

echo "[entrypoint] Ready. Starting server..."
exec node server.js