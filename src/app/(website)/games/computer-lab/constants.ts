import type { Screen } from "./types";

export const SCREENS: { key: Screen; labelTh: string; labelEn: string }[] = [
  { key: "menu", labelTh: "เมนู", labelEn: "Menu" },
  { key: "hardware", labelTh: "ฮาร์ดแวร์", labelEn: "Hardware" },
  { key: "software", labelTh: "ซอฟต์แวร์", labelEn: "Software" },
  { key: "workflow", labelTh: "การทำงาน", labelEn: "Workflow" },
  { key: "build", labelTh: "ประกอบเครื่อง", labelEn: "Build PC" },
  { key: "diagnosis", labelTh: "วินิจฉัย", labelEn: "Diagnosis" },
  { key: "victory", labelTh: "ชนะ", labelEn: "Victory" },
];

export const CRT_CLASS = "crt-scanline";

export const SPRITE_SIZE = 32;
