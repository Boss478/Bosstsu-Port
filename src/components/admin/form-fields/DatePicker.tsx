'use client';

interface DatePickerProps {
  name: string;
  defaultValue?: string;
  label: string;
  required?: boolean;
}

function toDateInputValue(date: string | undefined): string {
  if (!date) return new Date().toISOString().split('T')[0];
  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date().toISOString().split('T')[0] : d.toISOString().split('T')[0];
}

export default function DatePicker({ name, defaultValue, label, required }: DatePickerProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="date"
        name={name}
        id={name}
        defaultValue={toDateInputValue(defaultValue)}
        required={required}
        className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}
