'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#E0F2FE] via-[#F0FDFA] to-[#FEF3C7] dark:from-[#0B132B] dark:via-[#1B254B] dark:to-[#3E1B5D] min-h-dvh px-6 text-center">
          <div className="glass-heavy border border-white/60 dark:border-slate-700/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-4">
            <div className="text-5xl">⚠️</div>
            <h2 className="font-black text-lg text-slate-800 dark:text-white" style={{ fontFamily: "var(--font-mali)" }}>
              Something went wrong
            </h2>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
              The game encountered an unexpected error. Your save data is safe.
            </p>
            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-2xl bg-[#2EC4B6] text-white font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all cursor-pointer btn-3d shadow-md"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
