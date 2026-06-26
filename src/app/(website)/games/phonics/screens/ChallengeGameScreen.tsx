"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { shuffleArray } from "@/lib/shuffle";
import {
  generatePhonemeMatchRound,
  generateSoundSortQuestions,
  generateRhymeTimeQuestions,
  generateSpeedSpellQuestions,
  generateSyllableSmashQuestions,
} from "../question-generators";
import { CHALLENGE_TYPES, CHALLENGE_ROUND_LENGTHS, SIMILAR_SOUND_GROUPS } from "../constants";
import type { PhonemeMatchQuestion, SoundSortQuestion, RhymeQuestion, SpeedSpellQuestion, SyllableQuestion, CefrLevel } from "../types";

interface ChallengeGameScreenProps {
  challengeType: "phoneme-match" | "sound-sort" | "rhyme-time" | "speed-spell" | "syllable-smash";
  difficulty: "easy" | "medium" | "hard";
  level: string;
  onComplete: (results: { score: number; totalCorrect: number; totalAttempts: number }) => void;
  onBack: () => void;
}

type GamePhase = "playing" | "feedback" | "finished";

interface PhonemeMatchCard {
  id: string;
  text: string;
  type: "ipa" | "word";
  matchId: string;
  flipped: boolean;
  matched: boolean;
}

function getChallengeColor(type: string): string {
  const ct = CHALLENGE_TYPES.find((c) => c.id === type);
  return ct?.color ?? "#2EC4B6";
}

function getChallengeTitle(type: string): string {
  const ct = CHALLENGE_TYPES.find((c) => c.id === type);
  return ct?.title ?? type;
}

function getDifficultyLabel(diff: string): string {
  return diff.charAt(0).toUpperCase() + diff.slice(1);
}

function getSoundSortGroups(question: SoundSortQuestion) {
  const phonemeToGroupMap = new Map<string, string>();
  for (const group of SIMILAR_SOUND_GROUPS) {
    for (const pid of group.phonemeIds) {
      phonemeToGroupMap.set(pid, group.id);
    }
  }
  const involvedGroupIds = new Set<string>();
  for (const pid of question.targetPhonemeIds) {
    const gid = phonemeToGroupMap.get(pid);
    if (gid) involvedGroupIds.add(gid);
  }
  return SIMILAR_SOUND_GROUPS.filter((g) => involvedGroupIds.has(g.id));
}

function PhonemeMatchGame({
  question,
  onComplete,
}: {
  question: PhonemeMatchQuestion;
  onComplete: (correct: number, total: number) => void;
}) {
  const [cards, setCards] = useState<PhonemeMatchCard[]>(() => {
    const cardList: PhonemeMatchCard[] = [];
    question.pairs.forEach((pair, idx) => {
      cardList.push({
        id: `ipa-${idx}`,
        text: pair.ipa,
        type: "ipa",
        matchId: pair.phonemeId,
        flipped: false,
        matched: false,
      });
      cardList.push({
        id: `word-${idx}`,
        text: pair.word,
        type: "word",
        matchId: pair.phonemeId,
        flipped: false,
        matched: false,
      });
    });
    return shuffleArray(cardList);
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [matches, setMatches] = useState(0);
  const [feedbackWrong, setFeedbackWrong] = useState<string[]>([]);
  const lockRef = useRef(false);

  const allMatched = cards.every((c) => c.matched);

  useEffect(() => {
    if (allMatched && matches > 0) {
      setTimeout(() => onComplete(matches, attempts), 600);
    }
  }, [allMatched, matches, attempts, onComplete]);

  function handleCardClick(cardId: string) {
    if (lockRef.current) return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.matched || card.flipped) return;

    if (!selected) {
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)));
      setSelected(cardId);
      return;
    }

    if (selected === cardId) return;

    const firstCard = cards.find((c) => c.id === selected);
    if (!firstCard) return;

    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)));
    setAttempts((a) => a + 1);

    const isMatch = firstCard.matchId === card.matchId && firstCard.type !== card.type;

    if (isMatch) {
      setCards((prev) =>
        prev.map((c) =>
          c.id === selected || c.id === cardId ? { ...c, matched: true } : c
        )
      );
      setMatches((m) => m + 1);
      setSelected(null);
    } else {
      setFeedbackWrong([selected, cardId]);
      lockRef.current = true;
      setTimeout(() => {
        setCards((prev) =>
          prev.map((c) =>
            c.id === selected || c.id === cardId ? { ...c, flipped: false } : c
          )
        );
        setFeedbackWrong([]);
        setSelected(null);
        lockRef.current = false;
      }, 600);
    }
  }

  const color = getChallengeColor("phoneme-match");

  return (
    <div className="space-y-6">
      <p className="text-sm font-bold text-slate-500 dark:text-slate-400 text-center">
        Match each IPA symbol to its word
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto">
        {cards.map((card) => {
          const isSelected = card.id === selected;
          const isFeedbackWrong = feedbackWrong.includes(card.id);
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              disabled={card.matched}
              className={`
                h-20 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300
                ${card.matched
                  ? "bg-green-400/30 dark:bg-green-500/20 border-green-400/50 text-green-700 dark:text-green-300 cursor-default scale-95 opacity-70"
                  : card.flipped
                    ? isFeedbackWrong
                      ? "bg-red-400/30 dark:bg-red-500/20 border-red-400/50 text-red-700 dark:text-red-300 scale-105"
                      : isSelected
                        ? "ring-2 ring-offset-2 ring-offset-transparent"
                        : "bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-white"
                    : "bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
                }
                glass-panel border-2
                ${!card.matched && !card.flipped ? "border-white/20 dark:border-slate-700/50" : ""}
                ${isSelected ? "border-blue-400/60" : ""}
                ${isFeedbackWrong ? "border-red-400/60" : ""}
                ${card.matched ? "border-green-400/50" : ""}
              `}
              style={isSelected && !isFeedbackWrong ? { borderColor: color, boxShadow: `0 0 0 2px ${color}40` } : {}}
            >
              <span className={card.type === "ipa" ? "text-lg" : "text-sm"}>{card.text}</span>
            </button>
          );
        })}
      </div>
      <div className="text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        Matches: {matches} / {question.gridSize} &middot; Attempts: {attempts}
      </div>
    </div>
  );
}

function SoundSortGame({
  questions,
  onComplete,
}: {
  questions: SoundSortQuestion[];
  onComplete: (correct: number, total: number) => void;
}) {
  const allWords = questions.flatMap((q) => q.words);
  const total = allWords.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const lockRef = useRef(false);

  const currentWord = allWords[currentIndex];
  const currentQuestion = questions.find((q) =>
    q.words.some((w) => w.word === currentWord?.word)
  );
  const groups = currentQuestion ? getSoundSortGroups(currentQuestion) : [];

  function handleGroupClick(groupId: string) {
    if (lockRef.current || !currentWord) return;
    lockRef.current = true;

    const isCorrect = groupId === currentWord.correctGroup;
    if (isCorrect) setCorrect((c) => c + 1);
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      setFeedback(null);
      lockRef.current = false;
      if (currentIndex + 1 >= total) {
        const finalCorrect = isCorrect ? correct + 1 : correct;
        onComplete(finalCorrect, total);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 600);
  }

  if (!currentWord) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
          Which sound group does this word belong to?
        </p>
        <div
          className={`text-3xl font-black text-slate-800 dark:text-white py-6 px-8 inline-block rounded-3xl glass-panel border-white/20 transition-all duration-300 ${
            feedback === "correct"
              ? "bg-green-400/20 dark:bg-green-500/20 scale-105"
              : feedback === "wrong"
                ? "bg-red-400/20 dark:bg-red-500/20 scale-105"
                : ""
          }`}
          style={{ fontFamily: "var(--font-mali)" }}
        >
          {currentWord.word}
        </div>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => handleGroupClick(group.id)}
            className="glass-panel p-4 rounded-2xl border border-white/20 dark:border-slate-700/50 font-bold text-slate-800 dark:text-white hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {group.title}
          </button>
        ))}
      </div>

      <div className="text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        {currentIndex + 1} / {total}
      </div>
    </div>
  );
}

function RhymeTimeGame({
  questions,
  onComplete,
}: {
  questions: RhymeQuestion[];
  onComplete: (correct: number, total: number) => void;
}) {
  const total = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const lockRef = useRef(false);

  const current = questions[currentIndex];
  if (!current) return null;

  function handleOptionClick(option: string) {
    if (lockRef.current) return;
    lockRef.current = true;
    setSelectedAnswer(option);

    const isCorrect = option === current.correctAnswer;
    if (isCorrect) setCorrect((c) => c + 1);
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);
      lockRef.current = false;
      if (currentIndex + 1 >= total) {
        const finalCorrect = isCorrect ? correct + 1 : correct;
        onComplete(finalCorrect, total);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 800);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
          Which word rhymes with the target?
        </p>
        <div
          className="text-3xl font-black text-slate-800 dark:text-white py-6 px-8 inline-block rounded-3xl glass-panel border-white/20"
          style={{ fontFamily: "var(--font-mali)" }}
        >
          {current.targetWord}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {current.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrectAnswer = option === current.correctAnswer;
          let btnClass = "glass-panel p-4 rounded-2xl border text-lg font-bold text-slate-800 dark:text-white transition-all duration-300";
          if (feedback && isSelected) {
            btnClass += feedback === "correct"
              ? " bg-green-400/30 dark:bg-green-500/20 border-green-400/50 scale-105"
              : " bg-red-400/30 dark:bg-red-500/20 border-red-400/50 scale-105";
          } else if (feedback && isCorrectAnswer && !isSelected) {
            btnClass += " bg-green-400/20 dark:bg-green-500/10 border-green-400/30";
          } else {
            btnClass += " border-white/20 dark:border-slate-700/50 hover:scale-[1.02] active:scale-[0.98]";
          }
          return (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              disabled={lockRef.current}
              className={btnClass}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        {currentIndex + 1} / {total}
      </div>
    </div>
  );
}

function SpeedSpellGame({
  questions,
  onComplete,
  difficulty,
}: {
  questions: SpeedSpellQuestion[];
  onComplete: (correct: number, total: number) => void;
  difficulty: "easy" | "medium" | "hard";
}) {
  const total = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [inputBuffer, setInputBuffer] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | "timeout" | null>(null);
  const [tiles, setTiles] = useState<{ letter: string; id: number; used: boolean }[]>([]);
  const lockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = questions[currentIndex];
  const wordText = current?.word.word ?? "";
  const correctAnswer = wordText;

  const initQuestion = useCallback(
    (q: SpeedSpellQuestion) => {
      const letters = q.word.word.split("");
      const extraLetters: string[] = [];
      const vowels = "aeiou";
      for (let i = 0; i < Math.min(3, 5 - letters.length); i++) {
        extraLetters.push(vowels[Math.floor(Math.random() * vowels.length)]);
      }
      const allTiles = [...letters, ...extraLetters];
      setTiles(
        shuffleArray(allTiles).map((letter, i) => ({
          letter,
          id: i,
          used: false,
        }))
      );
      setInputBuffer("");
      setTimeRemaining(Math.floor(q.timeLimitMs / 1000));
      setFeedback(null);
    },
    []
  );

  useEffect(() => {
    if (current) initQuestion(current);
  }, [currentIndex, current, initQuestion]);

  useEffect(() => {
    if (feedback) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => {
        if (t <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, feedback]);

  function handleTimeout() {
    if (lockRef.current) return;
    lockRef.current = true;
    setFeedback("timeout");
    setTimeout(() => advance(false), 800);
  }

  function handleTileClick(tileId: number) {
    if (lockRef.current || feedback) return;
    setTiles((prev) =>
      prev.map((t) => (t.id === tileId ? { ...t, used: true } : t))
    );
    const tile = tiles.find((t) => t.id === tileId);
    if (tile) setInputBuffer((prev) => prev + tile.letter);
  }

  function handleClear() {
    if (lockRef.current || feedback) return;
    setTiles((prev) => prev.map((t) => ({ ...t, used: false })));
    setInputBuffer("");
  }

  function handleCheck() {
    if (lockRef.current || feedback || inputBuffer.length === 0) return;
    lockRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = inputBuffer === correctAnswer;
    if (isCorrect) setCorrect((c) => c + 1);
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => advance(isCorrect), 800);
  }

  function advance(wasCorrect: boolean) {
    if (currentIndex + 1 >= total) {
      const finalCorrect = wasCorrect ? correct + 1 : correct;
      onComplete(finalCorrect, total);
    } else {
      setCurrentIndex((i) => i + 1);
      lockRef.current = false;
    }
  }

  if (!current) return null;

  const timeLimitSecs = Math.floor(current.timeLimitMs / 1000);
  const timerPct = timeLimitSecs > 0 ? (timeRemaining / timeLimitSecs) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
          Spell the word using the tiles
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 italic mb-3">
          {current.word.definition}
        </p>
      </div>

      <div className="max-w-xs mx-auto">
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${timerPct}%`,
              backgroundColor: timerPct > 30 ? getChallengeColor("speed-spell") : "#E74C3C",
            }}
          />
        </div>
        <p className="text-xs font-bold text-center text-slate-500 dark:text-slate-400">
          {timeRemaining}s
        </p>
      </div>

      <div
        className={`text-2xl font-black text-center py-4 px-6 rounded-2xl glass-panel border max-w-xs mx-auto transition-all duration-300 min-h-[3.5rem] tracking-wider ${
          feedback === "correct"
            ? "border-green-400/50 bg-green-400/20"
            : feedback === "wrong" || feedback === "timeout"
              ? "border-red-400/50 bg-red-400/20"
              : "border-white/20 dark:border-slate-700/50"
        } ${inputBuffer.length > 0 ? "text-slate-800 dark:text-white" : "text-slate-400 dark:text-slate-500"}`}
        style={{ fontFamily: "var(--font-mali)" }}
      >
        {inputBuffer || (feedback ? correctAnswer : "\u200B")}
      </div>

      <div className="flex flex-wrap justify-center gap-2 max-w-xs mx-auto min-h-[4rem]">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            onClick={() => handleTileClick(tile.id)}
            disabled={tile.used || !!feedback}
            className={`w-11 h-11 rounded-xl text-lg font-bold transition-all ${
              tile.used
                ? "bg-transparent text-transparent pointer-events-none"
                : "bg-white/50 dark:bg-slate-800/50 text-slate-800 dark:text-white border border-white/30 dark:border-slate-700/50 hover:scale-110 active:scale-95 shadow-sm"
            }`}
          >
            {tile.used ? "" : tile.letter}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        <button
          onClick={handleClear}
          disabled={lockRef.current || !!feedback || inputBuffer.length === 0}
          className="px-5 py-2 rounded-xl text-sm font-bold bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 border border-white/20 dark:border-slate-700/50 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all disabled:opacity-30"
        >
          Clear
        </button>
        <button
          onClick={handleCheck}
          disabled={lockRef.current || !!feedback || inputBuffer.length === 0}
          className="px-6 py-2 rounded-xl text-sm font-bold text-white border transition-all disabled:opacity-30"
          style={{ backgroundColor: getChallengeColor("speed-spell") }}
        >
          Check
        </button>
      </div>

      <div className="text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        {currentIndex + 1} / {total}
      </div>
    </div>
  );
}

function SyllableSmashGame({
  questions,
  onComplete,
}: {
  questions: SyllableQuestion[];
  onComplete: (correct: number, total: number) => void;
}) {
  const total = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const lockRef = useRef(false);

  const current = questions[currentIndex];
  if (!current) return null;

  function handleOptionClick(option: number) {
    if (lockRef.current) return;
    lockRef.current = true;
    setSelectedAnswer(option);

    const isCorrect = option === current.correctAnswer;
    if (isCorrect) setCorrect((c) => c + 1);
    setFeedback(isCorrect ? "correct" : "wrong");

    setTimeout(() => {
      setFeedback(null);
      setSelectedAnswer(null);
      lockRef.current = false;
      if (currentIndex + 1 >= total) {
        const finalCorrect = isCorrect ? correct + 1 : correct;
        onComplete(finalCorrect, total);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 800);
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">
          How many syllables in this word?
        </p>
        <div className="flex items-center justify-center gap-3">
          <div
            className="text-3xl font-black text-slate-800 dark:text-white py-6 px-8 rounded-3xl glass-panel border-white/20"
            style={{ fontFamily: "var(--font-mali)" }}
          >
            {current.word}
          </div>
          <i className="fi fi-sr-volume text-2xl text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        {current.options.map((option) => {
          const isSelected = selectedAnswer === option;
          const isCorrectAnswer = option === current.correctAnswer;
          let btnClass = "glass-panel p-5 rounded-2xl border text-2xl font-black text-slate-800 dark:text-white transition-all duration-300";
          if (feedback && isSelected) {
            btnClass += feedback === "correct"
              ? " bg-green-400/30 dark:bg-green-500/20 border-green-400/50 scale-105"
              : " bg-red-400/30 dark:bg-red-500/20 border-red-400/50 scale-105";
          } else if (feedback && isCorrectAnswer && !isSelected) {
            btnClass += " bg-green-400/20 dark:bg-green-500/10 border-green-400/30";
          } else {
            btnClass += " border-white/20 dark:border-slate-700/50 hover:scale-[1.02] active:scale-[0.98]";
          }
          return (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              disabled={lockRef.current}
              className={btnClass}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="text-center text-sm font-bold text-slate-500 dark:text-slate-400">
        {currentIndex + 1} / {total}
      </div>
    </div>
  );
}

export default function ChallengeGameScreen({
  challengeType,
  difficulty,
  level,
  onComplete,
  onBack,
}: ChallengeGameScreenProps) {
  const [phase, setPhase] = useState<GamePhase>("playing");
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);

  const [phonemeMatchData, setPhonemeMatchData] = useState<PhonemeMatchQuestion | null>(null);
  const [soundSortData, setSoundSortData] = useState<SoundSortQuestion[] | null>(null);
  const [rhymeData, setRhymeData] = useState<RhymeQuestion[] | null>(null);
  const [speedSpellData, setSpeedSpellData] = useState<SpeedSpellQuestion[] | null>(null);
  const [syllableData, setSyllableData] = useState<SyllableQuestion[] | null>(null);

  useEffect(() => {
    const cefrLevel = level as CefrLevel;
    const roundCount = CHALLENGE_ROUND_LENGTHS[challengeType]?.[difficulty] ?? 8;

    switch (challengeType) {
      case "phoneme-match": {
        const data = generatePhonemeMatchRound(difficulty, cefrLevel);
        setPhonemeMatchData(data);
        setTotal(data.gridSize * 2);
        break;
      }
      case "sound-sort": {
        const data = generateSoundSortQuestions(1, cefrLevel);
        setSoundSortData(data);
        const wordCount = data.reduce((acc, q) => acc + q.words.length, 0);
        setTotal(wordCount);
        break;
      }
      case "rhyme-time": {
        const data = generateRhymeTimeQuestions(roundCount, cefrLevel);
        setRhymeData(data);
        setTotal(data.length);
        break;
      }
      case "speed-spell": {
        const data = generateSpeedSpellQuestions(roundCount, cefrLevel, difficulty);
        setSpeedSpellData(data);
        setTotal(data.length);
        break;
      }
      case "syllable-smash": {
        const data = generateSyllableSmashQuestions(roundCount, cefrLevel);
        setSyllableData(data);
        setTotal(data.length);
        break;
      }
    }
  }, [challengeType, difficulty, level]);

  function handleGameComplete(gameCorrect: number, gameAttempts: number) {
    const gameScore = gameAttempts > 0 ? Math.round((gameCorrect / gameAttempts) * 100) : 0;
    setCorrect(gameCorrect);
    setTotal(gameAttempts);
    setScore(gameScore);
    setPhase("finished");
  }

  const color = getChallengeColor(challengeType);
  const title = getChallengeTitle(challengeType);

  if (phase === "finished") {
    return (
      <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
        <div className="max-w-md mx-auto px-6 py-12 pb-36 text-center">
          <div className="glass-panel p-8 rounded-3xl border border-white/20 shadow-md text-center max-w-sm mx-auto w-full">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl text-white mx-auto mb-4"
              style={{ backgroundColor: color }}
            >
              <i className={CHALLENGE_TYPES.find((c) => c.id === challengeType)?.icon ?? "fi fi-sr-star"} />
            </div>

            <h2
              className="text-2xl font-black text-slate-800 dark:text-white mb-2"
              style={{ fontFamily: "var(--font-mali)" }}
            >
              Challenge Complete!
            </h2>

            <div className="text-5xl font-black mb-4" style={{ color }}>
              {score}%
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="glass-light p-3 rounded-2xl">
                <p className="text-2xl font-black text-green-500">{correct}</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Correct</p>
              </div>
              <div className="glass-light p-3 rounded-2xl">
                <p className="text-2xl font-black text-slate-600 dark:text-slate-300">{total}</p>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Total</p>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={onBack}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-white/30 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 border border-white/20 dark:border-slate-700/50 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
              >
                Back to Challenges
              </button>
              <button
                onClick={() => {
                  setPhase("playing");
                  setScore(0);
                  setCorrect(0);
                  setTotal(0);
                  setPhonemeMatchData(null);
                  setSoundSortData(null);
                  setRhymeData(null);
                  setSpeedSpellData(null);
                  setSyllableData(null);
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white border transition-all"
                style={{ backgroundColor: color }}
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain bg-transparent min-h-full">
      <div className="max-w-md mx-auto px-4 py-6 pb-36">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 glass-panel border border-white/20 dark:border-slate-700/50 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all"
          >
            <i className="fi fi-sr-angle-left text-lg" />
          </button>

          <div className="flex items-center gap-2">
            <i
              className={`${CHALLENGE_TYPES.find((c) => c.id === challengeType)?.icon ?? "fi fi-sr-star"} text-sm`}
              style={{ color }}
            />
            <h1
              className="text-lg font-black text-slate-800 dark:text-white"
              style={{ fontFamily: "var(--font-mali)" }}
            >
              {title}
            </h1>
          </div>

          <div
            className="px-3 py-1 rounded-lg text-[10px] font-bold text-white uppercase tracking-wider"
            style={{ backgroundColor: color }}
          >
            {getDifficultyLabel(difficulty)}
          </div>
        </div>

        {total > 0 && phase === "playing" && (
          <div className="mb-6">
            <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(correct / Math.max(total, 1)) * 100}%`,
                  backgroundColor: color,
                }}
              />
            </div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 text-center">
              Score: {correct}/{total}
            </p>
          </div>
        )}

        {phonemeMatchData && challengeType === "phoneme-match" && (
          <PhonemeMatchGame
            key={JSON.stringify(phonemeMatchData.pairs.map((p) => p.phonemeId))}
            question={phonemeMatchData}
            onComplete={handleGameComplete}
          />
        )}

        {soundSortData && challengeType === "sound-sort" && (
          <SoundSortGame
            key={soundSortData.length}
            questions={soundSortData}
            onComplete={handleGameComplete}
          />
        )}

        {rhymeData && challengeType === "rhyme-time" && (
          <RhymeTimeGame
            key={rhymeData.length}
            questions={rhymeData}
            onComplete={handleGameComplete}
          />
        )}

        {speedSpellData && challengeType === "speed-spell" && (
          <SpeedSpellGame
            key={speedSpellData.length}
            questions={speedSpellData}
            onComplete={handleGameComplete}
            difficulty={difficulty}
          />
        )}

        {syllableData && challengeType === "syllable-smash" && (
          <SyllableSmashGame
            key={syllableData.length}
            questions={syllableData}
            onComplete={handleGameComplete}
          />
        )}

        {!phonemeMatchData && !soundSortData && !rhymeData && !speedSpellData && !syllableData && (
          <div className="text-center py-12">
            <p className="text-slate-400 dark:text-slate-500 font-bold">Loading challenge...</p>
          </div>
        )}
      </div>
    </div>
  );
}
