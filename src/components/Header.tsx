'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';

const navLinks = [
  { href: '/', label: 'หน้าหลัก', icon: 'fi fi-sr-home' },
  { href: '/activities', label: 'ผลงาน', icon: 'fi fi-sr-briefcase' },
  { href: '/gallery', label: 'กิจกรรม', icon: 'fi fi-sr-camera' },
  { href: '/learning', label: 'สื่อ/เกม', icon: 'fi fi-sr-gamepad' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300); // Match animation duration
  };

  const handleToggle = () => {
    if (isOpen) {
      handleClose();
    } else {
      setIsOpen(true);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white font-bold text-lg">
              B
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="group hidden md:flex items-center p-1 gap-1 rounded-full bg-white/50 dark:bg-zinc-500/50 hover:bg-white/85 dark:hover:bg-zinc-500/85 backdrop-blur-2xs hover:backdrop-blur-xs  border border-white/80 dark:border-white/20 shadow-lg shadow-sky-100/40 dark:shadow-blue-900/40 transition-all duration-200">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-full text-sm text-zinc-600 dark:text-zinc-100 hover:text-black dark:hover:text-white hover:bg-gray-300/70 dark:hover:bg-gray-400/70 transition-all duration-200 font-medium flex items-center gap-2"
              >
                <i className={link.icon}></i>
                {link.label}
              </Link>
            ))}

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-full hover:bg-amber-200/50 dark:hover:bg-zinc-700/50 transition-all duration-200 flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {/* Sun Icon */}
              <i 
                className={`fi fi-sr-sun text-yellow-600 text-md leading-none transition-all duration-500 ${
                  mounted && theme === 'light' 
                    ? 'opacity-100 rotate-0 scale-100' 
                    : 'opacity-0 rotate-90 scale-50 absolute'
                }`}
              ></i>
              {/* Moon Icon */}
              <i 
                className={`fi fi-sr-moon text-violet-400 text-md leading-none transition-all duration-500 ${
                  mounted && theme === 'dark' 
                    ? 'opacity-100 rotate-0 scale-100' 
                    : 'opacity-0 -rotate-90 scale-50 absolute'
                }`}
              ></i>
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="flex md:hidden items-center gap-2">
            {/* Dark Mode Toggle Mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/50 dark:bg-zinc-500/50 border border-white/80 dark:border-white/20 shadow-lg shadow-sky-100/40 dark:shadow-blue-900/40 hover:bg-white/85 dark:hover:bg-zinc-500/85 transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <i 
                  className={`fi fi-sr-sun text-yellow-600 text-md leading-none transition-all duration-500 ${
                    mounted && theme === 'light' 
                      ? 'opacity-100 rotate-0 scale-100' 
                      : 'opacity-0 rotate-90 scale-50 absolute'
                  }`}
                ></i>
                <i 
                  className={`fi fi-sr-moon text-violet-400 text-md leading-none transition-all duration-500 ${
                    mounted && theme === 'dark' 
                      ? 'opacity-100 rotate-0 scale-100' 
                      : 'opacity-0 -rotate-90 scale-50 absolute'
                  }`}
                ></i>
              </div>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={handleToggle}
              className="p-2 rounded-full bg-white/50 dark:bg-zinc-500/50 border border-white/80 dark:border-white/20 shadow-lg shadow-sky-100/40 dark:shadow-blue-900/40 hover:bg-white/85 dark:hover:bg-zinc-500/85 transition-all duration-200"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <i className="fi fi-sr-cross text-xl"></i>
              ) : (
                <i className="fi fi-sr-menu-burger text-xl"></i>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className={`md:hidden py-4 flex justify-end ${isClosing ? 'animate-slide-up' : 'animate-slide-down'}`}>
            <div className="flex flex-col gap-1 p-2 rounded-4xl bg-white/50 dark:bg-zinc-500/50 backdrop-blur-2xs border border-white/80 dark:border-white/20 shadow-lg shadow-sky-100/40 dark:shadow-blue-900/40 w-fit">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleClose}
                  className="px-4 py-3 rounded-full text-zinc-600 dark:text-zinc-100 hover:text-black dark:hover:text-white hover:bg-gray-300/70 dark:hover:bg-gray-400/70 transition-all duration-200 font-medium flex items-center gap-2"
                >
                  <i className={link.icon}></i>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
