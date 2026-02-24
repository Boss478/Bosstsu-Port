import Breadcrumb from '@/components/Breadcrumb';
import LearningForm from '@/components/admin/LearningForm';
import { createLearningResource } from '../actions';
import { getTagsByCategory } from '@/app/actions/tags';

export default async function NewLearningPage() {
  const availableTags = await getTagsByCategory('learning');

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Backend', href: '/admin' },
            { label: 'Learning', href: '/admin/learning' },
            { label: 'New Resource' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <i className="fi fi-sr-plus text-sky-500" />
            เพิ่มสื่อใหม่ (New Resource)
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            เพิ่มสื่อการเรียนรู้ใหม่ลงในระบบ
          </p>
        </div>

        <LearningForm action={createLearningResource} availableTags={availableTags} />
      </div>
    </div>
  );
}
