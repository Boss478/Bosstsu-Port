"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { formatDate } from "@/lib/format";
import { type ResourceItem } from "./data";

interface ResourcesClientProps {
  items: ResourceItem[];
  uniqueTypes: string[];
  uniqueTags: string[];
  currentPage: number;
  totalPages: number;
  activeType: string;
  sort: "Newest" | "Oldest";
  totalItems: number;
}

export default function ResourcesClient({
  items,
  uniqueTypes,
  currentPage,
  totalPages,
  activeType,
  sort,
  totalItems: _totalItems,
}: ResourcesClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function navigateToPage(page: number) {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      if (activeType && activeType !== "All") params.set("type", activeType);
      params.set("sort", sort);
      router.push(`/resources?${params.toString()}`);
    });
  }

  function filterByType(type: string) {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("page", "1");
      if (type !== "All") params.set("type", type);
      params.set("sort", sort);
      router.push(`/resources?${params.toString()}`);
    });
  }

  function changeSort(newSort: "Newest" | "Oldest") {
    startTransition(() => {
      const params = new URLSearchParams();
      params.set("page", "1");
      if (activeType && activeType !== "All") params.set("type", activeType);
      params.set("sort", newSort);
      router.push(`/resources?${params.toString()}`);
    });
  }

  const allTypes = ["All", ...uniqueTypes];

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950">
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

      <section className="px-4 pb-8 flex flex-wrap items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {allTypes.map((type) => (
            <button
              key={type}
              onClick={() => filterByType(type)}
              disabled={isPending}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 disabled:opacity-60 ${
                activeType === type
                  ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                  : "bg-white/70 dark:bg-slate-800/60 text-zinc-600 dark:text-zinc-300 hover:bg-sky-100 dark:hover:bg-slate-700"
              }`}
            >
              {type === "All" ? "ทั้งหมด" : type}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => changeSort(e.target.value as "Newest" | "Oldest")}
          disabled={isPending}
          className="px-4 py-1.5 rounded-full text-sm font-medium bg-white/70 dark:bg-slate-800/60 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-700 hover:border-sky-300 focus:outline-hidden cursor-pointer disabled:opacity-60"
        >
          <option value="Newest">ใหม่สุด</option>
          <option value="Oldest">เก่าสุด</option>
        </select>
      </section>

      <section className="pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-20">
              <i className="fi fi-sr-search-alt text-4xl text-zinc-300 dark:text-zinc-600 mb-4 block"></i>
              <p className="text-zinc-500 dark:text-zinc-400">ไม่พบข้อมูลสื่อการเรียนรู้</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={item.link}
                  target={item.link !== "#" ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-zinc-100 dark:border-slate-800 shadow-xs hover:shadow-xl hover:shadow-sky-100/50 dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300"
                >
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

          {totalPages > 1 && (
            <div id="resources-pagination" className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => navigateToPage(currentPage - 1)}
                disabled={currentPage === 1 || isPending}
                className="p-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              >
                <i className="fi fi-sr-angle-left" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => navigateToPage(page)}
                    disabled={isPending}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-60 ${
                      currentPage === page
                        ? "bg-sky-500 text-white shadow-md shadow-sky-500/25"
                        : "text-zinc-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => navigateToPage(currentPage + 1)}
                disabled={currentPage === totalPages || isPending}
                className="p-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:bg-sky-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
              >
                <i className="fi fi-sr-angle-right" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
