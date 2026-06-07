import Link from 'next/link';

interface CardProps {
  title: string;
  description: string;
  href: string;
  icon: string;
  color: string;
  iconColor?: string;
  textColor?: string;
}

export default function Card({
  title,
  description,
  href,
  icon,
  color,
  iconColor = 'text-blue-700 dark:text-cyan-400',
  textColor = 'text-zinc-900 dark:text-zinc-300 group-hover:text-zinc-800 dark:group-hover:text-blue-300',
}: CardProps) {
  return (
    <Link
      href={href}
      className="group relative p-8 rounded-3xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-md border border-white/60 dark:border-white/10 shadow-xl shadow-blue-900/5 dark:shadow-black/20 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-blue-900/10 dark:hover:shadow-black/40 hover:bg-white/60 dark:hover:bg-slate-800/60"
    >
      <div
        className={`absolute inset-0 ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
      />

      <div className="absolute -bottom-6 -right-6 text-8xl opacity-[0.04] dark:opacity-[0.02] group-hover:opacity-[0.06] transition-opacity duration-300">
        <i aria-hidden="true" className={icon} />
      </div>

      <div className="relative z-10">
        <div className="text-6xl mb-4">
          <i aria-hidden="true" className={`${icon} ${iconColor}`}></i>
        </div>
        <h3
          className={`text-2xl font-bold mb-2 leading-relaxed ${textColor} transition-all duration-300`}
        >
          {title}
        </h3>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{description}</p>
      </div>

      <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-500 dark:group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
        <i aria-hidden="true" className="fi fi-sr-arrow-right text-lg leading-none"></i>
      </div>
    </Link>
  );
}
