import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dato skal have formatet ÅÅÅÅ-MM-DD');

export const bookingRequestSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Navn er påkrævet')
      .max(120, 'Navn er for langt'),
    startDate: dateSchema,
    endDate: dateSchema,
    note: z
      .string()
      .max(500, 'Beskeden er for lang')
      .nullable()
      .optional()
      .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Slutdato skal være samme dag som eller efter startdato',
    path: ['endDate'],
  });

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
