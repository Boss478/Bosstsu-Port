# Rule: Code Style

Source: @ AGENTS.md Code Style & UI

## Code Style & UI

ES modules, Tailwind 4 `@theme` (no config), server components where possible, `sharp` in `serverExternalPackages` (no edge for DB).
Prefer boring, conventional code over cleverness — fewer lines.
Modal overlays: darken only `bg-black/10`, no `backdrop-blur` on overlay (panel glass may keep blur).
Bilingual TH/EN — one language per commit subject, copywriter + locale-reviewer for TH/EN content.
Thai descenders handled in Gotchas — avoid `bg-clip-text`/`leading-tight` at 2xl+, use `leading-relaxed`.
Match surrounding style; no unsolicited refactoring outside scope; touch only what asked.
