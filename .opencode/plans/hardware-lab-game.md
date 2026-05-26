---
version: v1.9.16 → v1.9.17
date: 2026-05-26
status: Draft
---

# Hardware Lab Game — 5-Mode Educational Hub

**Current version:** v1.9.16
**Target version:** v1.9.17
**Date:** 2026-05-26
**Status:** Draft

---

## 1. Overview

A standalone educational game hub at `/games/hardware-lab` with **5 learning modes** teaching computer hardware concepts. No MongoDB, no server — all client-side following Number Game architecture.

**Target:** G.4-12 students (Easy / Medium / Hard / General)

---

## 2. The 5 Modes

### Mode 1: Identify Hardware (Identification Game)
Core vocabulary + categorization game. 4 categories: Input, Output, Processing Unit, Memory Unit. Difficulty determines item pool size and number of stages.

| Stage | Activity | Easy | Med | Hard |
|-------|----------|:----:|:---:|:----:|
| 1 | **Identify It** — Icon → Name (4-choice MCQ) | ✅ | ✅ | ✅ |
| 2 | **Category Sort** — Part → 4 buckets | ✅ | ✅ | ✅ |
| 3 | **Function Match** — Description → Part | ❌ | ✅ | ✅ |
| 4 | **Where Does It Go?** — Inside/Outside PC | ❌ | ✅ | ✅ |
| 5 | **Rapid Fire** — Timed speed round | ❌ | ❌ | ✅ |
| — | **Endless Mode** — Random mixed | General only | | |

**Files:** `DifficultyScreen.tsx`, `GameScreen.tsx`, `VictoryScreen.tsx`

### Mode 2: How Computer Works (Blueprint Simulator)
Interactive computer blueprint — user sends data and watches it flow through the system. Built with Flaticon icons in a flex layout, connected by SVG lines.

**Flow:** Keyboard → Motherboard → RAM → CPU → RAM → Monitor

**Real Problem Scenarios:**
| Scenario | Trigger | Effect |
|----------|---------|--------|
| Memory Full | 8+ data packets | RAM turns red, packets queue |
| Storage Full | 5+ file saves | SSD fills, error icon |
| CPU Overheat | 100% usage 10s | Temp rises, fan speeds up |
| Data Bottleneck | Clicks too fast | Packets pile up, slow |
| Power Loss | Power button | All goes dark |

**Files:** `HowItWorksScreen.tsx`, `ComputerBlueprint.tsx`, `ComponentInfoPanel.tsx`, `ProblemScenario.tsx`

### Mode 3: PC Builder (Assembly Game)
Build a computer for a given purpose. Uses simplified SVG illustrations (not abstract shapes — recognizable depictions) of each component.

**Mechanic:**
- Goal: "Build a gaming PC (budget 30,000 THB)"
- Slots: CPU, Motherboard, RAM, Storage, GPU, PSU, Case
- Each slot: 2-4 options with price + specs
- End: compatibility score + budget check + performance rating

**Difficulty:**
- **Easy:** 3 slots (CPU, RAM, Storage), no budget, 2 options each
- **Medium:** 5 slots (+Motherboard, +GPU), budget constraint, 3 options each
- **Hard:** 7 slots (+PSU, +Case), tight budget, 4 options each, compatibility rules

**SVG Components:** `CPUSVG`, `MotherboardSVG`, `RAMStickSVG`, `GPUSVG`, `StorageSVG`, `PowerSupplySVG`, `CoolingFanSVG` — each 50-80 lines, combined in one file.

**Files:** `PCBuilderScreen.tsx`, `PCVisuals.tsx`, `PCBuilderConstants.ts`

### Mode 4: Troubleshoot IT (Diagnosis Game)
Problem scenarios covering hardware, software, and network issues. Student follows a diagnosis tree: read problem → pick cause → pick solution.

**Example Scenario:**
> "Computer won't turn on"
> 1. Cause: "Power cable unplugged" ✓ | "Screen broken" ✗ | "Need new keyboard" ✗
> 2. Solution: "Plug in power cable" ✓ | "Buy new monitor" ✗

**Difficulty:**
- **Easy:** 2-3 obvious causes, visual hints
- **Medium:** 4 choices, some trick options
- **Hard:** Multi-step diagnosis (cause → sub-cause → solution)

**~15 scenarios** across all difficulty levels. Flaticon icons for problem types (e.g., `fi-sr-heat` for overheating).

**Files:** `TroubleshootScreen.tsx`, `scenarios.ts`

### Mode 5: Hardware Match (Memory Card Game)
Classic flip-card memory game with hardware pairs. Grid of face-down cards, find matching pairs.

**Pair Types by Difficulty:**
- **Easy:** 6 pairs — Icon ↔ Name
- **Medium:** 8 pairs — Icon ↔ Category
- **Hard:** 10 pairs — Icon ↔ Function description

**Scoring:** Efficiency-based. Fewer flips per successful match = higher score. `calcStars()` at end (>=90%=3 stars, >=70%=2, else 1).

**Files:** `MatchGameScreen.tsx`

---

## 3. Architecture

### Screen State Machine

```typescript
"menu" | "playing" | "victory"
```

The orchestrator tracks `activeMode: GameMode`:
```typescript
type GameMode = "identify" | "computer-works" | "pc-builder" | "troubleshoot" | "hardware-match";
```

Each mode renders its own game screen via conditional rendering in `"playing"` state.

### Menu Screen
5 mode buttons in a responsive grid (1 col mobile / 2 cols md / 3 cols lg), each with:
- Flaticon icon for the mode
- Mode name (TH + EN)
- Short description
- Difficulty badges

---

## 4. File Structure

```
games/hardware-lab/
  page.tsx                          → Server component, metadata
  HardwareLabClient.tsx             → Orchestrator (screen + activeMode)
  types.ts                          → All shared types
  constants.ts                      → HARDWARE_ITEMS[], GAME_CONFIG, helpers
  screens/
    MenuScreen.tsx                  → 5 mode buttons
    IdentifyHardware/
      DifficultyScreen.tsx          → Easy/Med/Hard/General
      GameScreen.tsx                → Stages 1-5
      VictoryScreen.tsx             → Stars + stats
    HowComputerWorks/
      HowItWorksScreen.tsx          → Blueprint simulator
      ComputerBlueprint.tsx         → Blueprint layout
      ComponentInfoPanel.tsx        → Info on click
      ProblemScenario.tsx           → Problem overlays
    PCBuilder/
      PCBuilderScreen.tsx           → Build wizard
      PCVisuals.tsx                 → SVG illustrations (CPU, RAM, etc.)
      PCBuilderConstants.ts         → Component data + scenarios
    TroubleshootIt/
      TroubleshootScreen.tsx        → Diagnosis game
      scenarios.ts                  → All problem scenarios
    HardwareMatch/
      MatchGameScreen.tsx           → Memory card game
  components/
    HardwareVisual.tsx              → Flaticon icon + label
    FeedbackOverlay.tsx             → Correct/wrong overlay
```

**Total: ~20 files, ~2,000 lines**

---

## 5. Item Distribution (HARDWARE_ITEMS)

24 items across 4 categories:

| Category | Items | Easy | Medium | Hard |
|----------|-------|:----:|:------:|:----:|
| Input | Keyboard, Mouse, Microphone, Scanner, Webcam, Touchscreen, Joystick (7) | 3 | 6 | 7 |
| Output | Monitor, Printer, Speaker, Headphones, Projector (5) | 3 | 5 | 5 |
| Processing | CPU, Motherboard, GPU, Cooling Fan, Power Supply (5) | 2 | 3 | 5 |
| Memory | RAM, USB Flash, SSD, HDD, SD Card, CD/DVD (6) | 2 | 5 | 6 |
| **Total** | **23** | **~10** | **~19** | **~23** |

---

## 6. Flaticon Icon Mapping

| Component | Icon | Usage |
|-----------|------|-------|
| Keyboard | `fi-sr-keyboard` | Modes 1, 2, 5 |
| Mouse | `fi-sr-computer-mouse` | Modes 1, 2, 5 |
| Microphone | `fi-sr-microphone` | Modes 1, 5 |
| Scanner | `fi-sr-scanner-image` | Modes 1, 5 |
| Webcam | `fi-sr-camera` | Modes 1, 5 |
| Touchscreen | `fi-sr-frame` | Modes 1, 5 |
| Joystick | `fi-sr-joystick` | Modes 1, 5 |
| Monitor | `fi-sr-dashboard-monitor` | Modes 1, 2, 5 |
| Printer | `fi-sr-scanner-image` | Modes 1, 5 (icon limitation — label disambiguates) |
| Speaker | `fi-sr-computer-speaker` | Modes 1, 2, 5 |
| Headphones | `fi-sr-headphones` | Modes 1, 5 |
| Projector | `fi-sr-projector` | Modes 1, 5 |
| CPU | `fi-sr-microchip` | Modes 1, 2, 5 |
| Motherboard | `fi-sr-diagram-cells` | Modes 1, 5 |
| GPU | `fi-sr-graphic-style` | Modes 1, 5 |
| Cooling Fan | `fi-sr-fan` | Modes 1, 5 |
| Power Supply | `fi-sr-plug` | Modes 1, 5 |
| RAM | `fi-sr-ram` | Modes 1, 2, 5 |
| USB Flash | `fi-sr-container-storage` | Modes 1, 5 |
| SSD | `fi-sr-hdd` | Modes 1, 5 |
| HDD | `fi-sr-external-hard-drive` | Modes 1, 5 |
| SD Card | `fi-sr-database` | Modes 1, 5 |
| CD/DVD | `fi-sr-disc-drive` | Modes 1, 5 |

**PC Builder** uses SVG illustrations (not Flaticon) — detailed in PCVisuals.tsx.

---

## 7. Conventions

- **Glassmorphism:** `bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border shadow-sm`
- **Game BG:** `bg-fuchsia-50 dark:bg-zinc-950`
- **No gradients** — solid colors only
- **Class-based dark mode** via ThemeProvider
- **Keyboard shortcuts:** 1-4 for choices (dynamic by option count), Escape for back
- **Header/footer hide:** `document.getElementById("site-header")` classList toggle
- **Fullscreen:** `containerRef.requestFullscreen()`
- **High scores:** localStorage per mode+difficulty, saved on victory
- **Theme accent:** Fuchsia for interactive elements

---

## 8. Impact Analysis

| Dimension | Before | After | Delta |
|-----------|--------|-------|-------|
| Bundle size | ~450KB JS | ~+55KB JS | ~12% (mostly constants + SVG strings) |
| Page load | ~1.2s | ~+0ms | No change |
| DB queries | 0 | 0 | No DB |
| Files | ~200 | ~+20 | +10% |
| Lines | ~15,000 | ~+2,000 | ~13% |

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mode 2 blueprint animation janky | Med | Med | CSS transitions + GPU compositing |
| PC Builder SVGs too verbose | Med | Low | 7 components × ~70 lines = ~500 lines total, acceptable |
| Troubleshoot IT scenarios too many | Low | Low | 15 scenarios × ~10 lines = ~150 lines |
| All 5 modes cause menu bloat | Low | Low | Responsive grid (1/2/3 cols), each mode is just a card with icon |
| Implementation time too long | High | High | Implement in order: Mode 1 → Mode 5 → Mode 4 → Mode 2 → Mode 3 |

---

## 10. Implementation Order (Priority)

| Phase | Modes | Files | Lines | Risk |
|-------|-------|-------|-------|------|
| 1 | Types + Constants + Shared | 4 | ~300 | Low — data only |
| 2 | Mode 1: Identify Hardware | 4 | ~400 | Low — Number Game pattern |
| 3 | Mode 5: Hardware Match | 1 | ~200 | Low — simple game mechanic |
| 4 | Mode 4: Troubleshoot IT | 2 | ~300 | Low — MCQ pattern |
| 5 | Mode 2: How Computer Works | 4 | ~500 | Med — animation complexity |
| 6 | Mode 3: PC Builder | 3 | ~300 | Med — SVG illustrations |

---

## 11. Inventory

### Files to Create (20)

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | `page.tsx` | 10 | Server component, metadata |
| 2 | `HardwareLabClient.tsx` | 120 | Orchestrator (screen + activeMode) |
| 3 | `types.ts` | 80 | All interfaces |
| 4 | `constants.ts` | 150 | HARDWARE_ITEMS + GAME_CONFIG + helpers |
| 5 | `screens/MenuScreen.tsx` | 80 | 5 mode cards |
| 6 | `screens/IdentifyHardware/DifficultyScreen.tsx` | 50 | Difficulty picker |
| 7 | `screens/IdentifyHardware/GameScreen.tsx` | 250 | Stages 1-5 |
| 8 | `screens/IdentifyHardware/VictoryScreen.tsx` | 80 | Results |
| 9 | `screens/HowComputerWorks/HowItWorksScreen.tsx` | 150 | Simulator state machine |
| 10 | `screens/HowComputerWorks/ComputerBlueprint.tsx` | 200 | Blueprint layout |
| 11 | `screens/HowComputerWorks/ComponentInfoPanel.tsx` | 60 | Info slide-up |
| 12 | `screens/HowComputerWorks/ProblemScenario.tsx` | 80 | Problem overlay |
| 13 | `screens/PCBuilder/PCBuilderScreen.tsx` | 150 | Build wizard |
| 14 | `screens/PCBuilder/PCVisuals.tsx` | 500 | 7 SVG components |
| 15 | `screens/PCBuilder/PCBuilderConstants.ts` | 100 | Component data |
| 16 | `screens/TroubleshootIt/TroubleshootScreen.tsx` | 150 | Diagnosis game |
| 17 | `screens/TroubleshootIt/scenarios.ts` | 150 | 15 scenarios |
| 18 | `screens/HardwareMatch/MatchGameScreen.tsx` | 200 | Memory card game |
| 19 | `components/HardwareVisual.tsx` | 30 | Icon component |
| 20 | `components/FeedbackOverlay.tsx` | 40 | Feedback overlay |

### New Types
```typescript
type Screen = "menu" | "playing" | "victory";
type GameMode = "identify" | "computer-works" | "pc-builder" | "troubleshoot" | "hardware-match";
type Difficulty = "easy" | "medium" | "hard" | "general";
type Category = "input" | "output" | "processing" | "memory";
type StageType = 1 | 2 | 3 | 4 | 5;

interface HardwareItem { id, nameTh, nameEn, category, icon, difficulty, descriptionEasy, descriptionMed, descriptionHard, isInternal }
interface Question { stageType, icon?, text, correct, options }
interface GameState { difficulty, stage, score, questionsDone, stageCorrect, stageTotal, totalCorrect, totalQuestions, bestStreak, currentStreak, stageDone, stageStars }
interface SimulationState { status, dataQueue, ramUsed, cpuUsed, cpuTemp, storageUsed, filesSaved, activePath, activeScenario, fanSpeed, difficulty }

// Mode 3
interface ComponentOption { id, nameTh, nameEn, price, category, powerWatt, compatibleWith, description }
interface BuildScenario { titleTh, titleEn, purpose, budget, requiredSlots }

// Mode 4
interface TroubleCause { textTh, textEn, isCorrect, solutionTh, solutionEn }
interface TroubleScenario { id, titleTh, titleEn, problemTh, problemEn, icon, causes: TroubleCause[] }

// Mode 5
interface MatchCard { id, icon, label, type: "icon" | "label", pairId }
```

### New Constants
- `HARDWARE_ITEMS` (23 items, 4 categories)
- `GAME_CONFIG` (stage configs, scoring)
- `STAGES_BY_DIFFICULTY` (stage progression per difficulty)
- `BUILD_SCENARIOS` (3 scenarios per difficulty)
- `COMPONENT_OPTIONS` (per-slot component data with prices)
- `TROUBLE_SCENARIOS` (15 diagnosis scenarios)
- `MATCH_PAIRS` (card pair data, up to 10 pairs)
- `DATA_FLOW_PATHS` (Mode 2 flow segments)
- `PROBLEM_SCENARIOS` (Mode 2 real problems)
- `HIGH_SCORE_KEY_PREFIX` = "hardware-lab-"

---

## 12. Verification Checklist

- [ ] `npm run build` passes (no errors, no warnings)
- [ ] Mode 1: All 5 stages work at correct difficulty (Easy=2, Med=4, Hard=5)
- [ ] Mode 2: Input → data flow animation → output
- [ ] Mode 2: Problem scenarios trigger and resolve
- [ ] Mode 3: Build wizard completes successfully at all difficulties
- [ ] Mode 3: SVG illustrations render and look recognizable
- [ ] Mode 4: Problem → Cause → Solution flow works
- [ ] Mode 4: All 15 scenarios available
- [ ] Mode 5: Memory card game — flip → match → score
- [ ] Mode 5: Stars awarded based on flip efficiency
- [ ] Header/footer hide during gameplay
- [ ] Fullscreen toggle works
- [ ] Keyboard shortcuts 1-4/Esc work
- [ ] localStorage high scores per mode+difficulty
- [ ] No lint errors
- [ ] No console errors
- [ ] Version bumped to v1.9.17
- [ ] Changelog updated
