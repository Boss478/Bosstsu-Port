'use client';

import { useState, KeyboardEvent, useTransition } from 'react';
import { addCustomTag } from '@/app/actions/tags';

interface TagPickerProps {
  name: string;
  availableTags: string[];
  initialTags?: string[];
  category: string;
  placeholder?: string;
}

export default function TagPicker({
  name,
  availableTags,
  initialTags = [],
  category,
  placeholder = 'เพิ่มแท็ก',
}: TagPickerProps) {
  const [selected, setSelected] = useState<string[]>(initialTags);
  const [tagsList, setTagsList] = useState<string[]>(availableTags);
  const [customInput, setCustomInput] = useState('');
  const [isPending, startTransition] = useTransition();

  const toggleTag = (tag: string) => {
    setSelected(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomTag = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    const isDuplicateLocal = tagsList.some(
      t => t.toLowerCase() === trimmed.toLowerCase()
    );

    if (!isDuplicateLocal) {
      startTransition(async () => {
        const res = await addCustomTag(trimmed, category);
        if (res.success && res.name) {
          setTagsList(prev => [...prev, res.name]);
          if (!selected.includes(res.name))
            setSelected(prev => [...prev, res.name]);
          setCustomInput('');
        }
      });
    } else {
      const match =
        tagsList.find(t => t.toLowerCase() === trimmed.toLowerCase()) ||
        trimmed;
      if (!selected.includes(match)) setSelected(prev => [...prev, match]);
      setCustomInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomTag();
    }
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={selected.join(',')} />

      {tagsList.length > 0 ? (
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
          {tagsList.map(tag => {
            const isSelected = selected.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-sky-500 border-sky-500 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-900 border-zinc-200 dark:border-slate-700 text-zinc-600 dark:text-zinc-400 hover:border-sky-400'
                }`}
              >
                {isSelected && (
                  <i className="fi fi-sr-check mr-1 text-[10px]" />
                )}
                {tag}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-slate-900/50 border border-zinc-100 dark:border-slate-800 text-sm text-zinc-400 dark:text-zinc-500">
          <i className="fi fi-sr-info" />
          ไม่มี tag ให้เพิ่มก่อน
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isPending}
          className="flex-1 px-3 py-1.5 text-sm rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleAddCustomTag}
          disabled={isPending || !customInput.trim()}
          className="px-3 py-1.5 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 hover:bg-sky-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className={`fi ${isPending ? 'fi-sr-spinner animate-spin' : 'fi-sr-plus'}`} />
        </button>
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-zinc-50 dark:bg-slate-900/50 border border-zinc-100 dark:border-slate-800">
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 w-full mb-1">
            แท็กที่เลือก ({selected.length})
          </span>
          {selected.map(tag => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500 text-white text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="hover:text-sky-200"
              >
                <i className="fi fi-sr-cross text-[8px]" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
