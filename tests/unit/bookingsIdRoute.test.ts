import { describe, expect, it, vi, beforeEach } from 'vitest';

const requireAdmin = vi.fn();
const updateBooking = vi.fn();
const deleteBooking = vi.fn();
const getBookingById = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ requireAdmin }));
vi.mock('@/lib/bookings/repository', () => ({ updateBooking, deleteBooking, getBookingById }));

const { PATCH, DELETE } = await import('@/app/api/bookings/[id]/route');

const validPayload = {
  name: 'Tania H.',
  status: 'approved',
  color: '#C1653A',
  startDate: '2026-08-10',
  endDate: '2026-08-17',
};

function makeRequest(method: string, body?: unknown) {
  return new Request('http://localhost/api/bookings/b1', {
    method,
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
}

describe('PATCH /api/bookings/:id', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    updateBooking.mockReset();
  });

  it('familievisningen kan ikke ændre en booking', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await PATCH(makeRequest('PATCH', validPayload), { params: { id: 'b1' } });
    expect(response.status).toBe(401);
    expect(updateBooking).not.toHaveBeenCalled();
  });

  it('administratoren kan ændre status fra Ønske til Godkendt', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    updateBooking.mockResolvedValue({ id: 'b1', ...validPayload, status: 'approved' });

    const response = await PATCH(makeRequest('PATCH', { ...validPayload, status: 'approved' }), {
      params: { id: 'b1' },
    });

    expect(response.status).toBe(200);
    expect(updateBooking).toHaveBeenCalledWith(
      'b1',
      expect.objectContaining({ status: 'approved' }),
    );
  });

  it('administratoren kan ændre status fra Godkendt til Ønske', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    updateBooking.mockResolvedValue({ id: 'b1', ...validPayload, status: 'request' });

    const response = await PATCH(makeRequest('PATCH', { ...validPayload, status: 'request' }), {
      params: { id: 'b1' },
    });

    expect(response.status).toBe(200);
    expect(updateBooking).toHaveBeenCalledWith(
      'b1',
      expect.objectContaining({ status: 'request' }),
    );
  });
});

describe('DELETE /api/bookings/:id', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    deleteBooking.mockReset();
  });

  it('familievisningen kan ikke slette en booking', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await DELETE(makeRequest('DELETE'), { params: { id: 'b1' } });
    expect(response.status).toBe(401);
    expect(deleteBooking).not.toHaveBeenCalled();
  });

  it('administratoren kan slette en booking', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    deleteBooking.mockResolvedValue(true);

    const response = await DELETE(makeRequest('DELETE'), { params: { id: 'b1' } });
    expect(response.status).toBe(200);
    expect(deleteBooking).toHaveBeenCalledWith('b1');
  });
});
