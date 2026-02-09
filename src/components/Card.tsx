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
            className="group relative p-8 rounded-3xl bg-white dark:bg-blue-950 border border-sky-200 dark:border-blue-800 card-hover overflow-hidden"
        >
            {/* Gradient overlay on hover */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />

            <div className="relative z-10">
                <div className="text-5xl mb-4">
                    <i className={icon}></i>
                </div>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-all duration-300">
                    {title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400">{description}</p>
            </div>

            {/* Arrow */}
            <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-sky-100 dark:bg-blue-900 flex items-center justify-center group-hover:bg-sky-500 dark:group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <i className="fi fi-rr-arrow-right"></i>
            </div>
        </Link>
    );
}
