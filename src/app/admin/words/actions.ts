'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import WordOverride from '@/models/Word';
import { parseNumberArray } from '@/lib/validation';
import { parseTagString as parseWordArray } from '@/lib/format';
import { ROUTES } from '@/lib/routes';
import { withAuth, handleDbError } from '@/lib/admin-crud';
import { WORDS } from '@/app/(website)/games/phonics/words';
import type { WordData } from '@/app/(website)/games/phonics/types';

export interface StaticWordResult {
  words: WordData[];
  total: number;
  page: number;
  totalPages: number;
  overrideMap: Record<string, string>;
}

export async function searchStaticWords(
  q: string,
  page = 1,
  limit = 50,
): Promise<StaticWordResult> {
  const query = q.toLowerCase();
  const filtered = WORDS.filter(
    (w) =>
      w.word.toLowerCase().includes(query) ||
      (w.definition || '').toLowerCase().includes(query) ||
      (w.ipa || '').toLowerCase().includes(query) ||
      w.level.toLowerCase().includes(query),
  );

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const words = filtered.slice(start, start + limit);

  await dbConnect();
  const overrides = (await WordOverride.find({}).select('slug').lean()) as unknown as {
    slug: string;
    _id: { toString: () => string };
  }[];
  const overrideMap: Record<string, string> = {};
  for (const ov of overrides) {
    overrideMap[ov.slug] = ov._id.toString();
  }

  return { words, total, page, totalPages, overrideMap };
}

const wordSchema = z
  .object({
    word: z.string().trim().min(1, 'กรุณาระบุคำศัพท์'),
    level: z.enum(['a1', 'a2', 'b1', 'b2', 'c1', 'c2']),
    wordClass: z.string().optional(),
    ipa: z.string().optional(),
    ipaUs: z.string().optional(),
    ipaUk: z.string().optional(),
    stress: z.string().optional(),
    syllables: z.string().optional(),
    phonemes: z.string().optional(),
    definition: z.string().optional(),
    example: z.string().optional(),
    wordFamily: z.string().optional(),
    synonyms: z.string().optional(),
    collocations: z.string().optional(),
    spellingDistractors: z.string().optional(),
    tags: z.string().optional(),
  })
  .strict();

const ADMIN = ROUTES.ADMIN.WORDS;

function makeSlug(word: string, level: string): string {
  return `${word.toLowerCase().replace(/\s+/g, '-')}-${level}`;
}

export async function upsertWordOverride(formData: FormData) {
  return withAuth(async () => {
    const parsed = wordSchema.safeParse({
      word: formData.get('word'),
      level: formData.get('level'),
      wordClass: formData.get('wordClass') || undefined,
      ipa: formData.get('ipa') || undefined,
      ipaUs: formData.get('ipaUs') || undefined,
      ipaUk: formData.get('ipaUk') || undefined,
      stress: formData.get('stress') || undefined,
      syllables: formData.get('syllables') || undefined,
      phonemes: formData.get('phonemes') || undefined,
      definition: formData.get('definition') || undefined,
      example: formData.get('example') || undefined,
      wordFamily: formData.get('wordFamily') || undefined,
      synonyms: formData.get('synonyms') || undefined,
      collocations: formData.get('collocations') || undefined,
      spellingDistractors: formData.get('spellingDistractors') || undefined,
      tags: formData.get('tags') || undefined,
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const {
      word,
      level,
      stress,
      syllables,
      phonemes,
      wordFamily,
      synonyms,
      collocations,
      spellingDistractors,
      tags,
      ...rest
    } = parsed.data;
    const slug = makeSlug(word, level);
    const published = formData.get('published') === 'on';

    try {
      await dbConnect();
      await WordOverride.findOneAndUpdate(
        { slug },
        {
          $set: {
            word,
            level,
            slug,
            ...rest,
            stress: parseNumberArray(stress),
            syllables: parseWordArray(syllables),
            phonemes: parseWordArray(phonemes),
            wordFamily: parseWordArray(wordFamily),
            synonyms: parseWordArray(synonyms),
            collocations: parseWordArray(collocations),
            spellingDistractors: parseWordArray(spellingDistractors),
            tags: parseWordArray(tags),
            published,
          },
        },
        { upsert: true },
      );
    } catch (error: unknown) {
      return handleDbError(error, 'Upsert word override', 'DB01');
    }
    revalidatePath(ADMIN);
    return { error: undefined };
  });
}

export async function toggleWordPublished(slug: string) {
  return withAuth(async () => {
    try {
      await dbConnect();
      const existing = await WordOverride.findOne({ slug }).select('published').lean();
      if (existing) {
        await WordOverride.findOneAndUpdate({ slug }, { $set: { published: !existing.published } });
      } else {
        const parts = slug.match(/^(.+)-([a-c]\d)$/);
        if (!parts) return { error: 'Invalid slug format' };
        await WordOverride.create({
          slug,
          word: parts[1].replace(/-/g, ' '),
          level: parts[2] as 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2',
          published: false,
        });
      }
    } catch (error: unknown) {
      return handleDbError(error, 'Toggle word published', 'DB02');
    }
    revalidatePath(ADMIN);
    return { error: undefined };
  });
}

export async function deleteWordOverride(id: string) {
  return withAuth(async () => {
    try {
      await dbConnect();
      await WordOverride.findByIdAndDelete(id);
    } catch (error: unknown) {
      return handleDbError(error, 'Delete word override', 'DB03');
    }
    revalidatePath(ADMIN);
    return { error: undefined };
  });
}
