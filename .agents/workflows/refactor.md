---
description: How to refactor, clean up, and optimize the Boss478 portfolio
---

# Refactor & Optimize Workflow

## Pre-flight
// turbo
1. Ensure dev server is running: `curl -s http://localhost:3000 || npm run dev &`
2. Read `CLAUDE.md` for project rules and constraints
3. Check `tasks/todo.md` for current progress

## Phase 1: Code Refactoring
4. Deduplicate auth token validation — extract `isValidToken` into `lib/auth.ts`, import in `middleware.ts`
5. Remove duplicate security headers from `middleware.ts` (keep in `next.config.ts` only)
6. Fix mid-file import in `actions/portfolio.ts`
7. Replace sync `fs` with async in `api/process-words/route.ts`
8. Reduce body size limit in `next.config.ts` from 200MB to 60MB
// turbo
9. Verify: `npm run build`

## Phase 2: File Cleanup
10. Delete unused files:
    - `public/{file,globe,next,vercel,window}.svg`
    - `public/covers/` (empty)
    - `public/img/Boss478 Head.png`
    - `public/files/word.csv`
    - `src/data/venv/`
    - `src/data/oxford-5000-with-def_n_syn.csv`
    - `src/components/GalleryGrid.tsx`
11. Move `cheerio`, `csv-parse`, `csv-stringify` to devDependencies
12. Add `.DS_Store` to `.gitignore` and remove from tracking
// turbo
13. Verify: `npm run build`

## Phase 3: Performance (VPS)
14. Add `{ published: true }` filters on public gallery/portfolio queries
15. Add MongoDB pool limits in `db.ts` (maxPoolSize: 5)
16. Add `output: 'standalone'` to `next.config.ts`
17. Create multi-stage production Dockerfile
// turbo
18. Verify: `npm run build`

## Phase 4: Security
19. Replace hardcoded secrets in `docker-compose.yml` with env vars
20. Create `.env.example` template

## Post-flight
// turbo
21. Final verify: `npm run build && npm run lint`
22. Bump version in `package.json`
23. Update `changelog.md`
24. Update `tasks/todo.md` with completion status
