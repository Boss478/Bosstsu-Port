// Boss478 Portfolio — Public Pages Load Test
//
// Usage:
//   Dev:  k6 run tests/k6/load-public.js
//   Prod: k6 run -e BASE_URL=https://srv1676702.hstgr.cloud -e THRESHOLD_MODE=prod tests/k6/load-public.js
//   Docker: docker run --rm -i grafana/k6 run -e BASE_URL=http://host.docker.internal:3300 - <tests/k6/load-public.js
//
// Thresholds match .agents/reference/performance-budget.md:
//   Dev mode:  p95 < 8000ms (dev server is unminified, no ISR)
//   Prod mode: p50 < 1000ms, p95 < 3000ms, p99 < 5000ms

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3300';
const THRESHOLD_MODE = __ENV.THRESHOLD_MODE || 'dev';

const isProd = THRESHOLD_MODE === 'prod';

const errorRate = new Rate('errors');
const homeTrend = new Trend('home_duration');
const portfolioTrend = new Trend('portfolio_duration');
const galleryTrend = new Trend('gallery_duration');
const gamesTrend = new Trend('games_duration');
const resourcesTrend = new Trend('resources_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 25 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    errors: ['rate<0.01'],
    ...(isProd
      ? {
          http_req_duration: ['p(50)<1000', 'p(95)<3000', 'p(99)<5000'],
        }
      : {
          http_req_duration: ['p(95)<8000'],
        }),
  },
};

const pages = [
  { path: '/', name: 'home', trend: homeTrend },
  { path: '/portfolio', name: 'portfolio', trend: portfolioTrend },
  { path: '/gallery', name: 'gallery', trend: galleryTrend },
  { path: '/games', name: 'games', trend: gamesTrend },
  { path: '/resources', name: 'resources', trend: resourcesTrend },
];

export default function loadPublicPages() {
  for (const page of pages) {
    const res = http.get(`${BASE_URL}${page.path}`, {
      tags: { page: page.name },
    });

    const ok = check(res, {
      [`${page.name} status 200`]: (r) => r.status === 200,
    });

    errorRate.add(!ok);

    page.trend.add(res.timings.duration);

    sleep(0.5);
  }

  sleep(1);
}
