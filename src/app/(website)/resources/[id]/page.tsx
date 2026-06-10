import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import mongoose from 'mongoose';
import DOMPurify from 'isomorphic-dompurify';
import dbConnect from '@/lib/db';
import Learning from '@/models/Learning';
import Breadcrumb from '@/components/Breadcrumb';
import { TrackedLink } from '@/components/TrackedLink';
import { formatLongDate, formatShortDate } from '@/lib/format';
import { CONFIG } from '@/lib/config';

export const revalidate = 60;

type LeanLearningDoc = {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  subject: string;
  type: string;
  link?: string;
  thumbnail?: string;
  tags: string[];
  published: boolean;
  content?: string;
  embedCode?: string;
  fileUrl?: string;
  youtubeId?: string;
  canvaEmbed?: string;
  createdAt: Date;
  updatedAt: Date;
};

type LeanNavDoc = { _id: mongoose.Types.ObjectId; title: string };
type LeanRecentDoc = {
  _id: mongoose.Types.ObjectId;
  title: string;
  thumbnail?: string;
  type: string;
  createdAt: Date;
};

const TYPE_COLORS: Record<string, string> = {
  Article: 'bg-orange-500/80 text-white',
  Video: 'bg-red-500/80 text-white',
  Presentation: 'bg-blue-500/80 text-white',
  'Lesson Plan': 'bg-teal-500/80 text-white',
  Sheet: 'bg-indigo-500/80 text-white',
  Worksheet: 'bg-green-500/80 text-white',
  Scratch: 'bg-yellow-500/80 text-slate-900',
  Interactive: 'bg-purple-500/80 text-white',
};

function getFileType(url: string): 'pdf' | 'image' | 'other' {
  const lower = url.toLowerCase();
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(jpe?g|png|webp|gif|svg)(\?|$)/.test(lower)) return 'image';
  return 'other';
}

function hasPrimaryContent(doc: LeanLearningDoc): boolean {
  if (doc.type === 'Article' && doc.content) return true;
  if (doc.type === 'Video' && doc.youtubeId) return true;
  if (doc.type === 'Presentation' && (doc.canvaEmbed || doc.fileUrl)) return true;
  if (doc.type === 'Lesson Plan' && doc.fileUrl) return true;
  if ((doc.type === 'Sheet' || doc.type === 'Worksheet') && doc.fileUrl) return true;
  if ((doc.type === 'Scratch' || doc.type === 'Interactive') && doc.embedCode) return true;
  return false;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) return { title: 'Not Found' };

    await dbConnect();
    const doc = (await Learning.findOne(
      { _id: id, published: { $ne: false } },
      'title description thumbnail',
    ).lean()) as LeanLearningDoc | null;

    if (!doc) return { title: 'Not Found' };

    return {
      title: `${doc.title} | Boss478`,
      description: doc.description || undefined,
      openGraph: {
        title: doc.title,
        description: doc.description || undefined,
        images: doc.thumbnail ? [{ url: doc.thumbnail }] : [],
        type: 'article',
      },
    };
  } catch {
    return { title: 'Boss478' };
  }
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) notFound();

  let doc: LeanLearningDoc | null = null;
  try {
    await dbConnect();
    doc = (await Learning.findOne({ _id: id, published: { $ne: false } })
      .select('+content')
      .lean()) as LeanLearningDoc | null;
  } catch {
    // DB unavailable (Docker build) — ISR populates at runtime
  }
  if (!doc) notFound();

  const docCreatedAt = doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt);

  const [recentDocs, olderDoc, newerDoc] = await Promise.all([
    Learning.find({ _id: { $ne: doc._id }, published: { $ne: false } })
      .select('_id title thumbnail type createdAt')
      .sort({ createdAt: -1 })
      .limit(CONFIG.PAGINATION.RECENT_RESOURCES)
      .lean() as Promise<LeanRecentDoc[]>,
    Learning.findOne({
      createdAt: { $lt: docCreatedAt },
      published: { $ne: false },
    })
      .select('_id title')
      .sort({ createdAt: -1 })
      .lean() as Promise<LeanNavDoc | null>,
    Learning.findOne({
      createdAt: { $gt: docCreatedAt },
      published: { $ne: false },
    })
      .select('_id title')
      .sort({ createdAt: 1 })
      .lean() as Promise<LeanNavDoc | null>,
  ]);

  const badgeColor = TYPE_COLORS[doc.type] ?? 'bg-blue-500/80 text-white';

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">
      <section className="pt-28 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <Breadcrumb
            items={[{ label: 'สื่อการเรียนรู้', href: '/resources' }, { label: doc.title }]}
          />
        </div>
      </section>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 px-4 pb-20">
        <main className="lg:col-span-3 space-y-8">
          {doc.thumbnail && (
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-xl shadow-blue-100/50 dark:shadow-black/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={doc.thumbnail}
                alt={doc.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          )}

          <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/70 dark:border-slate-700/50 shadow-sm">
            <header className="mb-8 border-b border-zinc-100 dark:border-slate-800 pb-8">
              <div className="flex flex-wrap gap-2 mb-4 items-center">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/40 shadow-sm ${badgeColor}`}
                >
                  {doc.type}
                </span>
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold leading-normal text-zinc-900 dark:text-zinc-100 mb-4">
                {doc.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-zinc-500 dark:text-zinc-400 text-sm">
                <span className="flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-calendar" />
                  {formatLongDate(docCreatedAt.toISOString())}
                </span>
                {doc.subject && (
                  <span className="flex items-center gap-2">
                    <i aria-hidden="true" className="fi fi-sr-book-alt" />
                    {doc.subject}
                  </span>
                )}
              </div>
            </header>

            {doc.description && (
              <div className="mb-8 p-6 bg-blue-50 dark:bg-slate-800/50 rounded-2xl border border-blue-100 dark:border-slate-700/50">
                <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                  <i aria-hidden="true" className="fi fi-sr-info" />
                  รายละเอียด
                </h3>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {doc.description}
                </p>
              </div>
            )}

            <div className="space-y-6">
              {doc.type === 'Article' && doc.content && (
                <div
                  className="article-content"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.content) }}
                />
              )}

              {doc.type === 'Video' && doc.youtubeId && (
                <div className="aspect-video rounded-2xl overflow-hidden shadow-md">
                  <iframe
                    src={`https://www.youtube.com/embed/${doc.youtubeId}`}
                    title={doc.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              )}

              {doc.type === 'Presentation' && (
                <>
                  {doc.canvaEmbed ? (
                    <div
                      className="rounded-2xl overflow-hidden shadow-md"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.canvaEmbed) }}
                    />
                  ) : doc.fileUrl ? (
                    <div className="aspect-video rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-slate-700">
                      <iframe src={doc.fileUrl} title={doc.title} className="w-full h-full" />
                    </div>
                  ) : null}
                </>
              )}

              {doc.type === 'Lesson Plan' && doc.fileUrl && (
                <div className="space-y-4">
                  {getFileType(doc.fileUrl) === 'pdf' ? (
                    <div className="h-[600px] rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-slate-700">
                      <iframe src={doc.fileUrl} title={doc.title} className="w-full h-full" />
                    </div>
                  ) : getFileType(doc.fileUrl) === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.fileUrl}
                      alt={doc.title}
                      className="max-w-full rounded-2xl shadow-md"
                    />
                  ) : null}
                  <TrackedLink
                    href={doc.fileUrl}
                    eventName="download"
                    metadata={{ title: doc.title, type: doc.type }}
                    download
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                  >
                    <i aria-hidden="true" className="fi fi-sr-download" />
                    ดาวน์โหลด
                  </TrackedLink>
                </div>
              )}

              {(doc.type === 'Sheet' || doc.type === 'Worksheet') && doc.fileUrl && (
                <>
                  {getFileType(doc.fileUrl) === 'pdf' ? (
                    <div className="h-[600px] rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-slate-700">
                      <iframe src={doc.fileUrl} title={doc.title} className="w-full h-full" />
                    </div>
                  ) : getFileType(doc.fileUrl) === 'image' ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={doc.fileUrl}
                      alt={doc.title}
                      className="max-w-full rounded-2xl shadow-md"
                    />
                  ) : null}
                </>
              )}

              {(doc.type === 'Scratch' || doc.type === 'Interactive') && doc.embedCode && (
                <div
                  className="rounded-2xl overflow-hidden shadow-md"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(doc.embedCode) }}
                />
              )}

              {!hasPrimaryContent(doc) && doc.link && doc.link !== '#' && (
                <TrackedLink
                  href={doc.link}
                  eventName="external_link_click"
                  metadata={{ title: doc.title }}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors"
                >
                  <i aria-hidden="true" className="fi fi-sr-arrow-up-right" />
                  เปิดสื่อการเรียนรู้
                </TrackedLink>
              )}
            </div>
          </div>

          <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {olderDoc && (
              <Link
                href={`/resources/${olderDoc._id.toString()}`}
                className="group p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
              >
                <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mb-2">
                  <i
                    aria-hidden="true"
                    className="fi fi-sr-arrow-left transition-transform group-hover:-translate-x-1"
                  />
                  สื่อก่อนหน้า
                </div>
                <div className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {olderDoc.title}
                </div>
              </Link>
            )}

            {newerDoc && (
              <Link
                href={`/resources/${newerDoc._id.toString()}`}
                className={`group p-6 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 text-right ${!olderDoc ? 'col-start-2' : ''}`}
              >
                <div className="flex items-center justify-end gap-2 text-xs text-zinc-400 dark:text-zinc-500 mb-2">
                  สื่อถัดไป
                  <i
                    aria-hidden="true"
                    className="fi fi-sr-arrow-right transition-transform group-hover:translate-x-1"
                  />
                </div>
                <div className="font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {newerDoc.title}
                </div>
              </Link>
            )}
          </nav>
        </main>

        <aside className="lg:col-span-1">
          <div className="sticky top-28 space-y-6">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm p-6 rounded-3xl border border-white/60 dark:border-slate-700/50 shadow-sm">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                <i aria-hidden="true" className="fi fi-sr-time-past text-blue-500" />
                สื่อล่าสุด
              </h3>
              <ul className="space-y-5">
                {recentDocs.map((item) => (
                  <li key={item._id.toString()} className="group">
                    <Link
                      href={`/resources/${item._id.toString()}`}
                      className="flex gap-3 items-start"
                    >
                      <div className="w-16 h-16 rounded-xl bg-zinc-200 dark:bg-slate-800 shrink-0 overflow-hidden relative">
                        {item.thumbnail ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <i
                              aria-hidden="true"
                              className="fi fi-sr-book-alt text-zinc-400 text-lg"
                            />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs text-zinc-400 dark:text-zinc-500 block mb-0.5">
                          {formatShortDate(
                            item.createdAt instanceof Date
                              ? item.createdAt.toISOString()
                              : new Date(item.createdAt).toISOString(),
                          )}
                        </span>
                        <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
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
