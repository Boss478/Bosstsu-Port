import { describe, it, expect, vi, afterEach } from "vitest";
import { shuffleArray } from "@/lib/shuffle";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("shuffleArray", () => {
  it("returns array of same length", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffleArray(arr);
    expect(result).toHaveLength(arr.length);
  });

  it("contains all original elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffleArray(arr);
    expect(result.sort()).toEqual(arr.sort());
  });

  it("does not mutate the original array", () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(original);
  });

  it("returns elements in different order (probabilistic)", () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set<string>();
    for (let i = 0; i < 50; i++) {
      results.add(shuffleArray(arr).join(","));
    }
    expect(results.size).toBeGreaterThan(1);
  });

  it("returns empty array for empty input", () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it("returns single-element array unchanged", () => {
    expect(shuffleArray([42])).toEqual([42]);
  });

  it("handles arrays with mixed types", () => {
    const arr = ["a", 1, true, null];
    const result = shuffleArray(arr);
    expect(result).toHaveLength(4);
    expect(result).toContain("a");
    expect(result).toContain(1);
    expect(result).toContain(true);
    expect(result).toContain(null);
  });

  it("handles arrays with duplicate values", () => {
    const arr = [1, 1, 2, 2, 3, 3];
    const result = shuffleArray(arr);
    expect(result).toHaveLength(6);
    expect(result.filter((x: number) => x === 1)).toHaveLength(2);
    expect(result.filter((x: number) => x === 2)).toHaveLength(2);
    expect(result.filter((x: number) => x === 3)).toHaveLength(2);
  });
});
