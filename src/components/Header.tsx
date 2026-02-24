'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useTheme } from './ThemeProvider';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  subItems?: NavItem[];
}

const navLinks: NavItem[] = [
  { href: '/', label: 'หน้าหลัก', icon: 'fi fi-sr-home' },
  { 
    href: '/portfolio', 
    label: 'ผลงาน', 
    icon: 'fi fi-sr-briefcase',
    subItems: [
      { href: '/portfolio', label: 'ผลงาน', icon: 'fi fi-sr-briefcase' },
      { href: '/gallery', label: 'แกลเลอรี่', icon: 'fi fi-sr-picture' }
    ]
  },
  { 
    href: '/resources', 
    label: 'สื่อการเรียนรู้', 
    icon: 'fi fi-sr-gamepad',
    subItems: [
      { href: '/resources', label: 'สื่อ', icon: 'fi fi-sr-book-alt' },
      { href: '/games', label: 'เกม', icon: 'fi fi-sr-gamepad' }
    ]
  },
  { href: '/about-me', label: "About me", icon: 'fi fi-sr-user' },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const { theme, toggleTheme, mounted } = useTheme();

  const closeMenuWithAnimation = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      setMobileExpanded(null);
    }, 300);
  };

  const toggleMobileMenu = () => {
    if (isOpen) {
      closeMenuWithAnimation();
    } else {
      setIsOpen(true);
    }
  };

  const toggleMobileSubmenu = (label: string) => {
    setMobileExpanded(mobileExpanded === label ? null : label);
  };

  return (
    <nav id="site-header" className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link href="/" className="flex items-center gap-2">
            <div className="relative w-10 h-10">
              <Image 
                src="/icon/icon.png" 
                alt="Boss478 Logo" 
                fill
                sizes="40px"
                className="object-cover" 
              />
            </div>
          </Link>



          <div id="desktop-nav" className="hidden md:flex items-center p-1 gap-1 rounded-full bg-white/40 dark:bg-slate-900/40 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-3xs hover:backdrop-blur-xs border border-white/60 dark:border-slate-700/50 shadow-lg shadow-sky-100/40 dark:shadow-black/20 transition-all duration-200">
            {navLinks.map((link) => (
              <div key={link.label} className="relative group">
                {!link.subItems ? (
                  <Link
                    href={link.href}
                    className="px-4 py-2 rounded-full text-sm text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-300/70 dark:hover:bg-slate-400/80 transition-all duration-200 font-medium flex items-center gap-2"
                  >
                    <i className={link.icon}></i>
                    {link.label}
                  </Link>
                ) : (
                  <>
                    <button
                      className="px-4 py-2 rounded-full text-sm text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-300/70 dark:hover:bg-slate-400/80 transition-all duration-200 font-medium flex items-center gap-2 cursor-default"
                    >
                      <i className={link.icon}></i>
                      {link.label}
                      <i className="fi fi-sr-angle-small-down text-xs mt-0.5 transition-transform group-hover:rotate-180"></i>
                    </button>

                    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out z-50 min-w-[160px]">
                      <div className="p-1 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl shadow-sky-100/40 dark:shadow-black/20 flex flex-col gap-1 overflow-hidden">
                        {link.subItems.map((subItem) => (
                          <Link
                            key={subItem.href}
                            href={subItem.href}
                            className="px-4 py-2.5 rounded-xl text-sm text-zinc-600 dark:text-zinc-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 font-medium flex items-center gap-2 whitespace-nowrap"
                          >
                            <i className={subItem.icon}></i>
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}


            <button
              onClick={toggleTheme}
              className="px-3 py-2 rounded-full hover:bg-amber-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 flex items-center justify-center"
              aria-label="Toggle dark mode"
            >

              <i 
                className={`fi fi-sr-sun text-yellow-500 text-md leading-none transition-all duration-500 ${
                  mounted && theme === 'light' 
                    ? 'opacity-100 rotate-0 scale-100' 
                    : 'opacity-0 rotate-90 scale-50 absolute'
                }`}
              ></i>

              <i 
                className={`fi fi-sr-moon text-sky-400 text-md leading-none transition-all duration-500 ${
                  mounted && theme === 'dark' 
                    ? 'opacity-100 rotate-0 scale-100' 
                    : 'opacity-0 -rotate-90 scale-50 absolute'
                }`}
              ></i>
            </button>
          </div>


          <div className="flex md:hidden items-center gap-2">

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 shadow-lg shadow-sky-100/40 dark:shadow-black/20 hover:bg-white/85 dark:hover:bg-slate-800/85 backdrop-blur-xs transition-all duration-200"
              aria-label="Toggle dark mode"
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <i 
                  className={`fi fi-sr-sun text-yellow-500 text-md leading-none transition-all duration-500 ${
                    mounted && theme === 'light' 
                      ? 'opacity-100 rotate-0 scale-100' 
                      : 'opacity-0 rotate-90 scale-50 absolute'
                  }`}
                ></i>
                <i 
                  className={`fi fi-sr-moon text-sky-400 text-md leading-none transition-all duration-500 ${
                    mounted && theme === 'dark' 
                      ? 'opacity-100 rotate-0 scale-100' 
                      : 'opacity-0 -rotate-90 scale-50 absolute'
                  }`}
                ></i>
              </div>
            </button>

            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-full bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 shadow-lg shadow-sky-100/40 dark:shadow-black/20 hover:bg-white/85 dark:hover:bg-slate-800/85 backdrop-blur-xs transition-all duration-200"
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


        {isOpen && (
          <div id="mobile-nav" className={`md:hidden py-4 flex justify-end ${isClosing ? 'animate-slide-up' : 'animate-slide-down'}`}>
            <div className="flex flex-col gap-1 p-2 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 shadow-lg shadow-sky-100/40 dark:shadow-black/20 w-fit min-w-[200px]">
              {navLinks.map((link) => (
                <div key={link.label} className="w-full">
                  {!link.subItems ? (
                    <Link
                      href={link.href}
                      onClick={closeMenuWithAnimation}
                      className="px-4 py-3 rounded-2xl text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 font-medium flex items-center gap-3 w-full"
                    >
                      <i className={link.icon}></i>
                      {link.label}
                    </Link>
                  ) : (
                    <div className="flex flex-col">
                      <button
                        onClick={() => toggleMobileSubmenu(link.label)}
                        className={`px-4 py-3 rounded-2xl text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 font-medium flex items-center justify-between gap-3 w-full ${mobileExpanded === link.label ? 'bg-gray-100/50 dark:bg-slate-700/30' : ''}`}
                      >
                        <span className="flex items-center gap-3">
                          <i className={link.icon}></i>
                          {link.label}
                        </span>
                        <i className={`fi fi-sr-angle-small-down transition-transform duration-200 ${mobileExpanded === link.label ? 'rotate-180' : ''}`}></i>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${mobileExpanded === link.label ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="flex flex-col pl-4 pr-1 pb-1 pt-1 gap-1">
                          {link.subItems.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={closeMenuWithAnimation}
                              className="px-4 py-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 flex items-center gap-2"
                            >
                              <i className={subItem.icon}></i>
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </nav>
  );
}
