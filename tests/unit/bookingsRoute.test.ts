import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { AdminBooking } from '@/lib/types';

const requireAdmin = vi.fn();
const hasFamilyOrAdminAccess = vi.fn();
const listBookings = vi.fn();
const createBooking = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ requireAdmin, hasFamilyOrAdminAccess }));
vi.mock('@/lib/bookings/repository', () => ({ listBookings, createBooking }));

const { GET, POST } = await import('@/app/api/bookings/route');

const fullBooking: AdminBooking = {
  id: 'b1',
  name: 'Joakim H.',
  status: 'request',
  color: '#3A6351',
  startDate: '2026-08-10',
  endDate: '2026-08-17',
  arrivalTime: '15:00',
  departureTime: '10:00',
  internalComment: 'Intern hemmelig note',
  createdBy: 'admin-1',
  photoPath: null,
  photoContentType: null,
  hasPhoto: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init) as any;
}

describe('GET /api/bookings', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    hasFamilyOrAdminAccess.mockReset();
    listBookings.mockReset();
  });

  it('afviser hvis hverken admin eller familie-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    requireAdmin.mockResolvedValue(null);

    const response = await GET(makeRequest('http://localhost/api/bookings'));
    expect(response.status).toBe(401);
  });

  it('leverer kun offentlige felter til familievisningen (ingen tidspunkter, ingen kommentar)', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    requireAdmin.mockResolvedValue(null);
    listBookings.mockResolvedValue([fullBooking]);

    const response = await GET(makeRequest('http://localhost/api/bookings'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.bookings).toHaveLength(1);
    const booking = body.bookings[0];
    expect(booking.name).toBe('Joakim H.');
    expect(booking.arrivalTime).toBeUndefined();
    expect(booking.departureTime).toBeUndefined();
    expect(booking.internalComment).toBeUndefined();
    expect(booking.createdBy).toBeUndefined();
    expect(booking.photoPath).toBeUndefined();
    expect('internalComment' in booking).toBe(false);
    expect('photoPath' in booking).toBe(false);
    expect(booking.hasPhoto).toBe(false);
  });

  it('leverer alle felter til administratorer, inkl. tidspunkter og kommentar', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    requireAdmin.mockResolvedValue('admin-1');
    listBookings.mockResolvedValue([fullBooking]);

    const response = await GET(makeRequest('http://localhost/api/bookings'));
    const body = await response.json();
    const booking = body.bookings[0];

    expect(booking.arrivalTime).toBe('15:00');
    expect(booking.departureTime).toBe('10:00');
    expect(booking.internalComment).toBe('Intern hemmelig note');
  });
});

describe('POST /api/bookings', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    createBooking.mockReset();
  });

  const validPayload = {
    name: 'Peter og Lise',
    status: 'request',
    color: '#2F5D8A',
    startDate: '2026-08-10',
    endDate: '2026-08-17',
  };

  it('familievisningen (ikke-admin) kan ikke oprette en booking', async () => {
    requireAdmin.mockResolvedValue(null);

    const response = await POST(
      makeRequest('http://localhost/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(401);
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('administratoren kan oprette en booking', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    createBooking.mockResolvedValue({ ...fullBooking, ...validPayload });

    const response = await POST(
      makeRequest('http://localhost/api/bookings', {
        method: 'POST',
        body: JSON.stringify(validPayload),
      }),
    );

    expect(response.status).toBe(201);
    expect(createBooking).toHaveBeenCalledWith(expect.objectContaining({ name: 'Peter og Lise' }), 'admin-1');
  });

  it('afviser ugyldigt input selv for administratorer', async () => {
    requireAdmin.mockResolvedValue('admin-1');

    const response = await POST(
      makeRequest('http://localhost/api/bookings', {
        method: 'POST',
        body: JSON.stringify({ ...validPayload, color: 'ikke-en-farve' }),
      }),
    );

    expect(response.status).toBe(400);
    expect(createBooking).not.toHaveBeenCalled();
  });
});
