"use client";

import { forwardRef, useImperativeHandle, useState, useCallback } from "react";
import PixelSprite from "./PixelSprite";
import { SPRITE_MAP } from "../sprites";

export interface CatEasterEggHandle {
  showCat: () => void;
}

const CatEasterEgg = forwardRef<CatEasterEggHandle, object>(function CatEasterEgg(_props, ref) {
  const [visible, setVisible] = useState(false);
  const [key, setKey] = useState(0);

  const showCat = useCallback(() => {
    setKey((k) => k + 1);
    setVisible(true);
  }, []);

  useImperativeHandle(ref, () => ({ showCat }), [showCat]);

  if (!visible) return null;

  return (
    <>
      <div
        key={key}
        className="fixed pointer-events-none z-50"
        style={{
          top: "calc(50% - 16px)",
          left: "-40px",
          animation: "catwalk 3s linear forwards",
        }}
        onAnimationEnd={() => setVisible(false)}
      >
        <div className="relative">
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-pink-400 font-bold text-xs whitespace-nowrap animate-bounce">
            Meow!
          </span>
          <PixelSprite data={SPRITE_MAP.cat} size={32} />
        </div>
      </div>
      <style>{`
        @keyframes catwalk {
          from { left: -40px; }
          to   { left: calc(100vw + 40px); }
        }
      `}</style>
    </>
  );
});

export default CatEasterEgg;
