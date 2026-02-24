import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Gallery from '@/models/Gallery';
import Portfolio from '@/models/Portfolio';
import Breadcrumb from '@/components/Breadcrumb';
import GalleryForm from '@/components/admin/GalleryForm';
import { updateGalleryAlbum } from '../actions';
import { getTagsByCategory } from '@/app/actions/tags';

export default async function EditGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  await dbConnect();

  let item = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let portfolios: any[] = [];
  try {
    item = await Gallery.findById(id).lean();
    portfolios = await Portfolio.find().sort({ date: -1 }).select('_id title').lean();
  } catch { }

  if (!item) notFound();

  const availableTags = await getTagsByCategory('gallery');
  const updateAction = updateGalleryAlbum.bind(null, id);
  const serializableItem = JSON.parse(JSON.stringify(item));
  const serializablePortfolios = JSON.parse(JSON.stringify(portfolios));

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Backend', href: '/admin' },
          { label: 'Gallery', href: '/admin/gallery' },
          { label: 'Edit Album' },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <i className="fi fi-sr-pencil text-sky-500" />
          แก้ไขอัลบั้ม (Edit Album)
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{serializableItem.title}</p>
      </div>

      <GalleryForm 
        action={updateAction} 
        initialData={serializableItem} 
        portfolios={serializablePortfolios}
        isEdit
        availableTags={availableTags}
      />
    </div>
  );
}
