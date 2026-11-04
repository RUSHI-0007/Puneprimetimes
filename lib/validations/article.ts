import { z } from 'zod';

export const articleSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(250, 'Title cannot exceed 250 characters'),
  slug: z
    .string()
    .min(3, 'Slug must be at least 3 characters')
    .max(250, 'Slug cannot exceed 250 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ),
  excerpt: z
    .string()
    .max(600, 'Excerpt cannot exceed 600 characters')
    .optional()
    .nullable(),
  content: z.record(z.any()).or(z.array(z.any())),
  cover_image_url: z.string().url('Invalid cover image URL').optional().nullable().or(z.literal('')),
  category_id: z.string().uuid('Invalid category ID').optional().nullable().or(z.literal('')),
  status: z.enum(['draft', 'published']),
  is_featured: z.boolean().default(false),
  is_breaking: z.boolean().default(false),
  published_at: z.string().datetime().optional().nullable(),
});

export const categorySchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(60, 'Slug cannot exceed 60 characters')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Slug can only contain lowercase letters, numbers, and hyphens'
    ),
});

export type ArticleFormValues = z.infer<typeof articleSchema>;
export type CategoryFormValues = z.infer<typeof categorySchema>;

