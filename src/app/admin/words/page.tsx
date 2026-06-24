import Link from 'next/link';
import dbConnect from '@/lib/db';
import WordOverride from '@/models/Word';
import Breadcrumb from '@/components/Breadcrumb';
import DeleteButton from '@/components/admin/DeleteButton';
import ToggleStatus from '@/components/admin/ToggleStatus';
import { deleteWordOverride, toggleWordPublished, searchStaticWords } from './actions';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

import SearchFilter from '@/components/admin/SearchFilter';
import PageSizeSelector from '@/components/admin/PageSizeSelector';

export default async function WordsListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const tab = typeof sp.tab === 'string' ? sp.tab : 'all';

  return (
    <div className="max-w-6xl mx-auto">
      <Breadcrumb items={[{ label: 'Backend', href: '/admin' }, { label: 'Words' }]} />

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <i aria-hidden="true" className="fi fi-sr-book text-blue-500" />
          จัดการคำศัพท์ (Words)
        </h1>
        <Link
          href="/admin/words/new"
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5"
        >
          <i aria-hidden="true" className="fi fi-sr-plus text-sm" />
          เพิ่มคำศัพท์ใหม่
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm w-fit">
        <Link
          href="?tab=all"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <i aria-hidden="true" className="fi fi-sr-list mr-1.5" />
          All Words
        </Link>
        <Link
          href="?tab=overrides"
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            tab === 'overrides'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <i aria-hidden="true" className="fi fi-sr-bookmark mr-1.5" />
          Overrides
        </Link>
      </div>

      {tab === 'all' ? <AllWordsView searchParams={sp} /> : <OverridesView searchParams={sp} />}
    </div>
  );
}

async function AllWordsView({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit =
    typeof searchParams.limit === 'string' ? Math.min(parseInt(searchParams.limit), 250) : 50;

  const safeLimit = isNaN(limit) || limit < 1 ? 50 : limit;
  const safePage = isNaN(page) || page < 1 ? 1 : page;

  const result = await searchStaticWords(q, safePage, safeLimit);
  const { words, total, totalPages, overrideMap } = result;

  function buildPaginationQuery(newPage: number): string {
    const params = new URLSearchParams();
    params.set('tab', 'all');
    if (q) params.set('q', q);
    if (limit !== 50) params.set('limit', String(limit));
    params.set('page', String(newPage));
    return params.toString();
  }

  function makeSlug(word: string, level: string): string {
    return `${word.toLowerCase().replace(/\s+/g, '-')}-${level}`;
  }

  return (
    <>
      {/* Search & pagination controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <form action="/admin/words" method="GET" className="relative flex-1 min-w-[200px]">
          <input type="hidden" name="tab" value="all" />
          <i
            aria-hidden="true"
            className="fi fi-sr-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            name="q"
            placeholder="ค้นหา... (word, definition, IPA, level)"
            defaultValue={q}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </form>
        <div className="text-sm text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
          {total.toLocaleString()} results
        </div>
      </div>

      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-zinc-500 dark:text-zinc-400 text-sm">
              <th className="p-4 font-medium">Word</th>
              <th className="p-4 font-medium hidden sm:table-cell">Level</th>
              <th className="p-4 font-medium hidden md:table-cell">Class</th>
              <th className="p-4 font-medium hidden lg:table-cell">Definition</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {words.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-zinc-500">
                  {q ? `No words match "${q}"` : 'No words found'}
                </td>
              </tr>
            ) : (
              words.map((w, i) => {
                const slug = makeSlug(w.word, w.level);
                const overrideId = overrideMap[slug];
                const isOverridden = !!overrideId;

                return (
                  <tr
                    key={`${slug}-${i}`}
                    className={`border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors group ${
                      isOverridden ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {w.word}
                        </span>
                        {isOverridden && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                            <i aria-hidden="true" className="fi fi-sr-bookmark text-[8px]" />
                            Override
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        {w.level}
                      </span>
                    </td>
                    <td className="p-4 hidden md:table-cell text-sm text-zinc-500 dark:text-zinc-400">
                      {w.wordClass || '-'}
                    </td>
                    <td className="p-4 hidden lg:table-cell text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                      {w.definition || '-'}
                    </td>
                    <td className="p-4 text-right">
                      {isOverridden ? (
                        <Link
                          href={`/admin/words/${overrideId}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                          <i aria-hidden="true" className="fi fi-sr-pencil" />
                          Edit
                        </Link>
                      ) : (
                        <Link
                          href={`/admin/words/new?word=${encodeURIComponent(w.word)}&level=${encodeURIComponent(w.level)}${w.wordClass ? `&wordClass=${encodeURIComponent(w.wordClass)}` : ''}${w.ipa ? `&ipa=${encodeURIComponent(w.ipa)}` : ''}${w.definition ? `&definition=${encodeURIComponent(w.definition)}` : ''}${w.example ? `&example=${encodeURIComponent(w.example)}` : ''}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                        >
                          <i aria-hidden="true" className="fi fi-sr-plus" />
                          Override
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Link
            href={safePage <= 1 ? '#' : `?${buildPaginationQuery(safePage - 1)}`}
            className={`p-2 rounded-lg border ${
              safePage <= 1
                ? 'pointer-events-none opacity-50 border-zinc-200 dark:border-slate-700'
                : 'bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:bg-zinc-50'
            }`}
          >
            <i aria-hidden="true" className="fi fi-sr-angle-left" />
          </Link>
          <span className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Page {safePage} of {totalPages}
          </span>
          <Link
            href={safePage >= totalPages ? '#' : `?${buildPaginationQuery(safePage + 1)}`}
            className={`p-2 rounded-lg border ${
              safePage >= totalPages
                ? 'pointer-events-none opacity-50 border-zinc-200 dark:border-slate-700'
                : 'bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:bg-zinc-50'
            }`}
          >
            <i aria-hidden="true" className="fi fi-sr-angle-right" />
          </Link>
        </div>
      )}
    </>
  );
}

async function OverridesView({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  await dbConnect();

  const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
  const limit =
    typeof searchParams.limit === 'string'
      ? Math.min(parseInt(searchParams.limit), 250)
      : CONFIG.PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const search = typeof searchParams.q === 'string' ? searchParams.q : '';
  const sortParam = typeof searchParams.sort === 'string' ? searchParams.sort : 'latest';

  const sortQuery: Record<string, 1 | -1> =
    sortParam === 'oldest'
      ? ({ updatedAt: 1 } as const)
      : sortParam === 'name_asc'
        ? ({ word: 1 } as const)
        : sortParam === 'name_desc'
          ? ({ word: -1 } as const)
          : ({ updatedAt: -1 } as const);

  const query = search ? { word: { $regex: search, $options: 'i' } } : {};

  const [items, total] = await Promise.all([
    WordOverride.find(query).sort(sortQuery).skip(skip).limit(limit).lean(),
    WordOverride.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  function buildPaginationQuery(newPage: number): Record<string, string | number> {
    const params: Record<string, string | number> = { page: newPage, tab: 'overrides' };
    if (search) params.q = search;
    if (sortParam !== 'latest') params.sort = sortParam;
    if (limit !== CONFIG.PAGINATION.DEFAULT_LIMIT) params.limit = limit;
    return params;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <SearchFilter />
        <PageSizeSelector />
      </div>

      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-white/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-zinc-500 dark:text-zinc-400 text-sm">
              <th className="p-4 font-medium">Word</th>
              <th className="p-4 font-medium hidden sm:table-cell">Level</th>
              <th className="p-4 font-medium hidden md:table-cell">Class</th>
              <th className="p-4 font-medium hidden lg:table-cell">Definition</th>
              <th className="p-4 font-medium hidden sm:table-cell">Status</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-500">
                  No word overrides found.{' '}
                  <Link href="/admin/words/new" className="text-blue-600 hover:underline">
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              (
                items as unknown as {
                  _id: { toString(): string };
                  word: string;
                  slug: string;
                  level: string;
                  wordClass?: string;
                  definition?: string;
                  published?: boolean;
                }[]
              ).map((item) => (
                <tr
                  key={item._id.toString()}
                  className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30 hover:bg-blue-50/40 dark:hover:bg-slate-700/30 transition-colors group"
                >
                  <td className="p-4">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.word}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-mono">
                      {item.slug}
                    </p>
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {item.level}
                    </span>
                  </td>
                  <td className="p-4 hidden md:table-cell text-sm text-zinc-500 dark:text-zinc-400">
                    {item.wordClass || '-'}
                  </td>
                  <td className="p-4 hidden lg:table-cell text-sm text-zinc-500 dark:text-zinc-400 max-w-xs truncate">
                    {item.definition || '-'}
                  </td>
                  <td className="p-4 hidden sm:table-cell">
                    <ToggleStatus
                      id={item.slug}
                      currentStatus={item.published ?? true}
                      action={toggleWordPublished}
                    />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <Link
                        href={`/admin/words/${item._id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <i aria-hidden="true" className="fi fi-sr-pencil" />
                      </Link>
                      <DeleteButton id={item._id.toString()} action={deleteWordOverride} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          <Link
            href={
              page <= 1 ? '#' : { pathname: '/admin/words', query: buildPaginationQuery(page - 1) }
            }
            className={`p-2 rounded-lg border ${
              page <= 1
                ? 'pointer-events-none opacity-50 border-zinc-200 dark:border-slate-700'
                : 'bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:bg-zinc-50'
            }`}
          >
            <i aria-hidden="true" className="fi fi-sr-angle-left" />
          </Link>
          <span className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            Page {page} of {totalPages}
          </span>
          <Link
            href={
              page >= totalPages
                ? '#'
                : { pathname: '/admin/words', query: buildPaginationQuery(page + 1) }
            }
            className={`p-2 rounded-lg border ${
              page >= totalPages
                ? 'pointer-events-none opacity-50 border-zinc-200 dark:border-slate-700'
                : 'bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:bg-zinc-50'
            }`}
          >
            <i aria-hidden="true" className="fi fi-sr-angle-right" />
          </Link>
        </div>
      )}
    </>
  );
}
