import type { SpriteData } from './types';

// ─── Palette (index 0 = transparent) ─────────────────────────────────────────
export const PALETTE: string[] = [
  'transparent', // 0
  '#1C1C1C', // 1: dark border / outline
  '#FFFFFF', // 2: white
  '#C8A44E', // 3: gold / owl / coins
  '#FDFBF7', // 4: warm parchment
  '#A2D2FF', // 5: day sky blue
  '#4EA8DE', // 6: day water
  '#80ED99', // 7: day grass green
  '#F7E1A0', // 8: day sand / path
  '#0A1128', // 9: night navy sky
  '#101F42', // 10: night water
  '#1A433A', // 11: night grass
  '#3D3B3C', // 12: night path
  '#9B59B6', // 13: witch purple (Mira)
  '#5DADE2', // 14: robot cyan (Chip)
  '#FF70A6', // 15: neon pink / error
  '#FFBA08', // 16: active star / warning
  '#2EC4B6', // 17: correct teal highlight
  '#D4AF37', // 18: dark-mode gold border
  '#888888', // 19: shadow gray
  '#F0F0F0', // 20: light gray (inner shadow)
  '#5C4033', // 21: brown (owl body)
  '#E8D5B7', // 22: light tan (owl face)
  '#FF5733', // 23: beak orange
  '#7B68EE', // 24: mira robe medium purple
  '#4682B4', // 25: chip body steel blue
  '#B0C4DE', // 26: chip highlights light steel blue
  '#2E7D32', // 27: dark green (grass deep shade)
  '#1565C0', // 28: deep water shade
  '#FFF9C4', // 29: light yellow (window glow)
  '#E67E22', // 30: island ground brown / volcano rock
  '#C0392B', // 31: lava red
  '#F39C12', // 32: lava orange
  '#ECF0F1', // 33: snow white
  '#BDC3C7', // 34: snow shadow
  '#2ECC71', // 35: palm tree green
  '#8E44AD', // 36: deep purple
  '#D35400', // 37: dark orange / roof tile
  '#F7DC6F', // 38: warm yellow / window
  '#AED6F1', // 39: light blue / sky accent
  '#E85D26', // 40: fox orange
  '#9E9E9E', // 41: cat gray
  '#8D6E63', // 42: bear brown
  '#FFF3E0', // 43: bunny off-white
  '#F48FB1', // 44: bunny / cat pink
  '#37474F', // 45: penguin / ninja dark gray
  '#66BB6A', // 46: alien green
  '#EF5350', // 47: ninja red
  '#AB47BC', // 48: alien purple
  '#5D4037', // 49: bear dark brown / muzzle
  '#546E7A', // 50: robot blue-gray (from Tools robot)
  '#B0BEC5', // 51: robot light steel blue (from Tools robot)
];

// ─── Phonics Building (16×24) ─────────────────────────────────────────────────
export const BUILDING_PHONICS: SpriteData = {
  width: 16,
  height: 24,
  pixels: [
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1, 0],
    [1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 16, 16, 4, 4, 4, 16, 16, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 16, 16, 4, 4, 4, 16, 16, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1],
    [1, 1, 4, 4, 4, 1, 1, 1, 1, 1, 1, 4, 4, 4, 1, 1],
    [1, 4, 4, 4, 4, 1, 29, 29, 29, 1, 4, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 1, 29, 29, 29, 1, 4, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 1, 29, 29, 29, 1, 4, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 1, 29, 29, 29, 1, 4, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 1, 1, 1, 1, 1, 1, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1],
    [1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
    [8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8],
  ],
};

// ─── Mascot — Nox the Owl (16×16) ─────────────────────────────────────────────
function generateDetailedNox(): SpriteData {
  const pixels: number[][] = Array.from({ length: 32 }, () => new Array(32).fill(0));

  const drawEllipse = (cx: number, cy: number, rx: number, ry: number, color: number, outlineColor?: number) => {
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          pixels[y][x] = color;
        }
      }
    }
    if (outlineColor !== undefined) {
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          if (pixels[y][x] === color) {
            let isBorder = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < 32 && nx >= 0 && nx < 32) {
                  if (pixels[ny][nx] === 0) {
                    isBorder = true;
                    break;
                  }
                }
              }
              if (isBorder) break;
            }
            if (isBorder) {
              pixels[y][x] = outlineColor;
            }
          }
        }
      }
    }
  };

  // 1. Ears
  drawEllipse(10, 6, 2, 4, 3, 1);
  drawEllipse(22, 6, 2, 4, 3, 1);

  // 2. Body
  drawEllipse(16, 22, 7, 6, 21, 1);
  drawEllipse(16, 22, 4, 4, 22);

  // 3. Wings
  drawEllipse(8, 22, 2, 4, 3, 1);
  drawEllipse(24, 22, 2, 4, 3, 1);

  // 4. Feet
  drawEllipse(13, 28, 1.5, 1, 23, 1);
  drawEllipse(19, 28, 1.5, 1, 23, 1);

  // 5. Head
  drawEllipse(16, 12, 8.5, 7, 3, 1);

  // 6. Face mask
  drawEllipse(12.5, 12.5, 3.5, 3.5, 22);
  drawEllipse(19.5, 12.5, 3.5, 3.5, 22);

  // 7. Eyes
  drawEllipse(12.5, 12, 1, 1.5, 1);
  drawEllipse(19.5, 12, 1, 1.5, 1);
  pixels[11][13] = 2;
  pixels[11][20] = 2;

  // 8. Beak
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = -dy; dx <= dy; dx++) {
      const px = 16 + dx;
      const py = 13 + dy;
      if (px >= 0 && px < 32 && py >= 0 && py < 32) {
        pixels[py][px] = 23;
      }
    }
  }
  pixels[13][16] = 1;
  pixels[14][15] = 1;
  pixels[14][17] = 1;
  pixels[15][16] = 1;

  // Blush cheeks
  pixels[14][9] = 15;
  pixels[14][22] = 15;

  return { width: 32, height: 32, pixels };
}

function generateDetailedMira(): SpriteData {
  const pixels: number[][] = Array.from({ length: 32 }, () => new Array(32).fill(0));

  const drawEllipse = (cx: number, cy: number, rx: number, ry: number, color: number, outlineColor?: number) => {
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          pixels[y][x] = color;
        }
      }
    }
    if (outlineColor !== undefined) {
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          if (pixels[y][x] === color) {
            let isBorder = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < 32 && nx >= 0 && nx < 32) {
                  if (pixels[ny][nx] === 0) {
                    isBorder = true;
                    break;
                  }
                }
              }
              if (isBorder) break;
            }
            if (isBorder) {
              pixels[y][x] = outlineColor;
            }
          }
        }
      }
    }
  };

  // 1. Robe (Triangular purple body)
  for (let y = 17; y <= 28; y++) {
    const w = Math.floor((y - 17) * 0.7) + 1;
    for (let dx = -w; dx <= w; dx++) {
      pixels[y][16 + dx] = 24; // Robe purple
    }
  }
  for (let y = 17; y <= 28; y++) {
    const w = Math.floor((y - 17) * 0.7) + 1;
    pixels[y][16 - w] = 1;
    pixels[y][16 + w] = 1;
  }
  for (let x = 8; x <= 24; x++) {
    if (pixels[28][x] === 24) pixels[28][x] = 1;
  }

  // 2. Sleeves / Hands
  drawEllipse(10, 24, 1.5, 2.5, 24, 1);
  drawEllipse(22, 24, 1.5, 2.5, 24, 1);
  drawEllipse(9, 26, 1, 1, 22, 1);
  drawEllipse(23, 26, 1, 1, 22, 1);

  // 3. Hair
  drawEllipse(11.5, 16.5, 2, 4, 2, 1);
  drawEllipse(20.5, 16.5, 2, 4, 2, 1);

  // 4. Face/Head
  drawEllipse(16, 16, 5, 4.5, 22, 1);

  // 5. Hat Cone
  for (let y = 3; y <= 11; y++) {
    const w = Math.floor((y - 3) * 0.6) + 0.5;
    for (let dx = -Math.floor(w); dx <= Math.floor(w); dx++) {
      pixels[y][16 + dx] = 13;
    }
  }
  for (let y = 3; y <= 11; y++) {
    const w = Math.floor((y - 3) * 0.6) + 0.5;
    pixels[y][16 - Math.floor(w)] = 1;
    pixels[y][16 + Math.floor(w)] = 1;
  }

  // 6. Hat Brim
  drawEllipse(16, 12, 9, 1.5, 13, 1);

  // 7. Buckle (Gold)
  for (let y = 10; y <= 11; y++) {
    for (let x = 15; x <= 17; x++) {
      pixels[y][x] = 3;
    }
  }
  pixels[11][16] = 1;

  // 8. Face details
  drawEllipse(14, 16, 0.5, 1, 1);
  drawEllipse(18, 16, 0.5, 1, 1);
  pixels[17][13] = 15;
  pixels[17][19] = 15;
  
  pixels[17][15] = 1;
  pixels[17][16] = 1;
  pixels[17][17] = 1;

  return { width: 32, height: 32, pixels };
}

function generateDetailedChip(): SpriteData {
  const pixels: number[][] = Array.from({ length: 32 }, () => new Array(32).fill(0));

  const drawRect = (x1: number, y1: number, w: number, h: number, color: number, outlineColor?: number) => {
    for (let y = y1; y < y1 + h; y++) {
      for (let x = x1; x < x1 + w; x++) {
        if (x >= 0 && x < 32 && y >= 0 && y < 32) {
          pixels[y][x] = color;
        }
      }
    }
    if (outlineColor !== undefined) {
      for (let y = y1; y < y1 + h; y++) {
        for (let x = x1; x < x1 + w; x++) {
          if (x === x1 || x === x1 + w - 1 || y === y1 || y === y1 + h - 1) {
            if (x >= 0 && x < 32 && y >= 0 && y < 32) {
              pixels[y][x] = outlineColor;
            }
          }
        }
      }
    }
  };

  // 1. Antenna
  drawRect(15, 5, 2, 3, 26, 1);
  drawRect(15, 3, 2, 2, 16, 1);

  // 2. Neck
  drawRect(14, 15, 4, 2, 26, 1);

  // 3. Treads / Base
  drawRect(9, 25, 14, 4, 3, 1);
  drawRect(8, 27, 16, 2, 1, 1);

  // 4. Arms
  drawRect(6, 19, 3, 2, 26, 1);
  drawRect(23, 19, 3, 2, 26, 1);
  drawRect(5, 18, 1, 3, 25, 1);
  drawRect(26, 18, 1, 3, 25, 1);

  // 5. Body
  drawRect(9, 17, 14, 9, 25, 1);
  drawRect(11, 19, 4, 3, 14, 1);
  drawRect(17, 19, 4, 3, 16, 1);

  // 6. Head
  drawRect(11, 8, 10, 8, 25, 1);
  drawRect(12, 9, 8, 1, 26);
  drawRect(12, 10, 1, 6, 26);

  // 7. Visor
  drawRect(12, 10, 8, 3, 1, 1);
  drawRect(15, 10, 2, 2, 14);
  pixels[11][15] = 2;

  // 8. Cheek lights
  pixels[13][14] = 16;
  pixels[18][14] = 16;

  return { width: 32, height: 32, pixels };
}

export const MASCOT_IDLE: SpriteData = generateDetailedNox();
export const MIRA_IDLE: SpriteData = generateDetailedMira();
export const CHIP_IDLE: SpriteData = generateDetailedChip();

// ─── Shared Sprite Renderer ───────────────────────────────────────────────────

function createRenderer() {
  const pixels: number[][] = Array.from({ length: 32 }, () => new Array(32).fill(0));

  const drawEllipse = (cx: number, cy: number, rx: number, ry: number, color: number, outlineColor?: number) => {
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) pixels[y][x] = color;
      }
    }
    if (outlineColor !== undefined) {
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          if (pixels[y][x] === color) {
            let isBorder = false;
            for (let dy = -1; dy <= 1 && !isBorder; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy, nx = x + dx;
                if (ny >= 0 && ny < 32 && nx >= 0 && nx < 32 && pixels[ny][nx] === 0) {
                  isBorder = true; break;
                }
              }
            }
            if (isBorder) pixels[y][x] = outlineColor;
          }
        }
      }
    }
  };

  const drawRect = (x1: number, y1: number, w: number, h: number, color: number, outlineColor?: number) => {
    for (let y = y1; y < y1 + h; y++) {
      for (let x = x1; x < x1 + w; x++) {
        if (x >= 0 && x < 32 && y >= 0 && y < 32) pixels[y][x] = color;
      }
    }
    if (outlineColor !== undefined) {
      for (let y = y1; y < y1 + h; y++) {
        for (let x = x1; x < x1 + w; x++) {
          if (x >= 0 && x < 32 && y >= 0 && y < 32) {
            if (x === x1 || x === x1 + w - 1 || y === y1 || y === y1 + h - 1) pixels[y][x] = outlineColor;
          }
        }
      }
    }
  };

  return { pixels, drawEllipse, drawRect, build: () => ({ width: 32, height: 32, pixels }) };
}

// ─── Fox ──────────────────────────────────────────────────────────────────────
function generateDetailedFox(): SpriteData {
  const { drawEllipse, build } = createRenderer();
  drawEllipse(9, 6, 2, 3.5, 40, 1);
  drawEllipse(23, 6, 2, 3.5, 40, 1);
  drawEllipse(16, 14, 9, 7.5, 40, 1);
  drawEllipse(16, 15.5, 4, 3, 2);
  drawEllipse(13, 12.5, 1, 1.5, 1);
  drawEllipse(19, 12.5, 1, 1.5, 1);
  drawEllipse(16, 16.5, 1, 0.8, 1);
  drawEllipse(16, 23, 6.5, 5.5, 40, 1);
  drawEllipse(16, 24, 3, 3, 2);
  drawEllipse(25, 25, 3, 2, 40, 1);
  drawEllipse(27, 24, 2, 1.5, 3);
  drawEllipse(12, 28, 1.5, 1, 40, 1);
  drawEllipse(20, 28, 1.5, 1, 40, 1);
  return build();
}

// ─── Cat ──────────────────────────────────────────────────────────────────────
function generateDetailedCat(): SpriteData {
  const { drawEllipse, pixels, build } = createRenderer();
  drawEllipse(9, 6, 2, 4, 41, 1);
  drawEllipse(23, 6, 2, 4, 41, 1);
  drawEllipse(9, 6, 1, 2.5, 44);
  drawEllipse(23, 6, 1, 2.5, 44);
  drawEllipse(16, 14, 8.5, 7, 41, 1);
  drawEllipse(16, 15.5, 4, 3.5, 43);
  drawEllipse(12.5, 13, 1.5, 1.5, 46);
  drawEllipse(19.5, 13, 1.5, 1.5, 46);
  drawEllipse(12.5, 13, 0.6, 1.2, 1);
  drawEllipse(19.5, 13, 0.6, 1.2, 1);
  drawEllipse(16, 16.5, 1, 0.6, 44);
  drawEllipse(16, 23, 6, 5, 41, 1);
  drawEllipse(12, 28, 1.5, 1, 41, 1);
  drawEllipse(20, 28, 1.5, 1, 41, 1);
  drawEllipse(25, 24, 2.5, 1.5, 41, 1);
  pixels[14][10] = 15; pixels[14][22] = 15;
  return build();
}

// ─── Bear ─────────────────────────────────────────────────────────────────────
function generateDetailedBear(): SpriteData {
  const { drawEllipse, build } = createRenderer();
  drawEllipse(8, 6, 3, 3, 42, 1);
  drawEllipse(24, 6, 3, 3, 42, 1);
  drawEllipse(16, 14, 9, 8, 42, 1);
  drawEllipse(16, 17.5, 3.5, 2.5, 49, 1);
  drawEllipse(16, 16.5, 1.5, 1, 22);
  drawEllipse(16, 16.5, 0.8, 0.6, 1);
  drawEllipse(13, 13, 1, 1.2, 1);
  drawEllipse(19, 13, 1, 1.2, 1);
  drawEllipse(16, 24, 7.5, 6, 42, 1);
  drawEllipse(16, 25, 4, 3, 43);
  drawEllipse(12, 29, 2.5, 1, 42, 1);
  drawEllipse(20, 29, 2.5, 1, 42, 1);
  return build();
}

// ─── Bunny ────────────────────────────────────────────────────────────────────
function generateDetailedBunny(): SpriteData {
  const { drawEllipse, build } = createRenderer();
  drawEllipse(10, 5, 2, 5, 43, 1);
  drawEllipse(10, 5, 1, 3.5, 44);
  drawEllipse(22, 5, 2, 5, 43, 1);
  drawEllipse(22, 5, 1, 3.5, 44);
  drawEllipse(16, 14, 8.5, 7.5, 43, 1);
  drawEllipse(12, 16, 2, 1.5, 44);
  drawEllipse(20, 16, 2, 1.5, 44);
  drawEllipse(13, 13, 1, 1.2, 1);
  drawEllipse(19, 13, 1, 1.2, 1);
  drawEllipse(16, 15.5, 1, 0.6, 44);
  drawEllipse(16, 23, 6, 5, 43, 1);
  drawEllipse(11, 28, 2.5, 1, 43, 1);
  drawEllipse(21, 28, 2.5, 1, 43, 1);
  return build();
}

// ─── Penguin ──────────────────────────────────────────────────────────────────
function generateDetailedPenguin(): SpriteData {
  const { drawEllipse, pixels, build } = createRenderer();
  drawEllipse(16, 11, 7, 6.5, 45, 1);
  drawEllipse(16, 11, 5, 4.5, 2);
  drawEllipse(14, 10, 1, 1.2, 1);
  drawEllipse(18, 10, 1, 1.2, 1);
  for (let dy = 0; dy < 2; dy++) {
    for (let dx = -dy; dx <= dy; dx++) {
      pixels[11+dy][16+dx] = 23;
    }
  }
  for (let y = 14; y <= 25; y++) {
    const w = Math.floor((y - 13) * 0.45) + 1;
    for (let dx = -w; dx <= w; dx++) pixels[y][16+dx] = 45;
    pixels[y][16-w] = 1; pixels[y][16+w] = 1;
  }
  for (let y = 16; y <= 23; y++) {
    const w = Math.floor((y - 15) * 0.3) + 1;
    for (let dx = -w; dx <= w; dx++) pixels[y][16+dx] = 2;
  }
  drawEllipse(13, 27, 1.5, 1, 23, 1);
  drawEllipse(19, 27, 1.5, 1, 23, 1);
  drawEllipse(9, 20, 1.5, 2.5, 45, 1);
  drawEllipse(23, 20, 1.5, 2.5, 45, 1);
  return build();
}

// ─── Alien ────────────────────────────────────────────────────────────────────
function generateDetailedAlien(): SpriteData {
  const { drawEllipse, pixels, build } = createRenderer();
  drawEllipse(16, 4, 1.5, 3.5, 48, 1);
  drawEllipse(16, 3, 2, 1.5, 48);
  drawEllipse(16, 16, 10, 11, 46, 1);
  drawEllipse(16, 8, 3, 2.5, 48);
  drawEllipse(16, 7, 2, 1.5, 1);
  drawEllipse(12, 15, 3, 3, 2, 1);
  drawEllipse(20, 15, 3, 3, 2, 1);
  drawEllipse(12, 15, 1.2, 2, 1);
  drawEllipse(20, 15, 1.2, 2, 1);
  pixels[21][15] = 48; pixels[21][16] = 48; pixels[21][17] = 48;
  drawEllipse(12, 28, 3, 1.5, 46, 1);
  drawEllipse(20, 28, 3, 1.5, 46, 1);
  drawEllipse(12, 25, 2, 1, 48);
  drawEllipse(20, 25, 2, 1, 48);
  return build();
}

// ─── Ninja ────────────────────────────────────────────────────────────────────
function generateDetailedNinja(): SpriteData {
  const { drawEllipse, drawRect, pixels, build } = createRenderer();
  drawEllipse(16, 22, 7, 6, 45, 1);
  drawEllipse(16, 12, 7, 7, 45, 1);
  drawEllipse(16, 13.5, 4.5, 3.5, 22);
  for (let y = 9; y <= 11; y++) {
    for (let x = 9; x <= 23; x++) pixels[y][x] = 47;
  }
  for (let x = 9; x <= 23; x++) { pixels[9][x] = 1; pixels[11][x] = 1; }
  pixels[10][8] = 47; pixels[11][7] = 47; pixels[12][6] = 47;
  pixels[10][24] = 47; pixels[11][25] = 47; pixels[12][26] = 47;
  drawEllipse(14, 13, 1, 1, 1);
  drawEllipse(18, 13, 1, 1, 1);
  drawRect(7, 19, 3, 2, 45, 1);
  drawRect(22, 19, 3, 2, 45, 1);
  drawEllipse(13, 28, 2, 1, 45, 1);
  drawEllipse(19, 28, 2, 1, 45, 1);
  return build();
}

export const FOX_IDLE: SpriteData = generateDetailedFox();
export const CAT_IDLE: SpriteData = generateDetailedCat();
export const BEAR_IDLE: SpriteData = generateDetailedBear();
export const BUNNY_IDLE: SpriteData = generateDetailedBunny();
export const PENGUIN_IDLE: SpriteData = generateDetailedPenguin();
export const ALIEN_IDLE: SpriteData = generateDetailedAlien();
export const NINJA_IDLE: SpriteData = generateDetailedNinja();

// ─── Robot (converted from Tools mascot) ──────────────────────────────────────
// Tools palette mapping: 0->0, 1(#546E7A)->50, 2(#EF5350)->47, 3(#FFFFFF)->2, 4(#B0BEC5)->51
const ROBOT_TOOLS_TO_PHONICS: Record<string, number> = {
  '0': 0, '1': 50, '2': 47, '3': 2, '4': 51,
};

const ROBOT_TOOLS_DATA = [
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
  '00000000000000020000000000000000',
  '00000000000000222000000000000000',
  '00000000000000111000000000000000',
  '00000000000000111000000000000000',
  '00000000000001111000000000000000',
  '00000000000011111100000000000000',
  '00000000000111111110000000000000',
  '00000000001111111111000000000000',
  '00000001111111111111111100000000',
  '00000001111111111111111100000000',
  '00000001111111111111111100000000',
  '00000001111111111111111100000000',
  '00000001111122333223332111110000',
  '00000001111122333223332111110000',
  '00000001111111111111111100000000',
  '00000001111111111111111100000000',
  '00000001111134444444443111110000',
  '00000001111134222222443111110000',
  '00000001111134444444443111110000',
  '00000001111111111111111100000000',
  '00000001111144444444441111110000',
  '00000001111144444444441111110000',
  '00000001111111111111111100000000',
  '00000001111111111111111100000000',
  '00000001111111111111111100000000',
  '00000000111111111111111110000000',
  '00000000001111111111110000000000',
  '00000000000011111111000000000000',
  '00000000000000000000000000000000',
  '00000000000000000000000000000000',
];

function generateDetailedRobot(): SpriteData {
  const pixels: number[][] = ROBOT_TOOLS_DATA.map(row =>
    [...row].map(ch => ROBOT_TOOLS_TO_PHONICS[ch] ?? 0)
  );
  return { width: 32, height: 32, pixels };
}

function generateDetailedRobotHead(): SpriteData {
  const fullPixels = generateDetailedRobot().pixels;
  const pixels: number[][] = Array.from({ length: 32 }, () => new Array(32).fill(0));
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 32; x++) {
      if (fullPixels[y]?.[x]) pixels[y][x] = fullPixels[y][x];
    }
  }
  return { width: 32, height: 32, pixels };
}

export const ROBOT_IDLE: SpriteData = generateDetailedRobot();
export const AVATAR_ROBOT_HEAD: SpriteData = generateDetailedRobotHead();

// ─── Avatar Mini-Icons (16×16) ────────────────────────────────────────────────
export const AVATAR_NOX: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 3, 1, 22, 22, 22, 1, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 3, 1, 22, 1, 22, 1, 22, 1, 3, 0, 0, 0, 0],
    [0, 0, 0, 3, 22, 22, 22, 22, 22, 22, 22, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 3, 22, 22, 22, 22, 22, 3, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 14, 14, 14, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 1, 3, 1, 3, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const AVATAR_MIRA: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 0, 1, 13, 13, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 13, 13, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 22, 22, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 22, 1, 22, 22, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 22, 22, 22, 22, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 24, 24, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 24, 24, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 24, 24, 24, 24, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 24, 1, 1, 24, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const AVATAR_CHIP: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 26, 26, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 14, 14, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 25, 25, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 25, 14, 14, 25, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 25, 25, 25, 25, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 25, 1, 1, 25, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 25, 1, 1, 25, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const AVATAR_FOX: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 0, 40, 0, 0, 40, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 40, 0, 0, 0, 0, 40, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 40, 40, 40, 40, 40, 40, 40, 40, 0, 0, 0, 0],
    [0, 0, 0, 0, 40, 1, 1, 1, 1, 1, 1, 40, 0, 0, 0, 0],
    [0, 0, 0, 0, 40, 1, 1, 2, 2, 1, 1, 40, 0, 0, 0, 0],
    [0, 0, 0, 0, 40, 1, 1, 1, 1, 1, 1, 40, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 40, 1, 1, 1, 1, 40, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 40, 1, 1, 40, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const AVATAR_CAT: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 41, 0, 0, 0, 0, 41, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 41, 0, 0, 41, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 41, 41, 41, 41, 41, 41, 41, 41, 0, 0, 0, 0],
    [0, 0, 0, 0, 41, 1, 1, 1, 1, 1, 1, 41, 0, 0, 0, 0],
    [0, 0, 0, 0, 41, 1, 1, 46, 46, 1, 1, 41, 0, 0, 0, 0],
    [0, 0, 0, 0, 41, 1, 1, 1, 1, 1, 1, 41, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 41, 1, 1, 1, 1, 41, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 41, 1, 1, 41, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const AVATAR_BEAR: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 42, 42, 0, 0, 0, 0, 42, 42, 0, 0, 0, 0],
    [0, 0, 0, 0, 42, 42, 0, 0, 0, 0, 42, 42, 0, 0, 0, 0],
    [0, 0, 0, 0, 42, 42, 42, 42, 42, 42, 42, 42, 0, 0, 0, 0],
    [0, 0, 0, 0, 42, 1, 1, 1, 1, 1, 1, 42, 0, 0, 0, 0],
    [0, 0, 0, 0, 42, 1, 49, 1, 1, 1, 1, 42, 0, 0, 0, 0],
    [0, 0, 0, 0, 42, 1, 1, 49, 1, 1, 1, 42, 0, 0, 0, 0],
    [0, 0, 0, 0, 42, 1, 1, 1, 1, 1, 1, 42, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 42, 42, 42, 42, 42, 42, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const AVATAR_BUNNY: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 43, 0, 0, 0, 0, 43, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 43, 44, 43, 0, 0, 43, 44, 43, 0, 0, 0, 0],
    [0, 0, 0, 0, 43, 44, 43, 0, 0, 43, 44, 43, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 43, 44, 43, 43, 44, 43, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 43, 1, 1, 1, 1, 43, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 43, 1, 44, 44, 1, 43, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 43, 1, 1, 1, 1, 43, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 43, 1, 1, 43, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const AVATAR_PENGUIN: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 0, 45, 45, 45, 45, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 45, 1, 1, 1, 1, 45, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 45, 1, 1, 1, 1, 45, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 45, 1, 2, 2, 1, 45, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 45, 1, 1, 1, 1, 45, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 45, 1, 1, 1, 1, 45, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 45, 1, 1, 45, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 23, 23, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const AVATAR_ALIEN: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 0, 48, 0, 0, 48, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 48, 1, 48, 48, 1, 48, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 46, 46, 46, 46, 46, 46, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 46, 1, 1, 1, 1, 46, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 46, 1, 1, 1, 1, 46, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 46, 1, 2, 2, 1, 46, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 46, 1, 1, 1, 1, 46, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 46, 1, 1, 46, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const AVATAR_NINJA: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 0, 47, 0, 0, 47, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 47, 0, 0, 47, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 47, 47, 47, 47, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 47, 47, 1, 1, 47, 47, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 47, 1, 1, 1, 1, 47, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 47, 1, 1, 1, 1, 47, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 47, 1, 1, 47, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

// ─── Decorative Sprites ───────────────────────────────────────────────────────
export const SUN_16: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 16, 2, 16, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  ],
};

export const SUN_16B: SpriteData = {
  width: 16,
  height: 16,
  pixels: [
    [0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 16, 0, 0, 0, 16, 2, 16, 0, 0, 0, 16, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0],
    [16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0],
    [0, 0, 0, 0, 0, 0, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 16, 0, 0, 0, 16, 2, 16, 0, 0, 0, 16, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 16, 16, 16, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0],
  ],
};

export const CLOUDS: SpriteData[] = [
  {
    width: 16, height: 8,
    pixels: [
      [0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
      [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    width: 18, height: 10,
    pixels: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    width: 20, height: 12,
    pixels: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
      [0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
  {
    width: 14, height: 6,
    pixels: [
      [0, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
      [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
  },
];

export const BIRD_V: SpriteData[] = [
  { width: 8, height: 4, pixels: [[0,0,0,1,1,0,0,0],[0,0,0,0,0,0,0,0],[0,1,0,0,0,0,1,0],[0,0,1,0,0,1,0,0]] },
  { width: 8, height: 4, pixels: [[0,0,0,0,0,0,0,0],[0,0,0,1,1,0,0,0],[0,1,0,0,0,0,1,0],[0,0,1,0,0,1,0,0]] },
];

export const FISH: SpriteData[] = [
  { width: 8, height: 4, pixels: [[0,0,0,6,6,6,0,0],[0,6,6,6,6,6,6,0],[0,0,6,6,6,6,6,6],[0,0,0,0,0,0,0,0]] },
  { width: 8, height: 4, pixels: [[0,0,0,6,6,6,0,0],[0,6,6,6,6,6,0,6],[0,0,6,6,6,6,6,0],[0,0,0,0,0,0,0,0]] },
];

export const BOAT: SpriteData = {
  width: 16, height: 12,
  pixels: [
    [0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,2,2,2,2,2,0,0,0,0,0],
    [0,0,0,0,0,2,2,2,2,2,2,2,0,0,0,0],
    [0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,2,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,3,3,3,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [1,21,21,21,21,21,21,21,21,21,21,21,21,21,21,1],
    [1,21,21,21,21,21,21,21,21,21,21,21,21,21,21,1],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const DOCK: SpriteData = {
  width: 16, height: 8,
  pixels: [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21],
    [21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

export const SPLASH: SpriteData = {
  width: 8, height: 8,
  pixels: [
    [0,0,0,0,0,0,0,0],
    [0,0,0,16,16,0,0,0],
    [0,0,16,2,16,16,0,0],
    [0,16,16,2,2,16,0,0],
    [0,0,16,2,16,16,0,0],
    [0,0,0,16,16,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
};

export const ROTATE_PHONE: SpriteData = {
  width: 16, height: 16,
  pixels: [
    [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
    [0,0,0,1,1,39,39,39,39,1,1,0,0,0,0,0],
    [0,0,1,1,39,39,39,39,39,39,1,1,0,0,0,0],
    [0,1,1,39,39,39,39,39,39,39,39,1,1,0,0,0],
    [0,1,1,39,39,39,39,39,39,39,39,1,1,0,0,0],
    [0,1,1,39,39,39,39,39,39,39,39,1,1,0,0,0],
    [0,1,1,39,39,39,39,39,39,39,39,1,1,0,0,0],
    [0,1,1,39,39,39,39,39,39,39,39,1,1,0,0,0],
    [0,1,1,39,39,39,39,39,39,39,39,1,1,0,0,0],
    [0,1,1,39,39,39,39,39,39,39,39,1,1,0,0,0],
    [0,1,1,39,39,39,39,39,39,39,39,1,1,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
};

// ─── Drawing Utilities ────────────────────────────────────────────────────────
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteData,
  destX: number,
  destY: number,
  scale: number,
): void {
  const palette = sprite.customPalette || PALETTE;
  for (let row = 0; row < sprite.height; row++) {
    for (let col = 0; col < sprite.width; col++) {
      const idx = sprite.pixels[row][col];
      if (idx === 0) continue;
      const color = palette[idx];
      if (!color || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(destX + col * scale, destY + row * scale, scale, scale);
    }
  }
}

export function drawSpriteFlipped(
  ctx: CanvasRenderingContext2D,
  sprite: SpriteData,
  destX: number,
  destY: number,
  scale: number,
  flipH: boolean,
  flipV: boolean,
): void {
  const palette = sprite.customPalette || PALETTE;
  for (let row = 0; row < sprite.height; row++) {
    for (let col = 0; col < sprite.width; col++) {
      const srcRow = flipV ? sprite.height - 1 - row : row;
      const srcCol = flipH ? sprite.width - 1 - col : col;
      const idx = sprite.pixels[srcRow][srcCol];
      if (idx === 0) continue;
      const color = palette[idx];
      if (!color || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(destX + col * scale, destY + row * scale, scale, scale);
    }
  }
}

export function drawMascotIdle(
  ctx: CanvasRenderingContext2D,
  frame: number,
  destX: number,
  destY: number,
  scale: number,
): void {
  const pixels = MASCOT_IDLE.pixels.map((row) => [...row]);
  switch (frame % 4) {
    case 0: break; // normal
    case 1: // blink — close eyes
      pixels[2][6] = 22;
      pixels[2][8] = 22;
      break;
    case 2: break; // normal
    case 3: { // breathe — expand chest by 1px each side
      for (let r = 7; r <= 10; r++) {
        pixels[r][5] = 14;
        pixels[r][10] = 14;
      }
      break;
    }
  }
  for (let r = 0; r < 16; r++) {
    for (let c = 0; c < 16; c++) {
      const idx = pixels[r][c];
      if (idx === 0) continue;
      const color = PALETTE[idx];
      if (!color || color === 'transparent') continue;
      ctx.fillStyle = color;
      ctx.fillRect(destX + c * scale, destY + r * scale, scale, scale);
    }
  }
}

// ─── Blink System ──────────────────────────────────────────────────────────────
// Eye-close regions for each mascot head: ellipse params + face color to paint over
type EyeRegion = { cx: number; cy: number; rx: number; ry: number; faceColor: number };
const EYE_CLOSE_REGIONS: Record<string, EyeRegion[]> = {
  nox: [
    { cx: 11, cy: 16.5, rx: 1.5, ry: 2, faceColor: 22 },
    { cx: 21, cy: 16.5, rx: 1.5, ry: 2, faceColor: 22 },
  ],
  mira: [
    { cx: 13.5, cy: 21.5, rx: 0.75, ry: 1.5, faceColor: 22 },
    { cx: 18.5, cy: 21.5, rx: 0.75, ry: 1.5, faceColor: 22 },
  ],
  chip: [
    { cx: 13, cy: 16, rx: 3, ry: 3, faceColor: 1 },
    { cx: 19, cy: 16, rx: 3, ry: 3, faceColor: 1 },
  ],
  fox: [
    { cx: 11, cy: 16.5, rx: 2, ry: 2.5, faceColor: 2 },
    { cx: 21, cy: 16.5, rx: 2, ry: 2.5, faceColor: 2 },
  ],
  cat: [
    { cx: 11, cy: 16, rx: 2, ry: 2, faceColor: 43 },
    { cx: 21, cy: 16, rx: 2, ry: 2, faceColor: 43 },
  ],
  bear: [
    { cx: 11, cy: 16, rx: 1.5, ry: 1.8, faceColor: 22 },
    { cx: 21, cy: 16, rx: 1.5, ry: 1.8, faceColor: 22 },
  ],
  bunny: [
    { cx: 11, cy: 15, rx: 1.5, ry: 1.8, faceColor: 44 },
    { cx: 21, cy: 15, rx: 1.5, ry: 1.8, faceColor: 44 },
  ],
  penguin: [
    { cx: 12, cy: 13, rx: 1.5, ry: 1.8, faceColor: 2 },
    { cx: 20, cy: 13, rx: 1.5, ry: 1.8, faceColor: 2 },
  ],
  alien: [
    { cx: 10, cy: 16, rx: 1.5, ry: 3, faceColor: 46 },
    { cx: 22, cy: 16, rx: 1.5, ry: 3, faceColor: 46 },
  ],
  ninja: [
    { cx: 13, cy: 17.5, rx: 1.5, ry: 1.5, faceColor: 22 },
    { cx: 19, cy: 17.5, rx: 1.5, ry: 1.5, faceColor: 22 },
  ],
  robot: [
    { cx: 12, cy: 18.5, rx: 2, ry: 2, faceColor: 50 },
    { cx: 20, cy: 18.5, rx: 2, ry: 2, faceColor: 50 },
  ],
};

export function blinkSprite(sprite: SpriteData, companionId: string): SpriteData {
  const regions = EYE_CLOSE_REGIONS[companionId];
  if (!regions) return sprite;
  const pixels = sprite.pixels.map((row) => [...row]);
  for (const { cx, cy, rx, ry, faceColor } of regions) {
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          pixels[y][x] = faceColor;
        }
      }
    }
  }
  return { width: sprite.width, height: sprite.height, pixels, customPalette: sprite.customPalette };
}

// ─── Head Sprite Generators ───────────────────────────────────────────────────
function generateDetailedNoxHead(): SpriteData {
  const pixels: number[][] = Array.from({ length: 32 }, () => new Array(32).fill(0));

  const drawEllipse = (cx: number, cy: number, rx: number, ry: number, color: number, outlineColor?: number) => {
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          pixels[y][x] = color;
        }
      }
    }
    if (outlineColor !== undefined) {
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          if (pixels[y][x] === color) {
            let isBorder = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < 32 && nx >= 0 && nx < 32) {
                  if (pixels[ny][nx] === 0) {
                    isBorder = true;
                    break;
                  }
                }
              }
              if (isBorder) break;
            }
            if (isBorder) {
              pixels[y][x] = outlineColor;
            }
          }
        }
      }
    }
  };

  // 1. Ears
  drawEllipse(7, 8, 2.5, 5.5, 3, 1);
  drawEllipse(25, 8, 2.5, 5.5, 3, 1);

  // 2. Head
  drawEllipse(16, 16.5, 12, 10, 3, 1);

  // 3. Face mask
  drawEllipse(11, 17, 5, 5, 22);
  drawEllipse(21, 17, 5, 5, 22);

  // 4. Eyes
  drawEllipse(11, 16.5, 1.5, 2, 1);
  drawEllipse(21, 16.5, 1.5, 2, 1);
  pixels[16][12] = 2; // Glints
  pixels[16][22] = 2;

  // 5. Beak
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = -dy; dx <= dy; dx++) {
      const px = 16 + dx;
      const py = 18.5 + dy;
      const rpy = Math.floor(py);
      if (px >= 0 && px < 32 && rpy >= 0 && rpy < 32) {
        pixels[rpy][px] = 23;
      }
    }
  }
  // Beak outline
  pixels[18][16] = 1;
  pixels[19][15] = 1;
  pixels[19][17] = 1;
  pixels[20][16] = 1;

  // Blush cheeks
  pixels[19][7] = 15;
  pixels[19][8] = 15;
  pixels[19][23] = 15;
  pixels[19][24] = 15;

  return { width: 32, height: 32, pixels };
}

function generateDetailedMiraHead(): SpriteData {
  const pixels: number[][] = Array.from({ length: 32 }, () => new Array(32).fill(0));

  const drawEllipse = (cx: number, cy: number, rx: number, ry: number, color: number, outlineColor?: number) => {
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const dx = (x - cx) / rx;
        const dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          pixels[y][x] = color;
        }
      }
    }
    if (outlineColor !== undefined) {
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          if (pixels[y][x] === color) {
            let isBorder = false;
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < 32 && nx >= 0 && nx < 32) {
                  if (pixels[ny][nx] === 0) {
                    isBorder = true;
                    break;
                  }
                }
              }
              if (isBorder) break;
            }
            if (isBorder) {
              pixels[y][x] = outlineColor;
            }
          }
        }
      }
    }
  };

  // 1. Hair
  drawEllipse(9.5, 22, 2.5, 5.5, 2, 1);
  drawEllipse(22.5, 22, 2.5, 5.5, 2, 1);

  // 2. Head
  drawEllipse(16, 21.5, 7, 6.5, 22, 1);

  // 3. Hat cone
  for (let y = 4; y <= 16; y++) {
    const w = Math.floor((y - 4) * 0.6) + 0.5;
    for (let dx = -Math.floor(w); dx <= Math.floor(w); dx++) {
      pixels[y][16 + dx] = 13;
    }
  }
  for (let y = 4; y <= 16; y++) {
    const w = Math.floor((y - 4) * 0.6) + 0.5;
    pixels[y][16 - Math.floor(w)] = 1;
    pixels[y][16 + Math.floor(w)] = 1;
  }

  // 4. Hat brim
  drawEllipse(16, 17, 12.5, 2, 13, 1);

  // 5. Buckle
  for (let y = 15; y <= 16; y++) {
    for (let x = 14; x <= 18; x++) {
      pixels[y][x] = 3;
    }
  }
  pixels[15][16] = 1;

  // 6. Eyes & blush
  drawEllipse(13.5, 21.5, 0.75, 1.5, 1);
  drawEllipse(18.5, 21.5, 0.75, 1.5, 1);
  pixels[22][11] = 15;
  pixels[22][20] = 15;

  // Smile
  pixels[23][15] = 1;
  pixels[23][16] = 1;
  pixels[23][17] = 1;

  return { width: 32, height: 32, pixels };
}

function generateDetailedChipHead(): SpriteData {
  const pixels: number[][] = Array.from({ length: 32 }, () => new Array(32).fill(0));

  const drawRect = (x1: number, y1: number, w: number, h: number, color: number, outlineColor?: number) => {
    for (let y = y1; y < y1 + h; y++) {
      for (let x = x1; x < x1 + w; x++) {
        if (x >= 0 && x < 32 && y >= 0 && y < 32) {
          pixels[y][x] = color;
        }
      }
    }
    if (outlineColor !== undefined) {
      for (let y = y1; y < y1 + h; y++) {
        for (let x = x1; x < x1 + w; x++) {
          if (x === x1 || x === x1 + w - 1 || y === y1 || y === y1 + h - 1) {
            if (x >= 0 && x < 32 && y >= 0 && y < 32) {
              pixels[y][x] = outlineColor;
            }
          }
        }
      }
    }
  };

  // 1. Antenna
  drawRect(15, 7, 2, 5, 26, 1);
  drawRect(15, 4, 2, 3, 16, 1);

  // 2. Head (Monitor screen body)
  drawRect(6, 11, 20, 16, 25, 1);
  drawRect(7, 12, 18, 1, 26);
  drawRect(7, 13, 1, 13, 26);

  // 3. Visor
  drawRect(9, 15, 14, 8, 1, 1);

  // 4. Glowing eye
  drawRect(13, 16, 6, 6, 14);
  pixels[17][15] = 2; // Glint
  pixels[17][16] = 2;

  // 5. Cheek lights
  pixels[24][24] = 16;
  pixels[7][24] = 16;

  return { width: 32, height: 32, pixels };
}

// ─── Fox Head ────────────────────────────────────────────────────────────────
function generateDetailedFoxHead(): SpriteData {
  const { drawEllipse, pixels, build } = createRenderer();
  drawEllipse(7, 8, 3, 5.5, 40, 1);
  drawEllipse(25, 8, 3, 5.5, 40, 1);
  drawEllipse(16, 16.5, 13, 11, 40, 1);
  drawEllipse(16, 18, 5.5, 4, 2);
  drawEllipse(11, 16.5, 2, 2.5, 1);
  drawEllipse(21, 16.5, 2, 2.5, 1);
  pixels[16][12] = 2; pixels[16][22] = 2;
  drawEllipse(16, 19, 1.5, 1, 1);
  pixels[20][10] = 15; pixels[20][11] = 15;
  pixels[20][21] = 15; pixels[20][22] = 15;
  return build();
}

// ─── Cat Head ────────────────────────────────────────────────────────────────
function generateDetailedCatHead(): SpriteData {
  const { drawEllipse, pixels, build } = createRenderer();
  drawEllipse(7, 8, 3, 5.5, 41, 1);
  drawEllipse(25, 8, 3, 5.5, 41, 1);
  drawEllipse(7, 9, 1.5, 3.5, 44);
  drawEllipse(25, 9, 1.5, 3.5, 44);
  drawEllipse(16, 17, 13, 11, 41, 1);
  drawEllipse(16, 18.5, 5.5, 4.5, 43);
  drawEllipse(11, 16, 2, 2, 46);
  drawEllipse(21, 16, 2, 2, 46);
  drawEllipse(11, 16, 1, 1.8, 1);
  drawEllipse(21, 16, 1, 1.8, 1);
  drawEllipse(16, 19.5, 1.2, 0.8, 44);
  pixels[22][10] = 15; pixels[22][11] = 15;
  pixels[22][21] = 15; pixels[22][22] = 15;
  return build();
}

// ─── Bear Head ───────────────────────────────────────────────────────────────
function generateDetailedBearHead(): SpriteData {
  const { drawEllipse, build } = createRenderer();
  drawEllipse(7, 8, 4, 4, 42, 1);
  drawEllipse(25, 8, 4, 4, 42, 1);
  drawEllipse(16, 17, 13, 11.5, 42, 1);
  drawEllipse(16, 20, 5, 3.5, 49, 1);
  drawEllipse(16, 19, 2, 1.5, 22);
  drawEllipse(16, 19, 1, 0.8, 1);
  drawEllipse(11, 16, 1.5, 1.8, 1);
  drawEllipse(21, 16, 1.5, 1.8, 1);
  return build();
}

// ─── Bunny Head ──────────────────────────────────────────────────────────────
function generateDetailedBunnyHead(): SpriteData {
  const { drawEllipse, build } = createRenderer();
  drawEllipse(9, 5, 2.5, 6, 43, 1);
  drawEllipse(9, 5, 1.5, 4.5, 44);
  drawEllipse(23, 5, 2.5, 6, 43, 1);
  drawEllipse(23, 5, 1.5, 4.5, 44);
  drawEllipse(16, 17, 12, 10, 43, 1);
  drawEllipse(11, 18, 3, 2, 44);
  drawEllipse(21, 18, 3, 2, 44);
  drawEllipse(11, 15, 1.5, 1.8, 1);
  drawEllipse(21, 15, 1.5, 1.8, 1);
  drawEllipse(16, 18.5, 1.2, 0.8, 44);
  return build();
}

// ─── Penguin Head ────────────────────────────────────────────────────────────
function generateDetailedPenguinHead(): SpriteData {
  const { drawEllipse, pixels, build } = createRenderer();
  drawEllipse(16, 16, 10, 11, 45, 1);
  drawEllipse(16, 14.5, 7.5, 7, 2);
  drawEllipse(12, 13, 1.5, 1.8, 1);
  drawEllipse(20, 13, 1.5, 1.8, 1);
  pixels[15][12] = 2; pixels[15][20] = 2;
  for (let dy = 0; dy < 3; dy++) {
    for (let dx = -dy; dx <= dy; dx++) {
      pixels[17+dy][16+dx] = 23;
    }
  }
  pixels[17][16] = 1;
  return build();
}

// ─── Alien Head ──────────────────────────────────────────────────────────────
function generateDetailedAlienHead(): SpriteData {
  const { drawEllipse, pixels, build } = createRenderer();
  drawEllipse(16, 4, 3, 5, 48, 1);
  drawEllipse(16, 3, 4, 2.5, 48);
  drawEllipse(16, 17, 14, 13, 46, 1);
  drawEllipse(16, 9, 4.5, 3, 48);
  drawEllipse(16, 8, 3, 2, 1);
  drawEllipse(10, 16, 4, 4, 2, 1);
  drawEllipse(22, 16, 4, 4, 2, 1);
  drawEllipse(10, 16, 1.5, 3, 1);
  drawEllipse(22, 16, 1.5, 3, 1);
  pixels[23][15] = 48; pixels[23][16] = 48; pixels[23][17] = 48;
  return build();
}

// ─── Ninja Head ──────────────────────────────────────────────────────────────
function generateDetailedNinjaHead(): SpriteData {
  const { drawEllipse, pixels, build } = createRenderer();
  drawEllipse(16, 17, 11, 11, 45, 1);
  drawEllipse(16, 18, 6, 4.5, 22);
  for (let y = 9; y <= 12; y++) {
    for (let x = 6; x <= 26; x++) pixels[y][x] = 47;
  }
  for (let x = 6; x <= 26; x++) { pixels[9][x] = 1; pixels[12][x] = 1; }
  pixels[10][5] = 47; pixels[11][4] = 47; pixels[12][3] = 47;
  pixels[10][27] = 47; pixels[11][28] = 47; pixels[12][29] = 47;
  drawEllipse(13, 17.5, 1.5, 1.5, 1);
  drawEllipse(19, 17.5, 1.5, 1.5, 1);
  return build();
}

export const AVATAR_NOX_HEAD: SpriteData = generateDetailedNoxHead();
export const AVATAR_MIRA_HEAD: SpriteData = generateDetailedMiraHead();
export const AVATAR_CHIP_HEAD: SpriteData = generateDetailedChipHead();

export const AVATAR_FOX_HEAD: SpriteData = generateDetailedFoxHead();
export const AVATAR_CAT_HEAD: SpriteData = generateDetailedCatHead();
export const AVATAR_BEAR_HEAD: SpriteData = generateDetailedBearHead();
export const AVATAR_BUNNY_HEAD: SpriteData = generateDetailedBunnyHead();
export const AVATAR_PENGUIN_HEAD: SpriteData = generateDetailedPenguinHead();
export const AVATAR_ALIEN_HEAD: SpriteData = generateDetailedAlienHead();
export const AVATAR_NINJA_HEAD: SpriteData = generateDetailedNinjaHead();

export const HEAD_ACC_Y_OFFSET: Record<string, number> = {
  nox: 4, mira: 6, chip: 7, fox: 4, cat: 3, bear: 3,
  bunny: 2, penguin: 3, alien: 1, ninja: 4, robot: 0,
};

export const HEAD_CONFIG = {
  nox: { x: 0, y: 0, scale: 1 },
  mira: { x: 0, y: 0, scale: 1 },
  chip: { x: 0, y: 0, scale: 1 },
  fox: { x: 0, y: 0, scale: 1 },
  cat: { x: 0, y: 0, scale: 1 },
  bear: { x: 0, y: 0, scale: 1 },
  bunny: { x: 0, y: 0, scale: 1 },
  penguin: { x: 0, y: 0, scale: 1 },
  alien: { x: 0, y: 0, scale: 1 },
  ninja: { x: 0, y: 0, scale: 1 },
  robot: { x: 0, y: 0, scale: 1 },
};

// ─── Accessory Sprites ──────────────────────────────────────────────────────────
type Pixel = [x: number, y: number, c: number];

function acc(...pixels: Pixel[]): SpriteData {
  const grid: number[][] = Array.from({ length: 32 }, () => new Array(32).fill(0));
  for (const [x, y, c] of pixels) {
    if (x >= 0 && x < 32 && y >= 0 && y < 32) grid[y][x] = c;
  }
  return { width: 32, height: 32, pixels: grid };
}

const ACC_MONOCLE = acc(
  [18, 8, 3], [19, 8, 3], [20, 8, 3],
  [17, 9, 3], [21, 9, 3],
  [17, 10, 3], [21, 10, 3],
  [17, 11, 3], [21, 11, 3],
  [18, 12, 3], [19, 12, 3], [20, 12, 3],
  [21, 13, 3], [21, 14, 3], [21, 15, 3],
);

const ACC_STAR_WAND = acc(
  [23, 25, 42], [24, 24, 42], [25, 23, 42], [26, 22, 42], [27, 21, 42], [28, 20, 42],
  [28, 18, 16], [27, 19, 16], [28, 19, 16], [29, 19, 16], [28, 20, 16],
);

const ACC_ANTENNA_GLOW = acc(
  [14, 2, 16], [15, 2, 16], [16, 2, 16],
  [14, 3, 16], [16, 3, 16],
  [15, 1, 16],
);

const ACC_FOX_LEAF = acc(
  [25, 6, 7], [26, 5, 7], [27, 5, 7],
  [26, 6, 7], [27, 7, 7],
  [25, 7, 1],
);

const ACC_YARN = acc(
  [25, 25, 44], [26, 25, 44], [27, 25, 44],
  [25, 26, 44], [27, 26, 44],
  [25, 27, 44], [26, 27, 44], [27, 27, 44],
  [26, 26, 2],
);

const ACC_HONEY_POT = acc(
  [14, 25, 3], [15, 25, 3], [16, 25, 3], [17, 25, 3], [18, 25, 3],
  [13, 26, 3], [14, 26, 3], [15, 26, 3], [16, 26, 3], [17, 26, 3], [18, 26, 3], [19, 26, 3],
  [13, 27, 3], [19, 27, 3],
  [16, 26, 16],
);

const ACC_CARROT = acc(
  [12, 26, 40], [13, 27, 40],
  [13, 28, 40], [14, 29, 40],
  [11, 26, 7], [12, 27, 7],
);

const ACC_SCARF = acc(
  [13, 15, 47], [14, 15, 47], [15, 15, 47], [16, 15, 47], [17, 15, 47], [18, 15, 47], [19, 15, 47],
  [12, 16, 47], [19, 16, 47],
  [20, 16, 47], [20, 17, 47],
);

const ACC_GOGGLES = acc(
  [10, 14, 48], [11, 13, 48], [12, 13, 48], [13, 14, 48],
  [19, 14, 48], [20, 13, 48], [21, 13, 48], [22, 14, 48],
  [14, 14, 1], [15, 13, 1], [16, 13, 1], [17, 14, 1],
  [11, 12, 2], [12, 12, 2], [20, 12, 2], [21, 12, 2],
);

const ACC_KATANA = acc(
  [6, 12, 47], [7, 11, 47],
  [8, 10, 47], [9, 9, 47], [10, 8, 47],
  [11, 7, 47], [12, 6, 47],
  [7, 13, 1], [8, 14, 1],
  [11, 9, 2],
);

const ACC_GEAR = acc(
  [14, 18, 50], [15, 17, 50], [16, 17, 50], [17, 18, 50],
  [17, 19, 50], [18, 20, 50], [17, 21, 50], [16, 22, 50],
  [15, 22, 50], [14, 21, 50], [13, 20, 50], [14, 19, 50],
  [15, 19, 16], [16, 19, 16], [15, 20, 16], [16, 20, 16],
  [16, 18, 1], [14, 20, 1], [16, 22, 1],
);

export const ACC_SPRITES: Record<string, SpriteData> = {
  monocle: ACC_MONOCLE,
  star_wand: ACC_STAR_WAND,
  antenna_glow: ACC_ANTENNA_GLOW,
  fox_leaf: ACC_FOX_LEAF,
  yarn: ACC_YARN,
  honey_pot: ACC_HONEY_POT,
  carrot: ACC_CARROT,
  scarf: ACC_SCARF,
  goggles: ACC_GOGGLES,
  katana: ACC_KATANA,
  gear: ACC_GEAR,
};
