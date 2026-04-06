"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getNumberData, NumberData } from "@/lib/numbers";

// --- Constants ---
const EMOJIS = ["🍎", "🐶", "🚗", "🌟", "🎈", "⚽", "🐸", "🐻", "🍓", "🍉", "🚁", "🤖"];

const INSTRUCTIONS = {
  1: { th: "เลือกคำศัพท์ให้ตรงกับตัวเลข", en: "Choose the correct English word for the number." },
  2: { th: "ตัวเลขนี้อ่านว่า...", en: "Choose the correct Thai pronunciation." },
  3: { th: "เติมตัวอักษรที่หายไปให้ถูกต้อง", en: "Fill in the missing letter." },
  4: { th: "ช่วยกันนับจำนวน แล้วเลือกตัวเลขให้ตรงกันนะ", en: "Count the objects and choose the right number." },
  5: { th: "บวกเลขแล้วเลือกคำตอบเลย", en: "Add the objects and choose the correct total." },
  6: { th: "โหมดสุ่ม: ตอบคำถามทุกรูปแบบ", en: "Endless Mode: Answer all types of questions!" }
};

const RANGES = [
  { id: '1-10', label: '1 - 10', min: 1, max: 10 },
  { id: '11-20', label: '11 - 20', min: 11, max: 20 },
  { id: '1-20', label: '1 - 20', min: 1, max: 20 },
  { id: '1-100', label: '1 - 100', min: 1, max: 100 },
];

// --- Helpers ---
const shuffleArray = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

const buildOptions = (correct: string, min: number, max: number): string[] => {
  const opts = [correct];
  while (opts.length < 3) {
    const rand = Math.floor(Math.random() * (max - min + 1)) + min;
    const d = getNumberData(rand).eng;
    if (!opts.includes(d)) opts.push(d);
  }
  return opts.sort(() => Math.random() - 0.5);
};

// --- Sound Hook ---
const useAudio = () => {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    const AudioContext = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AudioContext) return null;
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === 'suspended') {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  useEffect(() => {
    return () => { ctxRef.current?.close(); ctxRef.current = null; };
  }, []);

  const playSound = useCallback((type: 'correct' | 'wrong' | 'win') => {
    const ctx = getCtx();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'correct') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now); osc.stop(now + 0.5);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now); osc.stop(now + 0.3);
    } else if (type === 'win') {
      [400, 500, 600, 800].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.1;
        osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.2);
      });
    }
  }, [getCtx]);

  return { playSound };
};

export default function NumberGameClient() {
  const [screen, setScreen] = useState<'menu' | 'range' | 'game' | 'victory'>('menu');
  const [range, setRange] = useState(RANGES[0]);
  const [gameState, setGameState] = useState({
    score: 0,
    stage: 1,
    isEndless: false,
    questionsDone: 0,
    seqTotal: 0,
    sequentialMode: false,
    sequentialIndex: 0,
    reviewRoundActive: false,
    reviewNumbers: [] as number[],
    reviewIndex: 0,
  });

  const [currentQuestion, setCurrentQuestion] = useState<{
    text: string;
    correct: string;
    options: string[];
    stageType: number;
    visualData?: { emoji: string; count: number; countA?: number; countB?: number };
  } | null>(null);

  const [feedback, setFeedback] = useState<{ text: string; type: 'correct' | 'wrong' | '' }>({ text: '', type: '' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { playSound } = useAudio();
  const stateRef = useRef(gameState);
  stateRef.current = gameState;

  useEffect(() => {
    const header = document.getElementById('site-header');
    const footer = document.getElementById('site-footer');
    if (screen === 'game') {
      header?.classList.add('hidden');
      footer?.classList.add('hidden');
    } else {
      header?.classList.remove('hidden');
      footer?.classList.remove('hidden');
    }
    return () => {
      header?.classList.remove('hidden');
      footer?.classList.remove('hidden');
    };
  }, [screen]);

  // --- Handlers ---
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const generateQuestion = useCallback((game: typeof gameState, r: typeof range) => {
    let activeStage = game.stage;
    if (game.isEndless) activeStage = Math.floor(Math.random() * 5) + 1;

    // === SEQUENTIAL MODE: Show numbers in order first ===
    if (game.sequentialMode && !game.isEndless && activeStage === 1) {
      if (game.sequentialIndex < game.seqTotal) {
        const targetNum = r.min + game.sequentialIndex;
        const numData = getNumberData(targetNum);
        setCurrentQuestion({
          text: numData.num.toString(),
          correct: numData.eng,
          options: buildOptions(numData.eng, r.min, r.max),
          stageType: 1,
        });
        return;
      }
    }

    // === REVIEW ROUND: 5 random numbers from the same range ===
    if (game.reviewRoundActive && !game.isEndless && activeStage === 1) {
      if (game.reviewIndex < game.reviewNumbers.length) {
        const targetNum = game.reviewNumbers[game.reviewIndex];
        const numData = getNumberData(targetNum);
        setCurrentQuestion({
          text: numData.num.toString(),
          correct: numData.eng,
          options: buildOptions(numData.eng, r.min, r.max),
          stageType: 1,
        });
        return;
      }
    }

    // Get Target Number from Range
    const targetNum = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
    const numData = getNumberData(targetNum);

    let qText = "";
    let correctAns = "";
    let options: string[] = [];
    let visualData: any = null;

    if (activeStage === 1) {
      qText = numData.num.toString();
      correctAns = numData.eng;
      options = buildOptions(correctAns, r.min, r.max);
    }
    else if (activeStage === 2) {
      qText = `${numData.num} ${numData.eng}`;
      correctAns = numData.thai;
      options = [correctAns];
      while (options.length < 3) {
        const rand = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
        const d = getNumberData(rand).thai;
        if (!options.includes(d)) options.push(d);
      }
    } 
    else if (activeStage === 3) {
      qText = `${numData.num} = ${numData.spell}`;
      correctAns = numData.missing;
      options = [correctAns, ...numData.wrongLetters];
    } 
    else if (activeStage === 4) {
      // Small ranges or cap at 20 for visual count
      const count = Math.min(20, targetNum);
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      visualData = { emoji, count };
      correctAns = getNumberData(count).eng; // Use the actual count shown
      options = [correctAns];
      while (options.length < 3) {
        const rand = Math.floor(Math.random() * 20) + 1;
        const d = getNumberData(rand).eng;
        if (!options.includes(d)) options.push(d);
      }
    } 
    else if (activeStage === 5) {
      // Addition logic capped at 20
      const total = Math.floor(Math.random() * (r.max > 20 ? 19 : r.max - 1)) + 2; 
      const a = Math.floor(Math.random() * (total - 1)) + 1;
      const b = total - a;
      const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      visualData = { emoji, countA: a, countB: b, count: total };
      correctAns = getNumberData(total).eng;
      options = [correctAns];
      while (options.length < 3) {
        const rand = Math.floor(Math.random() * 20) + 1;
        const d = getNumberData(rand).eng;
        if (!options.includes(d)) options.push(d);
      }
    }

    setCurrentQuestion({
      text: qText,
      correct: correctAns,
      options: options.sort(() => Math.random() - 0.5),
      stageType: activeStage,
      visualData
    });
  }, []);

  const startGame = (selectedRange = range) => {
    const seqTotal = selectedRange.max - selectedRange.min + 1;
    const shouldSequence = seqTotal <= 20;
    const initialState = {
      score: 0,
      stage: 1,
      isEndless: false,
      questionsDone: 0,
      seqTotal,
      sequentialMode: shouldSequence,
      sequentialIndex: 0,
      reviewRoundActive: false,
      reviewNumbers: [] as number[],
      reviewIndex: 0,
    };
    setGameState(initialState);
    setScreen('game');
    generateQuestion(initialState, selectedRange);
  };

  const handleAnswer = (selected: string) => {
    if (!currentQuestion) return;
    const isCorrect = selected === currentQuestion.correct;

    if (isCorrect) {
      playSound('correct');
      setFeedback({ text: 'เก่งมาก! +3', type: 'correct' });
      const newScore = gameState.score + 3;
      const nextDone = gameState.questionsDone + 1;

      // Sequential mode: advance index, check if pass is done
      if (gameState.sequentialMode && !gameState.isEndless) {
        const nextIndex = gameState.sequentialIndex + 1;
        if (nextIndex >= gameState.seqTotal) {
          const reviewNums = shuffleArray(
            Array.from({ length: gameState.seqTotal }, (_, i) => i + range.min)
          ).slice(0, 5);
          const nextState = {
            ...gameState,
            score: newScore,
            sequentialMode: false,
            reviewRoundActive: true,
            reviewNumbers: reviewNums,
            reviewIndex: 0,
            questionsDone: nextDone,
          };
          setGameState(nextState);
          setTimeout(() => {
            setFeedback({ text: '', type: '' });
            generateQuestion(nextState, range);
          }, 1000);
        } else {
          setGameState({ ...gameState, score: newScore, sequentialIndex: nextIndex, questionsDone: nextDone });
          setTimeout(() => {
            setFeedback({ text: '', type: '' });
            generateQuestion(stateRef.current, range);
          }, 1000);
        }
        return;
      }

      // Review round: advance index, check if done
      if (gameState.reviewRoundActive && !gameState.isEndless) {
        const nextReviewIndex = gameState.reviewIndex + 1;
        if (nextReviewIndex >= gameState.reviewNumbers.length) {
          const nextState = {
            ...gameState,
            score: newScore,
            stage: 2,
            sequentialMode: false,
            reviewRoundActive: false,
            questionsDone: nextDone,
          };
          setGameState(nextState);
          setTimeout(() => {
            setFeedback({ text: '', type: '' });
            generateQuestion(nextState, range);
          }, 1000);
        } else {
          setGameState({ ...gameState, score: newScore, reviewIndex: nextReviewIndex, questionsDone: nextDone });
          setTimeout(() => {
            setFeedback({ text: '', type: '' });
            generateQuestion(stateRef.current, range);
          }, 1000);
        }
        return;
      }

      // Normal stage progression (post-sequential stages or 1-100 range)
      let nextStage = gameState.stage;
      if (!gameState.isEndless) {
        if (gameState.stage === 1 && nextDone >= 5) nextStage = 2;
        else if (gameState.stage === 2 && nextDone >= 10) nextStage = 3;
        else if (gameState.stage === 3 && nextDone >= 15) nextStage = 4;
        else if (gameState.stage === 4 && nextDone >= 20) nextStage = 5;
        else if (gameState.stage === 5 && nextDone >= 25) {
             victory(newScore);
             return;
        }
      }

      setGameState({ ...gameState, score: newScore, stage: nextStage, questionsDone: nextDone });
      setTimeout(() => {
        setFeedback({ text: '', type: '' });
        const st = stateRef.current;
        generateQuestion({ ...st, score: newScore, stage: nextStage, questionsDone: nextDone }, range);
      }, 1000);
    } else {
      playSound('wrong');
      setFeedback({ text: 'ไม่เป็นไรนะ! -2', type: 'wrong' });
      setGameState({ ...gameState, score: Math.max(0, gameState.score - 2) });
      setTimeout(() => setFeedback({ text: '', type: '' }), 1000);
    }
  };

  const victory = (score: number) => {
    playSound('win');
    setGameState({ ...gameState, score });
    setScreen('victory');
  };

  const startEndless = () => {
    const newState = { ...gameState, isEndless: true, stage: 1, questionsDone: 0 };
    setGameState(newState);
    setScreen('game');
    generateQuestion(newState, range);
  };

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center justify-center p-4 transition-all duration-500 ${
        screen === 'game'
          ? 'h-screen overflow-hidden bg-fuchsia-50 dark:bg-zinc-950'
          : 'min-h-screen bg-fuchsia-50 dark:bg-zinc-950 pt-24'
      }`}
      style={{ fontFamily: "'Mali', sans-serif" }}
    >
      <div className="w-full max-w-3xl mx-auto relative">


        {/* --- SCREENS --- */}
        {screen === 'menu' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 relative">
            <button
              onClick={() => router.push('/games')}
              className="absolute top-6 right-6 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 text-zinc-500 hover:text-fuchsia-500 transition-colors"
              title="Back to Games"
            >
              <i className="fi fi-sr-home text-lg"></i>
            </button>
             <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black text-fuchsia-600 dark:text-fuchsia-400 tracking-tight">
                Number Game
              </h1>
              <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-bold">
                ผจญภัยโลกตัวเลข 1-100
              </p>
            </div>
            
            <div className="text-8xl animate-bounce py-4 transform hover:scale-110 duration-500 cursor-default">
              <i className="fi fi-sr-calculator text-fuchsia-600 dark:text-fuchsia-400"></i>
            </div>

            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              มาเรียนรู้ตัวเลขภาษาอังกฤษแสนสนุก กับกิจกรรมท้าทายหลายรูปแบบ!
            </p>

            <button 
              onClick={() => setScreen('range')}
              className="px-12 py-5 bg-fuchsia-600 text-white text-2xl font-black rounded-3xl shadow-[0_12px_0_0_rgba(192,38,211,1)] active:shadow-none active:translate-y-3 transition-all"
            >
              เริ่มผจญภัย
            </button>
          </div>
        )}

        {screen === 'range' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-8 animate-in zoom-in duration-500">
            <h2 className="text-3xl font-black text-zinc-800 dark:text-zinc-100 uppercase tracking-widest">
              เลือกระดับตัวเลข
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {RANGES.map(r => (
                <button
                  key={r.id}
                  onClick={() => { setRange(r); startGame(r); }}
                  className="p-6 bg-zinc-50 dark:bg-zinc-800 rounded-3xl border-4 border-zinc-100 dark:border-zinc-700 hover:border-fuchsia-500 dark:hover:border-fuchsia-400 transition-all group"
                >
                  <p className="text-sm font-black text-zinc-400 group-hover:text-fuchsia-500 transition-colors uppercase">RANGE</p>
                  <p className="text-4xl font-black text-zinc-800 dark:text-zinc-100">{r.label}</p>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setScreen('menu')}
              className="text-zinc-400 font-bold hover:text-fuchsia-500 transition-colors"
            >
              ย้อนกลับ
            </button>
          </div>
        )}

        {screen === 'game' && currentQuestion && (
          <div className="space-y-6 animate-in fade-in duration-500">
              {/* HUD */}
             <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border-2 border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setScreen('menu')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 text-zinc-500 hover:text-fuchsia-500 transition-colors"
                  >
                    <i className="fi fi-sr-angle-left text-xs"></i>
                    <span className="text-xs font-black uppercase tracking-widest">เมนู</span>
                  </button>
                  <button
                    onClick={() => router.push('/games')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 text-zinc-500 hover:text-fuchsia-500 transition-colors"
                    title="Back to Games"
                  >
                    <i className="fi fi-sr-home text-xs"></i>
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center text-fuchsia-600 dark:text-fuchsia-400 text-xl font-black">
                    {gameState.isEndless ? "∞" : gameState.stage}
                  </div>
                  <div className="text-zinc-400 dark:text-zinc-500 text-xs font-black uppercase tracking-widest">
                    {gameState.isEndless ? "ENDLESS MODE" : `STAGE ${gameState.stage}`}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">SCORE</p>
                    <p className="text-4xl font-black text-fuchsia-500 tracking-tighter leading-none">{gameState.score}</p>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/30 hover:scale-110 transition-all"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    <i className={`fi ${isFullscreen ? 'fi-sr-exit' : 'fi-sr-expand'} text-fuchsia-600 dark:text-fuchsia-400 text-lg`}></i>
                  </button>
                </div>
             </div>

             {/* MAIN PLAY AREA */}
             <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl min-h-[450px] flex flex-col items-center justify-between relative overflow-hidden">
                <div className="text-center w-full">
                  <p className="text-lg font-black text-fuchsia-500 mb-8 px-4 py-2 bg-fuchsia-50 dark:bg-fuchsia-900/10 rounded-2xl inline-block">
                    {INSTRUCTIONS[currentQuestion.stageType as keyof typeof INSTRUCTIONS].th}
                  </p>

                  <div className="min-h-[160px] flex items-center justify-center">
                    {currentQuestion.visualData ? (
                      currentQuestion.stageType === 5 ? (
                        <div className="flex items-center gap-4 text-center">
                          <div className="flex flex-wrap max-w-[150px] justify-center text-4xl gap-1">
                            {Array.from({ length: currentQuestion.visualData.countA || 0 }).map((_, i) => (
                              <span key={i} className="animate-in zoom-in duration-300">{currentQuestion.visualData?.emoji}</span>
                            ))}
                          </div>
                          <span className="text-4xl font-black text-zinc-300">+</span>
                          <div className="flex flex-wrap max-w-[150px] justify-center text-4xl gap-1">
                            {Array.from({ length: currentQuestion.visualData.countB || 0 }).map((_, i) => (
                              <span key={i} className="animate-in zoom-in duration-300">{currentQuestion.visualData?.emoji}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-wrap max-w-[350px] justify-center text-5xl gap-2">
                           {Array.from({ length: currentQuestion.visualData.count }).map((_, i) => (
                              <span key={i} className="animate-in zoom-in duration-300">{currentQuestion.visualData?.emoji}</span>
                            ))}
                        </div>
                      )
                    ) : (
                      <h3 className="text-6xl md:text-8xl font-black text-zinc-800 dark:text-zinc-100 tracking-tight animate-in zoom-in duration-300">
                        {currentQuestion.text}
                      </h3>
                    )}
                  </div>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
                   {currentQuestion.options.map((opt, i) => (
                     <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        className="py-5 bg-zinc-50 dark:bg-zinc-800 text-xl font-black text-zinc-700 dark:text-zinc-200 rounded-3xl border-4 border-zinc-100 dark:border-zinc-700 hover:border-fuchsia-500 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 active:translate-y-2 active:shadow-none shadow-[0_8px_0_0_#e4e4e7] dark:shadow-none transition-all"
                     >
                       {opt}
                     </button>
                   ))}
                </div>
             </div>

             {feedback.text && (
                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 animate-in zoom-in slide-in-from-bottom-2 duration-300">
                  <div className={`px-12 py-6 rounded-[2rem] border-4 shadow-2xl transform -rotate-2 ${
                    feedback.type === 'correct' ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-rose-500 border-rose-600 text-white'
                  }`}>
                    <p className="text-4xl md:text-6xl font-black tracking-tighter">{feedback.text}</p>
                  </div>
                </div>
             )}
          </div>
        )}

        {screen === 'victory' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-12 shadow-2xl text-center space-y-8 animate-in zoom-in duration-500">
            <h1 className="text-5xl md:text-7xl font-black text-fuchsia-600 dark:text-fuchsia-400 tracking-tight underline decoration-zinc-100 dark:decoration-zinc-800 underline-offset-8">
              ยอดเยี่ยมไปเลย!
            </h1>
            <div className="text-[10rem] drop-shadow-2xl py-4">
              <i className="fi fi-sr-medal text-amber-500 dark:text-amber-400"></i>
            </div>
            <p className="text-2xl font-bold text-zinc-500 dark:text-zinc-400 px-8">
              หนูผ่านครบทุกด่านแล้วคนเก่ง! พร้อมสำหรับโหมดท้าทายหรือยัง?
            </p>

            <div className="flex flex-col md:flex-row justify-center gap-4 pt-4">
              <button
                onClick={startEndless}
                className="px-10 py-5 bg-fuchsia-600 text-white text-xl font-black rounded-3xl shadow-[0_12px_0_0_#9d174d] active:shadow-none active:translate-y-3 transition-all"
              >
                เล่นโหมดท้าทาย (∞)
              </button>
              <button
                onClick={() => router.push('/games')}
                className="px-10 py-5 bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 text-xl font-black rounded-3xl hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/20 hover:text-fuchsia-500 transition-colors"
              >
                <i className="fi fi-sr-gamepad mr-2"></i>เกมอื่นๆ
              </button>
              <button
                onClick={() => setScreen('range')}
                className="px-10 py-5 bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-xl font-black rounded-3xl shadow-[0_12px_0_0_#d4d4d8] dark:shadow-none active:shadow-none active:translate-y-3 transition-all"
              >
                เปลี่ยนระดับตัวเลข
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
