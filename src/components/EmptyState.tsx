/"/**
 * Empty state component for list pages.
 */

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: string;
}

export function EmptyState({ 
  title = "ไม่พบข้อมูล",
  message = "ไม่มีรายการที่ตรงกับเงื่อนไขการค้นหา",
  icon = "fi-sr-folder-open"
}: EmptyStateProps) {
  return (
    <div className="text-center py-20 px-4">
      <i className={`fi ${icon} text-5xl text-zinc-300 dark:text-zinc-600 mb-4`} />
      <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
        {title}
      </h3>
      <p className="text-zinc-500 dark:text-zinc-400">
        {message}
      </p>
    </div>
  );
}
