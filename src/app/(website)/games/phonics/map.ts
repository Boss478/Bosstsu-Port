import type { TileType, MapBuilding } from "./types";
import { MAP_GRID, MAP_COLS, MAP_ROWS } from "./constants";

// Parse map string grid → 2D tile type array
export function parseMapGrid(): TileType[][] {
  return MAP_GRID.map((row) =>
    row.split("").map((char): TileType => {
      if (char === "W") return "W";
      if (char === "G") return "G";
      if (char === "S") return "S";
      if (char === "P") return "P";
      // B1-B9 all map to "B" tile type
      if (char === "B") return "B";
      // Detect building characters inside multi-char tokens is handled below
      return "G";
    })
  );
}

// Buildings extracted from MAP_GRID (multi-char like B1, B2…)
// We manually define their tile positions based on the known MAP_GRID layout
export const BUILDINGS: MapBuilding[] = [
  { id: "B1", x: 3,  y: 3,  interactive: true,  label: "Phonics Island",  category: "phonics" },
  { id: "B2", x: 11, y: 3,  interactive: false, label: "Mystery Shop" },
  { id: "B3", x: 2,  y: 8,  interactive: false, label: "Library" },
  { id: "B4", x: 10, y: 8,  interactive: false, label: "Clock Tower" },
  { id: "B5", x: 15, y: 8,  interactive: false, label: "Market" },
  { id: "B6", x: 3,  y: 12, interactive: false, label: "School" },
  { id: "B7", x: 11, y: 12, interactive: false, label: "Garden" },
];

// Flat tile grid for the canvas renderer
// Returns a 15×20 array of tile chars (B1-B7 map blocks resolved to 'B')
export function getFlatGrid(): string[][] {
  return MAP_GRID.map((row) => {
    const cells: string[] = [];
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      // Look ahead for 2-char token like B1
      if (ch === "B" && i + 1 < row.length && /\d/.test(row[i + 1])) {
        cells.push("B"); // collapse to B tile
        i += 2;          // skip the digit
      } else {
        cells.push(ch);
        i++;
      }
    }
    return cells;
  });
}

// Mascot start tile (centre of map)
export const MASCOT_START = { tileX: Math.floor(MAP_COLS / 2), tileY: Math.floor(MAP_ROWS / 2) };
