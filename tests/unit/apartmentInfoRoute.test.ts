import { describe, expect, it, vi, beforeEach } from 'vitest';

const hasFamilyOrAdminAccess = vi.fn();
const requireAdmin = vi.fn();
const getApartmentInfo = vi.fn();
const setApartmentInfo = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ hasFamilyOrAdminAccess, requireAdmin }));
vi.mock('@/lib/settings/apartmentInfo', () => ({ getApartmentInfo, setApartmentInfo }));

const { GET, PATCH } = await import('@/app/api/apartment-info/route');

function makeRequest(method: string, body?: unknown) {
  return new Request('http://localhost/api/apartment-info', {
    method,
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
}

describe('GET /api/apartment-info', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    getApartmentInfo.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('leverer teksten til familievisningen', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    getApartmentInfo.mockResolvedValue('Adresse: Carrer Example 12');
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.text).toBe('Adresse: Carrer Example 12');
  });
});

describe('PATCH /api/apartment-info', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    setApartmentInfo.mockReset();
  });

  it('familievisningen (ikke-admin) kan ikke ændre teksten', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await PATCH(makeRequest('PATCH', { text: 'Forsøg' }));
    expect(response.status).toBe(401);
    expect(setApartmentInfo).not.toHaveBeenCalled();
  });

  it('administratoren kan gemme teksten', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    const response = await PATCH(makeRequest('PATCH', { text: 'Adresse: Carrer Example 12' }));
    expect(response.status).toBe(200);
    expect(setApartmentInfo).toHaveBeenCalledWith('Adresse: Carrer Example 12');
  });

  it('tillader tom tekst (rydder feltet)', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    const response = await PATCH(makeRequest('PATCH', { text: '' }));
    expect(response.status).toBe(200);
    expect(setApartmentInfo).toHaveBeenCalledWith('');
  });

  it('afviser for lang tekst', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    const response = await PATCH(makeRequest('PATCH', { text: 'x'.repeat(5001) }));
    expect(response.status).toBe(400);
    expect(setApartmentInfo).not.toHaveBeenCalled();
  });
});
