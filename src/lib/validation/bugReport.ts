import { z } from 'zod';

export const bugReportSchema = z.object({
  description: z.string().trim().min(1, 'Beskrivelse er påkrævet').max(2000, 'Beskrivelsen er for lang'),
  reporterName: z
    .string()
    .trim()
    .max(120, 'Navnet er for langt')
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type BugReportInput = z.infer<typeof bugReportSchema>;

export const bugReportStatusSchema = z.object({
  status: z.enum(['new', 'resolved']),
});

/** Maks. antal billeder pr. fejlrapport, for at holde uploads og lagerplads i skak. */
export const MAX_BUG_REPORT_PHOTOS = 5;
