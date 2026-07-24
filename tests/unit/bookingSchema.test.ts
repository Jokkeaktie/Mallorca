import { describe, expect, it } from 'vitest';
import { bookingSchema, familyPasswordLoginSchema } from '@/lib/validation/booking';

const validBooking = {
  name: 'Peter og Lise',
  status: 'request' as const,
  color: '#2F5D8A',
  startDate: '2026-08-10',
  endDate: '2026-08-17',
  arrivalTime: null,
  departureTime: null,
  internalComment: null,
};

describe('bookingSchema', () => {
  it('accepterer en gyldig booking uden klokkeslæt', () => {
    const result = bookingSchema.safeParse(validBooking);
    expect(result.success).toBe(true);
  });

  it('accepterer gyldige klokkeslæt i 24-timers format', () => {
    const result = bookingSchema.safeParse({
      ...validBooking,
      arrivalTime: '15:00',
      departureTime: '10:30',
    });
    expect(result.success).toBe(true);
  });

  it('afviser ugyldigt klokkeslæt-format', () => {
    const result = bookingSchema.safeParse({ ...validBooking, arrivalTime: '3pm' });
    expect(result.success).toBe(false);
  });

  it('afviser tomt navn', () => {
    const result = bookingSchema.safeParse({ ...validBooking, name: '   ' });
    expect(result.success).toBe(false);
  });

  it('afviser ugyldig status', () => {
    const result = bookingSchema.safeParse({ ...validBooking, status: 'noget-andet' });
    expect(result.success).toBe(false);
  });

  it('afviser ugyldig farve', () => {
    const result = bookingSchema.safeParse({ ...validBooking, color: 'blaa' });
    expect(result.success).toBe(false);
  });

  it('afviser slutdato før startdato', () => {
    const result = bookingSchema.safeParse({
      ...validBooking,
      startDate: '2026-08-17',
      endDate: '2026-08-10',
    });
    expect(result.success).toBe(false);
  });

  it('tillader at slutdato er samme dag som startdato (endagsbesøg)', () => {
    const result = bookingSchema.safeParse({
      ...validBooking,
      startDate: '2026-08-10',
      endDate: '2026-08-10',
    });
    expect(result.success).toBe(true);
  });

  it('to bookinger hvor den ene ankommer den dag den anden rejser er begge gyldige input hver for sig', () => {
    const departing = bookingSchema.safeParse({
      ...validBooking,
      startDate: '2026-08-10',
      endDate: '2026-08-17',
      departureTime: '10:00',
    });
    const arriving = bookingSchema.safeParse({
      ...validBooking,
      startDate: '2026-08-17',
      endDate: '2026-08-24',
      arrivalTime: '15:00',
    });
    expect(departing.success).toBe(true);
    expect(arriving.success).toBe(true);
  });
});

describe('familyPasswordLoginSchema', () => {
  it('afviser tom adgangskode', () => {
    expect(familyPasswordLoginSchema.safeParse({ password: '' }).success).toBe(false);
  });

  it('accepterer en udfyldt adgangskode', () => {
    expect(familyPasswordLoginSchema.safeParse({ password: 'hemmelighed' }).success).toBe(true);
  });
});
