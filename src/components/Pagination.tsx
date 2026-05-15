/**
 * Pagination component for list pages.
 */

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  isPending?: boolean;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  isPending = false 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-2 mt-12">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1 || isPending}
        className="p-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:bg-blue-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
      >
        <i className="fi fi-sr-angle-left" />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          disabled={isPending}
          className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-60 ${
            currentPage === page
              ? "bg-blue-500 text-white shadow-md shadow-blue-500/25"
              : "text-zinc-500 dark:text-zinc-400 hover:bg-blue-100 dark:hover:bg-slate-800"
          }`}
        >
          {page}
        </button>
      ))}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages || isPending}
        className="p-2 rounded-xl text-sm text-zinc-500 dark:text-zinc-400 hover:bg-blue-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 cursor-pointer"
      >
        <i className="fi fi-sr-angle-right" />
      </button>
    </div>
  );
}