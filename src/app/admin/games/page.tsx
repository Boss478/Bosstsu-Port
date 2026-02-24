import Link from 'next/link';
import dbConnect from '@/lib/db';
import Game from '@/models/Game';
import Breadcrumb from '@/components/Breadcrumb';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteGame } from './actions';
import SearchFilter from '@/components/admin/SearchFilter';

export const dynamic = 'force-dynamic';

export default async function GamesListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await dbConnect();

  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : '';
  const sortParam = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'latest';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sortQuery: any = { createdAt: -1 };
  if (sortParam === 'oldest') sortQuery = { createdAt: 1 };
  if (sortParam === 'name_asc') sortQuery = { title: 1 };
  if (sortParam === 'name_desc') sortQuery = { title: -1 };

  const query = search ? { title: { $regex: search, $options: 'i' } } : {};

  const [items, total] = await Promise.all([
    Game.find(query).sort(sortQuery).skip(skip).limit(limit).lean(),
    Game.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb items={[{ label: 'Backend', href: '/admin' }, { label: 'Games' }]} />

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <i className="fi fi-sr-gamepad text-sky-500" />
            จัดการเกม (Games)
          </h1>
          <Link
            href="/admin/games/new"
            className="flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:-translate-y-0.5"
          >
            <i className="fi fi-sr-plus text-sm" />
            เพิ่มเกมใหม่
          </Link>
        </div>

        <SearchFilter />

        <div className="bg-white/60 dark:bg-slate-800/60 rounded-2xl border border-white/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-zinc-500 dark:text-zinc-400 text-sm">
                <th className="p-4 font-medium">Title</th>
                <th className="p-4 font-medium hidden md:table-cell">Genre</th>
                <th className="p-4 font-medium hidden sm:table-cell">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    ยังไม่มีเกม
                  </td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                items.map((item: any) => (
                  <tr
                    key={item._id}
                    className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30 hover:bg-sky-50/40 dark:hover:bg-slate-700/30 transition-colors group"
                  >
                    <td className="p-4">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-1">
                        {item.title}
                      </p>
                      <p className="text-xs text-sky-600 dark:text-sky-400 font-mono truncate max-w-xs">
                        {item.playUrl}
                      </p>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-slate-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-slate-600">
                        {item.genre}
                      </span>
                    </td>
                    <td className="p-4 hidden sm:table-cell">
                      {item.published === false ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-slate-600">
                          <i className="fi fi-sr-eye-crossed" />Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-200 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                          <i className="fi fi-sr-eye" />Public
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/games/${item._id}`}
                          className="p-2 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <i className="fi fi-sr-pencil" />
                        </Link>
                        <DeleteButton id={item._id.toString()} action={deleteGame} />
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
              href={`?page=${page - 1}`}
              className={`p-2 rounded-lg border ${
                page <= 1
                  ? 'pointer-events-none opacity-50 border-zinc-200 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:bg-zinc-50'
              }`}
            >
              <i className="fi fi-sr-angle-left" />
            </Link>
            <span className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              Page {page} of {totalPages}
            </span>
            <Link
              href={`?page=${page + 1}`}
              className={`p-2 rounded-lg border ${
                page >= totalPages
                  ? 'pointer-events-none opacity-50 border-zinc-200 dark:border-slate-700'
                  : 'bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:bg-zinc-50'
              }`}
            >
              <i className="fi fi-sr-angle-right" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
