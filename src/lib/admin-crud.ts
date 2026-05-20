import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { formatError } from '@/lib/error-code';
import DOMPurify from 'isomorphic-dompurify';
import type { Model } from 'mongoose';

export async function withAuth<T>(
  fn: () => Promise<T>
): Promise<T | { error: string }> {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };
  return fn();
}

export function handleDbError(
  error: unknown,
  _context: string,
  code: string
): { error: string } {
  const msg = error instanceof Error ? error.message : '';
  if (msg.includes('ERROR_U05') || msg.includes('ERROR_U06') || msg.includes('ERROR_U07')) {
    return { error: msg };
  }
  return { error: formatError(code) };
}

export function sanitizeHtml(html?: string): string {
  return html ? DOMPurify.sanitize(html) : '';
}

export function revalidateContentPaths(
  adminPath: string,
  publicPath: string
): void {
  revalidatePath(adminPath);
  revalidatePath(publicPath);
}

export function createTogglePublished(
  Model: Model<unknown>,
  adminPath: string,
  publicPath: string
) {
  return async function togglePublished(id: string) {
    return withAuth(async () => {
      try {
        await dbConnect();
        const item = await Model.findById(id).select('_id published');
        if (!item) return { error: formatError('404') };
        await Model.findByIdAndUpdate(id, { published: !(item as Record<string, unknown>).published });
      } catch (error: unknown) {
        return handleDbError(error, 'Toggle published', 'DB02');
      }
      revalidateContentPaths(adminPath, publicPath);
      return { error: undefined };
    });
  };
}

export function createDeleteItem(
  Model: Model<unknown>,
  adminPath: string,
  publicPath: string
) {
  return async function deleteItem(id: string) {
    return withAuth(async () => {
      try {
        await dbConnect();
        await Model.findByIdAndDelete(id);
      } catch (error: unknown) {
        return handleDbError(error, 'Delete item', 'DB03');
      }
      revalidateContentPaths(adminPath, publicPath);
      return { error: undefined };
    });
  };
}
