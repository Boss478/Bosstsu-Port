import type { VocabularyWord } from "./types";

type GameMode = "PRACTICE" | "ENDLESS" | "TEST" | "TIMER" | "LIFE" | "HARDCORE" | null;

interface FlashcardResultScreenProps {
  mode: GameMode;
  timeLimit: number;
  wordStats: Record<string, { appearances: number; correct: number; wrong: number }>;
  activeVocab: VocabularyWord[];
  maxStreak: number;
  sessionStartTime: number;
  sessionEndTime: number;
  failedHardcoreWord: VocabularyWord | null;
  startGame: (selectedMode: GameMode, selectedTime?: number) => void;
  goHome: () => void;
}

export default function FlashcardResultScreen({
  mode,
  timeLimit,
  wordStats,
  activeVocab,
  maxStreak,
  sessionStartTime,
  sessionEndTime,
  failedHardcoreWord,
  startGame,
  goHome,
}: FlashcardResultScreenProps) {
  let totalApps = 0;
  let totalCorrects = 0;
  
  const wordList = Object.entries(wordStats).map(([word, stat]) => {
    totalApps += stat.appearances;
    totalCorrects += stat.correct;
    return { word, ...stat };
  }).sort((a, b) => b.wrong - a.wrong); // Sort by most mistakes first

  const accuracy = totalApps > 0 ? Math.round((totalCorrects / totalApps) * 100) : 0;
  const durationSeconds = Math.max(1, Math.floor((sessionEndTime - sessionStartTime) / 1000));
  const isPerfect = accuracy === 100 && totalApps > 0;
  const isHardcoreFail = mode === "HARDCORE" && failedHardcoreWord !== null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-sky-100/50 dark:shadow-black/40 max-w-3xl mx-auto space-y-8 animate-float">
      <div className="text-center relative">
        {isPerfect && !isHardcoreFail ? (
           <div className="absolute top-0 right-0 rotate-12 bg-amber-200 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-2 border-amber-400 px-4 py-1 rounded-full font-bold shadow-sm">
              Perfect!
           </div>
        ) : null}
        <i className={`fi ${isHardcoreFail ? 'fi-sr-skull-crossbones text-rose-500' : 'fi-sr-trophy text-amber-500'} text-6xl mb-4 inline-block drop-shadow-md`}></i>
        <h2 className={`text-3xl font-bold ${isHardcoreFail ? 'text-rose-600 dark:text-rose-400' : 'text-sky-600 dark:text-sky-400'} mb-2`}>
          {isHardcoreFail ? 'Game Over!' : 'Session Complete!'}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400">Here&apos;s your learning breakdown</p>
      </div>

      {isHardcoreFail && (
        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/50 text-center animate-in zoom-in duration-300">
           <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mb-2">You missed the word:</h3>
           <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">{failedHardcoreWord.word}</p>
           <div className="inline-block bg-white dark:bg-zinc-800 px-6 py-2 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm">
             The spelling was <strong className="text-sky-500">{failedHardcoreWord.isCorrect ? "Correct" : "Incorrect"}</strong>
           </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold mb-1">Total Words</p>
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{totalApps}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold mb-1">Accuracy</p>
          <p className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">{accuracy}%</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold mb-1">Best Streak</p>
          <p className="text-2xl font-bold text-amber-500">{maxStreak}</p>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-200 dark:border-zinc-800">
          <p className="text-zinc-500 dark:text-zinc-400 text-xs uppercase font-bold mb-1">Avg Speed</p>
          <p className="text-2xl font-bold text-sky-500">{(durationSeconds / Math.max(1, totalApps)).toFixed(1)}s</p>
        </div>
      </div>

      {wordList.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="bg-zinc-50 dark:bg-zinc-800 px-6 py-3 border-b border-zinc-200 dark:border-zinc-700 font-bold text-zinc-700 dark:text-zinc-300">
            All Word Analysis
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900/80 sticky top-0 shadow-sm text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-6 py-3">Word</th>
                  <th className="px-6 py-3 text-center">Seen</th>
                  <th className="px-6 py-3 text-center">Correct</th>
                  <th className="px-6 py-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {wordList.map((item, i) => {
                  const wordAcc = Math.round((item.correct / item.appearances) * 100);
                  // Find the original word object to get its definition
                  const originalWord = activeVocab.find(v => v.word === item.word);
                  return (
                    <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-6 py-3">
                         <div className="font-bold text-zinc-800 dark:text-zinc-200">{item.word}</div>
                         {originalWord?.definition && (
                            <div className="text-xs text-sky-600 dark:text-sky-400 mt-1 line-clamp-1" title={originalWord.definition}>
                              {originalWord.definition}
                            </div>
                         )}
                      </td>
                      <td className="px-6 py-3 text-center text-zinc-500">{item.appearances}</td>
                      <td className="px-6 py-3 text-center">
                         <span className={wordAcc >= 80 ? 'text-emerald-500' : wordAcc >= 50 ? 'text-amber-500' : 'text-rose-500'}>
                           {wordAcc}%
                         </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        {item.wrong === 0 ? (
                          <i className="fi fi-sr-check-circle text-emerald-500"></i>
                        ) : (
                          <span className="text-rose-500 font-bold bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded text-xs">
                            {item.wrong} missed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalApps === 0 && (
        <p className="text-center text-zinc-500">No words played.</p>
      )}

      <div className="flex gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button 
          onClick={() => startGame(mode as GameMode, timeLimit)}
          className="flex-1 bg-sky-500 text-white rounded-xl py-4 font-bold hover:bg-sky-600 transition-colors shadow-md hover:shadow-lg"
        >
          Play Again
        </button>
        <button 
          onClick={goHome}
          className="flex-1 bg-zinc-100 dark:bg-slate-800 text-zinc-700 dark:text-zinc-300 rounded-xl py-4 font-bold hover:bg-zinc-200 dark:hover:bg-slate-700 transition-colors shadow-sm"
        >
          Menu
        </button>
      </div>
    </div>
  );
}
