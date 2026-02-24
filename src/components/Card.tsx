import Link from "next/link";

interface CardProps {
    title: string;
    description: string;
    href: string;
    icon: string;
    color: string;
}

export default function Card({
    title,
    description,
    href,
    icon,
    color,
}: CardProps) {
    return (
        <Link
            href={href}
            className="group relative p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 card-hover overflow-hidden"
        >

            <div
                className={`absolute inset-0 ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />

            <div className="relative z-10">
                <div className="text-5xl mb-4">
                    <i className={`${icon} text-sky-700 dark:text-cyan-400`}></i>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-300 mb-2 group-hover:text-gray-900 dark:group-hover:text-sky-400 transition-all duration-300">
                    {title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
            </div>


            <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-sky-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:bg-sky-500 dark:group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <i className="fi fi-sr-arrow-right text-lg leading-none"></i>
            </div>
        </Link>
    );
}
