'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

const COLORS = [
  '#000000', '#e53e3e', '#dd6b20', '#d69e2e',
  '#38a169', '#3182ce', '#805ad5', '#d53f8c',
];

export default function RichTextEditor({
  name,
  defaultValue = '',
  placeholder = '',
  required = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const syncHidden = useCallback(() => {
    if (hiddenRef.current && editorRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue;
    }
  }, [defaultValue]);

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    syncHidden();
  };

  const applyColor = (color: string) => {
    execCmd('foreColor', color);
    setShowColorPicker(false);
  };

  const isActive = (command: string) => {
    try {
      return document.queryCommandState(command);
    } catch {
      return false;
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800/60">
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); execCmd('bold'); }}
          title="Bold"
          className={`p-1.5 rounded-lg transition-colors ${isActive('bold') ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        >
          <i className="fi fi-sr-bold text-sm flex" />
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); execCmd('italic'); }}
          title="Italic"
          className={`p-1.5 rounded-lg transition-colors ${isActive('italic') ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        >
          <i className="fi fi-sr-italic text-sm flex" />
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); execCmd('underline'); }}
          title="Underline"
          className={`p-1.5 rounded-lg transition-colors ${isActive('underline') ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        >
          <i className="fi fi-sr-underline text-sm flex" />
        </button>
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); execCmd('strikeThrough'); }}
          title="Strikethrough"
          className={`p-1.5 rounded-lg transition-colors ${isActive('strikeThrough') ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600' : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
        >
          <i className="fi fi-sr-strikethrough text-sm flex" />
        </button>

        <div className="w-px h-5 bg-zinc-200 dark:bg-slate-700 mx-1" />

        {/* Color Picker */}
        <div className="relative">
          <button
            type="button"
            onMouseDown={e => {
              e.preventDefault();
              setShowColorPicker(prev => !prev);
            }}
            title="Text Color"
            className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
          >
            <i className="fi fi-sr-paint-brush text-sm flex" />
          </button>

          {showColorPicker && (
            <div className="absolute top-full left-0 z-50 mt-1 p-2 rounded-xl border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg grid grid-cols-4 gap-1">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    applyColor(color);
                  }}
                  className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-700 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={syncHidden}
        onBlur={syncHidden}
        data-placeholder={placeholder}
        className="min-h-[200px] max-h-[500px] overflow-y-auto px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-500"
      />

      <input
        ref={hiddenRef}
        type="hidden"
        name={name}
        defaultValue={defaultValue}
        required={required}
      />
    </div>
  );
}
