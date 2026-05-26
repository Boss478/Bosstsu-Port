# Educational Games Listing Plan

**Version:** v1.9.16
**Date:** 2026-05-26

---

## Overview

Four standalone educational games — one per subject/grade combination. Each game follows the established pattern (like Number Game): a dedicated route under `/games/*` with multiple stages in different formats inside a single experience.

---

## 1. English Explorer — G.1

**Route:** `/games/english-explorer`
**Theme:** Cute animal jungle adventure

| Stage            | Format         | What they do                                               |
|------------------|----------------|------------------------------------------------------------|
| Picture Match    | Image → Word   | See image, pick correct English word (4 options)           |
| Listen & Choose  | Audio → Image  | Hear word via Web Speech API, pick matching picture        |
| Fill the Letter  | Missing letter | See word with 1 letter missing, type/choose correct letter |
| Sort the Words   | Categorization | Sort words into categories (animals vs. fruits)            |
| Sentence Builder | Word order     | Arrange 2–3 words into simple sentence                     |
| Endless Mode     | Mixed          | Random questions from all stages                           |

**Topics:** Colors, Numbers 1–10, Animals, Fruits, Body Parts, School Objects, Family, Greetings, Phonics A–E

**Complexity:** ~800 lines, 8 files (similar to Number Game)
**Key reuse:** `useAudio` hook for speech synthesis

---

## 2. Code Quest — Computer Science G.4–6

**Route:** `/games/code-quest`
**Theme:** Pixel/retro computer + robot sidekick

| Stage            | Format        | What they do                                                  |
|------------------|---------------|---------------------------------------------------------------|
| Arrange It       | Sequencing    | Drag steps into correct order                                 |
| Hardware Lab     | Image → Name  | See computer part image, pick its name                        |
| Input or Output? | Sorting       | Sort devices into Input / Output / Storage                    |
| Code Detective   | Debugging     | Find and fix errors in a 3–4 step sequence                    |
| Safe or Unsafe?  | Scenario Quiz | Read online scenario, choose safe or unsafe action            |
| Endless Mode     | Mixed         | Random from all modules                                       |

**Module breakdown:**
- Algorithm & Coding: Sequencing, loops, conditionals, debugging, pseudo-code
- Computer Parts: Hardware ID, input vs. output, storage, internal components
- Software: OS vs. apps, file extension matching
- Digital Literacy: Online safety, password strength, information literacy

**Complexity:** ~1,200 lines, 8+ files
**New need:** Drag-and-drop for sequencing/sorting (native HTML5 drag API or click-to-select)

---

## 3. Social World — Social Studies G.2–3

**Route:** `/games/social-world`
**Theme:** Globe / compass / world explorer

| Stage             | Format            | What they do                                                    |
|-------------------|-------------------|-----------------------------------------------------------------|
| Who Am I?         | Riddle→Occupation | Read riddle about a job, pick the correct occupation            |
| Map Explorer      | Region matching   | Match Thai provinces/regions to map location                    |
| Festival Match    | Image+Description | Match Thai festivals to their traditions                        |
| Rights & Duties   | Sorting           | Sort actions into Rights / Responsibilities                     |
| Needs vs. Wants   | Categorization    | Sort items into Needs or Wants                                  |
| Endless Mode      | Mixed             | Random questions                                                |

**Topics:** Occupations, community helpers, Thai geography (regions), festivals, rights & responsibilities, needs vs. wants

**Complexity:** ~1,000 lines, 8 files
**New need:** Simplified SVG map of Thailand's regions (static inline component)

---

## 4. Time Travelers — History G.1

**Route:** `/games/time-travelers`
**Theme:** Time machine / adventure through periods

| Stage          | Format     | What they do                                                  |
|----------------|------------|---------------------------------------------------------------|
| Day & Night    | Sorting    | Sort activities into morning / afternoon / evening            |
| Holiday Match  | Matching   | Match national holidays to dates or descriptions              |
| Family Tree    | Fill-in    | Complete simple family relationships                          |
| Period Puzzle  | Timeline   | Arrange Sukhothai → Ayutthaya → Rattanakosin in order         |
| Symbol Match   | Image Quiz | Match national symbols (flag, elephant) to their meaning      |
| Endless Mode   | Mixed      | Random questions                                              |

**Topics:** Time concepts, days/months, family history, national holidays, Thai historical periods, important kings, national symbols

**Complexity:** ~900 lines, 8 files
**New need:** Horizontal timeline visual (pure CSS)

---

## Summary

| Game             | Route                     | Grade | Stages      | Est. Lines |
|------------------|---------------------------|-------|-------------|------------|
| English Explorer | `/games/english-explorer` | G.1   | 5 + endless | ~800       |
| Code Quest       | `/games/code-quest`       | G.4–6 | 5 + endless | ~1,200     |
| Social World     | `/games/social-world`     | G.2–3 | 5 + endless | ~1,000     |
| Time Travelers   | `/games/time-travelers`   | G.1   | 5 + endless | ~900       |

**Total:** ~3,900 lines across ~32 files

### Shared Architecture (Reused)

- Screen-based state machine: `"menu" | "game" | "victory"`
- `useAudio` hook (sounds + speech synthesis)
- Fullscreen management + header/footer hide
- Keyboard shortcuts (1-4, Enter, Esc)
- localStorage high scores
- Fisher-Yates shuffle
- Glassmorphism styling
- Topic/set selector (like Number Game's range picker)

### New Needs

1. **Drag-and-drop** for sequencing/sorting (native HTML5 API)
2. **SVG map** of Thailand regions (static inline component)
3. **Horizontal timeline** UI (pure CSS)
4. **Topic selector screen** for broad-curriculum games

---

## Implementation Order (Recommended)

1. **English Explorer** — closest to existing patterns, establishes reusable topic selector + drag-drop
2. **Code Quest** — most complex, benefits from drag-drop foundation first
3. **Social World** — medium complexity with map SVG
4. **Time Travelers** — medium complexity with timeline UI

---

*Created on 2026-05-26. Plan mode — no implementation started.*
