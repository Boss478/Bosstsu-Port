import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = 'https://srv1676702.hstgr.cloud';

// Reads src/data/lawlib/index.json via node fs (same pattern as the LawLib
// pages): absent/unreadable → no LawLib detail URLs, never a build failure.
// 'sample' is a LOCAL PREVIEW FIXTURE — it must never appear in the sitemap.
function readLawlibSlugs(): string[] {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'src/data/lawlib/index.json'), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item): string | null => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'slug' in item) {
          return String((item as { slug: unknown }).slug);
        }
        return null;
      })
      .filter((slug): slug is string => slug !== null && slug !== 'sample');
  } catch {
    return [];
  }
}

export default async function sitemap() {
  const staticRoutes = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 1.0 },
    {
      url: `${BASE_URL}/portfolio`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/games`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/lawlib`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/lawlib/digest`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ];

  const lawlibRoutes = readLawlibSlugs().map((slug) => ({
    url: `${BASE_URL}/lawlib/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...lawlibRoutes];
}
