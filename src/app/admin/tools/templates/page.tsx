import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import { getTemplates } from '../actions';
import ToolTemplatesClient from '@/components/admin/ToolTemplatesClient';

export const dynamic = 'force-dynamic';

export default async function ToolTemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 pt-28 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        <Breadcrumb items={[
          { label: 'Backend', href: '/admin' },
          { label: 'Tools', href: '/admin/tools' },
          { label: 'Step Templates' },
        ]} />

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <i className="fi fi-sr-template text-blue-500" />
            Step Templates
          </h1>
          <Link
            href="/admin/tools"
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-zinc-700 dark:text-zinc-300 font-medium rounded-xl border border-zinc-200 dark:border-slate-700 transition-all"
          >
            <i className="fi fi-sr-arrow-left text-sm" />
            Back to Tools
          </Link>
        </div>

        <ToolTemplatesClient templates={templates} />
      </div>
    </div>
  );
}
