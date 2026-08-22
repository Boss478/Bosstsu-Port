# Rules — .agents/rules/ Index
> Load rule before acting in domain. AGENTS.md stays thin; rules load on demand.

| Rule | When to load | Purpose |
|------|--------------|---------|
| [.agents/rules/commit-convention.md](commit-convention.md) | commits | Grammar v3.1, types, refs |
| [.agents/rules/workflow.md](workflow.md) | >1 file / >30min | SPECIFY→PLAN→TASKS→IMPLEMENT, Explore→Plan→Build→Verify |
| [.agents/rules/verification.md](verification.md) | every feature | build+typecheck+lint+eval pass^3, no ship without evidence |
| [.agents/rules/database.md](database.md) | DB work | ask first, no deleteMany, pool 3, bufferCommands: false |
| [.agents/rules/security.md](security.md) | auth / inputs | rate limit 5/15min, validation, no secrets |
| [.agents/rules/code-style.md](code-style.md) | coding / UI | ES modules, Tailwind @theme, boring code, no backdrop-blur |
| [.agents/rules/gotchas.md](gotchas.md) | pitfalls | Thai descenders, hydration localStorage, aspect-video, Node 24 |
| [.agents/rules/file-conventions.md](file-conventions.md) | file layout | .agents/** caps, @ alias, artifact limits |
| [.agents/rules/session-capture.md](session-capture.md) | session end | /capture → memory + vault + report |
| [.agents/rules/testing.md](testing.md) | tests / eval | eval harness, pass^3, regression |
| [.agents/rules/i18n.md](i18n.md) | TH/EN copy | one language per commit, copywriter+reviewer |
| [.agents/rules/deployment.md](deployment.md) | deploy / infra | NO VPS now, VisperHost planned, Hostinger expired |
| [.agents/rules/glassmorphism.md](glassmorphism.md) | glass UI | glass tokens, blur, a11y, perf guards |
| [.agents/rules/lawlib-authoring.md](lawlib-authoring.md) | law content | LawLib schema, authoring workflow |
| [.agents/rules/errors.md](errors.md) | error handling | taxonomy, user messages, logging |
| [.agents/rules/performance.md](performance.md) | perf tuning | pool 3, concurrency 50-100, sharp, Turbopack |
| [.agents/rules/project-structure.md](project-structure.md) | repo layout | Next.js 16 App Router, (website)/admin/api paths |

> Tip: read AGENTS.md first, then load only needed rule(s) on demand.

All rules live under .agents/rules/ — 17 files total.
