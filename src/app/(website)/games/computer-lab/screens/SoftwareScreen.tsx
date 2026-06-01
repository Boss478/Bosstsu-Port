"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Screen } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import PixelSprite from "../components/PixelSprite";
import { SPRITE_MAP } from "../sprites";

interface Props {
  onNavigate: (screen: Screen) => void;
}

interface SoftwareItem {
  id: string;
  nameTh: string;
  nameEn: string;
  category: "os" | "app";
  sprite: keyof typeof SPRITE_MAP;
  colorClass: string;
  factTh: string;
  factEn: string;
}

const ITEMS: SoftwareItem[] = [
  { id: "windows", nameTh: "Windows", nameEn: "Windows", category: "os", sprite: "sw_windows" as keyof typeof SPRITE_MAP, colorClass: "text-sky-400", factTh: "Windows เป็นระบบปฏิบัติการที่พัฒนาโดย Microsoft", factEn: "Windows is an OS developed by Microsoft" },
  { id: "macos", nameTh: "macOS", nameEn: "macOS", category: "os", sprite: "sw_macos" as keyof typeof SPRITE_MAP, colorClass: "text-sky-400", factTh: "macOS เป็นระบบปฏิบัติการของ Apple สำหรับ Mac", factEn: "macOS is Apple's OS for Mac computers" },
  { id: "linux", nameTh: "Linux", nameEn: "Linux", category: "os", sprite: "sw_linux" as keyof typeof SPRITE_MAP, colorClass: "text-sky-400", factTh: "Linux เป็นระบบปฏิบัติการแบบโอเพนซอร์ส", factEn: "Linux is an open-source operating system" },
  { id: "android", nameTh: "Android", nameEn: "Android", category: "os", sprite: "sw_android" as keyof typeof SPRITE_MAP, colorClass: "text-sky-400", factTh: "Android เป็นระบบปฏิบัติการบนมือถือของ Google", factEn: "Android is Google's mobile operating system" },
  { id: "ios", nameTh: "iOS", nameEn: "iOS", category: "os", sprite: "sw_ios" as keyof typeof SPRITE_MAP, colorClass: "text-sky-400", factTh: "iOS เป็นระบบปฏิบัติการของ Apple สำหรับ iPhone", factEn: "iOS is Apple's OS for iPhone" },
  { id: "chromeos", nameTh: "ChromeOS", nameEn: "ChromeOS", category: "os", sprite: "sw_chromeos" as keyof typeof SPRITE_MAP, colorClass: "text-sky-400", factTh: "ChromeOS เป็นระบบปฏิบัติการที่ใช้ Chrome เบราว์เซอร์เป็นหลัก", factEn: "ChromeOS is an OS built around the Chrome browser" },
  { id: "word", nameTh: "Microsoft Word", nameEn: "Microsoft Word", category: "app", sprite: "sw_word" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Word เป็นโปรแกรมประมวลผลคำ", factEn: "Word is a word processing application" },
  { id: "excel", nameTh: "Microsoft Excel", nameEn: "Microsoft Excel", category: "app", sprite: "sw_excel" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Excel เป็นโปรแกรมคำนวณตาราง", factEn: "Excel is a spreadsheet application" },
  { id: "photoshop", nameTh: "Photoshop", nameEn: "Photoshop", category: "app", sprite: "sw_photoshop" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Photoshop เป็นโปรแกรมตกแต่งภาพ", factEn: "Photoshop is an image editing application" },
  { id: "vscode", nameTh: "VS Code", nameEn: "VS Code", category: "app", sprite: "sw_vscode" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "VS Code เป็นโปรแกรมสำหรับเขียนโค้ด", factEn: "VS Code is a code editor application" },
  { id: "chrome", nameTh: "Google Chrome", nameEn: "Google Chrome", category: "app", sprite: "sw_chrome" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Chrome เป็นเว็บเบราว์เซอร์", factEn: "Chrome is a web browser application" },
  { id: "spotify", nameTh: "Spotify", nameEn: "Spotify", category: "app", sprite: "sw_spotify" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Spotify เป็นโปรแกรมฟังเพลง", factEn: "Spotify is a music streaming application" },
  { id: "zoom", nameTh: "Zoom", nameEn: "Zoom", category: "app", sprite: "sw_zoom" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Zoom เป็นโปรแกรมประชุมออนไลน์", factEn: "Zoom is a video conferencing application" },
  { id: "calculator", nameTh: "เครื่องคิดเลข", nameEn: "Calculator", category: "app", sprite: "sw_calculator" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "เครื่องคิดเลขเป็นโปรแกรมคำนวณพื้นฐาน", factEn: "Calculator is a basic arithmetic application" },
  { id: "calendar", nameTh: "ปฏิทิน", nameEn: "Calendar", category: "app", sprite: "sw_calendar" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "ปฏิทินเป็นโปรแกรมจัดการตารางเวลา", factEn: "Calendar is a scheduling application" },
  { id: "clock", nameTh: "นาฬิกา", nameEn: "Clock", category: "app", sprite: "sw_clock" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "นาฬิกาเป็นโปรแกรมบอกเวลา", factEn: "Clock is a timekeeping application" },
  { id: "minecraft", nameTh: "Minecraft", nameEn: "Minecraft", category: "app", sprite: "sw_minecraft" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Minecraft เป็นเกมสร้างโลกแบบบล็อก", factEn: "Minecraft is a block-building sandbox game" },
  { id: "roblox", nameTh: "Roblox", nameEn: "Roblox", category: "app", sprite: "sw_roblox" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Roblox เป็นแพลตฟอร์มเกมที่ผู้ใช้สร้างเกมเองได้", factEn: "Roblox is a user-generated gaming platform" },
  { id: "youtube", nameTh: "YouTube", nameEn: "YouTube", category: "app", sprite: "sw_youtube" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "YouTube เป็นแพลตฟอร์มวิดีโอออนไลน์", factEn: "YouTube is an online video platform" },
  { id: "discord", nameTh: "Discord", nameEn: "Discord", category: "app", sprite: "sw_discord" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Discord เป็นโปรแกรมแชทสำหรับเกมเมอร์", factEn: "Discord is a chat app popular with gamers" },
  { id: "powerpoint", nameTh: "Microsoft PowerPoint", nameEn: "Microsoft PowerPoint", category: "app", sprite: "sw_powerpoint" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "PowerPoint เป็นโปรแกรมสร้างงานนำเสนอ", factEn: "PowerPoint is a presentation application" },
  { id: "instagram", nameTh: "Instagram", nameEn: "Instagram", category: "app", sprite: "sw_instagram" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Instagram เป็นแอปแชร์รูปภาพและวิดีโอ", factEn: "Instagram is a photo and video sharing app" },
  { id: "tiktok", nameTh: "TikTok", nameEn: "TikTok", category: "app", sprite: "sw_tiktok" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "TikTok เป็นแอปวิดีโอสั้นยอดนิยม", factEn: "TikTok is a popular short-form video app" },
  { id: "whatsapp", nameTh: "WhatsApp", nameEn: "WhatsApp", category: "app", sprite: "sw_whatsapp" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "WhatsApp เป็นแอปส่งข้อความยอดนิยม", factEn: "WhatsApp is a widely-used messaging app" },
  { id: "fortnite", nameTh: "Fortnite", nameEn: "Fortnite", category: "app", sprite: "sw_fortnite" as keyof typeof SPRITE_MAP, colorClass: "text-emerald-400", factTh: "Fortnite เป็นเกมแบทเทิลรอยัลยอดนิยม", factEn: "Fortnite is a popular battle royale game" },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type ToastState = { type: "correct" | "wrong"; message: string } | null;

export default function SoftwareScreen({ onNavigate }: Props) {
  const { lang, mode, playSfx, onStageComplete } = useGame();

  const [items] = useState(() => shuffle(ITEMS));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [locked, setLocked] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [showContinue, setShowContinue] = useState(false);
  const [finished, setFinished] = useState(false);
  const timerIds = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [spriteSize, setSpriteSize] = useState<128 | 256>(256);

  useEffect(() => {
    const handleResize = () => {
      setSpriteSize(window.innerWidth < 640 ? 128 : 256);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      timerIds.current.forEach(clearTimeout);
      timerIds.current = [];
    };
  }, []);

  const safeSetTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timerIds.current.push(id);
    return id;
  }, []);

  const advance = useCallback(() => {
    const next = currentIndex + 1;
    if (next >= items.length) {
      setFinished(true);
    } else {
      setCurrentIndex(next);
      setLocked(false);
    }
  }, [currentIndex, items.length]);

  const handleAnswer = useCallback((answer: "os" | "app") => {
    if (locked || finished || !items[currentIndex] || showContinue) return;

    const item = items[currentIndex];
    setLocked(true);

    if (answer === item.category) {
      playSfx("correct");
      const newCorrect = correctCount + 1;
      setCorrectCount(newCorrect);
      setToast({ type: "correct", message: lang === "th" ? item.factTh : item.factEn });

      if (newCorrect === 8) {
        const isLast = currentIndex + 1 >= items.length;
        if (isLast) {
          safeSetTimeout(() => {
            setToast(null);
            setFinished(true);
          }, 1800);
        } else {
          safeSetTimeout(() => {
            setToast(null);
            setShowContinue(true);
            setLocked(false);
          }, 1800);
        }
        return;
      }
    } else {
      playSfx("wrong");
      setMistakes((m) => m + 1);
      setToast({ type: "wrong", message: t("stage2.wrong", lang, mode) });
    }

    safeSetTimeout(() => {
      setToast(null);
      advance();
    }, answer === item.category ? 1800 : 1200);
  }, [currentIndex, correctCount, finished, items, lang, locked, mode, playSfx, showContinue, safeSetTimeout, advance]);

  const handleContinue = useCallback(() => {
    setShowContinue(false);
    setCurrentIndex((i) => i + 1);
    setLocked(false);
  }, []);

  useEffect(() => {
    if (finished) {
      const stars = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
      const totalScore = correctCount * 10;
      playSfx("victory");
      onStageComplete("software", stars, totalScore);
      onNavigate("victory");
    }
  }, [finished, mistakes, correctCount, playSfx, onStageComplete, onNavigate]);

  if (!items[currentIndex]) return null;

  const item = items[currentIndex];
  const displayName = lang === "th" ? item.nameTh : item.nameEn;

  return (
    <div className="flex flex-col items-center p-4 space-y-5 min-h-screen bg-black font-mono">
      <h2 className="text-xl font-black text-emerald-400 tracking-wide">
        {t("stage2.title", lang, mode)}
      </h2>

      <div className="w-full max-w-xs text-center">
        <p className="text-zinc-500 text-xs">{t("stage2.instruction", lang, mode)}</p>
      </div>

      <div className="text-zinc-500 text-xs">
        {correctCount} / 25 {t("stage2.correct", lang, mode)}
      </div>

      <div className="w-full max-w-sm bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center gap-4 justify-center relative min-h-[200px]">
        <div className="flex flex-col items-center gap-3">
          <PixelSprite data={SPRITE_MAP[item.sprite]} size={spriteSize} />
          <p className={`text-lg font-bold text-center ${item.colorClass}`}>{displayName}</p>
        </div>

        {toast && (
          <div
            className={`absolute inset-0 rounded-2xl flex items-center justify-center p-4 text-center text-sm font-bold transition-opacity duration-300 break-words ${
              toast.type === "correct"
                ? "bg-emerald-900/90 text-emerald-200 border-2 border-emerald-500"
                : "bg-red-900/90 text-red-200 border-2 border-red-500"
            }`}
          >
            {toast.message}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-sm">
        <button
          onClick={() => handleAnswer("os")}
          disabled={locked || showContinue}
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-800 border border-zinc-700 text-emerald-400 font-bold text-lg hover:bg-emerald-900/30 hover:border-emerald-600 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
        >
          <PixelSprite data={SPRITE_MAP.os_icon} size={16} />
          {t("software.os", lang, mode)}
        </button>
        <button
          onClick={() => handleAnswer("app")}
          disabled={locked || showContinue}
          className="w-full sm:w-auto px-8 py-4 rounded-xl bg-zinc-800 border border-zinc-700 text-sky-400 font-bold text-lg hover:bg-sky-900/30 hover:border-sky-600 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center gap-2"
        >
          <PixelSprite data={SPRITE_MAP.app_icon} size={16} />
          {t("software.app", lang, mode)}
        </button>
      </div>

      <button
        onClick={() => onNavigate("menu")}
        className="px-4 py-2 rounded bg-zinc-800 text-zinc-500 hover:text-emerald-400 text-xs transition-colors"
      >
        ← {t("topbar.back", lang, mode)}
      </button>

      {showContinue && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-xs w-full mx-4 text-center space-y-5">
            <p className="text-emerald-400 text-lg font-bold">{t("stage2.correct", lang, mode)}</p>
            <p className="text-zinc-300 text-sm">{t("stage2.continue", lang, mode)}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleContinue}
                className="px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold hover:bg-emerald-600 transition-colors"
              >
                {t("ui.ok", lang, mode)}
              </button>
              <button
                onClick={() => onNavigate("menu")}
                className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-400 font-bold hover:text-white transition-colors"
              >
                {t("topbar.back", lang, mode)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
