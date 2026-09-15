import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { site } from '../data/site';

// Чистый sitemap: только реальные страницы, без /head, /footer, дублей *-1 (они были в sitemap Тильды)
export const GET: APIRoute = async () => {
  const houses = await getCollection('houses');
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/doma', priority: '0.9', changefreq: 'weekly' },
    ...houses.map((h) => ({ loc: `/doma/${h.id}`, priority: '0.8', changefreq: 'monthly' })),
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${site.url}${u.loc === '/' ? '/' : u.loc}</loc><lastmod>${today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
