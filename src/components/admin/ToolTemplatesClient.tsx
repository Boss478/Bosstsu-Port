'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTemplate } from '@/app/admin/tools/actions';

const TOOL_TYPE_LABELS: Record<string, string> = {
  padlet: 'Padlet (Idea Board)',
  poll: 'Poll',
  assignment: 'Assignment',
  qa_board: 'Q&A Board',
  quiz: 'Quick Quiz',
  exit_ticket: 'Exit Ticket',
  discussion: 'Discussion',
};

const TOOL_TYPE_ICONS: Record<string, string> = {
  padlet: 'fi-sr-grid',
  poll: 'fi-sr-chart-pie',
  assignment: 'fi-sr-file-upload',
  qa_board: 'fi-sr-interrogation',
  quiz: 'fi-sr-graduation-cap',
  exit_ticket: 'fi-sr-ticket',
  discussion: 'fi-sr-comments',
};

interface Template {
  _id: string;
  type: string;
  title: string;
  config: Record<string, unknown>;
  updatedAt: string;
}

export default function ToolTemplatesClient({ templates }: { templates: Template[] }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const filtered = templates.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('ลบแม่แบบนี้?')) return;
    setDeleting(id);
    const formData = new FormData();
    formData.set('id', id);
    await deleteTemplate(formData);
    setDeleting(null);
    router.refresh();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาแม่แบบ..."
          className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm w-64 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-400"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="">All Types</option>
          {Object.entries(TOOL_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-600 dark:text-zinc-400">
          <i className="fi fi-sr-template text-5xl block mb-4 opacity-30" />
          <p>ยังไม่มีแม่แบบ</p>
          <p className="text-sm mt-1">สร้างแม่แบบได้จากหน้า Quick Start เมื่อสร้าง Multi-Step Session</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((t) => (
          <div
            key={t._id}
            className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-white/60 dark:border-slate-700/50 shadow-sm p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <i className={`fi ${TOOL_TYPE_ICONS[t.type] || 'fi-sr-template'} text-blue-500 text-lg`} />
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{t.title}</p>
                  <p className="text-xs text-zinc-500">{TOOL_TYPE_LABELS[t.type] || t.type}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(t._id)}
                disabled={deleting === t._id}
                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <i className={`fi ${deleting === t._id ? 'fi-sr-spinner animate-spin' : 'fi-sr-trash'}`} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
