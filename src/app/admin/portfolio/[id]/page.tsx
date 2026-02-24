import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import Breadcrumb from '@/components/Breadcrumb';
import PortfolioForm from '@/components/admin/PortfolioForm';
import { updatePortfolioItem } from '../actions';
import { getTagsByCategory } from '@/app/actions/tags';

export default async function EditPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  await dbConnect();
  
  let item = null;
  try {
     item = await Portfolio.findById(id).lean();
  } catch {
     // Ignore invalid ID error, item remains null
  }

  if (!item) {
    notFound();
  }

  const [availableTags, availableTools] = await Promise.all([
    getTagsByCategory('portfolio'),
    getTagsByCategory('tools'),
  ]);

  const updateAction = updatePortfolioItem.bind(null, id);
  const serializableItem = JSON.parse(JSON.stringify(item));

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Backend', href: '/admin' },
            { label: 'Portfolio', href: '/admin/portfolio' },
            { label: 'Edit Project' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <i className="fi fi-sr-pencil text-sky-500" />
            แก้ไขผลงาน (Edit Project)
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            กำลังแก้ไข: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{serializableItem.title}</span>
          </p>
        </div>

        <PortfolioForm 
          action={updateAction} 
          initialData={serializableItem} 
          isEdit
          availableTags={availableTags}
          availableTools={availableTools}
        />
      </div>
    </div>
  );
}
