import { describe, expect, it, vi, beforeEach } from 'vitest';

const hasFamilyOrAdminAccess = vi.fn();
const requireAdmin = vi.fn();
const listChecklistItems = vi.fn();
const createChecklistItem = vi.fn();
const updateChecklistItem = vi.fn();
const deleteChecklistItem = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ hasFamilyOrAdminAccess, requireAdmin }));
vi.mock('@/lib/content/checklist', () => ({
  listChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
}));

const { GET, POST } = await import('@/app/api/checklist/route');
const { PATCH, DELETE } = await import('@/app/api/checklist/[id]/route');

function makeRequest(method: string, body?: unknown) {
  return new Request('http://localhost/api/checklist', {
    method,
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
}

describe('GET /api/checklist', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    listChecklistItems.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('leverer tjeklisten til familievisningen', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    listChecklistItems.mockResolvedValue([{ id: '1', text: 'Sluk lys', sortOrder: 0 }]);
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
  });
});

describe('POST /api/checklist', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    createChecklistItem.mockReset();
  });

  it('familievisningen (ikke-admin) kan ikke oprette et punkt', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await POST(makeRequest('POST', { text: 'Sluk lys' }));
    expect(response.status).toBe(401);
    expect(createChecklistItem).not.toHaveBeenCalled();
  });

  it('administratoren kan oprette et punkt', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    createChecklistItem.mockResolvedValue({ id: '1', text: 'Sluk lys', sortOrder: 0 });
    const response = await POST(makeRequest('POST', { text: 'Sluk lys' }));
    expect(response.status).toBe(201);
  });

  it('afviser tomt input', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    const response = await POST(makeRequest('POST', { text: '  ' }));
    expect(response.status).toBe(400);
    expect(createChecklistItem).not.toHaveBeenCalled();
  });
});

describe('PATCH/DELETE /api/checklist/:id', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    updateChecklistItem.mockReset();
    deleteChecklistItem.mockReset();
  });

  it('familievisningen kan ikke ændre et punkt', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await PATCH(makeRequest('PATCH', { text: 'Ny tekst' }), { params: { id: '1' } });
    expect(response.status).toBe(401);
  });

  it('administratoren kan ændre rækkefølge', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    updateChecklistItem.mockResolvedValue({ id: '1', text: 'Sluk lys', sortOrder: 5 });
    const response = await PATCH(makeRequest('PATCH', { sortOrder: 5 }), { params: { id: '1' } });
    expect(response.status).toBe(200);
    expect(updateChecklistItem).toHaveBeenCalledWith('1', { sortOrder: 5 });
  });

  it('familievisningen kan ikke slette et punkt', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await DELETE(makeRequest('DELETE'), { params: { id: '1' } });
    expect(response.status).toBe(401);
    expect(deleteChecklistItem).not.toHaveBeenCalled();
  });

  it('administratoren kan slette et punkt', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    deleteChecklistItem.mockResolvedValue(true);
    const response = await DELETE(makeRequest('DELETE'), { params: { id: '1' } });
    expect(response.status).toBe(200);
  });
});
