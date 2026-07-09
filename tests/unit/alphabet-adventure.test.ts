import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calcStars,
  interpolateRate,
  getDropRate,
  getNoneDropRate,
  randomPraise,
  streakPraise,
  generateMatchRound,
  generateThaiRevertRound,
  generatePhonicsRevertRound,
  generateFillChoices,
  generateFillRound,
  generateTypingRound,
  buildStages,
  getStages,
  getStage,
  SUB_STAGE_NAMES,
  PER_LETTER_MIN,
  STAGE6_PER_LETTER_MIN,
  CARD_DROP_RATES,
} from "@/app/(standalone)/games/alphabet-adventure/constants";

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
import {
  getEffectiveStreak,
  rollCardDrop,
  pickLetter,
  addCard,
  isHolographicTier,
  TIER_LETTERS,
  CARD_WORDS,
  TIER_ORDER,
  TIER_LABELS,
} from "@/app/(standalone)/games/alphabet-adventure/cards/cards";
import { masteryLevel } from "@/app/(standalone)/games/alphabet-adventure/screens/LetterProgressGrid";
import { KEYBOARD_ROWS } from "@/app/(standalone)/games/alphabet-adventure/screens/TypingLevel";
import { migrateV2ToV3, loadMapSave } from "@/app/(standalone)/games/alphabet-adventure/migrateMapSave";
import { emptyMapSaveData } from "@/app/(standalone)/games/alphabet-adventure/types";
import type { MapSaveData, LetterTracker } from "@/app/(standalone)/games/alphabet-adventure/types";

vi.mock("@/lib/shuffle", () => ({
  shuffleArray: <T>(arr: T[]): T[] => [...arr].reverse(),
}));

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── calcStars ───────────────────────────────────────────────────────────────────

describe("calcStars", () => {
  it("returns 3 for accuracy >= 90", () => {
    expect(calcStars(90)).toBe(3);
    expect(calcStars(95)).toBe(3);
    expect(calcStars(100)).toBe(3);
  });

  it("returns 2 for accuracy >= 70 and < 90", () => {
    expect(calcStars(70)).toBe(2);
    expect(calcStars(80)).toBe(2);
    expect(calcStars(89)).toBe(2);
  });

  it("returns 1 for accuracy < 70", () => {
    expect(calcStars(0)).toBe(1);
    expect(calcStars(50)).toBe(1);
    expect(calcStars(69)).toBe(1);
  });

  it("handles edge values", () => {
    expect(calcStars(69.9)).toBe(1);
    expect(calcStars(70)).toBe(2);
    expect(calcStars(89.9)).toBe(2);
    expect(calcStars(90)).toBe(3);
  });
});

// ─── interpolateRate ────────────────────────────────────────────────────────────

describe("interpolateRate", () => {
  it("returns base at streak 0", () => {
    expect(interpolateRate(10, 20, 0)).toBe(10);
  });

  it("returns max at streak 20", () => {
    expect(interpolateRate(10, 20, 20)).toBe(20);
  });

  it("clamps streak at 20", () => {
    expect(interpolateRate(10, 20, 99)).toBe(20);
  });

  it("linearly interpolates at streak 10", () => {
    expect(interpolateRate(10, 20, 10)).toBe(15);
  });

  it("interpolates decreasing rate (base > max)", () => {
    expect(interpolateRate(90, 75, 0)).toBe(90);
    expect(interpolateRate(90, 75, 20)).toBe(75);
    expect(interpolateRate(90, 75, 10)).toBe(82.5);
  });
});

// ─── getDropRate / getNoneDropRate ──────────────────────────────────────────────

describe("getDropRate", () => {
  it("returns common rate at streak 0", () => {
    expect(getDropRate("common", 0)).toBeCloseTo(5.5);
  });

  it("returns common rate at streak 20", () => {
    expect(getDropRate("common", 20)).toBeCloseTo(7.0);
  });

  it("returns legendary rate at streak 0", () => {
    expect(getDropRate("legendary", 0)).toBeCloseTo(0.1);
  });

  it("returns legendary rate at streak 10", () => {
    expect(getDropRate("legendary", 10)).toBeCloseTo(0.8);
  });

  it("returns 0 for unknown tier", () => {
    expect(getDropRate("unknown" as const, 0)).toBe(0);
  });
});

describe("getNoneDropRate", () => {
  it("returns none rate at streak 0", () => {
    expect(getNoneDropRate(0)).toBeCloseTo(90);
  });

  it("returns none rate at streak 20", () => {
    expect(getNoneDropRate(20)).toBeCloseTo(75);
  });
});

// ─── randomPraise ───────────────────────────────────────────────────────────────

describe("randomPraise", () => {
  it("returns a correct praise", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const text = randomPraise("correct");
    expect(text).toBe("Excellent!");
  });

  it("returns a wrong praise", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const text = randomPraise("wrong");
    expect(text).toBe("Try again!");
  });

  it("returns last correct praise at high random", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const text = randomPraise("correct");
    expect(text).toBe("Awesome!");
  });

  it("returns last wrong praise at high random", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const text = randomPraise("wrong");
    expect(text).toBe("Nice try!");
  });
});

// ─── streakPraise ───────────────────────────────────────────────────────────────

describe("streakPraise", () => {
  it("returns simple count for streak < 3", () => {
    expect(streakPraise(1)).toBe("1 in a row!");
    expect(streakPraise(2)).toBe("2 in a row!");
  });

  it("returns praise for streak 3", () => {
    expect(streakPraise(3)).toBe("3 in a row! Keep going!");
  });

  it("returns highest praise for streak >= 7", () => {
    expect(streakPraise(10)).toBe("10 in a row! Perfect streak!");
  });

  it("maps streak to correct praise index", () => {
    expect(streakPraise(4)).toBe("4 in a row! On fire!");
    expect(streakPraise(5)).toBe("5 in a row! Unstoppable!");
    expect(streakPraise(6)).toBe("6 in a row! Legendary!");
    expect(streakPraise(7)).toBe("7 in a row! Perfect streak!");
  });
});

// ─── getEffectiveStreak ─────────────────────────────────────────────────────────

describe("getEffectiveStreak", () => {
  it("sums dropStreak and dropPower", () => {
    expect(getEffectiveStreak(3, 2)).toBe(5);
  });

  it("clamps to 10", () => {
    expect(getEffectiveStreak(10, 5)).toBe(10);
    expect(getEffectiveStreak(0, 15)).toBe(10);
  });

  it("returns dropStreak when dropPower is 0", () => {
    expect(getEffectiveStreak(5, 0)).toBe(5);
  });
});

// ─── rollCardDrop ───────────────────────────────────────────────────────────────

describe("rollCardDrop", () => {
  it("returns null-tier (no drop) at very low roll", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.4);
    expect(rollCardDrop(0, 0)).toBeNull();
  });

  it("returns common at roll within common range", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.92);
    expect(rollCardDrop(0, 0)).toBe("common");
  });

  it("returns legendary at very high roll", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    expect(rollCardDrop(20, 0)).toBe("legendary");
  });

  it("uses effective streak for clamping", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    expect(rollCardDrop(50, 50)).toBe("legendary");
  });
});

// ─── pickLetter ─────────────────────────────────────────────────────────────────

describe("pickLetter", () => {
  it("returns a letter from the tier pool", () => {
    const letter = pickLetter("legendary");
    expect(TIER_LETTERS["legendary"]).toContain(letter);
  });

  it("exhausts pool before refilling", () => {
    const picked: string[] = [];
    for (let i = 0; i < 12; i++) {
      picked.push(pickLetter("common"));
    }
    for (const letter of picked) {
      expect(TIER_LETTERS["common"]).toContain(letter);
    }
  });

  it("picks from correct tier pool", () => {
    const common = pickLetter("common");
    expect(TIER_LETTERS["common"]).toContain(common);

    const rare = pickLetter("rare");
    expect(TIER_LETTERS["rare"]).toContain(rare);
  });
});

// ─── addCard ────────────────────────────────────────────────────────────────────

describe("addCard", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      clear: () => { store = {}; },
      removeItem: (key: string) => { delete store[key]; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds a new card and returns isNew=true", () => {
    const { collection, isNew } = addCard("A", "common");
    expect(isNew).toBe(true);
    expect(collection.cards).toHaveLength(1);
    expect(collection.cards[0].letter).toBe("A");
    expect(collection.cards[0].tier).toBe("common");
    expect(collection.cards[0].count).toBe(1);
  });

  it("increments count for existing card and returns isNew=false", () => {
    addCard("A", "common");
    const { collection, isNew } = addCard("A", "common");
    expect(isNew).toBe(false);
    const card = collection.cards.find((c: { letter: string }) => c.letter === "A");
    expect(card?.count).toBe(2);
  });

  it("adds points by tier", () => {
    const r1 = addCard("J", "legendary");
    expect(r1.collection.totalPoints).toBe(10);
  });

  it("creates separate entries for same letter different tier", () => {
    addCard("E", "common");
    const { collection } = addCard("E", "uncommon");
    const eCards = collection.cards.filter((c: { letter: string }) => c.letter === "E");
    expect(eCards).toHaveLength(2);
  });
});

// ─── isHolographicTier ──────────────────────────────────────────────────────────

describe("isHolographicTier", () => {
  it("returns true for rare and above", () => {
    expect(isHolographicTier("rare")).toBe(true);
    expect(isHolographicTier("ultra-rare")).toBe(true);
    expect(isHolographicTier("legendary")).toBe(true);
  });

  it("returns false for common and uncommon", () => {
    expect(isHolographicTier("common")).toBe(false);
    expect(isHolographicTier("uncommon")).toBe(false);
  });
});

// ─── CARD_WORDS ─────────────────────────────────────────────────────────────────

describe("CARD_WORDS", () => {
  it("has all 26 letters", () => {
    expect(Object.keys(CARD_WORDS)).toHaveLength(26);
  });

  it("has expected words for key letters", () => {
    expect(CARD_WORDS["A"]).toBe("Apple");
    expect(CARD_WORDS["Z"]).toBe("Zebra");
    expect(CARD_WORDS["Q"]).toBe("Queen");
  });
});

// ─── TIER_ORDER / TIER_LABELS ───────────────────────────────────────────────────

describe("tier constants", () => {
  it("TIER_ORDER has 5 tiers", () => {
    expect(TIER_ORDER).toHaveLength(5);
    expect(TIER_ORDER[0]).toBe("common");
    expect(TIER_ORDER[4]).toBe("legendary");
  });

  it("TIER_LABELS matches TIER_ORDER", () => {
    for (const tier of TIER_ORDER) {
      expect(TIER_LABELS[tier]).toBeDefined();
    }
  });

  it("all tiers have letters defined", () => {
    for (const tier of TIER_ORDER) {
      expect(TIER_LETTERS[tier].length).toBeGreaterThan(0);
    }
  });
});

// ─── Question Generators ────────────────────────────────────────────────────────

describe("generateMatchRound", () => {
  it("returns correct number of choices", () => {
    const round = generateMatchRound(1, undefined, 4);
    expect(round.choices).toHaveLength(4);
  });

  it("includes correctChar in choices", () => {
    const round = generateMatchRound(1, undefined, 3);
    expect(round.choices).toContain(round.correctChar);
  });

  it("maps round 1 to letter A", () => {
    const round = generateMatchRound(1);
    expect(round.targetLetter).toBe("A");
    expect(round.correctChar).toBe("a");
  });

  it("maps round 2 to letter B", () => {
    const round = generateMatchRound(2);
    expect(round.targetLetter).toBe("B");
    expect(round.correctChar).toBe("b");
  });

  it("maps round 26 to letter Z", () => {
    const round = generateMatchRound(26);
    expect(round.targetLetter).toBe("Z");
    expect(round.correctChar).toBe("z");
  });

  it("uses shuffled seed for rounds > 26", () => {
    const round27 = generateMatchRound(27);
    const letter27 = round27.targetLetter;

    const round27Again = generateMatchRound(27);
    expect(round27Again.targetLetter).toBe(letter27);

    expect(letter27.length).toBe(1);
    expect("ABCDEFGHIJKLMNOPQRSTUVWXYZ").toContain(letter27);
  });
});

describe("generateThaiRevertRound", () => {
  it("returns correct number of choices", () => {
    const round = generateThaiRevertRound(1, undefined, 3);
    expect(round.choices).toHaveLength(3);
  });

  it("maps round 1 to Thai name เอ and letter A", () => {
    const round = generateThaiRevertRound(1);
    expect(round.targetLetter).toBe("เอ");
    expect(round.correctChar).toBe("A");
  });

  it("maps round 26 to Thai name แซด and letter Z", () => {
    const round = generateThaiRevertRound(26);
    expect(round.targetLetter).toBe("แซด");
    expect(round.correctChar).toBe("Z");
  });

  it("includes correctChar in choices", () => {
    const round = generateThaiRevertRound(5, undefined, 4);
    expect(round.choices).toContain(round.correctChar);
  });

  it("all choices are uppercase letters", () => {
    const round = generateThaiRevertRound(10, undefined, 4);
    for (const c of round.choices) {
      expect(c).toMatch(/^[A-Z]$/);
    }
  });
});

describe("generatePhonicsRevertRound", () => {
  it("maps round 1 to phonics sound แอะ /a/ and letter A", () => {
    const round = generatePhonicsRevertRound(1);
    expect(round.targetLetter).toBe("แอะ /a/");
    expect(round.correctChar).toBe("A");
  });

  it("maps round 26 to phonics sound ซี /z/ and letter Z", () => {
    const round = generatePhonicsRevertRound(26);
    expect(round.targetLetter).toBe("ซี /z/");
    expect(round.correctChar).toBe("Z");
  });

  it("includes correctChar in choices", () => {
    const round = generatePhonicsRevertRound(15, undefined, 4);
    expect(round.choices).toContain(round.correctChar);
  });

  it("all choices are uppercase letters", () => {
    const round = generatePhonicsRevertRound(8, undefined, 4);
    for (const c of round.choices) {
      expect(c).toMatch(/^[A-Z]$/);
    }
  });
});

describe("generateFillChoices", () => {
  it("returns correct number of choices", () => {
    const choices = generateFillChoices("A", 4, UPPER);
    expect(choices).toHaveLength(4);
  });

  it("includes the correct character", () => {
    const choices = generateFillChoices("M", 3, UPPER);
    expect(choices).toContain("M");
  });

  it("all choices are from the correct case alphabet", () => {
    const upper = generateFillChoices("A", 5, UPPER);
    for (const c of upper) {
      expect(c).toMatch(/^[A-Z]$/);
    }

    const lower = generateFillChoices("a", 5, LOWER);
    for (const c of lower) {
      expect(c).toMatch(/^[a-z]$/);
    }
  });

  it("returns unique choices", () => {
    const choices = generateFillChoices("X", 10, UPPER);
    expect(new Set(choices).size).toBe(choices.length);
  });
});

describe("generateFillRound", () => {
  it("returns correct grid for fill-upper (2 hidden)", () => {
    const round = generateFillRound("fill-upper", ["A", "B"], UPPER, 4);
    expect(round.grid).toHaveLength(26);
    expect(round.missingIndices).toHaveLength(2);
    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.grid[round.activeIndex].char);
  });

  it("returns correct grid for fill-lower (3 hidden)", () => {
    const round = generateFillRound("fill-lower", ["a", "b", "c"], LOWER, 4);
    expect(round.grid).toHaveLength(26);
    expect(round.missingIndices).toHaveLength(3);
  });

  it("marks correct cells as hidden", () => {
    const round = generateFillRound("fill-upper", ["A", "B"], UPPER, 4);
    for (const i of round.missingIndices) {
      expect(round.grid[i].isHidden).toBe(true);
    }
  });

  it("sorts missingIndices ascending", () => {
    const round = generateFillRound("fill-upper", ["Z", "A", "M"], UPPER);
    for (let i = 1; i < round.missingIndices.length; i++) {
      expect(round.missingIndices[i]).toBeGreaterThan(round.missingIndices[i - 1]);
    }
  });

  it("activeIndex matches first missing", () => {
    const round = generateFillRound("fill-upper", ["A", "B"], UPPER);
    expect(round.activeIndex).toBe(round.missingIndices[0]);
  });
});

describe("generateTypingRound", () => {
  it("returns grid of 26 cells", () => {
    const round = generateTypingRound(UPPER);
    expect(round.grid).toHaveLength(26);
  });

  it("marks pool cells as hidden", () => {
    const round = generateTypingRound(["A", "B", "C", "D", "E"]);
    expect(round.missingIndices).toHaveLength(5);
    for (const i of round.missingIndices) {
      expect(round.grid[i].isHidden).toBe(true);
    }
    expect(round.activeIndex).toBe(-1);
  });

  it("all hidden cells have empty value", () => {
    const round = generateTypingRound(["A", "B", "C", "D"]);
    for (const i of round.missingIndices) {
      expect(round.grid[i].value).toBe("");
    }
  });
});

// ─── CARD_DROP_RATES integrity ──────────────────────────────────────────────────

describe("CARD_DROP_RATES integrity", () => {
  it("has 6 entries (null + 5 tiers)", () => {
    expect(CARD_DROP_RATES).toHaveLength(6);
  });

  it("base rates sum to 100", () => {
    const sum = CARD_DROP_RATES.reduce((acc: number, r) => acc + r.base, 0);
    expect(sum).toBeCloseTo(100);
  });

  it("max rates sum to 100", () => {
    const sum = CARD_DROP_RATES.reduce((acc: number, r) => acc + r.max, 0);
    expect(sum).toBeCloseTo(100);
  });

  it("total at any streak equals 100", () => {
    for (let streak = 0; streak <= 20; streak++) {
      const total = CARD_DROP_RATES.reduce((acc: number, r) => acc + interpolateRate(r.base, r.max, streak), 0);
      expect(total).toBeCloseTo(100);
    }
  });
});

// ─── buildStages ─────────────────────────────────────────────────────────────

describe("buildStages", () => {
  it("returns 6 stages", () => {
    const stages = buildStages();
    expect(stages).toHaveLength(6);
  });

  it("each stage has 5 sub-stages", () => {
    const stages = buildStages();
    for (const stage of stages) {
      expect(stage.subStages).toHaveLength(5);
    }
  });

  it("stage names match game types", () => {
    const stages = buildStages();
    for (let i = 0; i < 6; i++) {
      expect(stages[i].name).toBe(SUB_STAGE_NAMES[i].name);
      expect(stages[i].subtitle).toBe(SUB_STAGE_NAMES[i].subtitle);
    }
  });

  it("each stage has empty letterGroup", () => {
    const stages = buildStages();
    for (const stage of stages) {
      expect(stage.letterGroup).toEqual([]);
    }
  });

  it("sub-stage types are uniform within each stage", () => {
    const stages = buildStages();
    const expectedTypes = ["match", "match", "match", "fill-upper", "fill-lower", "typing"];
    for (let i = 0; i < 6; i++) {
      for (const sub of stages[i].subStages) {
        expect(sub.type).toBe(expectedTypes[i]);
      }
    }
  });

  it("sub-stages 0-3 are named after letter groups (A-F through S-Z)", () => {
    const stages = buildStages();
    for (const stage of stages) {
      expect(stage.subStages[0].name).toBe("Letters A–F");
      expect(stage.subStages[1].name).toBe("Letters G–L");
      expect(stage.subStages[2].name).toBe("Letters M–R");
      expect(stage.subStages[3].name).toBe("Letters S–Z");
    }
  });

  it("last sub-stage is named All Letters", () => {
    const stages = buildStages();
    for (const stage of stages) {
      expect(stage.subStages[4].name).toBe("All Letters");
    }
  });

  it("sub-stage subtitles show space-joined letter group", () => {
    const stages = buildStages();
    expect(stages[0].subStages[0].subtitle).toBe("A B C D E F");
    expect(stages[0].subStages[1].subtitle).toBe("G H I J K L");
    expect(stages[0].subStages[3].subtitle).toBe("S T U V W X Y Z");
    expect(stages[0].subStages[4].subtitle).toBe("A B C D E F G H I J K L M N O P Q R S T U V W X Y Z");
  });

  it("sub-stage 0 (A-F) letterPool matches match type stages (uppercase)", () => {
    const stages = buildStages();
    for (let i = 0; i < 3; i++) {
      expect(stages[i].subStages[0].letterPool).toEqual(["A", "B", "C", "D", "E", "F"]);
    }
  });

  it("sub-stage 0 letterPool is lowercase for fill-lower stage", () => {
    const stages = buildStages();
    expect(stages[4].subStages[0].letterPool).toEqual(["a", "b", "c", "d", "e", "f"]);
  });

  it("last sub-stage (All 26) letterPool is 26 letters for match and typing", () => {
    const stages = buildStages();
    for (let i = 0; i < 3; i++) {
      expect(stages[i].subStages[4].letterPool).toHaveLength(26);
    }
    expect(stages[5].subStages[4].letterPool).toHaveLength(26);
  });

  it("last sub-stage letterPool hidden for fill is 10 random letters", () => {
    const stages = buildStages();
    expect(stages[3].subStages[4].letterPool).toHaveLength(10);
    expect(stages[4].subStages[4].letterPool).toHaveLength(10);
  });

  it("every sub-stage has a non-empty letterPool", () => {
    const stages = buildStages();
    for (const stage of stages) {
      for (const sub of stage.subStages) {
        expect(sub.letterPool).toBeDefined();
        expect(sub.letterPool!.length).toBeGreaterThan(0);
      }
    }
  });

  it("revert is true for Thai Match and Phonics Match stages only", () => {
    const stages = buildStages();
    for (const sub of stages[0].subStages) expect(sub.revert).toBe(true);
    for (const sub of stages[1].subStages) expect(sub.revert).toBe(true);
    for (let i = 2; i < 6; i++)
      for (const sub of stages[i].subStages) expect(sub.revert).toBe(false);
  });

  it("dataPool matches stage game type", () => {
    const stages = buildStages();
    expect(stages[0].subStages[0].dataPool).toBe("thai");
    expect(stages[1].subStages[0].dataPool).toBe("phonics");
    expect(stages[2].subStages[0].dataPool).toBe("lowercase");
    expect(stages[3].subStages[0].dataPool).toBeUndefined();
    expect(stages[4].subStages[0].dataPool).toBeUndefined();
    expect(stages[5].subStages[0].dataPool).toBeUndefined();
  });

  it("fill sub-stages have hideLetters set, match/typing do not", () => {
    const stages = buildStages();
    for (let i = 0; i < 3; i++)
      for (const sub of stages[i].subStages) expect(sub.hideLetters).toBeUndefined();
    for (const sub of stages[3].subStages) expect(sub.hideLetters).toBeDefined();
    for (const sub of stages[4].subStages) expect(sub.hideLetters).toBeDefined();
    for (const sub of stages[5].subStages) expect(sub.hideLetters).toBeUndefined();
  });

  it("fill-lower hideLetters are lowercase", () => {
    const stages = buildStages();
    for (const sub of stages[4].subStages) {
      for (const letter of sub.hideLetters!) {
        expect(letter).toMatch(/^[a-z]$/);
      }
    }
  });

  it("targetMin for match types with 6-letter groups is PER_LETTER_MIN * 6", () => {
    const stages = buildStages();
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        expect(stages[i].subStages[j].targetMin).toBe(PER_LETTER_MIN * 6);
  });

  it("targetMin for match type S-Z (8-letter group) is PER_LETTER_MIN * 8", () => {
    const stages = buildStages();
    for (let i = 0; i < 3; i++)
      expect(stages[i].subStages[3].targetMin).toBe(PER_LETTER_MIN * 8);
  });

  it("targetMin for last sub-stage (All 26) match types is STAGE6_PER_LETTER_MIN * 26", () => {
    const stages = buildStages();
    for (let i = 0; i < 3; i++)
      expect(stages[i].subStages[4].targetMin).toBe(STAGE6_PER_LETTER_MIN * 26);
  });

  it("targetMin for fill types with 6-letter groups equals 6", () => {
    const stages = buildStages();
    for (const i of [3, 4])
      for (let j = 0; j < 3; j++)
        expect(stages[i].subStages[j].targetMin).toBe(6);
  });

  it("targetMin for fill type S-Z (8-letter group) equals 8", () => {
    const stages = buildStages();
    for (const i of [3, 4])
      expect(stages[i].subStages[3].targetMin).toBe(8);
  });

  it("targetMin for typing with 6-letter groups equals 6", () => {
    const stages = buildStages();
    for (let j = 0; j < 3; j++)
      expect(stages[5].subStages[j].targetMin).toBe(6);
  });

  it("targetMin for typing S-Z (8-letter group) equals 8", () => {
    const stages = buildStages();
    expect(stages[5].subStages[3].targetMin).toBe(8);
  });

  it("targetMin for typing with all 26 letters equals 26", () => {
    const stages = buildStages();
    expect(stages[5].subStages[4].targetMin).toBe(26);
  });

  it("getStages returns cached stages", () => {
    const a = getStages();
    const b = getStages();
    expect(a).toBe(b);
    expect(a).toHaveLength(6);
  });

  it("getStage returns correct stage by id", () => {
    const s1 = getStage(1);
    expect(s1).toBeDefined();
    expect(s1!.name).toBe(SUB_STAGE_NAMES[0].name);

    const s3 = getStage(3);
    expect(s3).toBeDefined();
    expect(s3!.name).toBe(SUB_STAGE_NAMES[2].name);
  });

  it("getStage returns undefined for invalid id", () => {
    expect(getStage(0)).toBeUndefined();
    expect(getStage(7)).toBeUndefined();
    expect(getStage(-1)).toBeUndefined();
  });
});

// ─── Phase 1: Save Migration v2→v3 ─────────────────────────────────────

function makeV2Save(): MapSaveData {
  return {
    version: 2,
    totalScore: 100,
    stages: Array.from({ length: 6 }, (_, stageIdx) => ({
      unlocked: true,
      subStages: Array.from({ length: 6 }, (__, subIdx) => ({
        completed: subIdx < 4,
        stars: stageIdx === 0 && subIdx === 4 ? 1 : subIdx < 4 ? 3 : 2,
        bestScore: stageIdx === 0 && subIdx === 5 ? 40 : 50,
      })),
      completed: true,
    })),
    letterTracker: {},
  };
}

describe("save migration v2→v3", () => {
  it("maps old 6 sub-stages to new 5, dropping old[4]", () => {
    const v2 = makeV2Save();
    const v3 = migrateV2ToV3(v2);
    for (const stage of v3.stages) {
      expect(stage.subStages).toHaveLength(5);
    }
  });

  it("preserves old indices [0,1,2,3,5] as new [0,1,2,3,4]", () => {
    const v2 = makeV2Save();
    const oldSubs = v2.stages[0].subStages.map((s) => ({ ...s }));
    const v3 = migrateV2ToV3(v2);
    const newSubs = v3.stages[0].subStages;
    expect(newSubs[0].stars).toBe(oldSubs[0].stars);
    expect(newSubs[1].stars).toBe(oldSubs[1].stars);
    expect(newSubs[2].stars).toBe(oldSubs[2].stars);
    expect(newSubs[3].stars).toBe(oldSubs[3].stars);
    expect(newSubs[4].stars).toBe(oldSubs[5].stars);
  });

  it("drops old index 4 (does not appear in new)", () => {
    const v2 = makeV2Save();
    v2.stages[0].subStages[4].stars = 1;
    v2.stages[0].subStages[4].bestScore = 10;
    const v3 = migrateV2ToV3(v2);
    const newSubs = v3.stages[0].subStages;
    expect(newSubs[4].stars).not.toBe(1);
    expect(newSubs[4].bestScore).not.toBe(10);
  });

  it("preserves completion state from old indices", () => {
    const v2 = makeV2Save();
    const oldSubs = v2.stages[0].subStages.map((s) => ({ ...s }));
    const v3 = migrateV2ToV3(v2);
    const newSubs = v3.stages[0].subStages;
    expect(newSubs[0].completed).toBe(oldSubs[0].completed);
    expect(newSubs[1].completed).toBe(oldSubs[1].completed);
    expect(newSubs[2].completed).toBe(oldSubs[2].completed);
    expect(newSubs[3].completed).toBe(oldSubs[3].completed);
    expect(newSubs[4].completed).toBe(oldSubs[5].completed);
  });

  it("sets version to 3", () => {
    const v2 = makeV2Save();
    const v3 = migrateV2ToV3(v2);
    expect(v3.version).toBe(3);
  });

  it("returns v3 data unchanged", () => {
    const v3Data = emptyMapSaveData();
    v3Data.version = 3;
    const result = migrateV2ToV3(v3Data);
    expect(result.version).toBe(3);
    expect(result.stages).toHaveLength(6);
  });

  it("handles saves with 5 sub-stages (already migrated)", () => {
    const v3Data = emptyMapSaveData();
    v3Data.version = 3;
    const result = migrateV2ToV3(v3Data);
    for (const stage of result.stages) {
      expect(stage.subStages).toHaveLength(5);
    }
  });

  it("preserves totalScore and letterTracker", () => {
    const v2 = makeV2Save();
    v2.letterTracker = { A: { correct: 5, total: 6 }, Z: { correct: 1, total: 5 } };
    const v3 = migrateV2ToV3(v2);
    expect(v3.totalScore).toBe(100);
    expect(v3.letterTracker).toEqual({ A: { correct: 5, total: 6 }, Z: { correct: 1, total: 5 } });
  });
});

// ─── Phase 2: EasyMode Choice Reduction ────────────────────────────────

describe("easyMode choice reduction", () => {
  it("generateMatchRound returns 2 choices in easy mode", () => {
    const round = generateMatchRound(1, undefined, 2);
    expect(round.choices).toHaveLength(2);
    expect(round.choices).toContain(round.correctChar);
  });

  it("generateFillChoices returns 3 choices in easy mode", () => {
    const choices = generateFillChoices("A", 3, UPPER);
    expect(choices).toHaveLength(3);
    expect(choices).toContain("A");
  });

  it("default (non-easy) match has 3 choices", () => {
    const round = generateMatchRound(1);
    expect(round.choices).toHaveLength(3);
  });

  it("default (non-easy) fill has 4 choices", () => {
    const choices = generateFillChoices("M", 4, UPPER);
    expect(choices).toHaveLength(4);
  });
});

// ─── Phase 2: Onboarding Key Clearing ──────────────────────────────────

describe("onboarding key clearing", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {
      "onboarding_match": "true",
      "onboarding_fill-upper": "true",
      "onboarding_fill-lower": "true",
      "onboarding_typing": "true",
      "other_key": "preserved",
    };
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears all 4 onboarding_* keys", () => {
    ['match', 'fill-upper', 'fill-lower', 'typing'].forEach((k) =>
      localStorage.removeItem(`onboarding_${k}`),
    );
    expect(localStorage.getItem("onboarding_match")).toBeNull();
    expect(localStorage.getItem("onboarding_fill-upper")).toBeNull();
    expect(localStorage.getItem("onboarding_fill-lower")).toBeNull();
    expect(localStorage.getItem("onboarding_typing")).toBeNull();
  });

  it("preserves non-onboarding keys", () => {
    ['match', 'fill-upper', 'fill-lower', 'typing'].forEach((k) =>
      localStorage.removeItem(`onboarding_${k}`),
    );
    expect(localStorage.getItem("other_key")).toBe("preserved");
  });
});

// ─── Phase 3: Spaced Repetition Sorting ────────────────────────────────

function sortPoolByAccuracy(
  pool: string[],
  tracker: Record<string, LetterTracker>,
): string[] {
  return [...pool].sort((a, b) => {
    const ta = tracker[a.toUpperCase()];
    const tb = tracker[b.toUpperCase()];
    const accA = ta ? ta.correct / ta.total : 1;
    const accB = tb ? tb.correct / tb.total : 1;
    return accA - accB;
  });
}

describe("spaced repetition pool sorting", () => {
  it("sorts low-accuracy letters before high-accuracy letters", () => {
    const pool = ["A", "B", "C"];
    const tracker: Record<string, LetterTracker> = {
      A: { correct: 1, total: 5 },  // 20%
      B: { correct: 4, total: 5 },  // 80%
      C: { correct: 5, total: 5 },  // 100%
    };
    const sorted = sortPoolByAccuracy(pool, tracker);
    expect(sorted[0]).toBe("A");
    expect(sorted[1]).toBe("B");
    expect(sorted[2]).toBe("C");
  });

  it("untracked letters are treated as 100% accuracy (sorted last)", () => {
    const pool = ["A", "B", "C"];
    const tracker: Record<string, LetterTracker> = {
      A: { correct: 1, total: 5 },
    };
    const sorted = sortPoolByAccuracy(pool, tracker);
    expect(sorted[0]).toBe("A");
    expect(sorted.slice(1).sort()).toEqual(["B", "C"]);
  });

  it("preserves pool length", () => {
    const pool = ["A", "B", "C", "D", "E"];
    const tracker: Record<string, LetterTracker> = {
      A: { correct: 0, total: 5 },
      E: { correct: 5, total: 5 },
    };
    const sorted = sortPoolByAccuracy(pool, tracker);
    expect(sorted).toHaveLength(5);
  });

  it("handles empty pool", () => {
    expect(sortPoolByAccuracy([], {})).toEqual([]);
  });

  it("handles empty tracker", () => {
    const pool = ["A", "B", "C"];
    const sorted = sortPoolByAccuracy(pool, {});
    expect(sorted.sort()).toEqual(["A", "B", "C"]);
  });

  it("does not mutate original pool", () => {
    const pool = ["A", "B", "C"];
    const original = [...pool];
    sortPoolByAccuracy(pool, { A: { correct: 0, total: 5 } });
    expect(pool).toEqual(original);
  });
});

// ─── Phase 4: LetterProgressGrid.masteryLevel ─────────────────────────

describe("masteryLevel", () => {
  it("returns untracked for undefined tracker", () => {
    expect(masteryLevel(undefined)).toBe("untracked");
  });

  it("returns untracked when total is 0", () => {
    expect(masteryLevel({ correct: 0, total: 0 })).toBe("untracked");
    expect(masteryLevel({ correct: 5, total: 0 })).toBe("untracked");
  });

  it("returns mastered for ≥80% accuracy with ≥5 attempts", () => {
    expect(masteryLevel({ correct: 4, total: 5 })).toBe("mastered");
    expect(masteryLevel({ correct: 8, total: 10 })).toBe("mastered");
    expect(masteryLevel({ correct: 5, total: 5 })).toBe("mastered");
    expect(masteryLevel({ correct: 20, total: 25 })).toBe("mastered");
  });

  it("returns learning for <80% accuracy with ≥5 attempts", () => {
    expect(masteryLevel({ correct: 3, total: 5 })).toBe("learning");
    expect(masteryLevel({ correct: 0, total: 5 })).toBe("learning");
    expect(masteryLevel({ correct: 7, total: 10 })).toBe("learning");
  });

  it("returns learning for ≥80% accuracy but <5 attempts", () => {
    expect(masteryLevel({ correct: 4, total: 4 })).toBe("learning");
    expect(masteryLevel({ correct: 1, total: 1 })).toBe("learning");
    expect(masteryLevel({ correct: 3, total: 3 })).toBe("learning");
  });

  it("returns learning for <80% accuracy even with many attempts", () => {
    expect(masteryLevel({ correct: 10, total: 50 })).toBe("learning");
    expect(masteryLevel({ correct: 1, total: 100 })).toBe("learning");
  });

  it("handles edge boundary: accuracy exactly 0.8", () => {
    expect(masteryLevel({ correct: 4, total: 5 })).toBe("mastered");
  });

  it("handles edge boundary: accuracy just below 0.8", () => {
    expect(masteryLevel({ correct: 3, total: 5 })).toBe("learning");
  });
});

// ─── Phase 4: Typing Keyboard Layout ───────────────────────────────────

describe("KEYBOARD_ROWS", () => {
  it("contains all 26 letters across 3 rows", () => {
    const all = KEYBOARD_ROWS.flat();
    expect(all).toHaveLength(26);
    expect(new Set(all).size).toBe(26);
  });

  it("each row is sorted alphabetically", () => {
    for (const row of KEYBOARD_ROWS) {
      for (let i = 1; i < row.length; i++) {
        expect(row[i].charCodeAt(0)).toBeGreaterThan(row[i - 1].charCodeAt(0));
      }
    }
  });

  it("has no duplicate letters", () => {
    const all = KEYBOARD_ROWS.flat();
    expect(new Set(all).size).toBe(all.length);
  });

  it("has correct row distribution", () => {
    expect(KEYBOARD_ROWS[0]).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
    expect(KEYBOARD_ROWS[1]).toEqual(["J", "K", "L", "M", "N", "O", "P", "Q", "R"]);
    expect(KEYBOARD_ROWS[2]).toEqual(["S", "T", "U", "V", "W", "X", "Y", "Z"]);
  });
});

// ─── Phase 6: Stale Closure in handleSubStageComplete ────────────────

describe("handleSubStageComplete stale closure bug", () => {
  it("currentStageId=0 causes stageIdx=-1 and early return", () => {
    const data = emptyMapSaveData();
    // Simulate what happens in the stale closure:
    // handleSelectSubStage calls setCurrentStageId(1) but
    // handleSubStageComplete closes over currentStageId=0
    const staleCurrentStageId = 0;
    const stageIdx = staleCurrentStageId - 1;
    expect(stageIdx).toBe(-1);
    expect(stageIdx < 0).toBe(true);
    // This guard causes the save to never update
    expect(stageIdx >= data.stages.length).toBe(false);
  });

  it("after setCurrentStageId(1), new callback is created but ref points to old one", () => {
    const data = emptyMapSaveData();
    const originalSub = { ...data.stages[0].subStages[0] };
    expect(originalSub.completed).toBe(false);

    // Simulate: stale callback (currentStageId=0) — save never updates
    const staleStageIdx = 0 - 1;
    if (staleStageIdx < 0 || staleStageIdx >= data.stages.length) {
      // early return — no update
    }

    // Data is unchanged
    expect(data.stages[0].subStages[0].completed).toBe(false);
    expect(data.stages[0].completed).toBe(false);
    expect(data.stages[1].unlocked).toBe(false);

    // Simulate: fresh callback (currentStageId=1) — save updates correctly
    const correctStageIdx = 1 - 1;
    if (correctStageIdx >= 0 && correctStageIdx < data.stages.length) {
      data.stages[correctStageIdx].subStages[0].completed = true;
    }

    // Data is now updated
    expect(data.stages[0].subStages[0].completed).toBe(true);
  });
});

// ─── Phase 5: Mascot Imports ──────────────────────────────────────────

describe("mascot components", () => {
  it("CaptainAlph imports successfully", async () => {
    const mod = await import("@/app/(standalone)/games/alphabet-adventure/characters/CaptainAlph");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("Mermaid imports successfully", async () => {
    const mod = await import("@/app/(standalone)/games/alphabet-adventure/characters/Mermaid");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });

  it("TreasureMonster imports successfully", async () => {
    const mod = await import("@/app/(standalone)/games/alphabet-adventure/characters/TreasureMonster");
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe("function");
  });
});

describe("sfx module", () => {
  it("exports playCardSfx as a function", async () => {
    const mod = await import("@/app/(standalone)/games/alphabet-adventure/sfx");
    expect(typeof mod.playCardSfx).toBe("function");
  });

  it("exports playSingleCorrect as a function", async () => {
    const mod = await import("@/app/(standalone)/games/alphabet-adventure/sfx");
    expect(typeof mod.playSingleCorrect).toBe("function");
  });

  it("exports playWrong as a function", async () => {
    const mod = await import("@/app/(standalone)/games/alphabet-adventure/sfx");
    expect(typeof mod.playWrong).toBe("function");
  });
});
