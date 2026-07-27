'use client';

interface ChallengeResultsProps {
  score: number;
  incorrect: number;
  totalQuestions: number;
  bestStreak: number;
  onPlayAgain: () => void;
  onBack: () => void;
  onBackToBuilder: () => void;
}

export default function ChallengeResults({
  score,
  incorrect,
  totalQuestions,
  bestStreak,
  onPlayAgain,
  onBack,
  onBackToBuilder,
}: ChallengeResultsProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white/95 dark:bg-slate-900/95 border border-white/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
        <div className="w-16 h-16 rounded-full bg-[#C8A44E]/20 flex items-center justify-center mx-auto">
          <i
            className={`fi fi-sr-${score >= incorrect ? 'trophy' : 'flag'} text-2xl text-[#C8A44E]`}
          />
        </div>

        <h2
          className="text-lg font-extrabold text-slate-800 dark:text-[#F7E1A0]"
          style={{ fontFamily: 'var(--font-mali)' }}
        >
          Quiz Complete!
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 p-3">
            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">{score}</p>
            <p className="text-[8px] font-extrabold text-emerald-500/70 uppercase tracking-widest">
              Correct
            </p>
          </div>
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 p-3">
            <p className="text-sm font-black text-rose-600 dark:text-rose-400">{incorrect}</p>
            <p className="text-[8px] font-extrabold text-rose-500/70 uppercase tracking-widest">
              Incorrect
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3">
          <p className="text-lg font-black text-slate-700 dark:text-slate-200">
            {totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0}%
          </p>
          <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest">
            Accuracy
          </p>
        </div>

        {bestStreak > 0 && (
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
            Best streak: {bestStreak}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#C8A44E] to-[#D4B06A] text-white text-[10px] font-extrabold tracking-wider uppercase shadow-lg hover:shadow-xl active:scale-[0.97] transition-all cursor-pointer"
          >
            Play Again
          </button>
          <button
            onClick={onBack}
            className="w-full py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold tracking-wider uppercase hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-[0.97] transition-all cursor-pointer"
          >
            Back to Challenge List
          </button>
          <button
            onClick={onBackToBuilder}
            className="w-full py-3 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-white/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-[10px] font-extrabold tracking-wider uppercase hover:bg-white/80 dark:hover:bg-slate-700/80 active:scale-[0.97] transition-all cursor-pointer"
          >
            Back to Word Builder
          </button>
        </div>
      </div>
    </div>
  );
}
