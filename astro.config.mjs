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
      // Фирменный шрифт заголовков ecobr.ru (тот же файл, что на Тильде)
      provider: fontProviders.local(),
      name: "DespairDisplay",
      cssVariable: "--font-despair",
      fallbacks: ["Arial", "sans-serif"],
      options: { variants: [{ src: ["./src/assets/fonts/DespairDisplay-Bold.woff"], weight: "700", style: "normal" }] },
    },
    {
      // TildaSans доступен только на Тильде — ближайшая открытая замена
      provider: fontProviders.google(),
      name: "Manrope",
      cssVariable: "--font-manrope",
      weights: ["400", "500", "600", "700"],
      subsets: ["cyrillic", "latin"],
      fallbacks: ["Arial", "sans-serif"],
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
