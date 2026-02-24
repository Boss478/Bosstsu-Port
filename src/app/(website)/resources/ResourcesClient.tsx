"use client";

import { useState, useMemo } from "react";
import Breadcrumb from "@/components/Breadcrumb";

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  type: string;
  cover: string;
  link: string;
  date: string;
  tags: string[];
  subject: string;
}

export default function ResourcesClient({ initialItems }: { initialItems: ResourceItem[] }) {
  const [activeType, setActiveType] = useState<string>("All");
  const [activeSort, setActiveSort] = useState<"Newest" | "Oldest">("Newest");

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>(initialItems.map((item) => item.type));
    return ["All", ...Array.from(types)];
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    const items =
      activeType === "All"
        ? [...initialItems]
        : initialItems.filter((item) => item.type === activeType);

    items.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return activeSort === "Newest" ? dateB - dateA : dateA - dateB;
    });

    return items;
  }, [activeType, activeSort, initialItems]);

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950">
      
      {/* Header Section */}
      <section className="pt-28 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb items={[{ label: "สื่อการเรียนรู้" }]} />
          
          <h1 className="text-4xl md:text-5xl font-bold text-sky-600 dark:text-sky-400">
            สื่อการเรียนรู้
          </h1>
          <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">
            เอกสารประกอบการเรียน สไลด์ และวิดีโอความรู้
          </p>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="px-4 pb-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {uniqueTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeType === type
                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                    : "bg-white/70 dark:bg-slate-800/60 text-zinc-600 dark:text-zinc-300 hover:bg-sky-100 dark:hover:bg-slate-700"
                }`}
              >
                {type === "All" ? "ทั้งหมด" : type}
              </button>
            ))}
          </div>

          <div className="ml-auto">
            <select
              value={activeSort}
              onChange={(e) => setActiveSort(e.target.value as "Newest" | "Oldest")}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/70 dark:bg-slate-800/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700 hover:border-sky-300 focus:outline-hidden cursor-pointer"
            >
              <option value="Newest">ใหม่สุด</option>
              <option value="Oldest">เก่าสุด</option>
            </select>
          </div>
        </div>
      </section>

      {/* Grid Section */}
      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <i className="fi fi-sr-search-alt text-4xl text-zinc-300 dark:text-zinc-600 mb-4 block"></i>
              <p className="text-zinc-500 dark:text-zinc-400">ไม่พบข้อมูลสื่อการเรียนรู้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredItems.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target={item.link !== "#" ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-slate-800 shadow-xs hover:shadow-xl hover:shadow-sky-100/50 dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-slate-800">
                    {item.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="fi fi-sr-book-alt text-3xl text-zinc-400" />
                      </div>
                    )}
                    
                    <div className="absolute top-2 right-2">
                       <span className={`px-2 py-1 rounded-md text-xs font-bold text-white shadow-xs ${
                         item.type === "Worksheet" ? "bg-green-500" :
                         item.type === "Article" ? "bg-orange-500" :
                         item.type === "Video" ? "bg-red-500" :
                         item.type === "Interactive" ? "bg-purple-500" : "bg-sky-500"
                       }`}>
                         {item.type}
                       </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-bold text-zinc-800 dark:text-zinc-200 line-clamp-1 mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4 flex-1">
                      {item.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-slate-800 mt-auto">
                      <span className="text-xs text-zinc-400 flex items-center gap-1">
                        <i className="fi fi-sr-calendar"></i>
                        {formatDate(item.date)}
                      </span>
                      
                      <span className="text-xs font-medium text-sky-600 dark:text-sky-400 flex items-center gap-1 group-hover:underline">
                        เข้าชม
                        <i className="fi fi-sr-arrow-up-right text-[10px]"></i>
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
