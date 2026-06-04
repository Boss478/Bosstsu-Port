"use client";

import { useState, useEffect, useCallback } from "react";
import { useGame } from "../context";
import { t } from "../lang";
interface Step {
  selector: string;
  title: string;
  description: string;
}

interface GuidedTourProps {
  steps: Step[];
  onComplete?: () => void;
}

function getStepStyle(selector: string) {
  if (selector === "__fullscreen__" || !selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + rect.height / 2,
    left: rect.left + rect.width / 2,
    width: rect.width,
    height: rect.height,
  };
}

export default function GuidedTour({ steps, onComplete }: GuidedTourProps) {
  const { lang, mode, save, updateSave } = useGame();
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!save.tourCompleted) {
      const timer = setTimeout(() => setVisible(true), 600);
      return () => clearTimeout(timer);
    }
  }, [save.tourCompleted]);

  const finish = useCallback(() => {
    setVisible(false);
    updateSave({ tourCompleted: true });
    onComplete?.();
  }, [updateSave, onComplete]);

  if (!visible || save.tourCompleted || steps.length === 0) return null;

  const step = steps[currentStep];
  const isFullscreen = step.selector === "__fullscreen__" || !step.selector;
  const rect = isFullscreen ? null : getStepStyle(step.selector);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={finish}
    >
      <div className="absolute inset-0 bg-black/60" />

      {rect && (
        <div
          className="absolute pointer-events-none"
          style={{
            top: rect.top - 20,
            left: rect.left - 20,
            width: rect.width + 40,
            height: rect.height + 40,
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.6), 0 0 0 3px rgba(74, 144, 217, 0.6), 0 0 20px rgba(74, 144, 217, 0.4)`,
            borderRadius: 12,
          }}
        />
      )}

      <div
        className="absolute z-10 max-w-xs"
        style={{
          top: rect ? rect.top + rect.height + 16 : "50%",
          left: rect ? Math.max(16, rect.left + rect.width / 2 - 120) : "50%",
          transform: rect ? undefined : "translate(-50%, -50%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 shadow-2xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
              {currentStep + 1}
            </span>
            <h3 className="text-white font-bold text-sm">{step.title}</h3>
          </div>
          <p className="text-zinc-300 text-xs leading-relaxed mb-4">
            {step.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === currentStep ? "bg-blue-400" : "bg-zinc-600"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  finish();
                }}
                className="text-xs text-zinc-400 hover:text-white transition-colors px-2 py-1"
              >
                {t("ui.skip", lang, mode)}
              </button>

              {currentStep > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStep((s) => s - 1);
                  }}
                  className="text-xs px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white transition-colors"
                >
                  {t("ui.cancel", lang, mode)}
                </button>
              )}

              {currentStep < steps.length - 1 ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentStep((s) => s + 1);
                  }}
                  className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors font-bold"
                >
                  {t("ui.next", lang, mode)}
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    finish();
                  }}
                  className="text-xs px-3 py-1 rounded bg-green-600 hover:bg-green-500 text-white transition-colors font-bold"
                >
                  {t("ui.ok", lang, mode)}
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className="w-3 h-3 bg-zinc-900 border-l border-t border-zinc-700 rotate-45 mx-auto -mb-1.5"
          style={{ marginTop: -6 }}
        />
      </div>
    </div>
  );
}
