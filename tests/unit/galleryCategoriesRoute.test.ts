import { describe, expect, it, vi, beforeEach } from 'vitest';

const hasFamilyOrAdminAccess = vi.fn();
const requireAdmin = vi.fn();
const listGalleryCategories = vi.fn();
const createGalleryCategory = vi.fn();
const updateGalleryCategory = vi.fn();
const deleteGalleryCategory = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ hasFamilyOrAdminAccess, requireAdmin }));
vi.mock('@/lib/gallery/repository', () => ({
  listGalleryCategories,
  createGalleryCategory,
  updateGalleryCategory,
  deleteGalleryCategory,
}));

const { GET, POST } = await import('@/app/api/gallery/categories/route');
const { PATCH, DELETE } = await import('@/app/api/gallery/categories/[id]/route');

function makeRequest(method: string, body?: unknown) {
  return new Request('http://localhost/api/gallery/categories', {
    method,
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
}

describe('GET /api/gallery/categories', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    listGalleryCategories.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('leverer kategorierne til familievisningen', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    listGalleryCategories.mockResolvedValue([{ id: '1', name: 'Udsigt', sortOrder: 0 }]);
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.categories).toHaveLength(1);
  });
});

describe('POST /api/gallery/categories', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    createGalleryCategory.mockReset();
  });

  it('familievisningen (ikke-admin) kan ikke oprette en kategori', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await POST(makeRequest('POST', { name: 'Udsigt' }));
    expect(response.status).toBe(401);
    expect(createGalleryCategory).not.toHaveBeenCalled();
  });

  it('administratoren kan oprette en kategori', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    createGalleryCategory.mockResolvedValue({ id: '1', name: 'Udsigt', sortOrder: 0 });
    const response = await POST(makeRequest('POST', { name: 'Udsigt' }));
    expect(response.status).toBe(201);
    expect(createGalleryCategory).toHaveBeenCalledWith('Udsigt');
  });

  it('afviser tomt navn', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    const response = await POST(makeRequest('POST', { name: '  ' }));
    expect(response.status).toBe(400);
    expect(createGalleryCategory).not.toHaveBeenCalled();
  });
});

describe('PATCH/DELETE /api/gallery/categories/:id', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    updateGalleryCategory.mockReset();
    deleteGalleryCategory.mockReset();
  });

  it('familievisningen kan ikke omdøbe en kategori', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await PATCH(makeRequest('PATCH', { name: 'Ny' }), { params: { id: '1' } });
    expect(response.status).toBe(401);
  });

  it('administratoren kan omdøbe en kategori', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    updateGalleryCategory.mockResolvedValue({ id: '1', name: 'Ny', sortOrder: 0 });
    const response = await PATCH(makeRequest('PATCH', { name: 'Ny' }), { params: { id: '1' } });
    expect(response.status).toBe(200);
    expect(updateGalleryCategory).toHaveBeenCalledWith('1', { name: 'Ny' });
  });

  it('administratoren kan ændre rækkefølge', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    updateGalleryCategory.mockResolvedValue({ id: '1', name: 'Udsigt', sortOrder: 2 });
    const response = await PATCH(makeRequest('PATCH', { sortOrder: 2 }), { params: { id: '1' } });
    expect(response.status).toBe(200);
  });

  it('familievisningen kan ikke slette en kategori', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await DELETE(makeRequest('DELETE'), { params: { id: '1' } });
    expect(response.status).toBe(401);
    expect(deleteGalleryCategory).not.toHaveBeenCalled();
  });

  it('administratoren kan slette en kategori', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    deleteGalleryCategory.mockResolvedValue(true);
    const response = await DELETE(makeRequest('DELETE'), { params: { id: '1' } });
    expect(response.status).toBe(200);
  });
});
