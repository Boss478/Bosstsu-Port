# Rule: Database

Source: @ AGENTS.md Database Rules (IMPORTANT — ask first, else data loss)

## Database Rules (IMPORTANT — ask first, else data loss)

> Violating these causes permanent data loss.

1. **ADD/EDIT/REMOVE: ASK USER FIRST** — exact collections, data, impact
2. **Never deleteMany/findByIdAndDelete** without explicit confirmation
3. **Seeds: never use deleteMany without approval**
4. **Previous incident:** seed wipe of gallery data — MUST NEVER repeat
5. Resource: pool 3, batch/prefetch within 50-100 — do not raise pool.
