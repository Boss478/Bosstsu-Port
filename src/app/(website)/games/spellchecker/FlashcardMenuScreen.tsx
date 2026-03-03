import { useState } from "react";


type Language = "THAI" | "ENGLISH" | null;
type GameMode = "PRACTICE" | "ENDLESS" | "TEST" | "TIMER" | "LIFE" | "HARDCORE" | null;

interface FlashcardMenuScreenProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  startGame: (selectedMode: GameMode, selectedTime?: number) => void;
  isLoading?: boolean;
}

export default function FlashcardMenuScreen({ language, setLanguage, startGame, isLoading }: FlashcardMenuScreenProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  if (!language) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-sky-100/50 dark:shadow-black/40 text-center space-y-8 animate-float relative overflow-hidden">
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => setShowChangelog(true)} className="p-2 text-zinc-400 hover:text-sky-500 transition-colors" title="Changelog">
            <i className="fi fi-sr-time-past text-xl"></i>
          </button>
          <button onClick={() => setShowHelp(true)} className="p-2 text-zinc-400 hover:text-amber-500 transition-colors" title="How to play">
            <i className="fi fi-sr-interrogation text-xl"></i>
          </button>
        </div>

        <div className="mb-6 pt-4">
          <i className="fi fi-sr-graduation-cap text-6xl text-sky-500 mb-4 inline-block"></i>
          <h1 className="text-4xl font-bold text-sky-600 dark:text-sky-400 mb-2">
            SpellCheck
          </h1>
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-4">
            เขียนถูกหรือผิด?
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
            Test your spelling skills. Select a language to begin. <br />
            ฝึกทักษะการสะกดคำ เลือกภาษาเพื่อเริ่มต้น
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
          <button
            onClick={() => setLanguage("THAI")}
            className="card-hover bg-sky-500 hover:bg-sky-600 text-white rounded-2xl p-6 font-bold text-xl flex flex-col items-center gap-2 transition-colors relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <i className="fi fi-sr-flag text-3xl z-10"></i>
            <span className="z-10">ภาษาไทย</span>
          </button>
          <button
            onClick={() => setLanguage("ENGLISH")}
            className="card-hover bg-gray-500 hover:bg-gray-600 text-white rounded-2xl p-6 font-bold text-xl flex flex-col items-center gap-2 transition-colors relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            <i className="fi fi-sr-world text-3xl z-10"></i>
            <span className="z-10">English (US)</span>
            <span className="text-xs">(In Progress)</span>
          </button>
        </div>

        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-left relative overflow-y-auto max-h-[90vh]">
              <button onClick={() => setShowHelp(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-rose-500">
                <i className="fi fi-sr-cross-circle text-2xl"></i>
              </button>
              <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-3">
                <i className="fi fi-sr-interrogation text-amber-500"></i> How to Play
              </h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">Controls</h4>
                  <ul className="text-zinc-600 dark:text-zinc-400 space-y-2 text-sm">
                    <li>• <b>PC:</b> Use <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">Left Arrow</kbd> for Correct Spelling, <kbd className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">Right Arrow</kbd> for Incorrect.</li>
                    <li>• <b>Mobile:</b> Swipe the card Left for Correct, Swipe Right for Incorrect.</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 mb-2">Game Modes</h4>
                  <ul className="text-zinc-600 dark:text-zinc-400 space-y-3 text-sm">
                    <li><b className="text-sky-500">Practice:</b> Shows answer when wrong. Focuses on words you miss.</li>
                    <li><b className="text-emerald-500">Test:</b> Must answer each word 2 times. Blind feedback.</li>
                    <li><b className="text-amber-500">Life:</b> 3 mistakes allowed. Blind feedback.</li>
                    <li><b className="text-rose-500">Hardcore:</b> 1 mistake ends the game. Blind feedback.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {showChangelog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl text-left relative overflow-y-auto max-h-[90vh]">
              <button onClick={() => setShowChangelog(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-rose-500">
                <i className="fi fi-sr-cross-circle text-2xl"></i>
              </button>
              <h3 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-6 flex items-center gap-3">
                <i className="fi fi-sr-time-past text-sky-500"></i> Update History
              </h3>
              
              <div className="space-y-6">
                <div className="border-l-2 border-sky-500 pl-4 py-1">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 flex justify-between">
                    v1.1.1 
                    <span className="text-xs font-normal text-sky-500 bg-sky-100 dark:bg-sky-900/40 px-2 py-1 rounded-full">New Update</span>
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2 leading-relaxed">
                    - <b>&quot;Blind&quot; learning:</b> Removed score HUD during play.<br/>
                    - <b>Revamped Modes:</b> Hardcore is now 1 life. Life mode has 3 lives. Test mode requires 2 passes.<br/>
                    - <b>Analytics:</b> Added detailed run histories, streaks, and advanced timing.<br/>
                    - <b>Security:</b> Hidden word datasets.
                  </p>
                </div>
                <div className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 py-1 opacity-70">
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200">v1.1.0</h4>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-2">
                    Initial release with Practice, Endless, Test, and Hardcore modes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl shadow-sky-100/50 dark:shadow-black/40 text-center animate-float relative overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in">
          <i className="fi fi-sr-spinner animate-spin text-5xl text-sky-500 mb-4"></i>
          <p className="text-zinc-800 dark:text-zinc-200 font-bold text-lg animate-pulse">Loading Vocabulary...</p>
        </div>
      )}

      <button onClick={() => setLanguage(null)} className="absolute top-6 left-6 text-zinc-400 hover:text-sky-500 transition-colors">
        <i className="fi fi-sr-arrow-left text-2xl"></i>
      </button>
      <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-8">Select Game Mode</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <button onClick={() => startGame("PRACTICE")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-sky-400 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <i className="fi fi-sr-book-alt text-2xl text-sky-500"></i>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Practice</h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Shows answer on mistake. Adapts to weaknesses.</p>
        </button>
        
        <button onClick={() => startGame("ENDLESS")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-blue-400 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <i className="fi fi-sr-infinity text-2xl text-blue-500"></i>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Endless</h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Play continuously. Blind feedback.</p>
        </button>
        
        <button onClick={() => startGame("TEST")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-emerald-400 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <i className="fi fi-sr-clipboard-list-check text-2xl text-emerald-500"></i>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Test</h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Must answer each word 2x. Blind feedback.</p>
        </button>

        <button onClick={() => startGame("LIFE")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-amber-400 transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <i className="fi fi-sr-heart text-2xl text-amber-500"></i>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Life Mode</h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">3 Lives. Blind feedback.</p>
        </button>

        <button onClick={() => startGame("HARDCORE")} className="card-hover bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-6 text-left border-2 border-transparent hover:border-rose-400 transition-colors sm:col-span-2">
          <div className="flex items-center gap-3 mb-2">
            <i className="fi fi-sr-flame text-2xl text-rose-500"></i>
            <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Hardcore</h3>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">1 Life. No room for error. Blind feedback.</p>
        </button>
      </div>

      <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 text-left border border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3 mb-4">
          <i className="fi fi-sr-stopwatch text-2xl text-violet-500"></i>
          <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Timer Mode</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {[30, 60, 90, 120, 150, 180].map(t => (
            <button 
              key={t}
              onClick={() => startGame("TIMER", t)} 
              className="px-4 py-2 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-violet-500 hover:text-white rounded-lg transition-colors font-bold"
            >
              {t}s
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
