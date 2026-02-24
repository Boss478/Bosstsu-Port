import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Learning from '@/models/Learning';
import Breadcrumb from '@/components/Breadcrumb';
import LearningForm from '@/components/admin/LearningForm';
import { updateLearningResource } from '../actions';
import { getTagsByCategory } from '@/app/actions/tags';

export default async function EditLearningPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  await dbConnect();

  let item = null;
  try {
    item = await Learning.findById(id).lean();
  } catch { }

  if (!item) notFound();

  const availableTags = await getTagsByCategory('learning');
  const updateAction = updateLearningResource.bind(null, id);
  const serializableItem = JSON.parse(JSON.stringify(item));

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Backend', href: '/admin' },
            { label: 'Learning', href: '/admin/learning' },
            { label: 'Edit Resource' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <i className="fi fi-sr-pencil text-sky-500" />
            แก้ไขสื่อ (Edit Resource)
          </h1>
          <p className="text-zinc-500 text-sm mt-1">{serializableItem.title}</p>
        </div>

        <LearningForm
          action={updateAction}
          initialData={serializableItem}
          isEdit
          availableTags={availableTags}
        />
      </div>
    </div>
  );
}
