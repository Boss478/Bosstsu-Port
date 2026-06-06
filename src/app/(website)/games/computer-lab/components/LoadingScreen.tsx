"use client";

interface LoadingScreenProps {
  visible: boolean;
  message?: string;
  progress?: number;
}

export default function LoadingScreen({ visible, message = "Preparing the lab...", progress }: LoadingScreenProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black">
      <div className="text-center space-y-6">
        <p className="text-green-400 text-2xl font-bold tracking-widest animate-pulse">
          LOADING...
        </p>
        <div className="w-64 h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
          <div
            className={`h-full bg-green-500 rounded-full ${progress === undefined ? "animate-[loadingBar_2s_ease-in-out_infinite]" : "transition-all duration-300"}`}
            style={{
              width: progress !== undefined ? `${Math.max(0, Math.min(100, progress))}%` : "0%",
            }}
          />
        </div>
        <p className="text-zinc-500 text-sm">{message} {progress !== undefined && `(${Math.round(progress)}%)`}</p>
      </div>
      <style>{`
        @keyframes loadingBar {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
