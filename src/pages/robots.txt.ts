import type { APIRoute } from 'astro';
import { site } from '../data/site';

// Демо целиком закрыто. Прод-версия ниже закомментирована: Clean-param для Яндекса убирает дубли с utm/ysclid
export const GET: APIRoute = () =>
  new Response(
    `# ДЕМО: закрыто от индексации
User-agent: *
Disallow: /

# ПРОД (ecobr.ru):
# User-agent: *
# Disallow: /*?*utm_
# Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&ysclid&yclid&gclid
# Sitemap: ${site.url}/sitemap.xml
`,
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
