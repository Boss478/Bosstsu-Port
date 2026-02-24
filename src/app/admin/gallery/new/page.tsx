import Breadcrumb from '@/components/Breadcrumb';
import GalleryForm from '@/components/admin/GalleryForm';
import { createGalleryAlbum } from '../actions';
import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import { getTagsByCategory } from '@/app/actions/tags';

export default async function NewGalleryPage() {
  await dbConnect();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let portfolios: any[] = [];
  try {
    portfolios = await Portfolio.find().sort({ date: -1 }).select('_id title').lean();
  } catch (error) {
    console.error('Failed to fetch portfolios for gallery form:', error);
  }
  const serializablePortfolios = JSON.parse(JSON.stringify(portfolios));
  const availableTags = await getTagsByCategory('gallery');

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Backend', href: '/admin' },
          { label: 'Gallery', href: '/admin/gallery' },
          { label: 'New Album' },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <i className="fi fi-sr-plus text-sky-500" />
          สร้างอัลบั้มใหม่ (New Album)
        </h1>
      </div>

      <GalleryForm
        action={createGalleryAlbum}
        portfolios={serializablePortfolios}
        availableTags={availableTags}
      />
    </div>
  );
}
