import Link from "next/link";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Portfolio from "@/models/Portfolio";
import Breadcrumb from "@/components/Breadcrumb";
import PortfolioGallery from "@/components/PortfolioGallery";
import { type PortfolioItem, formatDate } from "../data";
import DOMPurify from 'isomorphic-dompurify';
import { CONFIG } from "@/lib/config";

export const revalidate = 60;

export async function generateStaticParams() {
  await dbConnect();
  const docs = await Portfolio.find({ published: { $ne: false } }, "slug").lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return docs.map((doc: any) => ({
    id: doc.slug,
  }));
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = await Portfolio.findOne({ slug: id, published: { $ne: false } }).lean();
  if (!doc) notFound();

  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  const item: PortfolioItem = {
    id: doc.slug,
    title: doc.title,
    description: doc.description || "",
    content: doc.content || "",
    gallery: doc.gallery || [],
    tools: doc.tools || [],
    cover: doc.cover,
    tags: doc.tags || [],
    date: doc.date instanceof Date ? doc.date.toISOString() : new Date(doc.date || defaultFallbackDate).toISOString(),
    relatedGalleryId: doc.relatedGalleryId || undefined,
  };

  // Fetch related data in parallel to avoid JS waterfall effect
  const [recentDocs, relatedDocs, newerDocAny, olderDocAny] = await Promise.all([
    Portfolio.find({ slug: { $ne: id }, published: { $ne: false } }).sort({ date: -1 }).limit(CONFIG.PAGINATION.PORTFOLIO_RECENT).lean(),
    item.tags.length > 0 ? Portfolio.aggregate([
      { $match: { slug: { $ne: id }, tags: { $in: item.tags }, published: { $ne: false } } },
      { $addFields: { score: { $size: { $setIntersection: ["$tags", item.tags] } } } },
      { $sort: { score: -1, date: -1 } },
      { $limit: CONFIG.PAGINATION.PORTFOLIO_RELATED },
    ]) : Promise.resolve([]),
    Portfolio.findOne({ date: { $gt: doc.date } }).sort({ date: 1 }).lean(),
    Portfolio.findOne({ date: { $lt: doc.date } }).sort({ date: -1 }).lean(),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentItems = recentDocs.map((d: any) => ({
    id: d.slug,
    title: d.title,
    cover: d.cover,
    date: d.date instanceof Date ? d.date.toISOString() : new Date(d.date || defaultFallbackDate).toISOString(),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const relatedItems = relatedDocs.map((d: any) => ({
    id: d.slug,
    title: d.title,
    cover: d.cover,
    date: d.date instanceof Date ? d.date.toISOString() : new Date(d.date || defaultFallbackDate).toISOString(),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newerDoc: any = newerDocAny;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const olderDoc: any = olderDocAny;

  const newerItem = newerDoc ? { id: newerDoc.slug, title: newerDoc.title } : null;
  const olderItem = olderDoc ? { id: olderDoc.slug, title: olderDoc.title } : null;

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950">
      <section className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb
            items={[
              { label: "ผลงาน", href: "/portfolio" },
              { label: item.title },
            ]}
          />
        </div>
      </section>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 px-4 pb-20">
        <main className="lg:col-span-3 space-y-8">
          <article id="portfolio-article" className="space-y-8">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-xl shadow-sky-100/50 dark:shadow-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.cover}
                alt={item.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/70 dark:border-slate-700/50 shadow-sm">
              <header className="mb-12 border-b border-zinc-100 dark:border-slate-800 pb-12">
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                  {item.title}
                </h1>
                <div className="flex flex-wrap items-center gap-6 text-zinc-500 dark:text-zinc-400 text-sm">
                  <span className="flex items-center gap-2">
                    <i className="fi fi-sr-calendar" />
                    {formatDate(item.date)}
                  </span>
                </div>
              </header>

              {/* sanitize with DOMPurify to prevent XSS */}
              <div
                className="prose prose-lg prose-sky dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.content) }}
              />

              {item.tools && item.tools.length > 0 && (
                <div className="mt-20 pt-12 border-t border-zinc-100 dark:border-slate-800">
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-200 mb-4 flex items-center gap-2">
                    <i className="fi fi-sr-tools text-sky-500" /> Tools used
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {item.tools.map((tool) => (
                      <span
                        key={tool}
                        className="px-3 py-1.5 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-300"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gallery Section - Show if inline gallery exists OR if there's a related gallery link */}
            {( (item.gallery && item.gallery.length > 0) || item.relatedGalleryId ) && (
              <section id="portfolio-gallery" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 pl-2 border-l-4 border-sky-500">
                    แกลเลอรี่
                  </h3>
                  {item.relatedGalleryId && (
                    <Link
                      href={`/gallery/${item.relatedGalleryId}`}
                      className="text-sm font-medium text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                    >
                      ดูรูปทั้งหมด
                      <i className="fi fi-sr-arrow-right text-xs mt-0.5"></i>
                    </Link>
                  )}
                </div>
                
                {item.gallery && item.gallery.length > 0 ? (
                  <PortfolioGallery images={item.gallery} />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 rounded-2xl bg-sky-50 dark:bg-slate-900/50 border border-sky-100 dark:border-slate-800 text-center">
                     <div className="w-16 h-16 bg-sky-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                        <i className="fi fi-sr-picture text-2xl text-sky-500"></i>
                     </div>
                     <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                       ดูรูปภาพเพิ่มเติมได้ในอัลบั้มแกลเลอรี่
                     </p>
                     <Link
                      href={`/gallery/${item.relatedGalleryId}`}
                      className="px-6 py-2 bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 rounded-full font-medium shadow-sm hover:shadow border border-sky-100 dark:border-slate-700 transition-all"
                    >
                      ไปที่แกลเลอรี่
                    </Link>
                  </div>
                )}
              </section>
            )}
          </article>

          <nav id="portfolio-navigation" className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {olderItem && (
              <Link
                href={`/portfolio/${olderItem.id}`}
                className="group p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mb-2">
                  <i className="fi fi-sr-arrow-left transition-transform group-hover:-translate-x-1" />
                  ผลงานก่อนหน้า
                </div>
                <div className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                  {olderItem.title}
                </div>
              </Link>
            )}

            {newerItem && (
              <Link
                href={`/portfolio/${newerItem.id}`}
                className={`group p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 text-right ${!olderItem ? 'col-start-2' : ''}`}
              >
                <div className="flex items-center justify-end gap-2 text-xs text-zinc-400 dark:text-zinc-500 mb-2">
                  ผลงานถัดไป
                  <i className="fi fi-sr-arrow-right transition-transform group-hover:translate-x-1" />
                </div>
                <div className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                  {newerItem.title}
                </div>
              </Link>
            )}
          </nav>

          {relatedItems.length > 0 && (
            <section id="portfolio-related" className="pt-16 border-t border-zinc-200 dark:border-slate-800">
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                <i className="fi fi-sr-apps text-sky-500" />
                ผลงานอื่น ๆ
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/portfolio/${item.id}`}
                    className="group block bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/60 dark:border-slate-700/50 hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="aspect-video bg-zinc-200 dark:bg-slate-800 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-zinc-800 dark:text-zinc-200 text-sm mb-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatDate(item.date)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </main>

        <aside id="portfolio-sidebar" className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-6 rounded-3xl border border-white/60 dark:border-slate-700/50 shadow-sm">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <i className="fi fi-sr-time-past text-sky-500" />
                ผลงานล่าสุด
              </h3>
              <ul className="space-y-5">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {recentItems.map((item: any) => (
                  <li key={item.id} className="group">
                    <Link
                      href={`/portfolio/${item.id}`}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-16 h-16 rounded-xl bg-zinc-200 dark:bg-slate-800 shrink-0 overflow-hidden relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.cover}
                          alt={item.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 block mb-0.5">
                          {formatDate(item.date)}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
