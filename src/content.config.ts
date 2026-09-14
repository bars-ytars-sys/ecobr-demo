import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const houses = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/houses' }),
  schema: ({ image }) =>
    z.object({
      // SEO: title и description обязательны; description вне 70–160 символов — сборка падает
      title: z.string().min(20).max(70),
      description: z.string().min(70).max(160),
      name: z.string(),
      type: z.enum(['aframe', 'sfera', 'panorama', 'barnhouse', 'house', 'chalet', 'baus']),
      tagline: z.string(),
      lead: z.string().min(40),
      capacity: z.number().int().min(1).max(12),
      banya: z.boolean(),
      chan: z.boolean(),
      badge: z.string().optional(),
      scenarios: z.array(z.enum(['pair', 'family', 'company'])).min(1),
      price: z.object({
        weekday: z.number().int().positive(),
        weekend: z.number().int().positive(),
      }),
      priceNotes: z.array(z.string()).min(1),
      cover: image(),
      gallery: z.array(image()).min(6),
      order: z.number().int(),
    }),
});

export const collections = { houses };
