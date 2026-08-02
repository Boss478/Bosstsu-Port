// Boss478 — Class Tools Live Poll Load Test
//
// Simulates 100 students polling a live session. Run AFTER Phase 1-3 fixes
// (token stripping, server-side counts, 10s+jitter polling).
//
// Prerequisites:
//   1. Dev server running: npm run dev
//   2. A live session in the DB — set its _id via SESSION_ID (optional env).
//      Without it the test exercises the 400/validation path (counts still
//      measured, but not representative of live polling).
//
// Usage:
//   k6 run -e SESSION_ID=<mongodb-id> tests/k6/tools-live.js
//   Docker: docker run --rm -i grafana/k6 run -e BASE_URL=http://host.docker.internal:3300 -e SESSION_ID=<id> - <tests/k6/tools-live.js
//
// Thresholds:
//   p95 < 500ms per poll GET, error rate < 1% (1vCPU VPS, pool 3).

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3300';
const SESSION_ID = __ENV.SESSION_ID || '507f1f77bcf86cd799439011';

const errorRate = new Rate('errors');
const pollTrend = new Trend('poll_duration');

export const options = {
  stages: [
    { duration: '15s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 100 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
    poll_duration: ['p(95)<500'],
  },
};

export default function toolsLivePoll() {
  const res = http.get(`${BASE_URL}/api/tools/poll?sessionId=${SESSION_ID}`, {
    tags: { endpoint: 'poll' },
  });

  const ok = check(res, {
    'poll status 2xx': (r) => r.status >= 200 && r.status < 300,
  });

  errorRate.add(!ok);
  pollTrend.add(res.timings.duration);

  // Matches client jitter (10s base + 0-4s) so the herd stays desynced.
  sleep(10 + Math.random() * 4);
}
