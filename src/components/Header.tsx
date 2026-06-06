'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { navLinks } from '@/lib/nav-links';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [desktopExpanded, setDesktopExpanded] = useState<string | null>(null);
  const [navMode, setNavMode] = useState<'public' | 'private'>('public');
  const [navMounted, setNavMounted] = useState(false);
  const { theme, toggleTheme, mounted } = useTheme();
  const pathname = usePathname();

  useEffect(() => {
    setNavMode(pathname.startsWith('/boss478') ? 'private' : 'public');
    setNavMounted(true);
  }, [pathname]);

  const PRIVATE_LINKS = [
    { href: '/boss478', label: 'Dashboard', icon: 'fi fi-sr-apps' },
    { href: '/boss478/stocks', label: 'Stocks', icon: 'fi fi-sr-stats' },
    { href: '/boss478/finance', label: 'Budget', icon: 'fi fi-sr-wallet' },
  ] as const;

  const isPrivateActive = (href: string) => {
    if (pathname === href) return true;
    if (href === '/boss478') return false;
    return pathname.startsWith(href + '/');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const nav = document.getElementById('desktop-nav');
      if (nav && !nav.contains(event.target as Node)) {
        setDesktopExpanded(null);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

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
                priority
              />
            </div>
          </Link>



          <div className="hidden md:flex items-center gap-2">
            <div id="desktop-nav" className="flex items-center p-1 gap-1 rounded-full bg-white/40 dark:bg-slate-900/40 hover:bg-white/50 dark:hover:bg-slate-800/50 backdrop-blur-3xs hover:backdrop-blur-xs border border-white/60 dark:border-slate-700/50 shadow-lg shadow-blue-100/40 dark:shadow-black/20 transition-all duration-200">
              {navMounted && (navMode === 'public' ? (
                /* Public Nav */
                navLinks.map((link) => (
                  <div key={link.label} className="relative group">
                    {!link.subItems ? (
                      <Link
                        href={link.href}
                        className="px-4 py-2 rounded-full text-sm text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-300/70 dark:hover:bg-slate-400/80 transition-all duration-200 font-medium flex items-center gap-2"
                        aria-current={pathname === link.href ? "page" : undefined}
                      >
                        <i aria-hidden="true" className={link.icon}></i>
                        {link.label}
                      </Link>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setDesktopExpanded(desktopExpanded === link.label ? null : link.label);
                          }}
                          className="px-4 py-2 rounded-full text-sm text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-300/70 dark:hover:bg-slate-400/80 transition-all duration-200 font-medium flex items-center gap-2 cursor-pointer"
                        >
                          <i className={link.icon}></i>
                          {link.label}
                          <i className={`fi fi-sr-angle-small-down text-xs mt-0.5 transition-transform ${desktopExpanded === link.label ? 'rotate-180' : 'group-hover:rotate-180'}`}></i>
                        </button>

                        <div className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ease-out z-50 min-w-40 ${desktopExpanded === link.label ? 'visible opacity-100 translate-y-0' : 'invisible opacity-0 translate-y-2 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0'}`}>
                          <div className="p-1 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl shadow-blue-100/40 dark:shadow-black/20 flex flex-col gap-1 overflow-hidden">
                            {link.subItems.map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={() => setDesktopExpanded(null)}
                                className="px-4 py-2.5 rounded-xl text-sm text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 font-medium flex items-center gap-2 whitespace-nowrap"
                                aria-current={pathname === subItem.href ? "page" : undefined}
                              >
                                <i aria-hidden="true" className={subItem.icon}></i>
                                {subItem.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
              ) : (
                /* Private Nav */
                PRIVATE_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-full text-sm transition-all duration-200 font-medium flex items-center gap-2 ${
                      isPrivateActive(link.href)
                        ? 'bg-blue-500/30 dark:bg-blue-400/20 backdrop-blur-xs border border-blue-400/40 text-blue-700 dark:text-blue-300 hover:bg-blue-500/50 dark:hover:bg-blue-400/30'
                        : 'text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-300/70 dark:hover:bg-slate-400/80'
                    }`}
                    aria-current={isPrivateActive(link.href) ? "page" : undefined}
                  >
                    <i aria-hidden="true" className={link.icon}></i>
                    {link.label}
                  </Link>
                ))
              ))}
            </div>

            <div className="flex items-center gap-1">
              {pathname.startsWith('/boss478') && (
                <button
                  onClick={() => setNavMode(navMode === 'public' ? 'private' : 'public')}
                  className={`px-2.5 py-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                    navMode === 'private'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'hover:bg-gray-300/70 dark:hover:bg-slate-400/80 text-zinc-500 dark:text-zinc-400'
                  }`}
                  aria-label="Switch to private tools"
                  title={navMode === 'public' ? 'Switch to private tools' : 'Switch to public nav'}
                >
                  <i aria-hidden="true" className="fi fi-sr-user-lock text-sm leading-none"></i>
                </button>
              )}

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
                  className={`fi fi-sr-moon text-blue-400 text-md leading-none transition-all duration-500 ${
                    mounted && theme === 'dark' 
                      ? 'opacity-100 rotate-0 scale-100' 
                      : 'opacity-0 -rotate-90 scale-50 absolute'
                  }`}
                ></i>
              </button>
            </div>
          </div>


          <div className="flex md:hidden items-center gap-2">

            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 shadow-lg shadow-blue-100/40 dark:shadow-black/20 hover:bg-white/85 dark:hover:bg-slate-800/85 backdrop-blur-xs transition-all duration-200"
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
                  className={`fi fi-sr-moon text-blue-400 text-md leading-none transition-all duration-500 ${
                    mounted && theme === 'dark' 
                      ? 'opacity-100 rotate-0 scale-100' 
                      : 'opacity-0 -rotate-90 scale-50 absolute'
                  }`}
                ></i>
              </div>
            </button>

            {pathname.startsWith('/boss478') && (
              <button
                onClick={() => setNavMode(navMode === 'public' ? 'private' : 'public')}
                className={`p-2 rounded-full bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 shadow-lg shadow-blue-100/40 dark:shadow-black/20 hover:bg-white/85 dark:hover:bg-slate-800/85 backdrop-blur-xs transition-all duration-200 ${
                  navMode === 'private' ? 'bg-white/85 dark:bg-slate-800/85' : ''
                }`}
                aria-label="Switch nav mode"
                title={navMode === 'public' ? 'Private tools' : 'Public nav'}
              >
                <i className={`fi fi-sr-user-lock text-sm ${navMode === 'private' ? 'text-blue-600' : 'text-zinc-500'}`} />
              </button>
            )}

            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-full bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 shadow-lg shadow-blue-100/40 dark:shadow-black/20 hover:bg-white/85 dark:hover:bg-slate-800/85 backdrop-blur-xs transition-all duration-200"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <i aria-hidden="true" className="fi fi-sr-cross text-xl"></i>
              ) : (
                <i aria-hidden="true" className="fi fi-sr-menu-burger text-xl"></i>
              )}
            </button>
          </div>
        </div>


        {isOpen && (
            <div id="mobile-nav" className={`md:hidden py-4 flex justify-end ${isClosing ? 'animate-slide-up' : 'animate-slide-down'}`}>
              <div className="flex flex-col gap-1 p-2 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 shadow-lg shadow-blue-100/40 dark:shadow-black/20 w-fit min-w-50">
                {navMounted && (navMode === 'public' ? (
                  navLinks.map((link) => (
                    <div key={link.label} className="w-full">
                      {!link.subItems ? (
                        <Link
                          href={link.href}
                          onClick={closeMenuWithAnimation}
                          className="px-4 py-3 rounded-2xl text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-slate-700/50 transition-all duration-200 font-medium flex items-center gap-3 w-full"
                          aria-current={pathname === link.href ? "page" : undefined}
                        >
                          <i aria-hidden="true" className={link.icon}></i>
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
                                  className="px-4 py-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-all duration-200 flex items-center gap-2"
                                  aria-current={pathname === subItem.href ? "page" : undefined}
                                >
                                  <i aria-hidden="true" className={subItem.icon}></i>
                                  {subItem.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  PRIVATE_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={closeMenuWithAnimation}
                       className={`px-4 py-3 rounded-2xl transition-all duration-200 font-medium flex items-center gap-3 w-full ${
                         isPrivateActive(link.href)
                           ? 'bg-blue-500/20 dark:bg-blue-400/15 border border-blue-400/30 text-blue-700 dark:text-blue-300 hover:bg-blue-500/40 dark:hover:bg-blue-400/25'
                           : 'text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-slate-700/50'
                       }`}
                       aria-current={isPrivateActive(link.href) ? "page" : undefined}
                     >
                       <i aria-hidden="true" className={link.icon}></i>
                       {link.label}
                     </Link>
                  ))
                ))}
              </div>

            </div>
          )}
      </div>
    </nav>
  );
}
