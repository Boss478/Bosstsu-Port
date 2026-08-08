import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { formatError } from '@/lib/error-code';
import DOMPurify from 'isomorphic-dompurify';
import type { Model } from 'mongoose';

export async function withAuth<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };
  return fn();
}

export function handleDbError(error: unknown, _context: string, code: string): { error: string } {
  const msg = error instanceof Error ? error.message : '';
  if (msg.includes('ERROR_U05') || msg.includes('ERROR_U06') || msg.includes('ERROR_U07')) {
    return { error: msg };
  }
  return { error: formatError(code) };
}

export function sanitizeHtml(html?: string): string {
  return html ? DOMPurify.sanitize(html) : '';
}

export function revalidateContentPaths(adminPath: string, publicPath: string): void {
  revalidatePath(adminPath);
  revalidatePath(publicPath);
}

export function createTogglePublished<T>(Model: Model<T>, adminPath: string, publicPath: string) {
  return async function togglePublished(id: string) {
    return withAuth(async () => {
      try {
        await dbConnect();
        const item = await Model.findById(id).select('_id published').lean();
        if (!item) return { error: formatError('404') };
        await Model.findByIdAndUpdate(id, {
          published: !(item as unknown as Record<string, unknown>).published,
        });
      } catch (error: unknown) {
        return handleDbError(error, 'Toggle published', 'DB02');
      }
      revalidateContentPaths(adminPath, publicPath);
      return { error: undefined };
    });
  };
}

export function createDeleteItem<T>(Model: Model<T>, adminPath: string, publicPath: string) {
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

export interface ListParams {
  page: number;
  limit: number;
  skip: number;
  search: string;
  sortParam: string;
  sortQuery: Record<string, 1 | -1>;
  buildPaginationQuery: (
    newPage: number,
    extra?: Record<string, string>,
  ) => Record<string, string | number>;
}

export async function parseListParams(
  searchParams:
    | Promise<{ [key: string]: string | string[] | undefined }>
    | { [key: string]: string | string[] | undefined },
  defaults?: { sort?: string; limit?: number },
): Promise<ListParams> {
  const resolved = searchParams instanceof Promise ? await searchParams : searchParams;
  const page = typeof resolved.page === 'string' ? Math.max(1, parseInt(resolved.page)) : 1;
  const limit =
    typeof resolved.limit === 'string'
      ? Math.min(parseInt(resolved.limit), 250)
      : (defaults?.limit ?? 20);
  const skip = (page - 1) * limit;
  const search = typeof resolved.q === 'string' ? resolved.q : '';
  const sortParam =
    typeof resolved.sort === 'string' ? resolved.sort : (defaults?.sort ?? 'latest');

  let sortQuery: Record<string, 1 | -1> = { date: -1 };
  if (sortParam === 'oldest') sortQuery = { date: 1 };
  if (sortParam === 'name_asc') sortQuery = { title: 1 };
  if (sortParam === 'name_desc') sortQuery = { title: -1 };

  function buildPaginationQuery(
    newPage: number,
    extra?: Record<string, string>,
  ): Record<string, string | number> {
    const params: Record<string, string | number> = { page: newPage };
    if (resolved.q && typeof resolved.q === 'string') params.q = resolved.q;
    if (resolved.sort && typeof resolved.sort === 'string') params.sort = resolved.sort;
    if (resolved.limit && typeof resolved.limit === 'string')
      params.limit = parseInt(resolved.limit);
    if (extra) Object.assign(params, extra);
    return params;
  }

  return { page, limit, skip, search, sortParam, sortQuery, buildPaginationQuery };
}
