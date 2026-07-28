import { describe, expect, it, vi, beforeEach } from 'vitest';

const hasFamilyOrAdminAccess = vi.fn();
const requireAdmin = vi.fn();
const listGalleryPhotos = vi.fn();
const createGalleryPhoto = vi.fn();
const updateGalleryPhoto = vi.fn();
const deleteGalleryPhoto = vi.fn();
const getGalleryPhotoFile = vi.fn();
const upload = vi.fn();
const download = vi.fn();
const remove = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ hasFamilyOrAdminAccess, requireAdmin }));
vi.mock('@/lib/gallery/repository', () => ({
  listGalleryPhotos,
  createGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  getGalleryPhotoFile,
}));
vi.mock('@/lib/supabase/serviceClient', () => ({
  getServiceSupabaseClient: () => ({
    storage: { from: () => ({ upload, download, remove }) },
  }),
}));

const { GET, POST } = await import('@/app/api/gallery/photos/route');
const { PATCH, DELETE } = await import('@/app/api/gallery/photos/[id]/route');
const { GET: GET_IMAGE } = await import('@/app/api/gallery/photos/[id]/image/route');

function makeRequest(method: string, body?: BodyInit) {
  return new Request('http://localhost/api/gallery/photos', { method, body }) as any;
}

describe('GET /api/gallery/photos', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    listGalleryPhotos.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('leverer billedlisten til familievisningen', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    listGalleryPhotos.mockResolvedValue([
      { id: '1', categoryId: null, sortOrder: 0, createdAt: '2026-01-01T00:00:00.000Z' },
    ]);
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.photos).toHaveLength(1);
  });
});

describe('POST /api/gallery/photos', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    upload.mockReset();
    createGalleryPhoto.mockReset();
  });

  it('familievisningen (ikke-admin) kan ikke uploade et billede', async () => {
    requireAdmin.mockResolvedValue(null);
    const formData = new FormData();
    formData.append('photo', new File(['x'], 'foto.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(401);
    expect(upload).not.toHaveBeenCalled();
  });

  it('afviser filtyper der ikke er billeder', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    const formData = new FormData();
    formData.append('photo', new File(['x'], 'note.pdf', { type: 'application/pdf' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('afviser filer over 4 MB', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    const bigContent = new Uint8Array(4 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append('photo', new File([bigContent], 'foto.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('administratoren kan uploade et billede uden kategori', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    upload.mockResolvedValue({ error: null });
    createGalleryPhoto.mockResolvedValue({
      id: 'p1',
      categoryId: null,
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const formData = new FormData();
    formData.append('photo', new File(['x'], 'foto.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(201);
    expect(createGalleryPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: null, photoContentType: 'image/jpeg' }),
    );
  });

  it('administratoren kan uploade et billede med kategori', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    upload.mockResolvedValue({ error: null });
    createGalleryPhoto.mockResolvedValue({
      id: 'p1',
      categoryId: 'cat-1',
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const formData = new FormData();
    formData.append('photo', new File(['x'], 'foto.jpg', { type: 'image/jpeg' }));
    formData.append('categoryId', 'cat-1');

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(201);
    expect(createGalleryPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: 'cat-1' }),
    );
  });
});

describe('PATCH/DELETE /api/gallery/photos/:id', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    updateGalleryPhoto.mockReset();
    deleteGalleryPhoto.mockReset();
    getGalleryPhotoFile.mockReset();
    remove.mockReset();
  });

  it('familievisningen kan ikke flytte et billede til en anden kategori', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await PATCH(makeRequest('PATCH', JSON.stringify({ categoryId: null })), {
      params: { id: '1' },
    });
    expect(response.status).toBe(401);
  });

  it('administratoren kan flytte et billede til en anden kategori', async () => {
    const categoryId = '11111111-1111-1111-1111-111111111111';
    requireAdmin.mockResolvedValue('admin-1');
    updateGalleryPhoto.mockResolvedValue({ id: '1', categoryId, sortOrder: 0, createdAt: '' });
    const response = await PATCH(makeRequest('PATCH', JSON.stringify({ categoryId })), {
      params: { id: '1' },
    });
    expect(response.status).toBe(200);
    expect(updateGalleryPhoto).toHaveBeenCalledWith('1', { categoryId });
  });

  it('familievisningen kan ikke slette et billede', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await DELETE(makeRequest('DELETE'), { params: { id: '1' } });
    expect(response.status).toBe(401);
    expect(deleteGalleryPhoto).not.toHaveBeenCalled();
  });

  it('administratoren kan slette et billede (database + storage)', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    getGalleryPhotoFile.mockResolvedValue({ photoPath: 'p1.jpg', photoContentType: 'image/jpeg' });
    deleteGalleryPhoto.mockResolvedValue(true);
    remove.mockResolvedValue({ error: null });

    const response = await DELETE(makeRequest('DELETE'), { params: { id: 'p1' } });
    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith(['p1.jpg']);
  });
});

describe('GET /api/gallery/photos/:id/image', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    getGalleryPhotoFile.mockReset();
    download.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const response = await GET_IMAGE(makeRequest('GET'), { params: { id: '1' } });
    expect(response.status).toBe(401);
  });

  it('giver 404 hvis billedet ikke findes', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    getGalleryPhotoFile.mockResolvedValue(null);
    const response = await GET_IMAGE(makeRequest('GET'), { params: { id: '1' } });
    expect(response.status).toBe(404);
  });

  it('leverer billedet med korrekt content-type', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    getGalleryPhotoFile.mockResolvedValue({ photoPath: 'p1.jpg', photoContentType: 'image/jpeg' });
    download.mockResolvedValue({ data: new Blob([new Uint8Array([1, 2, 3])]), error: null });

    const response = await GET_IMAGE(makeRequest('GET'), { params: { id: '1' } });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });
});
