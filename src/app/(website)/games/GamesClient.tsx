"use client";

import { useState, useMemo } from "react";
import Breadcrumb from "@/components/Breadcrumb";

import { formatDate } from "@/lib/format";
interface GameItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  cover: string;
  link: string;
  date: string;
  tags: string[];
  instructions: string;
}

export default function GamesClient({ initialItems }: { initialItems: GameItem[] }) {
  const [activeSearch, setActiveSearch] = useState("");

  const filteredItems = useMemo(() => {
    const lower = activeSearch.toLowerCase();
    return initialItems.filter((item) =>
      item.title.toLowerCase().includes(lower)
    );
  }, [activeSearch, initialItems]);

  const categories = useMemo(() => {
    if (filteredItems.length === 0) return [];
    const groups: Record<string, GameItem[]> = {};
    filteredItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 px-4 pt-28 pb-20">
      <section className="pb-12 text-center">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb items={[{ label: "เกมการศึกษา" }]} />
          <h1 className="text-4xl md:text-6xl font-black text-sky-600 dark:text-sky-400 mt-6 tracking-tight">
            เกมการศึกษา
          </h1>
          <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400 font-medium">
            เรียนรู้ผ่านการเล่น สนุกและได้ความรู้สไตล์ Boss478
          </p>
        </div>
      </section>

      <section className="pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="relative group">
            <i className="fi fi-sr-search absolute left-5 top-1/2 -translate-y-1/2 text-sky-400 group-focus-within:text-sky-500 text-lg transition-colors"></i>
            <input
              type="text"
              placeholder="ค้นหาเกม..."
              value={activeSearch}
              onChange={(e) => setActiveSearch(e.target.value)}
              className="w-full pl-14 pr-12 py-5 rounded-3xl bg-white dark:bg-slate-900 border-2 border-transparent focus:border-sky-400 transition-all shadow-xl shadow-sky-100/50 dark:shadow-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 text-lg"
            />
            {activeSearch && (
              <button
                onClick={() => setActiveSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-sm"
              >
                <i className="fi fi-sr-cross-small text-zinc-500"></i>
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto space-y-20">
        {filteredItems.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-[3rem] border-4 border-dashed border-zinc-100 dark:border-slate-800">
            <div className="w-20 h-20 bg-sky-100 dark:bg-sky-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fi fi-sr-gamepad text-4xl text-sky-500 animate-bounce"></i>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 text-xl font-bold">ไม่พบเกมที่ค้นหา</p>
          </div>
        ) : (
          categories.map(([category, items]) => (
            <div key={category} className="space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black text-zinc-800 dark:text-zinc-100 px-6 py-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-slate-800 uppercase tracking-widest">
                  {category}
                </h2>
                <div className="h-1 flex-1 bg-zinc-200 dark:bg-slate-800 rounded-full opacity-50"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                  <a
                    key={item.id}
                    href={item.link}
                    target={item.link !== "#" ? "_blank" : "_self"}
                    rel="noopener noreferrer"
                    className="group relative block bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-sky-100/30 dark:shadow-black/40 border border-transparent hover:border-sky-400/50 transition-all duration-500 hover:-translate-y-3"
                  >
                    <div className="relative aspect-video overflow-hidden">
                      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
                      {item.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.cover}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-sky-400 to-indigo-500 flex items-center justify-center">
                          <i className="fi fi-sr-gamepad text-6xl text-white/50" />
                        </div>
                      )}
                      
                      <div className="absolute bottom-4 left-6 z-20">
                         <div className="flex gap-2">
                           {item.tags.map(tag => (
                             <span key={tag} className="px-3 py-1 rounded-xl bg-sky-500 text-white text-[10px] font-black uppercase tracking-tighter shadow-lg">
                               {tag}
                             </span>
                           ))}
                         </div>
                      </div>
                    </div>

                    <div className="p-8 relative">
                      <div className="absolute -top-10 right-8 w-16 h-16 rounded-[1.5rem] bg-sky-500 text-white flex items-center justify-center text-3xl shadow-2xl shadow-sky-500/50 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 z-30">
                        <i className="fi fi-sr-play"></i>
                      </div>

                      <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-100 mb-3 group-hover:text-sky-500 transition-colors leading-tight">
                        {item.title}
                      </h3>
                      <p className="text-zinc-500 dark:text-zinc-400 mb-6 line-clamp-2 text-sm leading-relaxed">
                         {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-slate-800">
                        <span className="flex items-center gap-2 text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                           <i className="fi fi-sr-calendar text-sky-400"></i>
                           {formatDate(item.date)}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-sky-50 dark:bg-slate-800 flex items-center justify-center text-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                          <i className="fi fi-sr-angle-small-right"></i>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
