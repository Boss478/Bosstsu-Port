"use client";

interface Props {
  feedback: "correct" | "wrong" | null;
  selectedAnswer: string | null;
  correctAnswer: string;
  value: string;
  onClick: () => void;
  children: React.ReactNode;
  id?: string;
}

export default function QuestionChoiceButton({
  feedback,
  selectedAnswer,
  correctAnswer,
  value,
  onClick,
  children,
  id,
}: Props) {
  const isSelected = selectedAnswer === value;
  const isCorrect = value === correctAnswer;

  let btnClass =
    "w-full px-4 py-5 font-bold text-sm md:text-base lg:text-lg tracking-wide text-center rounded-2xl backdrop-blur-xs border-2 transition-all btn-3d shadow-sm cursor-pointer ";
  let borderStyle: React.CSSProperties = { "--border-color": "rgba(0,0,0,0.12)" } as React.CSSProperties;

  if (feedback === "correct" && isCorrect) {
    btnClass += "bg-[#2EC4B6] text-white border-[#2EC4B6] dark:border-[#2EC4B6] animate-correct-bounce";
    borderStyle = { "--border-color": "#1e8a7f" } as React.CSSProperties;
  } else if (feedback === "wrong" && isCorrect) {
    btnClass += "bg-[#2EC4B6]/40 text-emerald-800 dark:text-emerald-200 border-[#2EC4B6]/40";
    borderStyle = { "--border-color": "transparent" } as React.CSSProperties;
  } else if (feedback === "wrong" && isSelected && !isCorrect) {
    btnClass += "bg-[#FF70A6] text-white border-[#FF70A6] dark:border-[#FF70A6] animate-shake";
    borderStyle = { "--border-color": "#b83f50" } as React.CSSProperties;
  } else if (isSelected && !feedback) {
    btnClass += "border-[#C8A44E] bg-[#C8A44E]/10 dark:bg-[#C8A44E]/20 text-[#C8A44E] dark:text-[#F7E1A0]";
    borderStyle = { "--border-color": "#a8853b" } as React.CSSProperties;
  } else {
    btnClass += "bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700/50 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-700/80";
  }

  return (
    <button
      id={id}
      className={btnClass}
      onClick={onClick}
      disabled={!!feedback}
      style={borderStyle}
    >
      {children}
    </button>
  );
}
