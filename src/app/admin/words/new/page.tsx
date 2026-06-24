import Breadcrumb from '@/components/Breadcrumb';
import WordForm from '@/components/admin/WordForm';
import { upsertWordOverride } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewWordPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const initialData =
    typeof sp.word === 'string' && sp.word
      ? {
          word: sp.word,
          level: typeof sp.level === 'string' ? sp.level : 'a1',
          wordClass: typeof sp.wordClass === 'string' ? sp.wordClass : '',
          ipa: typeof sp.ipa === 'string' ? sp.ipa : '',
          definition: typeof sp.definition === 'string' ? sp.definition : '',
          example: typeof sp.example === 'string' ? sp.example : '',
        }
      : undefined;

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: 'Backend', href: '/admin' },
          { label: 'Words', href: '/admin/words' },
          { label: initialData ? `New: ${initialData.word}` : 'New Word' },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
          <i aria-hidden="true" className="fi fi-sr-plus text-blue-500" />
          {initialData
            ? `เพิ่มคำว่า "${initialData.word}" (Add Word)`
            : 'สร้างคำศัพท์ใหม่ (New Word)'}
        </h1>
      </div>

      <WordForm action={upsertWordOverride} initialData={initialData} />
    </div>
  );
}
