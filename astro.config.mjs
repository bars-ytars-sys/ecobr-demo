// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://ecobr.ru',
  // BASE_PATH задаётся в CI для GitHub Pages (/ecobr-demo); локально и на проде — корень
  base: process.env.BASE_PATH ?? '/',
  // Тильда отдаёт адреса без слэша — сохраняем формат 1:1, чтобы не терять SEO
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'always' },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  image: { layout: 'constrained', responsiveStyles: true, service: { entrypoint: 'astro/assets/services/sharp', config: { avif: { quality: 68 }, webp: { quality: 82 } } } },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Cormorant',
      cssVariable: '--font-cormorant',
      // optional + preload: без прыжка крупных заголовков при подмене шрифта (CLS)
      display: 'optional',
      weights: ['400', '500'],
      styles: ['normal', 'italic'],
      subsets: ['cyrillic', 'latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Manrope',
      cssVariable: '--font-manrope',
      weights: ['400', '500', '600'],
      subsets: ['cyrillic', 'latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
