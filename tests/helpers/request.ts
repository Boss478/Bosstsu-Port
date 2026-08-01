import { NextRequest } from 'next/server';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
  searchParams?: Record<string, string>;
}

export function createRequest(url: string, opts: RequestOptions = {}): NextRequest {
  const { method = 'GET', headers = {}, body, searchParams } = opts;

  const baseUrl = url.startsWith('http') ? url : `http://localhost:3300${url}`;

  let fullUrl = baseUrl;
  if (searchParams) {
    const u = new URL(fullUrl);
    for (const [k, v] of Object.entries(searchParams)) {
      u.searchParams.set(k, v);
    }
    fullUrl = u.toString();
  }

  const init: RequestInit = { method, headers: { ...headers } };

  if (body !== undefined && method !== 'GET') {
    if (body instanceof FormData) {
      init.body = body;
    } else {
      init.body = JSON.stringify(body);
      if (!headers['content-type']) {
        (init.headers as Record<string, string>)['content-type'] = 'application/json';
      }
    }
  }

  return new NextRequest(fullUrl, init);
}

export function createGetRequest(
  url: string,
  opts: { headers?: Record<string, string>; searchParams?: Record<string, string> } = {},
) {
  return createRequest(url, { method: 'GET', ...opts });
}

export function createPostRequest(
  url: string,
  opts: {
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
) {
  return createRequest(url, { method: 'POST', ...opts });
}

export function createPatchRequest(
  url: string,
  opts: {
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
) {
  return createRequest(url, { method: 'PATCH', ...opts });
}

export function createDeleteRequest(
  url: string,
  opts: {
    body?: unknown;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {},
) {
  return createRequest(url, { method: 'DELETE', ...opts });
}

export function createMultipartRequest(
  url: string,
  formData: FormData,
  opts: { method?: string; headers?: Record<string, string> } = {},
) {
  return createRequest(url, {
    method: opts.method || 'POST',
    body: formData,
    headers: opts.headers,
  });
}
