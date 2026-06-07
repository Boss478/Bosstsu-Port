import Link from 'next/link';
import Image from 'next/image';

export interface SpotlightItem {
  slug: string;
  title: string;
  cover: string;
  date: string;
}

interface SpotlightProps {
  items: SpotlightItem[];
}

export default function Spotlight({ items }: SpotlightProps) {
  return (
    <section className="py-16 px-4 bg-white/70 dark:bg-slate-900">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-800 dark:text-zinc-100 leading-relaxed">
              ผลงานล่าสุด
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">ผลงานและโปรเจกต์ที่อัปเดตล่าสุด</p>
          </div>
          <Link
            href="/portfolio"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-500 dark:bg-blue-600 text-white text-sm font-semibold hover:bg-blue-600 dark:hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
          >
            ดูทั้งหมด
            <i aria-hidden="true" className="fi fi-sr-arrow-right text-xs" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-fade-left">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={`/portfolio/${item.slug}`}
              className="group relative flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-slate-800 border border-zinc-100 dark:border-slate-700/50 shadow-sm hover:shadow-xl hover:shadow-blue-900/10 dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="relative aspect-video overflow-hidden bg-zinc-100 dark:bg-slate-800">
                {item.cover ? (
                  <Image
                    src={item.cover}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <i
                      aria-hidden="true"
                      className="fi fi-sr-image text-3xl text-zinc-300 dark:text-zinc-600"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-zinc-800 dark:text-zinc-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {item.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-500 dark:bg-blue-600 text-white font-semibold hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-300"
          >
            ดูผลงานทั้งหมด
            <i aria-hidden="true" className="fi fi-sr-arrow-right text-xs" />
          </Link>
        </div>
      </div>
    </section>
  );
}
