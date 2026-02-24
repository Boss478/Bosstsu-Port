'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { logoutAdmin } from '@/app/admin/login/actions';

interface AdminSessionContextType {
  isUploading: boolean;
  setIsUploading: (uploading: boolean) => void;
}

const AdminSessionContext = createContext<AdminSessionContextType | undefined>(undefined);

export function useAdminSession() {
  const context = useContext(AdminSessionContext);
  if (!context) {
    throw new Error('useAdminSession must be used within an AdminSessionProvider');
  }
  return context;
}

export default function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAFK, setIsAFK] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Constants
  const IDLE_TIMEOUT = 30 * 1000; // 30 seconds
  const COUNTDOWN_DURATION = 10; // 10 seconds

  const startIdleTimer = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    idleTimerRef.current = setTimeout(() => {
      // If uploading, don't trigger AFK
      if (!isUploading) {
        setIsAFK(true);
        setCountdown(COUNTDOWN_DURATION);
      } else {
        // Retry later if uploading
        startIdleTimer();
      }
    }, IDLE_TIMEOUT);
  };

  const handleActivity = () => {
    // If we are already AFK, activity resets everything
    if (isAFK) {
      setIsAFK(false);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }
    
    // Always restart the idle timer on activity
    startIdleTimer();
  };

  // Effect for idle detection events
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    
    // Throttle activity updates slightly to avoid excessive timer resets
    let lastActivity = Date.now();
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastActivity > 1000) {
        handleActivity();
        lastActivity = now;
      }
    };

    events.forEach((event) => window.addEventListener(event, throttledHandler));
    startIdleTimer(); // Initial start

    return () => {
      events.forEach((event) => window.removeEventListener(event, throttledHandler));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAFK, isUploading]); 

  // Effect for Countdown Logic
  useEffect(() => {
    if (isAFK) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [isAFK]);

  // Effect to handle Logout when countdown hits 0
  useEffect(() => {
    if (isAFK && countdown === 0 && !isLoggingOut) {
      setIsLoggingOut(true);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      logoutAdmin().catch((err) => {
        console.error('Logout failed:', err);
        setIsLoggingOut(false);
      });
    }
  }, [isAFK, countdown, isLoggingOut]);

  return (
    <AdminSessionContext.Provider value={{ isUploading, setIsUploading }}>
      {children}
      
      {/* AFK Notification */}
      <div 
        className={`fixed top-6 right-6 z-50 transition-all duration-500 transform ${
          isAFK ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4 p-4 pr-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 text-zinc-800 dark:text-zinc-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white/20 backdrop-blur-sm">
          <div className="relative w-10 h-10">
            <svg className="w-full h-full -rotate-90">
              <circle
                className="text-zinc-200 dark:text-slate-700"
                strokeWidth="4"
                stroke="currentColor"
                fill="transparent"
                r="18"
                cx="20"
                cy="20"
              />
              <circle
                className="text-red-500 transition-all duration-1000 ease-linear"
                strokeWidth="4"
                strokeDasharray={113}
                strokeDashoffset={113 - (113 * countdown) / COUNTDOWN_DURATION}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="18"
                cx="20"
                cy="20"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-bold text-sm text-red-500">
              {isLoggingOut ? (
                <i className="fi fi-sr-spinner animate-spin text-xs" />
              ) : (
                countdown
              )}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-sm">
              {isLoggingOut ? 'Logging out...' : 'Session Timeout'}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Move mouse to stay</p>
          </div>
        </div>
      </div>
    </AdminSessionContext.Provider>
  );
}
