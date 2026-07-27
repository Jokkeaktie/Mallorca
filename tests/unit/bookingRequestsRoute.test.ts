import { describe, expect, it, vi, beforeEach } from 'vitest';

const hasFamilyOrAdminAccess = vi.fn();
const createBooking = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ hasFamilyOrAdminAccess }));
vi.mock('@/lib/bookings/repository', () => ({ createBooking }));

const { POST } = await import('@/app/api/booking-requests/route');

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/booking-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  }) as any;
}

describe('POST /api/booking-requests', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    createBooking.mockReset();
  });

  const validPayload = {
    name: 'Peter og Lise',
    startDate: '2026-08-10',
    endDate: '2026-08-17',
  };

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);

    const response = await POST(makeRequest(validPayload));

    expect(response.status).toBe(401);
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('opretter et ønske med status "request" for familie/venner', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    createBooking.mockResolvedValue({ id: 'b1' });

    const response = await POST(makeRequest(validPayload));

    expect(response.status).toBe(201);
    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Peter og Lise',
        status: 'request',
        startDate: '2026-08-10',
        endDate: '2026-08-17',
        arrivalTime: null,
        departureTime: null,
      }),
      null,
    );
  });

  it('gemmer en valgfri besked som intern kommentar', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    createBooking.mockResolvedValue({ id: 'b1' });

    await POST(makeRequest({ ...validPayload, note: 'Vi kommer med hunden' }));

    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        internalComment: 'Besked fra familien: Vi kommer med hunden',
      }),
      null,
    );
  });

  it('gemmer valgfrit flynummer og ankomst-/afrejsetidspunkt', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    createBooking.mockResolvedValue({ id: 'b1' });

    await POST(
      makeRequest({
        ...validPayload,
        flightNumber: 'SK1533',
        arrivalTime: '15:00',
        departureTime: '10:00',
      }),
    );

    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        flightNumber: 'SK1533',
        arrivalTime: '15:00',
        departureTime: '10:00',
      }),
      null,
    );
  });

  it('rejseoplysninger er valgfrie (bliver null uden dem)', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    createBooking.mockResolvedValue({ id: 'b1' });

    await POST(makeRequest(validPayload));

    expect(createBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        flightNumber: null,
        arrivalTime: null,
        departureTime: null,
      }),
      null,
    );
  });

  it('afviser ugyldigt input (manglende navn)', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);

    const response = await POST(makeRequest({ ...validPayload, name: '' }));

    expect(response.status).toBe(400);
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('afviser når slutdato er før startdato', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);

    const response = await POST(
      makeRequest({ ...validPayload, startDate: '2026-08-17', endDate: '2026-08-10' }),
    );

    expect(response.status).toBe(400);
    expect(createBooking).not.toHaveBeenCalled();
  });
});
