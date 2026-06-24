import { notFound } from 'next/navigation';
import dbConnect, { serializeDoc } from '@/lib/db';
import WordOverride from '@/models/Word';
import Breadcrumb from '@/components/Breadcrumb';
import WordForm from '@/components/admin/WordForm';
import { upsertWordOverride } from '../actions';

export const dynamic = 'force-dynamic';

export default async function EditWordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await dbConnect();

  let item = null;
  try {
    item = await WordOverride.findById(id).lean();
  } catch {}

  if (!item) notFound();

  const action = upsertWordOverride;

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Backend', href: '/admin' },
          { label: 'Words', href: '/admin/words' },
          { label: 'Edit Word' },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <i aria-hidden="true" className="fi fi-sr-pencil text-blue-500" />
          แก้ไขคำศัพท์ (Edit Word)
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{item.word}</p>
      </div>

      <WordForm action={action} initialData={serializeDoc(item)} isEdit />
    </div>
  );
}
