const VOWELS = new Set(['A', 'E', 'I', 'O', 'U']);

export interface SessionLetterStats {
  correct: number;
  wrong: number;
}

export function generateAnalysis(
  accuracyPercent: number,
  sessionLetterStats: Record<string, SessionLetterStats>,
  subStageLetters: string[],
): { english: string; thai: string } {
  const highs: string[] = [];
  const lows: string[] = [];
  const vowelLows: string[] = [];
  let vowelSum = 0;
  let vowelCount = 0;
  let consonantSum = 0;
  let consonantCount = 0;

  for (const letter of subStageLetters) {
    const stats = sessionLetterStats[letter];
    if (!stats) continue;
    const total = stats.correct + stats.wrong;
    if (total === 0) continue;
    const pct = (stats.correct / total) * 100;
    if (pct > 80) highs.push(letter);
    else if (pct < 60) {
      lows.push(letter);
      if (VOWELS.has(letter)) vowelLows.push(letter);
    }
    if (VOWELS.has(letter)) {
      vowelSum += pct;
      vowelCount++;
    } else {
      consonantSum += pct;
      consonantCount++;
    }
  }

  const letterCount = highs.length + lows.length;
  if (accuracyPercent === 100) {
    return {
      english: `Perfect! All ${letterCount} letters correct! You're a superstar!`,
      thai: `สมบูรณ์แบบ! ทั้ง ${letterCount} ตัวอักษรถูกต้อง! คุณคือซุปเปอร์สตาร์!`,
    };
  }

  let en = '';
  let th = '';

  if (accuracyPercent >= 90) {
    en = `Excellent! You've mastered ${highs.join(', ')}. Keep it up!`;
    th = `เก่งมาก! คุณทำได้ดีกับ ${highs.join(', ')}! เก่งมาก!`;
  } else if (accuracyPercent >= 70) {
    const focus = lows.length > 0 ? lows.join(', ') : 'these letters';
    en = `Great work! Practice ${focus} a bit more.`;
    th = `ดีมาก! ฝึก ${focus} อีกนิดนะ`;
  } else {
    const focus = lows.length > 0 ? lows.join(', ') : 'these letters';
    en = `Keep going! Focus on ${focus}. You'll get it!`;
    th = `สู้ๆ! เน้น ${focus} ให้มากขึ้น! คุณทำได้!`;
  }

  const vowelAvg = vowelCount > 0 ? vowelSum / vowelCount : 0;
  const consonantAvg = consonantCount > 0 ? consonantSum / consonantCount : 0;
  if (vowelCount > 0 && consonantCount > 0 && vowelAvg < consonantAvg && vowelAvg < 70) {
    const vowelStr = vowelLows.length > 0 ? vowelLows.join(', ') : 'A, E, I, O, U';
    en += ` Focus on vowels like ${vowelStr}.`;
    th += ` เน้นสระเช่น ${vowelStr}.`;
  }

  return { english: en, thai: th };
}
