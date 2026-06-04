"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "../context";
import { SPRITE_MAP, PALETTE } from "../sprites";
import { t } from "../lang";
import { saveSave } from "../save";

const STAGE_IDS = ["hardware", "software", "workflow", "build", "diagnosis"] as const;

export default function Certificate() {
  const { save, lang, mode } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nameInput, setNameInput] = useState(save.playerName);
  const [displayName, setDisplayName] = useState(save.playerName);

  const allCompleted = STAGE_IDS.every((id) => save.progress[id].completed);
  const totalStars = STAGE_IDS.reduce((sum, id) => sum + save.progress[id].stars, 0);
  const showCanvas = allCompleted && displayName !== "";

  useEffect(() => {
    if (!showCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = 600;
    const H = 400;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.imageSmoothingEnabled = false;
    ctx.scale(dpr, dpr);

    const bg = SPRITE_MAP.certificate_bg;
    const scaleX = Math.floor(W / bg.width);
    const scaleY = Math.floor(H / bg.height);

    for (let y = 0; y < bg.height; y++) {
      for (let x = 0; x < bg.width; x++) {
        const pi = bg.pixels[y]?.[x];
        if (pi === undefined || pi === 0) continue;
        const color = PALETTE[pi];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
      }
    }

    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText("Certificate of Completion", W / 2, 65);

    ctx.fillStyle = "#333";
    ctx.font = "15px 'Courier New', monospace";
    ctx.fillText(t("cert.line1", lang, mode), W / 2, 115);

    ctx.fillStyle = "#000";
    ctx.font = "bold 26px 'Courier New', monospace";
    ctx.fillText(displayName, W / 2, 165);

    ctx.fillStyle = "#444";
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillText(t("cert.line2", lang, mode), W / 2, 205);

    const fmt = new Intl.DateTimeFormat(lang === "th" ? "th-TH" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    ctx.fillStyle = "#666";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillText(fmt.format(Date.now()), W / 2, 255);

    ctx.fillStyle = "#1a1a2e";
    ctx.font = "14px 'Courier New', monospace";
    ctx.fillText(`${t("cert.stars", lang, mode)}: ${totalStars} / 15`, W / 2, 295);

    const star = SPRITE_MAP.star_filled;
    const ss = 2;
    const sw = star.width * ss;
    const gap = 4;
    const totalW = totalStars * sw + (totalStars - 1) * gap;
    const ox = (W - totalW) / 2;

    for (let i = 0; i < totalStars; i++) {
      const sx = ox + i * (sw + gap);
      const sy = 315;
      for (let py = 0; py < star.height; py++) {
        for (let px = 0; px < star.width; px++) {
          const pi = star.pixels[py]?.[px];
          if (pi === undefined || pi === 0) continue;
          const color = PALETTE[pi];
          if (!color) continue;
          ctx.fillStyle = color;
          ctx.fillRect(sx + px * ss, sy + py * ss, ss, ss);
        }
      }
    }
  }, [showCanvas, displayName, totalStars, lang, mode]);

  const handleNameSubmit = () => {
    if (!nameInput.trim()) return;
    saveSave({ ...save, playerName: nameInput.trim(), timestamp: Date.now() });
    setDisplayName(nameInput.trim());
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Computer_Lab_Certificate.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  if (!allCompleted) return null;

  if (!displayName) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 bg-zinc-900 border border-zinc-700 rounded-lg">
        <p className="text-lg text-white font-bold">{t("cert.title", lang, mode)}</p>
        <p className="text-sm text-zinc-400">{t("cert.line1", lang, mode)}</p>
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          placeholder={t("cert.name", lang, mode)}
          className="px-4 py-2 bg-zinc-800 border border-zinc-600 rounded text-white text-center text-lg w-64"
          onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
        />
        <button
          onClick={handleNameSubmit}
          className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold transition-colors"
        >
          {t("cert.save", lang, mode)}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        className="border-2 border-zinc-600 rounded-lg shadow-lg"
        style={{ imageRendering: "pixelated" }}
      />
      <button
        onClick={handleDownload}
        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold transition-colors"
      >
        Save Certificate
      </button>
    </div>
  );
}
