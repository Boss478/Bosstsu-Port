'use client';

import { useEffect, useState, useRef } from 'react';
import { drawSprite, ROTATE_PHONE } from '../sprites';

export default function RotateDeviceOverlay() {
  const [show, setShow] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    function check() {
      setShow(window.innerWidth < 768 && window.innerHeight > window.innerWidth);
    }
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 64, 64);
    drawSprite(ctx, ROTATE_PHONE, 0, 0, 4);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
      <canvas
        ref={canvasRef}
        width={64}
        height={64}
        className="w-24 h-24 image-rendering-pixelated"
        aria-hidden="true"
      />
      <p className="text-white text-sm mt-4 font-bold tracking-widest text-center px-8">
        Rotate your device to landscape
      </p>
    </div>
  );
}
