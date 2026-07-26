import { z } from 'zod';

export const checklistItemSchema = z.object({
  text: z.string().trim().min(1, 'Tekst er påkrævet').max(300, 'Teksten er for lang'),
});

export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;

export const faqItemSchema = z.object({
  question: z.string().trim().min(1, 'Spørgsmål er påkrævet').max(200, 'Spørgsmålet er for langt'),
  answer: z.string().trim().min(1, 'Svar er påkrævet').max(2000, 'Svaret er for langt'),
});

export type FaqItemInput = z.infer<typeof faqItemSchema>;

export const reorderSchema = z.object({
  sortOrder: z.number().int(),
});

export const apartmentInfoSchema = z.object({
  text: z.string().max(5000, 'Teksten er for lang').transform((v) => v.trim()),
});
