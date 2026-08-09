# R3 Cleanup Report — /tmp scratch & benchmark artifacts

**Date:** 2026-08-08 · **Scope:** `/tmp` only (repo untouched, no git ops) · **Status:** Complete

## Deletion Log

All sizes are bytes (ls -la). All files were scratch/benchmark artifacts, no user data. | Path | Size | mtime |
| --- | ---: | --- |
| /tmp/check3.cjs | 2919 | Aug 8 13:09 |
| /tmp/check4.cjs | 2919 | Aug 8 13:09 |
| /tmp/check5.cjs | 2643 | Aug 8 13:10 |
| /tmp/checkA.cjs | 2628 | Aug 8 13:11 |
| /tmp/checkA-clean.cjs | 2453 | Aug 8 13:11 |
| /tmp/checkB.cjs | 3656 | Aug 8 13:12 |
| /tmp/checkC.cjs | 1989 | Aug 8 13:13 |
| /tmp/env-upgrade-avif-check.png | 83199 | Aug 8 14:29 |
| /tmp/t9b-avif-compare.png | 865524 | Aug 8 14:31 |
| /tmp/k6-load-public-attempt3.json | 5883 | Aug 8 15:38 |
| /tmp/k6-load-public-attempt3.log | 18895 | Aug 8 15:38 |
| /tmp/k6-load-public-summary.json | 6116 | Aug 8 14:53 |
| /tmp/k6-run3-full.log | 13623 | Aug 8 14:56 |
| /tmp/k6-run4-full.log | 13624 | Aug 8 14:58 |
| /tmp/k6-tools-live-attempt3.json | 3915 | Aug 8 15:35 |
| /tmp/k6-tools-live-attempt3.log | 13945 | Aug 8 15:35 |
| /tmp/k6-tools-live-summary.json | 3895 | Aug 8 14:50 |
| /tmp/k6-tools-live-summary2.json | 3934 | Aug 8 14:55 |
| /tmp/k6-tools-live-summary3.json | 3884 | Aug 8 14:56 |
| /tmp/k6-tools-live-summary4.json | 3921 | Aug 8 14:58 |
| /tmp/env-upgrade-lawlib.config.ts | 1079 | Aug 8 15:03 |
| /tmp/env-upgrade-prod-server.log | 2879 | Aug 8 14:39 |

**22 files removed · 1,065,523 bytes (~1.0 MB) freed**

## Skipped

| Path | Reason |
| --- | --- |
| `.../T/opencode/boss478-old-54fa6af/` | **Already absent** — verified not present before deletion; nothing to remove |
| `.../T/opencode/k6-tools-live-50vu.js`, `bind3300.mjs`, `t10-artifacts/`, `t16-smoke.cjs`, `t16-smoke.mjs` | Outside deletion list; rule: do NOT touch anything else under opencode temp dir |
| /tmp files not matching listed patterns | Out of scope per rules |

## Remaining /tmp State (after cleanup, matched patterns)

```
check*.cjs:                        no matches found
env-upgrade-*.png / t9b-avif*.png: no matches found
k6-*:                              no matches found
env-upgrade-lawlib.config.ts:      no such file
env-upgrade-prod-server.log:       no such file
```

## Notes

- No file was skipped due to "looks like user data" — all matched targets were clearly benchmark/scratch artifacts (logs, JSON summaries, screenshots, throwaway scripts).
- No repo files touched; no git operations performed.
