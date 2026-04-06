"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// --- Constants ---
const ALPHABET_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
const ALPHABET_LOWER = "abcdefghijklmnopqrstuvwxyz".split('');

const LEVELS = {
  1: { 
    name: "จับคู่ตัวอักษร", 
    target: 35, 
    type: "match" 
  },
  2: { 
    name: "เติมตัวพิมพ์ใหญ่ที่หายไป", 
    target: 10, 
    type: "fill-upper",
    hideCount: 2
  },
  3: { 
    name: "เติมตัวพิมพ์เล็กที่หายไป", 
    target: 10, 
    type: "fill-lower",
    hideCount: 3
  },
  4: { 
    name: "พิมพ์ตัวอักษร (ท้าทาย)", 
    target: 10, 
    type: "typing"
  }
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
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      [400, 500, 600, 800].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.value = 0.1;
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.2);
      });
    }
  }, [getCtx]);

  return { playSound };
};

export default function AlphabetAdventureClient() {
  const [screen, setScreen] = useState<'menu' | 'game' | 'victory'>('menu');
  const [gameState, setGameState] = useState({
    level: 1,
    score: 0,
    round: 1,
    winsInLevel: 0,
    difficulty: 3,
    consecutiveErrors: 0,
  });
  
  const [roundData, setRoundData] = useState<{
    targetLetter?: string;
    correctChar?: string;
    choices: string[];
    grid: { char: string; isHidden: boolean; isCorrect?: boolean; isWrong?: boolean; value?: string }[];
    missingIndices: number[];
    activeIndex: number;
  }>({
    choices: [],
    grid: [],
    missingIndices: [],
    activeIndex: -1,
  });

  const [feedback, setFeedback] = useState<{ text: string; type: 'pop' | '' }>({ text: '', type: '' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { playSound } = useAudio();

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
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const showFeedback = (text: string) => {
    setFeedback({ text, type: 'pop' });
    setTimeout(() => setFeedback({ text: '', type: '' }), 1000);
  };

  const loadRound = useCallback((state = gameState) => {
    const config = LEVELS[state.level as keyof typeof LEVELS];
    let newRoundData: typeof roundData = { ...roundData, choices: [], grid: [], missingIndices: [], activeIndex: -1 };

    if (config.type === "match") {
      let targetIndex = state.round <= 26 ? state.round - 1 : Math.floor(Math.random() * 26);
      const upper = ALPHABET_UPPER[targetIndex];
      const correctLower = ALPHABET_LOWER[targetIndex];
      
      let choices = [correctLower];
      while (choices.length < 3) {
        let r = ALPHABET_LOWER[Math.floor(Math.random() * 26)];
        if (!choices.includes(r)) choices.push(r);
      }
      newRoundData = {
        ...newRoundData,
        targetLetter: upper,
        correctChar: correctLower,
        choices: choices.sort(() => Math.random() - 0.5),
      };
    } 
    else if (config.type.startsWith("fill")) {
      const isUpper = config.type === "fill-upper";
      const alphabet = isUpper ? ALPHABET_UPPER : ALPHABET_LOWER;
      
      let missing: number[] = [];
      while (missing.length < (config as any).hideCount) {
        const r = Math.floor(Math.random() * 26);
        if (!missing.includes(r)) missing.push(r);
      }
      missing.sort((a, b) => a - b);

      const grid = alphabet.map((char, index) => ({
        char,
        isHidden: missing.includes(index),
      }));

      newRoundData = {
        ...newRoundData,
        grid,
        missingIndices: missing,
        activeIndex: missing[0],
      };
      
      // Load choices for the first active slot
      const correct = alphabet[missing[0]];
      let choices = [correct];
      while (choices.length < 4) {
        let r = alphabet[Math.floor(Math.random() * 26)];
        if (!choices.includes(r)) choices.push(r);
      }
      newRoundData.choices = choices.sort(() => Math.random() - 0.5);
    }
    else if (config.type === "typing") {
      const isUpper = Math.random() > 0.5;
      const alphabet = isUpper ? ALPHABET_UPPER : ALPHABET_LOWER;
      
      let missing: number[] = [];
      while (missing.length < state.difficulty) {
        const r = Math.floor(Math.random() * 26);
        if (!missing.includes(r)) missing.push(r);
      }
      
      const grid = alphabet.map((char, index) => ({
        char,
        isHidden: missing.includes(index),
        value: "",
      }));

      newRoundData = {
        ...newRoundData,
        grid,
        missingIndices: missing,
        activeIndex: -1,
      };
    }

    setRoundData(newRoundData);
  }, [gameState, roundData]);

  const startGame = () => {
    const initialState = {
      level: 1,
      score: 0,
      round: 1,
      winsInLevel: 0,
      difficulty: 3,
      consecutiveErrors: 0,
    };
    setGameState(initialState);
    setScreen('game');
    loadRound(initialState);
  };

  const handleChoice = (selected: string) => {
    const config = LEVELS[gameState.level as keyof typeof LEVELS];
    const correct = config.type === "match" ? roundData.correctChar : roundData.grid[roundData.activeIndex].char;

    if (selected === correct) {
      playSound('correct');
      const newScore = gameState.score + 5;
      
      if (config.type === "match") {
        const nextRound = gameState.round + 1;
        if (nextRound > config.target) {
          nextLevel(newScore);
        } else {
          const nextState = { ...gameState, score: newScore, round: nextRound };
          setGameState(nextState);
          loadRound(nextState);
        }
      } else {
        // Update grid
        const newGrid = [...roundData.grid];
        newGrid[roundData.activeIndex] = { ...newGrid[roundData.activeIndex], isHidden: false, isCorrect: true };
        
        const nextMissing = roundData.missingIndices.filter(i => i !== roundData.activeIndex);
        
        if (nextMissing.length === 0) {
          const newWins = gameState.winsInLevel + 1;
          if (newWins >= config.target) {
            nextLevel(newScore);
          } else {
            const nextState = { ...gameState, score: newScore, winsInLevel: newWins };
            setGameState(nextState);
            setTimeout(() => loadRound(nextState), 1000);
          }
        } else {
          // Next Slot
          const isUpper = config.type === "fill-upper";
          const alphabet = isUpper ? ALPHABET_UPPER : ALPHABET_LOWER;
          const nextActive = nextMissing[0];
          const nextCorrect = alphabet[nextActive];
          let nextChoices = [nextCorrect];
          while (nextChoices.length < 4) {
            let r = alphabet[Math.floor(Math.random() * 26)];
            if (!nextChoices.includes(r)) nextChoices.push(r);
          }
          setRoundData({
            ...roundData,
            grid: newGrid,
            missingIndices: nextMissing,
            activeIndex: nextActive,
            choices: nextChoices.sort(() => Math.random() - 0.5),
          });
          setGameState({ ...gameState, score: newScore });
        }
      }
    } else {
      playSound('wrong');
      setGameState({ ...gameState, score: Math.max(0, gameState.score - 3) });
    }
  };

  const checkTyping = () => {
    const config = LEVELS[4];
    let allCorrect = true;
    const newGrid = roundData.grid.map(item => {
      if (!item.isHidden) return item;
      const isCorrect = item.value?.toUpperCase() === item.char.toUpperCase();
      if (!isCorrect) allCorrect = false;
      return { ...item, isCorrect, isWrong: !isCorrect };
    });

    setRoundData({ ...roundData, grid: newGrid });

    if (allCorrect) {
      playSound('correct');
      const newScore = gameState.score + 10;
      const newWins = gameState.winsInLevel + 1;
      const newDifficulty = Math.min(24, gameState.difficulty + 2);
      
      if (newWins >= config.target) {
        victory(newScore);
      } else {
        const nextState = { ...gameState, score: newScore, winsInLevel: newWins, difficulty: newDifficulty, consecutiveErrors: 0 };
        setGameState(nextState);
        setTimeout(() => loadRound(nextState), 1000);
      }
    } else {
      playSound('wrong');
      const newErrors = gameState.consecutiveErrors + 1;
      const nextState = { ...gameState, score: Math.max(0, gameState.score - 5), consecutiveErrors: newErrors };
      
      if (newErrors >= 3) {
        showFeedback("ลดความยากลงนะ");
        const easierState = { ...nextState, difficulty: Math.max(1, gameState.difficulty - 1), consecutiveErrors: 0 };
        setGameState(easierState);
        setTimeout(() => loadRound(easierState), 1500);
      } else {
        setGameState(nextState);
        // Reset wrong marks after a bit
        setTimeout(() => {
          setRoundData(prev => ({
            ...prev,
            grid: prev.grid.map(g => g.isWrong ? { ...g, isWrong: false } : g)
          }));
        }, 800);
      }
    }
  };

  const nextLevel = (score: number) => {
    playSound('win');
    showFeedback("ผ่านด่าน!");
    const nextState = { 
      ...gameState, 
      level: gameState.level + 1, 
      score, 
      round: 1, 
      winsInLevel: 0, 
      difficulty: 3, 
      consecutiveErrors: 0 
    };
    setGameState(nextState);
    setTimeout(() => loadRound(nextState), 1500);
  };

  const victory = (score: number) => {
    playSound('win');
    setGameState({ ...gameState, score });
    setScreen('victory');
  };

  // --- Render Helpers ---
  const currentConfig = LEVELS[gameState.level as keyof typeof LEVELS];
  const progress = currentConfig.type === "match" ? gameState.round : gameState.winsInLevel;
  const progressPct = Math.min(100, (progress / currentConfig.target) * 100);

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col items-center justify-center p-4 transition-colors duration-500 ${
        screen === 'game'
          ? 'h-screen overflow-hidden bg-violet-50 dark:bg-zinc-950'
          : 'min-h-screen bg-violet-50 dark:bg-zinc-950 pt-24'
      }`}
      style={{ fontFamily: "'Mali', sans-serif" }}
    >
      <div className="w-full max-w-3xl mx-auto relative">


        {/* --- SCREENS --- */}
        {screen === 'menu' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black text-violet-600 dark:text-violet-400 tracking-tight">
                Alphabet Adventure
              </h1>
              <p className="text-xl md:text-2xl text-zinc-500 dark:text-zinc-400 font-bold">
                ผจญภัยโลกตัวอักษร
              </p>
            </div>
            
            <div className="text-8xl animate-bounce py-4 transition-all hover:scale-125 duration-500 cursor-default">
              <i className="fi fi-sr-island-tropical text-violet-600 dark:text-violet-400"></i>
            </div>
            
            <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
              เตรียมพร้อมสำหรับการเดินทางแสนสนุกผ่านเกาะตัวอักษร A-Z เรียนรู้และท้าทายตัวเองไปพร้อมกัน!
            </p>

            <div className="pt-4">
              <button 
                onClick={startGame}
                className="group relative px-12 py-5 bg-violet-600 text-white text-2xl font-black rounded-3xl shadow-[0_12px_0_0_rgba(109,40,217,1)] active:shadow-none active:translate-y-3 transition-all duration-150 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  เริ่มเกม <i className="fi fi-sr-play mt-1 transition-transform group-hover:translate-x-1"></i>
                </span>
                <div className="absolute inset-0 bg-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
            
            <p className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              เหมาะสำหรับชั้น G.1 • 4 ด่านหรรษา
            </p>
          </div>
        )}

        {screen === 'game' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* HUD */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border-2 border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setScreen('menu')}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-zinc-500 hover:text-violet-500 transition-colors"
                  >
                    <i className="fi fi-sr-angle-left text-xs"></i>
                    <span className="text-xs font-black uppercase tracking-widest">เมนู</span>
                  </button>
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 text-xl font-black">
                    {gameState.level}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">LEVEL</p>
                    <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">{currentConfig.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">SCORE</p>
                    <p className="text-3xl font-black text-fuchsia-500 tracking-tighter">{gameState.score}</p>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:scale-110 transition-all"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                  >
                    <i className={`fi ${isFullscreen ? 'fi-sr-exit' : 'fi-sr-expand'} text-violet-600 dark:text-violet-400 text-lg`}></i>
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-1 shadow-inner">
                  <div
                    className="h-full bg-violet-500 rounded-full transition-all duration-500 ease-out relative shadow-sm"
                    style={{ width: `${progressPct}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                  <span>PROGRESS</span>
                  <span>{Math.min(progress, currentConfig.target)} / {currentConfig.target}</span>
                </div>
              </div>
            </div>

            {/* MAIN GAME AREA */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
               {/* Decorative background elements */}
               <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-fuchsia-500/5 rounded-full -ml-16 -mb-16 blur-3xl"></div>

               {/* Game Content Switcher */}
               {currentConfig.type === "match" ? (
                 <div className="flex flex-col items-center animate-in zoom-in duration-300">
                   <div className="w-48 h-48 md:w-56 md:h-56 rounded-[3rem] bg-violet-50 dark:bg-violet-900/10 border-8 border-violet-100 dark:border-violet-900/30 flex items-center justify-center text-9xl font-black leading-none text-violet-600 dark:text-violet-400 shadow-2xl mb-12 transform hover:rotate-2 transition-transform">
                     {roundData.targetLetter}
                   </div>
                   <div className="flex flex-wrap justify-center gap-6">
                     {roundData.choices.map((choice, i) => (
                       <button
                         key={i}
                         onClick={() => handleChoice(choice)}
                         className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-white dark:bg-zinc-800 text-5xl font-black text-zinc-700 dark:text-zinc-200 shadow-[0_8px_0_0_#e4e4e7] dark:shadow-[0_8px_0_0_#27272a] active:shadow-none active:translate-y-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all duration-150 border-2 border-zinc-100 dark:border-zinc-800"
                       >
                         {choice}
                       </button>
                     ))}
                   </div>
                 </div>
               ) : (
                 <div className="w-full space-y-12">
                   <div className="grid grid-cols-7 md:grid-cols-13 gap-2 md:gap-3">
                     {roundData.grid.map((item, index) => (
                       <div 
                         key={index}
                         className={`aspect-square flex items-center justify-center rounded-lg md:rounded-xl text-xl md:text-2xl font-black transition-all duration-300 ${
                           item.isHidden 
                             ? (roundData.activeIndex === index 
                               ? 'bg-violet-100 dark:bg-violet-900/40 border-4 border-violet-500 animate-pulse' 
                               : (item.isWrong ? 'bg-rose-500 text-white shadow-none translate-y-1' : 'bg-zinc-100 dark:bg-zinc-800 border-2 border-dashed border-zinc-300 dark:border-zinc-700 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700'))
                             : (item.isCorrect ? 'bg-emerald-500 text-white scale-105' : 'bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 text-zinc-400')
                         }`}
                         onClick={() => !item.isCorrect && currentConfig.type !== "typing" && setRoundData(prev => ({ ...prev, activeIndex: index }))}
                       >
                         {item.isHidden ? (
                           currentConfig.type === "typing" ? (
                             <input 
                               autoFocus={index === roundData.missingIndices[0]}
                               className="w-full h-full bg-transparent text-center focus:outline-hidden"
                               value={item.value}
                               onChange={(e) => {
                                 const val = e.target.value.slice(-1);
                                 const nextGrid = [...roundData.grid];
                                 nextGrid[index].value = val;
                                 setRoundData(prev => ({ ...prev, grid: nextGrid }));
                               }}
                             />
                           ) : "?"
                         ) : item.char}
                       </div>
                     ))}
                   </div>

                   {currentConfig.type === "typing" ? (
                     <div className="text-center pt-8">
                        <button 
                          onClick={checkTyping}
                          className="px-10 py-4 bg-fuchsia-600 text-white text-xl font-black rounded-2xl shadow-[0_8px_0_0_#9d174d] active:shadow-none active:translate-y-2 transition-all flex items-center gap-2 mx-auto"
                        >
                          ตรวจคำตอบ <i className="fi fi-sr-checkbox"></i>
                        </button>
                     </div>
                   ) : (
                     <div className="flex flex-wrap justify-center gap-4">
                        {roundData.choices.map((choice, i) => (
                          <button
                            key={i}
                            onClick={() => handleChoice(choice)}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white dark:bg-zinc-800 text-3xl font-black text-zinc-700 dark:text-zinc-200 shadow-[0_6px_0_0_#e4e4e7] dark:shadow-[0_6px_0_0_#27272a] active:shadow-none active:translate-y-1.5 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all border-2 border-zinc-100 dark:border-zinc-800"
                          >
                            {choice}
                          </button>
                        ))}
                     </div>
                   )}
                 </div>
               )}
            </div>
            
            {/* Feedback Pop */}
            {feedback.text && (
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in slide-in-from-bottom-2 duration-300 pointer-events-none">
                <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md px-10 py-6 rounded-[2rem] shadow-2xl border-4 border-violet-500 transform -rotate-3">
                  <p className="text-4xl md:text-6xl font-black text-violet-600 dark:text-violet-400 whitespace-nowrap">
                    {feedback.text}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {screen === 'victory' && (
          <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-12 shadow-2xl text-center space-y-8 animate-in zoom-in duration-500">
            <h1 className="text-5xl md:text-7xl font-black text-emerald-500 animate-pulse tracking-tight">
              ยอดเยี่ยมมาก!
            </h1>
            <div className="text-9xl rotate-12 py-6 drop-shadow-2xl">
              <i className="fi fi-sr-trophy text-amber-500 dark:text-amber-400"></i>
            </div>
            <h2 className="text-2xl md:text-3xl text-zinc-600 dark:text-zinc-400 font-bold">
              คุณพิชิตเกาะตัวอักษรสำเร็จแล้ว!
            </h2>
            
            <div className="bg-violet-50 dark:bg-violet-900/10 p-8 rounded-3xl inline-block border-2 border-violet-100 dark:border-violet-900/30">
              <p className="text-lg font-bold text-violet-600/60 dark:text-violet-400/60 uppercase tracking-widest mb-1">FINAL SCORE</p>
              <p className="text-7xl font-black text-violet-600 dark:text-violet-400 tracking-tighter">{gameState.score}</p>
            </div>

            <div className="pt-8">
              <button 
                onClick={startGame}
                className="px-12 py-5 bg-emerald-600 text-white text-2xl font-black rounded-3xl shadow-[0_12px_0_0_#065f46] active:shadow-none active:translate-y-3 transition-all"
              >
                เล่นอีกครั้ง!
              </button>
              <button 
                onClick={() => setScreen('menu')}
                className="block mx-auto mt-6 text-zinc-400 hover:text-violet-500 font-bold transition-colors"
              >
                กลับหน้าหลัก
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
