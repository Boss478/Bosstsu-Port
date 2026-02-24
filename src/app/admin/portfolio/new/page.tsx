import Breadcrumb from '@/components/Breadcrumb';
import PortfolioForm from '@/components/admin/PortfolioForm';
import { createPortfolioItem } from '../actions';
import { getTagsByCategory } from '@/app/actions/tags';

export default async function NewPortfolioPage() {
  const [availableTags, availableTools] = await Promise.all([
    getTagsByCategory('portfolio'),
    getTagsByCategory('tools'),
  ]);

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-slate-950 pt-28 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Backend', href: '/admin' },
            { label: 'Portfolio', href: '/admin/portfolio' },
            { label: 'New Project' },
          ]}
        />

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <i className="fi fi-sr-plus text-sky-500" />
            สร้างผลงานใหม่ (New Project)
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2">
            เพิ่มข้อมูลผลงานใหม่ลงในระบบ
          </p>
        </div>

        <PortfolioForm
          action={createPortfolioItem}
          availableTags={availableTags}
          availableTools={availableTools}
        />
      </div>
    </div>
  );
}
