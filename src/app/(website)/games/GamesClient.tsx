"use client";

import { useState, useMemo } from "react";
import Breadcrumb from "@/components/Breadcrumb";

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface GameItem {
  id: string;
  title: string;
  description: string;
  genre: string;
  cover: string;
  link: string;
  date: string;
  tags: string[];
  instructions: string;
}

export default function GamesClient({ initialItems }: { initialItems: GameItem[] }) {
  const [activeSearch, setActiveSearch] = useState("");

  const filteredItems = useMemo(() => {
    return initialItems.filter((item) =>
      item.title.toLowerCase().includes(activeSearch.toLowerCase())
    );
  }, [activeSearch, initialItems]);

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950">
      
      {/* Header Section */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: "เกมการศึกษา" }]} />
          
          <h1 className="text-4xl md:text-5xl font-bold text-sky-600 dark:text-sky-400">
            เกมการศึกษา
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            เรียนรู้ผ่านการเล่น สนุกและได้ความรู้
          </p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="relative max-w-md">
            <i className="fi fi-sr-search absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"></i>
            <input
              type="text"
              placeholder="ค้นหาเกม..."
              value={activeSearch}
              onChange={(e) => setActiveSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-zinc-200 dark:border-slate-800 focus:ring-2 focus:ring-sky-400 focus:outline-hidden transition-all shadow-sm"
            />
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <i className="fi fi-sr-gamepad text-4xl text-zinc-300 dark:text-zinc-600 mb-4 block"></i>
              <p className="text-zinc-500 dark:text-zinc-400">ไม่พบเกมที่ค้นหา</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredItems.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target={item.link !== "#" ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="group relative block bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg shadow-sky-100/50 dark:shadow-black/40 hover:shadow-2xl hover:shadow-sky-300/40 dark:hover:shadow-sky-900/20 hover:-translate-y-2 transition-all duration-300"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-4/3 overflow-hidden">
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    {item.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-zinc-200 dark:bg-slate-800 flex items-center justify-center">
                        <i className="fi fi-sr-gamepad text-4xl text-zinc-400" />
                      </div>
                    )}
                    
                    <span className="absolute top-4 right-4 z-20 px-3 py-1 rounded-full text-xs font-bold bg-white/90 text-sky-600 shadow-md">
                      {item.genre}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="p-6 relative">
                    <div className="absolute -top-8 right-6 w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-2xl shadow-lg rotate-3 group-hover:rotate-12 transition-transform duration-300 z-20">
                      <i className="fi fi-sr-play"></i>
                    </div>

                    <h3 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 mb-2 group-hover:text-sky-500 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">
                       {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                      {item.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {item.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 text-[10px]">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="flex items-center gap-1.5">
                         <i className="fi fi-sr-calendar"></i>
                         {formatDate(item.date)}
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
