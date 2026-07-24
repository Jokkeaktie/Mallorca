import { describe, expect, it } from 'vitest';
import { groupBookingsByDay, isDateWithinBooking, rangesOverlap } from '@/lib/bookings/overlap';

describe('isDateWithinBooking', () => {
  it('inkluderer både start- og slutdato', () => {
    const range = { startDate: '2026-08-10', endDate: '2026-08-17' };
    expect(isDateWithinBooking('2026-08-10', range)).toBe(true);
    expect(isDateWithinBooking('2026-08-17', range)).toBe(true);
    expect(isDateWithinBooking('2026-08-13', range)).toBe(true);
  });

  it('ekskluderer dage uden for intervallet', () => {
    const range = { startDate: '2026-08-10', endDate: '2026-08-17' };
    expect(isDateWithinBooking('2026-08-09', range)).toBe(false);
    expect(isDateWithinBooking('2026-08-18', range)).toBe(false);
  });
});

describe('rangesOverlap', () => {
  it('to overlappende ønsker for samme periode overlapper', () => {
    const a = { startDate: '2026-08-10', endDate: '2026-08-17' };
    const b = { startDate: '2026-08-15', endDate: '2026-08-20' };
    expect(rangesOverlap(a, b)).toBe(true);
  });

  it('afrejse og ny ankomst samme dag betragtes IKKE som et forbudt overlap på datointervalniveau', () => {
    // Familie A rejser d. 2026-08-17, familie B ankommer samme dag.
    // rangesOverlap opererer kun på hele datointervaller (bruges til info,
    // ikke til automatisk afvisning), og her deler de rent faktisk d. 17.
    // Systemet forhindrer IKKE dette – begge bookinger kan oprettes og eksistere.
    const departing = { startDate: '2026-08-10', endDate: '2026-08-17' };
    const arriving = { startDate: '2026-08-17', endDate: '2026-08-24' };
    expect(rangesOverlap(departing, arriving)).toBe(true);
    // Vigtigst: begge er stadig gyldige, uafhængige bookinger (se bookingSchema.test.ts
    // for at bekræfte at ingen valideringsregel afviser dette).
  });

  it('intervaller uden fælles dage overlapper ikke', () => {
    const a = { startDate: '2026-08-01', endDate: '2026-08-05' };
    const b = { startDate: '2026-08-06', endDate: '2026-08-10' };
    expect(rangesOverlap(a, b)).toBe(false);
  });
});

describe('groupBookingsByDay', () => {
  it('viser flere overlappende ønsker samtidig for samme dag', () => {
    const bookings = [
      { id: '1', startDate: '2026-08-10', endDate: '2026-08-17' },
      { id: '2', startDate: '2026-08-12', endDate: '2026-08-19' },
    ];
    const result = groupBookingsByDay(bookings, ['2026-08-13']);
    expect(result.get('2026-08-13')).toHaveLength(2);
  });
});
