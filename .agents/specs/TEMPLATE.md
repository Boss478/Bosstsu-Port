# Spec: [Feature Name]
> Status: DRAFT | APPROVED | IMPLEMENTING | DONE
> Gated: SPECIFY → PLAN → TASKS → IMPLEMENT
<!-- For ambiguous/>30min features, interview human via AskUserQuestion (tech/UI/UX/edges/tradeoffs) until ASSUMPTIONS concrete — block PLAN until corrected. Explore via subagents (explore/researcher/docs-lookup) to keep main context clean. -->

## ASSUMPTIONS I'M MAKING:
1. [Scope — e.g., all categories at once vs incremental]
2. [Data source — e.g., MongoDB pool 3, bufferCommands false]
→ Correct me now or I proceed with these.

## 1. Objective
**What:** [One sentence — what to build]
**Why:** [Problem/value if not built]
**Who:** [Users/agents affected]
**Success:** [What "done" looks like]

## 2. Tech Stack
- [Framework + versions — e.g., Next.js 16, Node 24, Mongoose pool 3]

## 3. Commands
```
npm run build && npm run lint && npm run typecheck
```

## 4. Project Structure
```
.agents/specs/[feature].md → this spec
src/[feature]/ → implementation
```

## 5. Code Style
```typescript
// one real snippet beats three paragraphs
export const example = { id: "demo", enabled: true };
```

## 6. Testing Strategy
| Level | What | Expect |
|-------|------|--------|
| unit | `npm test` / harness | pass |

## 7. Boundaries
- **Always:** [validate, keep build green, update spec before code]
- **Ask first:** [DB mutations, new deps, scope changes]
- **Never:** [secrets, deleteMany without approval, shell heredoc]

## 8. Success Criteria
<!-- verifiable: must be test/build/eval/screenshot + expected signal, e.g. `npm run eval -- <feature> green`, `LCP <2.5s` — not vague faster/better -->
- [ ] [Testable criterion 1]
- [ ] [Testable criterion 2]
> Verify: `npm run build` or harness still green? Show output.

## 9. Open Questions
- [ ] [Unresolved — resolve before PLAN]

## 10. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| [Stale spec] | [Update spec before code] |
