import { z } from 'zod';

export const galleryCategorySchema = z.object({
  name: z.string().trim().min(1, 'Navn er påkrævet').max(60, 'Navnet er for langt'),
});

export type GalleryCategoryInput = z.infer<typeof galleryCategorySchema>;

export const galleryCategoryPatchSchema = z
  .object({
    name: galleryCategorySchema.shape.name.optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => data.name !== undefined || data.sortOrder !== undefined, {
    message: 'Intet at opdatere.',
  });

export const galleryPhotoPatchSchema = z
  .object({
    categoryId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((data) => data.categoryId !== undefined || data.sortOrder !== undefined, {
    message: 'Intet at opdatere.',
  });
