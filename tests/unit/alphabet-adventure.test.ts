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
  resetRoundSeed,
  CARD_DROP_RATES,
} from "@/app/(standalone)/games/alphabet-adventure/constants";
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
    const round = generateMatchRound(1, 4);
    expect(round.choices).toHaveLength(4);
  });

  it("includes correctChar in choices", () => {
    resetRoundSeed();
    const round = generateMatchRound(1, 3);
    expect(round.choices).toContain(round.correctChar);
  });

  it("maps round 1 to letter A", () => {
    resetRoundSeed();
    const round = generateMatchRound(1);
    expect(round.targetLetter).toBe("A");
    expect(round.correctChar).toBe("a");
  });

  it("maps round 2 to letter B", () => {
    resetRoundSeed();
    const round = generateMatchRound(2);
    expect(round.targetLetter).toBe("B");
    expect(round.correctChar).toBe("b");
  });

  it("maps round 26 to letter Z", () => {
    resetRoundSeed();
    const round = generateMatchRound(26);
    expect(round.targetLetter).toBe("Z");
    expect(round.correctChar).toBe("z");
  });

  it("uses shuffled seed for rounds > 26", () => {
    resetRoundSeed();
    const round27 = generateMatchRound(27);
    const letter27 = round27.targetLetter;

    resetRoundSeed();
    const round27Again = generateMatchRound(27);
    expect(round27Again.targetLetter).toBe(letter27);

    expect(letter27.length).toBe(1);
    expect("ABCDEFGHIJKLMNOPQRSTUVWXYZ").toContain(letter27);
  });
});

describe("generateThaiRevertRound", () => {
  it("returns correct number of choices", () => {
    resetRoundSeed();
    const round = generateThaiRevertRound(1, 3);
    expect(round.choices).toHaveLength(3);
  });

  it("maps round 1 to Thai name เอ and letter A", () => {
    resetRoundSeed();
    const round = generateThaiRevertRound(1);
    expect(round.targetLetter).toBe("เอ");
    expect(round.correctChar).toBe("A");
  });

  it("maps round 26 to Thai name แซด and letter Z", () => {
    resetRoundSeed();
    const round = generateThaiRevertRound(26);
    expect(round.targetLetter).toBe("แซด");
    expect(round.correctChar).toBe("Z");
  });

  it("includes correctChar in choices", () => {
    resetRoundSeed();
    const round = generateThaiRevertRound(5, 4);
    expect(round.choices).toContain(round.correctChar);
  });

  it("all choices are uppercase letters", () => {
    resetRoundSeed();
    const round = generateThaiRevertRound(10, 4);
    for (const c of round.choices) {
      expect(c).toMatch(/^[A-Z]$/);
    }
  });
});

describe("generatePhonicsRevertRound", () => {
  it("maps round 1 to phonics sound แอะ /a/ and letter A", () => {
    resetRoundSeed();
    const round = generatePhonicsRevertRound(1);
    expect(round.targetLetter).toBe("แอะ /a/");
    expect(round.correctChar).toBe("A");
  });

  it("maps round 26 to phonics sound ซี /z/ and letter Z", () => {
    resetRoundSeed();
    const round = generatePhonicsRevertRound(26);
    expect(round.targetLetter).toBe("ซี /z/");
    expect(round.correctChar).toBe("Z");
  });

  it("includes correctChar in choices", () => {
    resetRoundSeed();
    const round = generatePhonicsRevertRound(15, 4);
    expect(round.choices).toContain(round.correctChar);
  });

  it("all choices are uppercase letters", () => {
    resetRoundSeed();
    const round = generatePhonicsRevertRound(8, 4);
    for (const c of round.choices) {
      expect(c).toMatch(/^[A-Z]$/);
    }
  });
});

describe("getLetterIndex / resetRoundSeed", () => {
  it("resetRoundSeed clears the seed (fresh shuffle on next call)", () => {
    resetRoundSeed();
    const before = generateMatchRound(27).targetLetter;
    resetRoundSeed();
    const after = generateMatchRound(27).targetLetter;
    expect(after).toBe(before);
  });

  it("rounds 1-26 always produce same mapping regardless of seed", () => {
    resetRoundSeed();
    const r1 = generateMatchRound(1);
    resetRoundSeed();
    const r2 = generateMatchRound(1);
    expect(r1.targetLetter).toBe(r2.targetLetter);
  });
});

describe("generateFillChoices", () => {
  it("returns correct number of choices", () => {
    const choices = generateFillChoices("A", 4, true);
    expect(choices).toHaveLength(4);
  });

  it("includes the correct character", () => {
    const choices = generateFillChoices("M", 3, true);
    expect(choices).toContain("M");
  });

  it("all choices are from the correct case alphabet", () => {
    const upper = generateFillChoices("A", 5, true);
    for (const c of upper) {
      expect(c).toMatch(/^[A-Z]$/);
    }

    const lower = generateFillChoices("a", 5, false);
    for (const c of lower) {
      expect(c).toMatch(/^[a-z]$/);
    }
  });

  it("returns unique choices", () => {
    const choices = generateFillChoices("X", 10, true);
    expect(new Set(choices).size).toBe(choices.length);
  });
});

describe("generateFillRound", () => {
  it("returns correct grid for fill-upper (2 hidden)", () => {
    const round = generateFillRound("fill-upper", 4);
    expect(round.grid).toHaveLength(26);
    expect(round.missingIndices).toHaveLength(2);
    expect(round.choices).toHaveLength(4);
    expect(round.choices).toContain(round.grid[round.activeIndex].char);
  });

  it("returns correct grid for fill-lower (3 hidden)", () => {
    const round = generateFillRound("fill-lower", 4);
    expect(round.grid).toHaveLength(26);
    expect(round.missingIndices).toHaveLength(3);
  });

  it("marks correct cells as hidden", () => {
    const round = generateFillRound("fill-upper", 4);
    for (const i of round.missingIndices) {
      expect(round.grid[i].isHidden).toBe(true);
    }
  });

  it("sorts missingIndices ascending", () => {
    const round = generateFillRound("fill-upper");
    for (let i = 1; i < round.missingIndices.length; i++) {
      expect(round.missingIndices[i]).toBeGreaterThan(round.missingIndices[i - 1]);
    }
  });

  it("activeIndex matches first missing", () => {
    const round = generateFillRound("fill-upper");
    expect(round.activeIndex).toBe(round.missingIndices[0]);
  });
});

describe("generateTypingRound", () => {
  it("returns grid of 26 cells", () => {
    const round = generateTypingRound(3);
    expect(round.grid).toHaveLength(26);
  });

  it("marks difficulty cells as hidden", () => {
    const round = generateTypingRound(5);
    expect(round.missingIndices).toHaveLength(5);
    for (const i of round.missingIndices) {
      expect(round.grid[i].isHidden).toBe(true);
    }
    expect(round.activeIndex).toBe(-1);
  });

  it("all hidden cells have empty value", () => {
    const round = generateTypingRound(4);
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
