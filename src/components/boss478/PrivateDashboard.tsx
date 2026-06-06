import Link from 'next/link';
import DashboardSummary from './DashboardSummary';

const TOOLS = [
  {
    href: '/boss478/stocks',
    icon: 'fi fi-sr-stats',
    title: 'Stock Dashboard',
    desc: 'Portfolio tracker, watchlist, charts, and market overview',
    color: 'from-blue-500/20 to-cyan-500/20',
  },
  {
    href: '/boss478/finance',
    icon: 'fi fi-sr-wallet',
    title: 'Budget Tracker',
    desc: 'Track expenses, income, and subscriptions with monthly summaries',
    color: 'from-emerald-500/20 to-teal-500/20',
  },
];

export default function PrivateDashboard() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <i aria-hidden="true" className="fi fi-sr-apps text-blue-500" />
          Private Tools
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Select a tool to get started
        </p>
      </div>

      <DashboardSummary />

      <div className="grid gap-6 md:grid-cols-2">
        {TOOLS.map((tool) => (
          <Link
            key={tool.href}
            href={tool.href}
            className="group block p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg shadow-sky-100/40 dark:shadow-black/20 hover:shadow-xl transition-all hover:-translate-y-0.5"
          >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${tool.color} flex items-center justify-center mb-4`}>
              <i className={`${tool.icon} text-xl text-zinc-700 dark:text-zinc-200`} />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {tool.title}
            </h2>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {tool.desc}
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-blue-600 dark:text-blue-400">
              <span>Open</span>
              <i aria-hidden="true" className="fi fi-sr-arrow-right text-xs transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
