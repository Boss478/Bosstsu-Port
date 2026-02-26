import Link from "next/link";
import { getDbStats, getDashboardStats } from "@/app/actions/admin";
import Breadcrumb from "@/components/Breadcrumb";
import LogoutButton from "./LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [stats, recent] = await Promise.all([getDbStats(), getDashboardStats()]);

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950">
      <section className="pt-28 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <Breadcrumb items={[{ label: "Backend" }]} />

          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
              <i className="fi fi-sr-settings text-sky-500 mr-3" />
              Backend Dashboard
            </h1>
            <LogoutButton />
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 mb-8">
            ระบบจัดการข้อมูลเว็บไซต์ — Database Management
          </p>

          {/* Connection Status Card */}
          <div className="mb-8 p-6 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`w-3 h-3 rounded-full ${
                  stats.connected
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                }`}
              />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {stats.connected ? "Connected" : "Disconnected"}
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40">
                <i className="fi fi-sr-database text-sky-500" />
                <div>
                  <p className="text-zinc-400 dark:text-zinc-500 text-xs">Database</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {stats.dbName || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40">
                <i className="fi fi-sr-link-alt text-sky-500" />
                <div>
                  <p className="text-zinc-400 dark:text-zinc-500 text-xs">URI</p>
                  <p className="font-mono font-semibold text-zinc-800 dark:text-zinc-200 text-xs break-all">
                    {stats.dbUri || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40">
                <i className="fi fi-sr-server text-sky-500" />
                <div>
                  <p className="text-zinc-400 dark:text-zinc-500 text-xs">Host</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {stats.host || "—"}
                  </p>
                </div>
              </div>

              {stats.serverStatus && (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40">
                    <i className="fi fi-sr-info text-sky-500" />
                    <div>
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs">
                        MongoDB Version
                      </p>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {stats.serverStatus.version}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40">
                    <i className="fi fi-sr-time-past text-sky-500" />
                    <div>
                      <p className="text-zinc-400 dark:text-zinc-500 text-xs">Uptime</p>
                      <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {stats.serverStatus.uptime}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Mongo Express Link */}
            <div className="mt-5 pt-5 border-t border-zinc-200/40 dark:border-slate-700/40">
              <a
                href="http://localhost:8081"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/20 transition-all group"
              >
                <i className="fi fi-sr-database text-emerald-500 text-lg" />
                <div>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">
                    Mongo Express
                  </p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">
                    localhost:8081
                  </p>
                </div>
                <i className="fi fi-sr-arrow-up-right text-emerald-500 text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          </div>

          {/* Collection Stats */}
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            <i className="fi fi-sr-layers text-sky-500 mr-2" />
            Collections
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
            {stats.collections.map((col) => (
              <div
                key={col.name}
                className="p-5 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <i className={`${col.icon} text-sky-500 text-xl`} />
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                    {col.count}
                  </span>
                </div>
                <p className="font-semibold text-zinc-700 dark:text-zinc-300 text-sm">
                  {col.name}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500">
                  {col.count === 0 ? "ยังไม่มีข้อมูล" : `${col.count} รายการ`}
                </p>
              </div>
            ))}
          </div>

          {/* Recent Portfolio Items */}
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            <i className="fi fi-sr-time-past text-sky-500 mr-2" />
            รายการล่าสุด — Portfolio
          </h2>
          <div className="mb-10 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-sm overflow-hidden">
            {recent.portfolio.length === 0 ? (
              <p className="p-6 text-zinc-400 text-sm">ไม่มีข้อมูล</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-left text-zinc-500 dark:text-zinc-400">
                    <th className="py-3 px-5 font-medium">Slug</th>
                    <th className="py-3 px-5 font-medium">Title</th>
                    <th className="py-3 px-5 font-medium hidden md:table-cell">Tags</th>
                    <th className="py-3 px-5 font-medium hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recent.portfolio.map((item: any) => (
                    <tr
                      key={item._id}
                      className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30 hover:bg-sky-50/40 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3 px-5 font-mono text-xs text-sky-600 dark:text-sky-400">
                        <Link href={`/portfolio/${item.slug}`} className="hover:underline">
                          {item.slug}
                        </Link>
                      </td>
                      <td className="py-3 px-5 font-medium text-zinc-800 dark:text-zinc-200">
                        {item.title}
                      </td>
                      <td className="py-3 px-5 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {item.tags?.map((tag: string) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-xs bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-5 hidden lg:table-cell text-zinc-500 dark:text-zinc-400">
                        {new Date(item.date).toLocaleDateString("th-TH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Recent Gallery Albums */}
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            <i className="fi fi-sr-picture text-sky-500 mr-2" />
            รายการล่าสุด — Gallery
          </h2>
          <div className="mb-10 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-sm overflow-hidden">
            {recent.gallery.length === 0 ? (
              <p className="p-6 text-zinc-400 text-sm">ไม่มีข้อมูล</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-left text-zinc-500 dark:text-zinc-400">
                    <th className="py-3 px-5 font-medium">Slug</th>
                    <th className="py-3 px-5 font-medium">Title</th>
                    <th className="py-3 px-5 font-medium hidden md:table-cell">Photos</th>
                    <th className="py-3 px-5 font-medium hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {recent.gallery.map((album: any) => (
                    <tr
                      key={album._id}
                      className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30 hover:bg-sky-50/40 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3 px-5 font-mono text-xs text-sky-600 dark:text-sky-400">
                        <Link href={`/gallery/${album.slug}`} className="hover:underline">
                          {album.slug}
                        </Link>
                      </td>
                      <td className="py-3 px-5 font-medium text-zinc-800 dark:text-zinc-200">
                        {album.title}
                      </td>
                      <td className="py-3 px-5 hidden md:table-cell text-zinc-500 dark:text-zinc-400">
                        {album.photos?.length || 0} รูป
                      </td>
                      <td className="py-3 px-5 hidden lg:table-cell text-zinc-500 dark:text-zinc-400">
                        {new Date(album.date).toLocaleDateString("th-TH")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* System Info & Tools */}
          <div className="mb-8 p-6 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <i className="fi fi-sr-info text-sky-500" />
              ข้อมูลระบบ (System Info)
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
              <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40 border border-sky-100 dark:border-slate-600/50">
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mb-1">Framework</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Next.js</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-black text-white">v16.1.6</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40 border border-sky-100 dark:border-slate-600/50">
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mb-1">Library</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">React</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500 text-white">v19.2.3</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40 border border-sky-100 dark:border-slate-600/50">
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mb-1">Styling</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">TailwindCSS</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500 text-white">v4.0</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40 border border-sky-100 dark:border-slate-600/50">
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mb-1">Database ORM</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Mongoose</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-600 text-white">v9.1.6</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40 border border-sky-100 dark:border-slate-600/50">
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mb-1">Language</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">TypeScript</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-600 text-white">v5.0</span>
                </div>
              </div>
               <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-slate-700/40 border border-sky-100 dark:border-slate-600/50">
                <p className="text-zinc-400 dark:text-zinc-500 text-xs mb-1">Environment</p>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Node.js</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-green-500 text-white">Current</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
            <i className="fi fi-sr-bolt text-sky-500 mr-2" />
            เมนูลัด (Quick Links)
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/admin/portfolio"
              className="flex items-center gap-3 p-4 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all group"
            >
              <i className="fi fi-sr-briefcase text-sky-500" />
              <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">
                จัดการผลงาน
              </span>
              <i className="fi fi-sr-arrow-right text-xs text-zinc-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/admin/gallery"
              className="flex items-center gap-3 p-4 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all group"
            >
              <i className="fi fi-sr-picture text-sky-500" />
              <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">
                จัดการแกลเลอรี
              </span>
              <i className="fi fi-sr-arrow-right text-xs text-zinc-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/admin/learning"
              className="flex items-center gap-3 p-4 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all group"
            >
              <i className="fi fi-sr-book-alt text-sky-500" />
              <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">
                จัดการสื่อการเรียนรู้
              </span>
              <i className="fi fi-sr-arrow-right text-xs text-zinc-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link
              href="/admin/games"
              className="flex items-center gap-3 p-4 rounded-2xl border border-white/60 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/60 shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-700 transition-all group"
            >
              <i className="fi fi-sr-gamepad text-sky-500" />
              <span className="font-medium text-zinc-700 dark:text-zinc-300 text-sm">
                จัดการเกม
              </span>
              <i className="fi fi-sr-arrow-right text-xs text-zinc-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
