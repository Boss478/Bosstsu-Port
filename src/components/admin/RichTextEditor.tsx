'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

const BLOCK_FORMATS = [
  { label: 'ย่อหน้า', tag: 'p' },
  { label: 'H1 — หัวข้อใหญ่', tag: 'h1' },
  { label: 'H2 — หัวข้อรอง', tag: 'h2' },
  { label: 'H3 — หัวข้อย่อย', tag: 'h3' },
  { label: 'H4', tag: 'h4' },
  { label: 'H5', tag: 'h5' },
  { label: 'H6', tag: 'h6' },
];

const FONT_SIZES = [
  { label: '10px', px: '10px' },
  { label: '12px', px: '12px' },
  { label: '14px', px: '14px' },
  { label: '18px', px: '18px' },
  { label: '24px', px: '24px' },
  { label: '32px', px: '32px' },
  { label: '48px', px: '48px' },
];

const COLORS = [
  '#000000', '#374151', '#6B7280', '#D1D5DB',
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4',
  '#FFFFFF', '#FDE68A', '#BFDBFE', '#FBCFE8',
];

type ViewMode = 'wysiwyg' | 'html';
type OpenPanel = 'none' | 'blockFormat' | 'fontSize' | 'color' | 'link' | 'image';

interface FormatState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikeThrough: boolean;
  justifyLeft: boolean;
  justifyCenter: boolean;
  justifyRight: boolean;
  justifyFull: boolean;
  insertUnorderedList: boolean;
  insertOrderedList: boolean;
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-zinc-200 dark:bg-slate-700 mx-0.5 self-center shrink-0" />;
}

export default function RichTextEditor({
  name,
  defaultValue = '',
  placeholder = '',
  required = false,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const htmlCodeRef = useRef<HTMLTextAreaElement>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('wysiwyg');
  const [openPanel, setOpenPanel] = useState<OpenPanel>('none');
  const [formats, setFormats] = useState<FormatState>({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: true,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
  });
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const syncHidden = useCallback(() => {
    if (hiddenRef.current && editorRef.current) {
      hiddenRef.current.value = editorRef.current.innerHTML;
    }
  }, []);

  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue;
      syncHidden();
    }
  }, [defaultValue, syncHidden]);

  useEffect(() => {
    if (openPanel === 'none') return;
    const handler = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setOpenPanel('none');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openPanel]);

  const updateFormats = useCallback(() => {
    try {
      setFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikeThrough: document.queryCommandState('strikeThrough'),
        justifyLeft: document.queryCommandState('justifyLeft'),
        justifyCenter: document.queryCommandState('justifyCenter'),
        justifyRight: document.queryCommandState('justifyRight'),
        justifyFull: document.queryCommandState('justifyFull'),
        insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        insertOrderedList: document.queryCommandState('insertOrderedList'),
      });
    } catch {
      // queryCommandState unsupported in some contexts — ignore
    }
  }, []);

  const execCmd = useCallback(
    (command: string, value?: string) => {
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      syncHidden();
      updateFormats();
    },
    [syncHidden, updateFormats],
  );

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      editorRef.current?.focus();
    }
  };

  const applyBlock = (tag: string) => {
    execCmd('formatBlock', tag);
    setOpenPanel('none');
  };

  const applyFontSize = (px: string) => {
    editorRef.current?.focus();
    document.execCommand('fontSize', false, '7');
    editorRef.current?.querySelectorAll('font[size="7"]').forEach(el => {
      const span = document.createElement('span');
      span.style.fontSize = px;
      span.innerHTML = (el as HTMLElement).innerHTML;
      el.parentNode?.replaceChild(span, el);
    });
    syncHidden();
    setOpenPanel('none');
  };

  const applyColor = (color: string) => {
    execCmd('foreColor', color);
    setOpenPanel('none');
  };

  const openLinkPanel = () => {
    saveSelection();
    setLinkUrl('');
    setOpenPanel('link');
  };

  const applyLink = () => {
    if (!linkUrl.trim()) return;
    restoreSelection();
    const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
    execCmd('createLink', url);
    setLinkUrl('');
    setOpenPanel('none');
  };

  const openImagePanel = () => {
    saveSelection();
    setImageUrl('');
    setOpenPanel('image');
  };

  const applyImage = () => {
    if (!imageUrl.trim()) return;
    restoreSelection();
    execCmd('insertImage', imageUrl);
    setImageUrl('');
    setOpenPanel('none');
  };

  const toggleViewMode = () => {
    if (viewMode === 'wysiwyg') {
      if (htmlCodeRef.current && editorRef.current) {
        htmlCodeRef.current.value = editorRef.current.innerHTML;
      }
      setOpenPanel('none');
      setViewMode('html');
    } else {
      if (editorRef.current && htmlCodeRef.current) {
        editorRef.current.innerHTML = htmlCodeRef.current.value;
        syncHidden();
      }
      setViewMode('wysiwyg');
    }
  };

  const btnCls = (active: boolean) =>
    `p-1.5 rounded-lg transition-colors flex items-center justify-center ${
      active
        ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400'
        : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-700 hover:text-zinc-700 dark:hover:text-zinc-300'
    }`;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
      <div ref={toolbarRef} className="border-b border-zinc-200 dark:border-slate-700 bg-zinc-50 dark:bg-slate-800/60">

        {/* Row 1: Block Format, Font Size, B/I/U/S, Color, Alignment | toggle */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap">

          {viewMode === 'wysiwyg' && (
            <>
              {/* Block Format Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    setOpenPanel(p => p === 'blockFormat' ? 'none' : 'blockFormat');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors min-w-[88px]"
                  title="รูปแบบข้อความ"
                >
                  <span className="flex-1 text-left">ย่อหน้า</span>
                  <i className="fi fi-sr-angle-small-down flex text-[10px]" />
                </button>
                {openPanel === 'blockFormat' && (
                  <div className="absolute top-full left-0 z-50 mt-1 py-1 min-w-[168px] rounded-xl border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
                    {BLOCK_FORMATS.map(f => (
                      <button
                        key={f.tag}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); applyBlock(f.tag); }}
                        className="w-full text-left px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <ToolbarDivider />

              {/* Font Size Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    setOpenPanel(p => p === 'fontSize' ? 'none' : 'fontSize');
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-700 transition-colors min-w-[72px]"
                  title="ขนาดตัวอักษร"
                >
                  <span className="flex-1 text-left">ขนาด</span>
                  <i className="fi fi-sr-angle-small-down flex text-[10px]" />
                </button>
                {openPanel === 'fontSize' && (
                  <div className="absolute top-full left-0 z-50 mt-1 py-1 min-w-[120px] rounded-xl border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl">
                    {FONT_SIZES.map(s => (
                      <button
                        key={s.px}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); applyFontSize(s.px); }}
                        className="w-full text-left px-3 py-1 hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-700 dark:text-zinc-300 transition-colors"
                        style={{ fontSize: s.px, lineHeight: '1.8' }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <ToolbarDivider />

              {/* Bold */}
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); execCmd('bold'); }}
                className={btnCls(formats.bold)}
                title="ตัวหนา (Ctrl+B)"
              >
                <i className="fi fi-sr-bold text-sm flex" />
              </button>
              {/* Italic */}
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); execCmd('italic'); }}
                className={btnCls(formats.italic)}
                title="ตัวเอียง (Ctrl+I)"
              >
                <i className="fi fi-sr-italic text-sm flex" />
              </button>
              {/* Underline */}
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); execCmd('underline'); }}
                className={btnCls(formats.underline)}
                title="ขีดเส้นใต้ (Ctrl+U)"
              >
                <i className="fi fi-sr-underline text-sm flex" />
              </button>
              {/* Strikethrough */}
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); execCmd('strikeThrough'); }}
                className={btnCls(formats.strikeThrough)}
                title="ขีดทับ"
              >
                <i className="fi fi-sr-strikethrough text-sm flex" />
              </button>

              <ToolbarDivider />

              {/* Text Color */}
              <div className="relative">
                <button
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault();
                    setOpenPanel(p => p === 'color' ? 'none' : 'color');
                  }}
                  className={btnCls(openPanel === 'color')}
                  title="สีข้อความ"
                >
                  <i className="fi fi-sr-paint-brush text-sm flex" />
                </button>
                {openPanel === 'color' && (
                  <div className="absolute top-full left-0 z-50 mt-1 p-2 rounded-xl border border-zinc-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl grid grid-cols-4 gap-1.5">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); applyColor(color); }}
                        className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-700 hover:scale-110 transition-transform shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                )}
              </div>

              <ToolbarDivider />

              {/* Alignment */}
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); execCmd('justifyLeft'); }}
                className={btnCls(formats.justifyLeft)}
                title="ชิดซ้าย"
              >
                <i className="fi fi-sr-align-left text-sm flex" />
              </button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); execCmd('justifyCenter'); }}
                className={btnCls(formats.justifyCenter)}
                title="กึ่งกลาง"
              >
                <i className="fi fi-sr-align-center text-sm flex" />
              </button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); execCmd('justifyRight'); }}
                className={btnCls(formats.justifyRight)}
                title="ชิดขวา"
              >
                <i className="fi fi-sr-align-right text-sm flex" />
              </button>
              <button
                type="button"
                onMouseDown={e => { e.preventDefault(); execCmd('justifyFull'); }}
                className={btnCls(formats.justifyFull)}
                title="จัดเต็ม"
              >
                <i className="fi fi-sr-align-justify text-sm flex" />
              </button>
            </>
          )}

          {/* View Mode Toggle — always visible, pushed to far right */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); toggleViewMode(); }}
            className={`ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              viewMode === 'html'
                ? 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400'
                : 'bg-zinc-100 dark:bg-slate-700 text-zinc-500 dark:text-zinc-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400'
            }`}
            title={viewMode === 'wysiwyg' ? 'ดูและแก้ไข HTML โดยตรง' : 'กลับไปยัง Visual Editor'}
          >
            {viewMode === 'wysiwyg' ? (
              <><i className="fi fi-sr-code flex" /><span>HTML</span></>
            ) : (
              <><i className="fi fi-sr-pencil flex" /><span>Editor</span></>
            )}
          </button>
        </div>

        {/* Row 2 & dialogs — WYSIWYG mode only */}
        {viewMode === 'wysiwyg' && (
          <>
        {/* Row 2: Lists, Indent/Outdent, Link, Image, HR, Clear */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 flex-wrap border-t border-zinc-100 dark:border-slate-700/50">

          {/* Bullet List */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); execCmd('insertUnorderedList'); }}
            className={btnCls(formats.insertUnorderedList)}
            title="รายการหัวข้อ (Bullet List)"
          >
            <i className="fi fi-sr-list text-sm flex" />
          </button>
          {/* Ordered List */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); execCmd('insertOrderedList'); }}
            className={btnCls(formats.insertOrderedList)}
            title="รายการลำดับ (Numbered List)"
          >
            <i className="fi fi-sr-list-ol text-sm flex" />
          </button>

          <ToolbarDivider />

          {/* Indent */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); execCmd('indent'); }}
            className={btnCls(false)}
            title="เพิ่มย่อหน้า (Indent)"
          >
            <i className="fi fi-sr-indent text-sm flex" />
          </button>
          {/* Outdent */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); execCmd('outdent'); }}
            className={btnCls(false)}
            title="ลดย่อหน้า (Outdent)"
          >
            <i className="fi fi-sr-outdent text-sm flex" />
          </button>

          <ToolbarDivider />

          {/* Insert Link */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); openLinkPanel(); }}
            className={btnCls(openPanel === 'link')}
            title="แทรกลิงก์"
          >
            <i className="fi fi-sr-link text-sm flex" />
          </button>
          {/* Unlink */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); execCmd('unlink'); }}
            className={btnCls(false)}
            title="ลบลิงก์"
          >
            <i className="fi fi-sr-unlink text-sm flex" />
          </button>

          <ToolbarDivider />

          {/* Insert Image */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); openImagePanel(); }}
            className={btnCls(openPanel === 'image')}
            title="แทรกรูปภาพ (URL)"
          >
            <i className="fi fi-sr-picture text-sm flex" />
          </button>

          <ToolbarDivider />

          {/* Horizontal Rule */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); execCmd('insertHorizontalRule'); }}
            className={btnCls(false)}
            title="เส้นแบ่ง (Horizontal Rule)"
          >
            <i className="fi fi-sr-minus text-sm flex" />
          </button>
          {/* Remove Formatting */}
          <button
            type="button"
            onMouseDown={e => { e.preventDefault(); execCmd('removeFormat'); }}
            className={btnCls(false)}
            title="ล้างการจัดรูปแบบ"
          >
            <i className="fi fi-sr-eraser text-sm flex" />
          </button>
        </div>

        {/* Link Inline Dialog */}
        {openPanel === 'link' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-950/30 border-t border-zinc-200 dark:border-slate-700">
            <i className="fi fi-sr-link text-sky-500 text-sm flex shrink-0" />
            <input
              type="url"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') setOpenPanel('none');
              }}
              placeholder="https://..."
              autoFocus
              className="flex-1 text-sm bg-transparent text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={applyLink}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white transition-colors"
            >
              แทรก
            </button>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setOpenPanel('none'); }}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <i className="fi fi-sr-cross text-xs flex" />
            </button>
          </div>
        )}

        {/* Image Inline Dialog */}
        {openPanel === 'image' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-sky-50 dark:bg-sky-950/30 border-t border-zinc-200 dark:border-slate-700">
            <i className="fi fi-sr-picture text-sky-500 text-sm flex shrink-0" />
            <input
              type="url"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); applyImage(); }
                if (e.key === 'Escape') setOpenPanel('none');
              }}
              placeholder="https://example.com/image.jpg"
              autoFocus
              className="flex-1 text-sm bg-transparent text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={applyImage}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-sky-500 hover:bg-sky-600 text-white transition-colors"
            >
              แทรก
            </button>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); setOpenPanel('none'); }}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
            >
              <i className="fi fi-sr-cross text-xs flex" />
            </button>
          </div>
        )}
          </>
        )}
      </div>

      {/* WYSIWYG Editor Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncHidden}
        onBlur={syncHidden}
        onKeyUp={updateFormats}
        onMouseUp={updateFormats}
        data-placeholder={placeholder}
        className={`min-h-[240px] max-h-[600px] overflow-y-auto px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400 dark:empty:before:text-zinc-500 ${viewMode === 'html' ? 'hidden' : ''}`}
      />

      {/* HTML Source Editor */}
      <textarea
        ref={htmlCodeRef}
        onChange={e => {
          if (hiddenRef.current) hiddenRef.current.value = e.target.value;
        }}
        spellCheck={false}
        className={`w-full min-h-[240px] max-h-[600px] overflow-y-auto px-4 py-3 text-sm font-mono text-zinc-900 dark:text-zinc-100 bg-white dark:bg-slate-900 focus:outline-none resize-none ${viewMode === 'wysiwyg' ? 'hidden' : ''}`}
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
