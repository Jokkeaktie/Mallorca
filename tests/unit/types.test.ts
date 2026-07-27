import { describe, expect, it } from 'vitest';
import { toPublicBooking, type AdminBooking } from '@/lib/types';

const fullBooking: AdminBooking = {
  id: 'abc-123',
  name: 'Joakim H.',
  status: 'approved',
  color: '#3A6351',
  startDate: '2026-08-10',
  endDate: '2026-08-17',
  arrivalTime: '15:00',
  departureTime: '10:00',
  internalComment: 'Hemmelig intern note',
  createdBy: 'admin-uuid',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('toPublicBooking', () => {
  it('bevarer kun de felter familievisningen må se', () => {
    const publicBooking = toPublicBooking(fullBooking);
    expect(publicBooking).toEqual({
      id: 'abc-123',
      name: 'Joakim H.',
      status: 'approved',
      color: '#3A6351',
      startDate: '2026-08-10',
      endDate: '2026-08-17',
    });
  });

  it('fjerner private felter helt (de er ikke bare skjult, de er væk)', () => {
    const publicBooking = toPublicBooking(fullBooking) as unknown as Record<string, unknown>;
    expect(publicBooking.arrivalTime).toBeUndefined();
    expect(publicBooking.departureTime).toBeUndefined();
    expect(publicBooking.internalComment).toBeUndefined();
    expect(publicBooking.createdBy).toBeUndefined();
    expect('arrivalTime' in publicBooking).toBe(false);
    expect('internalComment' in publicBooking).toBe(false);
  });
});
