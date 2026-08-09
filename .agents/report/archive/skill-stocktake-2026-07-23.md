# Skill Stocktake Report — 2026-07-23

**Mode:** Full Stocktake
**Total evaluated:** 89 skills
**Date:** 2026-07-23

## Summary

| Decision | Count |
|----------|-------|
| Keep (no changes) | 43 |
| Improve (trim/expand/fix) | 17 |
| Merge into another | 12 |
| Rename | 9 |
| Remove | 3 |

**Resulting skill count after consolidation:** ~74

## Improve (17)

| Skill | Lines | Action |
|-------|-------|--------|
| django-security | 593→400 | Trim |
| django-tdd | 729→450 | Trim |
| frontend-design | 72 | Update description (senior UI/UX focus) |
| website-api-test | 359 | Add 6 test areas (GraphQL, WebSocket, webhook, file upload/download, CORS, idempotency), trim existing |
| website-accessibility-test | 404 | Add 6 areas (WCAG 2.2, mobile, voice control, cognitive, motion, time-based media), trim existing |
| ai-regression-testing | 385 | Expand integrations (CI/CD hooks) |
| web-security-audit | 818→600 | Trim |
| web-performance | 566→450 | Trim |
| cost-aware-llm-pipeline | 183 | Expand, update pricing |
| foundation-models-on-device | 243 | Expand |
| eval-harness | 270 | Fix .claude/ → .agents/ paths |
| api-design | 523→400 | Trim |
| database-migrations | 429→350 | Trim |
| python-patterns | 750→550 | Trim |
| python-testing | 816→600 | Trim |
| prompt-optimizer | 398→300 | Trim, fix stale refs |
| strategic-compact | 131 | Fix broken refs |

## Merge (12)

| Source | Target | Reason |
|--------|--------|--------|
| django-verification | django-security | Verification steps merge into Django security skill |
| frontend-scrutinize | frontend-review | Combine user UX + code review |
| frontend-ui-engineering | frontend-design | Combine planning + implementation |
| web-refactor | code-refactor | Web-specific patterns absorbed |
| code-simplification | code-refactor | Readability patterns absorbed |
| refactor-decision | code-refactor | Decision framework absorbed |
| ai-first-engineering | agentic-engineering | Org model absorbed |
| research-ops | deep-research | Orchestration wrapper absorbed |
| search-first | source-driven-development | Research-before-code absorbed |
| verification-loop | verify subagent | Project-specific verify already exists |
| agents-setup | project-setup | Bootstrap project more comprehensive |
| skill-stocktake | skill-scout | Skill management combined |

## Rename (9)

| Old | New | Reason |
|-----|-----|--------|
| review | deep-review | More descriptive |
| continuous-learning-v2 | project-learning | v2 suffix unnecessary |
| security-scan | project-config-scan | Scope expanded to all AI tools |
| agentic-engineering | AI-agentic-engineering | AI group prefix |
| foundation-models-on-device | AI-foundation-models-on-device | AI group prefix |
| cost-aware-llm-pipeline | AI-cost-aware-llm-pipeline | AI group prefix |
| project-learning | AI-project-learning | AI group prefix |
| eval-harness | AI-eval-harness | AI group prefix |
| source-driven-development | AI-source-driven-development | AI group prefix |

## Remove (3)

| Skill | Reason |
|-------|--------|
| context | Not needed |
| doubt-driven-development | Not needed |
| regex-vs-llm-structured-text | Not needed |

## Keep (43 — no changes)

frontend-slides, browser-test, test-driven-development, e2e-testing, website-perf-test, website-security-test, security-and-hardening, security-bounty-hunter, deployment-patterns, ci-cd-and-automation, docker-patterns, debug, debug-mantra, agent-introspection-debugging, code-tour, scrutinize, docs-adr, article-writing, content-engine, exa-search, self-learn-project, self-learn-research, self-learn-session, implement-task, plan-task, spec-dev, iterative-retrieval, investor-materials, investor-outreach, management-talk, market-research, incident-response, post-mortem, ship, production-audit, teacher-review, teacher-shared, teacher-general, teacher-game, teacher-english, teacher-learning-resource, curriculum-auditor, blueprint, council, postgres-patterns, error-handling, git-workflow-and-versioning, tech-debt-tracker

## Verdict Distribution

- 43 Keep (no changes)
- 17 Improve
- 12 Merge
- 9 Rename
- 3 Remove
- 5 Keep (with merges absorbed): agentic-engineering, deep-research, code-refactor, source-driven-development, skill-scout
EOF
echo "Report saved."