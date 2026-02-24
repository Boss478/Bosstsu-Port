'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

export default function ImageCropper({ imageSrc, onCropComplete, onCancel, aspectRatio = 16 / 9 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, aspectRatio, width, height),
      width,
      height
    );
    setCrop(crop);
  }

  const handleSave = async () => {
    if (imgRef.current && completedCrop?.width && completedCrop?.height) {
      const canvas = document.createElement('canvas');
      const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
      const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
      
      canvas.width = completedCrop.width * scaleX;
      canvas.height = completedCrop.height * scaleY;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Draw image
      ctx.drawImage(
        imgRef.current,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Extract Blob
      canvas.toBlob((blob) => {
        if (blob) onCropComplete(blob);
      }, 'image/jpeg', 0.9);
    } else {
       onCancel(); // if error
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-zinc-200 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
          <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">ครอปรอปรูป (Crop Image)</h3>
          <button type="button" onClick={onCancel} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <i className="fi fi-sr-cross" />
          </button>
        </div>
        
        <div className="flex-1 overflow-auto bg-zinc-100 dark:bg-slate-950 p-6 flex justify-center items-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop me"
              onLoad={onImageLoad}
              className="max-h-[60vh] w-auto object-contain"
            />
          </ReactCrop>
        </div>
        
        <div className="p-4 border-t border-zinc-200 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-zinc-700 dark:text-zinc-300 font-medium hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
          >
            ยกเลิก (Cancel)
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium shadow-lg shadow-sky-500/20 transition-colors"
          >
            บันทึกและใช้รูปนี้ (Save Cropped Cover)
          </button>
        </div>
      </div>
    </div>
  );
}
