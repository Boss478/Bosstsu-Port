// Lighthouse CI assertion config — blocks on critical CWV violations
// Usage: npx lhci collect --url=https://srv1676702.hstgr.cloud/ && npx lhci assert
// Or:    npx lhci autorun --config=lighthouserc.js

module.exports = {
  ci: {
    collect: {
      url: [
        'https://srv1676702.hstgr.cloud/',
        'https://srv1676702.hstgr.cloud/portfolio',
        'https://srv1676702.hstgr.cloud/gallery',
        'https://srv1676702.hstgr.cloud/games',
        'https://srv1676702.hstgr.cloud/resources',
      ],
      numberOfRuns: 1,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        // Critical — BLOCK (error)
        'categories:performance': ['error', { minScore: 0.7 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['error', { maxNumericValue: 500 }],

        // Warning only
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'server-response-time': ['warn', { maxNumericValue: 1500 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
  },
}
