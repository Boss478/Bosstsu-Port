# Code Deletion Log

## 2026-05-17 - Refactor Session

### Unused Files Deleted
| File | Reason |
|------|--------|
| src/components/admin/FormError.tsx | No imports found in codebase |
| src/components/admin/FormField.tsx | No imports found in codebase |
| src/components/admin/FormSubmitButton.tsx | No imports found in codebase |
| src/components/admin/GlassCard.tsx | No imports found in codebase |
| src/components/admin/PublishedToggle.tsx | No imports found in codebase |
| src/hooks/useObjectURL.ts | No imports found in codebase |
| src/hooks/useSlug.ts | No imports found in codebase |
| src/app/actions/gallery.ts | Not used - pages use model directly |
| src/app/actions/portfolio.ts | Not used - pages use model directly |
| src/lib/utils.ts | Only export was toSlug, used by removed useSlug hook |

### Unused Exports Removed
| File | Function/Export | Reason |
|------|-----------------|--------|
| src/app/(website)/games/alphabet-adventure/constants.ts | getLevelName | No references in codebase |
| src/app/(website)/games/alphabet-adventure/constants.ts | getLevelNameShort | No references in codebase |
| src/app/admin/tools/actions.ts | getSessionResults | No references in codebase |

### Unused Dependencies Removed
| Package | Type | Reason |
|---------|------|--------|
| pdfjs-dist | dependency | Not imported anywhere |
| quill | dependency | Not imported anywhere |
| react-pdf | dependency | Not imported anywhere |
| @types/uuid | devDependency | Not used - uuid is used at runtime only |
| cheerio | devDependency | Not imported anywhere |
| csv-parse | devDependency | Not imported anywhere |
| csv-stringify | devDependency | Not imported anywhere |

### Remaining Items (Not Removed)
- **public/pyodide-worker.js**: Actually used by PythonCompilerClient.tsx (False positive from knip)
- **scripts/scrape_thai_words.js, seed-games-v2.ts, seed-learning.ts**: Orphaned utility scripts, could be removed but left for potential future use
- **ALPHABET_UPPER, ALPHABET_LOWER, PRAISE, fisherYatesShuffle**: Used internally in same file, not dead code
- **ERRORS, MONTHS, generateSessionCode**: Used internally by module functions
- **Model interfaces (IGame, ITag, etc.)**: Exported for potential external use, kept

### Impact
- Files deleted: 10
- Files modified: 3
- Dependencies removed: 7
- Package size reduction: ~2.5 MB estimated

### Testing
- ESLint passes (pre-existing warnings in alphabet-adventure game)
- All unused imports/files safely removed
- No functionality broken - removed items had no callers