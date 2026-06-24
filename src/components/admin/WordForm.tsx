'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminSession } from './AdminSessionProvider';
import { useToast } from './ToastProvider';

interface WordFormProps {
  action: (formData: FormData) => Promise<void | { error?: string }>;
  initialData?: {
    word: string;
    level: string;
    wordClass?: string;
    ipa?: string;
    ipaUs?: string;
    ipaUk?: string;
    stress?: number[];
    syllables?: string[];
    phonemes?: string[];
    definition?: string;
    example?: string;
    wordFamily?: string[];
    synonyms?: string[];
    collocations?: string[];
    spellingDistractors?: string[];
    tags?: string[];
    published?: boolean;
  };
  isEdit?: boolean;
}

export default function WordForm({ action, initialData, isEdit }: WordFormProps) {
  const router = useRouter();
  const { onAuthError } = useAdminSession();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const result = await action(formData);
      if (result?.error) {
        if (result.error.includes('[401]')) {
          onAuthError();
          return;
        }
        setError(result.error);
        showToast(result.error, 'error');
      } else {
        showToast(isEdit ? 'อัปเดตคำศัพท์สำเร็จ' : 'สร้างคำศัพท์สำเร็จ');
        setTimeout(() => router.push('/admin/words'), 500);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดที่ไม่คาดคิด';
      setError(message);
      showToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatArray = (arr?: string[] | number[]): string => {
    if (!arr || arr.length === 0) return '';
    return arr.map(String).join(', ');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 border border-red-200">{error}</div>
      )}

      {/* Basic Info */}
      <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
          ข้อมูลพื้นฐาน (Basic Info)
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="word" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              คำศัพท์ (Word) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="word"
              id="word"
              defaultValue={initialData?.word}
              required
              placeholder="hello"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="level" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ระดับ (Level) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                name="level"
                id="level"
                defaultValue={initialData?.level || 'a1'}
                required
                className="appearance-none w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="a1">A1</option>
                <option value="a2">A2</option>
                <option value="b1">B1</option>
                <option value="b2">B2</option>
                <option value="c1">C1</option>
                <option value="c2">C2</option>
              </select>
              <i
                aria-hidden="true"
                className="fi fi-sr-angle-small-down absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="wordClass"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              ประเภทคำ (Word Class)
            </label>
            <input
              type="text"
              name="wordClass"
              id="wordClass"
              defaultValue={initialData?.wordClass}
              placeholder="noun, verb, adjective"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none pt-6">
              <input
                type="checkbox"
                name="published"
                defaultChecked={initialData?.published !== false}
                className="w-4 h-4 rounded accent-blue-500"
              />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Public</span>
            </label>
          </div>
        </div>
      </div>

      {/* Pronunciation */}
      <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
          การออกเสียง (Pronunciation)
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label htmlFor="ipa" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              IPA
            </label>
            <input
              type="text"
              name="ipa"
              id="ipa"
              defaultValue={initialData?.ipa}
              placeholder="/ˈhɛloʊ/"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ipaUs" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              IPA (US)
            </label>
            <input
              type="text"
              name="ipaUs"
              id="ipaUs"
              defaultValue={initialData?.ipaUs}
              placeholder="/ˈhɛloʊ/"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ipaUk" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              IPA (UK)
            </label>
            <input
              type="text"
              name="ipaUk"
              id="ipaUk"
              defaultValue={initialData?.ipaUk}
              placeholder="/həˈləʊ/"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label
              htmlFor="stress"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Stress (comma-separated)
            </label>
            <input
              type="text"
              name="stress"
              id="stress"
              defaultValue={formatArray(initialData?.stress)}
              placeholder="1, 0"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="syllables"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Syllables (comma-separated)
            </label>
            <input
              type="text"
              name="syllables"
              id="syllables"
              defaultValue={formatArray(initialData?.syllables)}
              placeholder="hel, lo"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phonemes"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Phonemes (comma-separated)
            </label>
            <input
              type="text"
              name="phonemes"
              id="phonemes"
              defaultValue={formatArray(initialData?.phonemes)}
              placeholder="h, eh, l, ow"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* Definition */}
      <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
          ความหมาย (Definition)
        </h3>

        <div className="space-y-2">
          <label
            htmlFor="definition"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            คำจำกัดความ (Definition)
          </label>
          <textarea
            name="definition"
            id="definition"
            defaultValue={initialData?.definition}
            rows={3}
            placeholder="Used as a greeting or to begin a conversation"
            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="example" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ตัวอย่างประโยค (Example)
          </label>
          <textarea
            name="example"
            id="example"
            defaultValue={initialData?.example}
            rows={2}
            placeholder="Hello, how are you today?"
            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Related Words */}
      <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-4">
          คำที่เกี่ยวข้อง (Related)
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor="wordFamily"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Word Family (comma-separated)
            </label>
            <input
              type="text"
              name="wordFamily"
              id="wordFamily"
              defaultValue={formatArray(initialData?.wordFamily)}
              placeholder="hello, helloed"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="synonyms"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Synonyms (comma-separated)
            </label>
            <input
              type="text"
              name="synonyms"
              id="synonyms"
              defaultValue={formatArray(initialData?.synonyms)}
              placeholder="hi, greetings"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="collocations"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Collocations (comma-separated)
            </label>
            <input
              type="text"
              name="collocations"
              id="collocations"
              defaultValue={formatArray(initialData?.collocations)}
              placeholder="say hello, hello world"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="spellingDistractors"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Spelling Distractors (comma-separated)
            </label>
            <input
              type="text"
              name="spellingDistractors"
              id="spellingDistractors"
              defaultValue={formatArray(initialData?.spellingDistractors)}
              placeholder="helo, helloo"
              className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="tags" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            name="tags"
            id="tags"
            defaultValue={formatArray(initialData?.tags)}
            placeholder="greeting, common"
            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? 'กำลังบันทึก...' : isEdit ? 'อัปเดตคำศัพท์' : 'สร้างคำศัพท์'}
      </button>
    </form>
  );
}
