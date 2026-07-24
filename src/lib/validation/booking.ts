import { z } from 'zod';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Dato skal have formatet ÅÅÅÅ-MM-DD');

const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Klokkeslæt skal have formatet TT:MM')
  .nullable()
  .optional()
  .transform((v) => (v ? v : null));

const hexColorSchema = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Farve skal være en hex-kode, fx #3A6351');

export const bookingSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Navn er påkrævet')
      .max(120, 'Navn er for langt'),
    status: z.enum(['request', 'approved']),
    color: hexColorSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    arrivalTime: timeSchema,
    departureTime: timeSchema,
    internalComment: z
      .string()
      .max(2000, 'Kommentaren er for lang')
      .nullable()
      .optional()
      .transform((v) => (v && v.trim().length > 0 ? v.trim() : null)),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: 'Slutdato skal være samme dag som eller efter startdato',
    path: ['endDate'],
  });

export type BookingInput = z.infer<typeof bookingSchema>;

export const familyPasswordLoginSchema = z.object({
  password: z.string().min(1, 'Adgangskode er påkrævet').max(200),
});

export const changeFamilyPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Adgangskoden skal være mindst 8 tegn')
    .max(200),
});
