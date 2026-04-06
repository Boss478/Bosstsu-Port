export interface NumberData {
  num: number;
  eng: string;
  thai: string;
  spell: string;
  missing: string;
  wrongLetters: string[];
}

const UNITS = ["", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
const TEENS = ["TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

const THAI_UNITS = ["", "วัน", "ทู", "ทรี", "โฟร์", "ไฟฟ์", "ซิกส์", "เซเว่น", "เอท", "ไนน์"];
const THAI_TEENS = ["เท็น", "อิเลฟเว่น", "ทเวลฟ์", "เทอร์ทีน", "ฟอร์ทีน", "ฟิฟทีน", "ซิกส์ทีน", "เซเว่นทีน", "เอททีน", "ไนน์ทีน"];
const THAI_TENS = ["", "", "ทเวนตี้", "เทอร์ตี้", "ฟอร์ตี้", "ฟิฟตี้", "ซิกส์ตี้", "เซเว่นตี้", "เอทตี้", "ไนน์ตี้"];

export function getNumberData(n: number): NumberData {
  let eng = "";
  let thai = "";

  if (n === 0) {
    eng = "ZERO";
    thai = "ซีโร่";
  } else if (n < 10) {
    eng = UNITS[n];
    thai = THAI_UNITS[n];
  } else if (n < 20) {
    eng = TEENS[n - 10];
    thai = THAI_TEENS[n - 10];
  } else if (n < 100) {
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    eng = TENS[ten] + (unit > 0 ? "-" + UNITS[unit] : "");
    thai = THAI_TENS[ten] + (unit > 0 ? "-" + THAI_UNITS[unit] : "");
  } else {
    eng = "ONE HUNDRED";
    thai = "วัน ฮันเดรด";
  }

  // Spell-checking logic (Level 3)
  // Create a version with one missing letter
  let spell = eng;
  let missing = "";
  let wrongLetters: string[] = [];

  // Find a suitable index to hide (alphabetic char)
  const availableIndices = [];
  for (let i = 0; i < eng.length; i++) {
    if (eng[i] >= 'A' && eng[i] <= 'Z') availableIndices.push(i);
  }
  
  const hideIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
  missing = eng[hideIdx];
  spell = eng.substring(0, hideIdx) + "_" + eng.substring(hideIdx + 1);

  // Generate wrong letters
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  while (wrongLetters.length < 2) {
    const r = ALPHABET[Math.floor(Math.random() * 26)];
    if (r !== missing && !wrongLetters.includes(r)) wrongLetters.push(r);
  }

  return { num: n, eng, thai, spell, missing, wrongLetters };
}
