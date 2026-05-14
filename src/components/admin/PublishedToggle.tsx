/**
 * Published toggle checkbox component.
 */

interface PublishedToggleProps {
  name?: string;
  defaultChecked?: boolean;
  label?: string;
  className?: string;
}

export function PublishedToggle({ 
  name = 'published', 
  defaultChecked = true,
  label = 'Public',
  className = '' 
}: PublishedToggleProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="inline-flex items-center gap-2 cursor-pointer select-none">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          className="w-4 h-4 rounded accent-sky-500"
        />
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
        </span>
      </label>
    </div>
  );
}