import { describe, expect, it, vi, beforeEach } from 'vitest';

const hasFamilyOrAdminAccess = vi.fn();
const requireAdmin = vi.fn();
const getBookingPhotoInfo = vi.fn();
const setBookingPhoto = vi.fn();
const clearBookingPhoto = vi.fn();
const download = vi.fn();
const upload = vi.fn();
const remove = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ hasFamilyOrAdminAccess, requireAdmin }));
vi.mock('@/lib/bookings/repository', () => ({
  getBookingPhotoInfo,
  setBookingPhoto,
  clearBookingPhoto,
}));
vi.mock('@/lib/supabase/serviceClient', () => ({
  getServiceSupabaseClient: () => ({
    storage: { from: () => ({ download, upload, remove }) },
  }),
}));

const { GET, POST, DELETE } = await import('@/app/api/bookings/[id]/photo/route');

function makeRequest(method: string, body?: BodyInit) {
  return new Request('http://localhost/api/bookings/b1/photo', { method, body }) as any;
}

describe('GET /api/bookings/:id/photo', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    getBookingPhotoInfo.mockReset();
    download.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const response = await GET(makeRequest('GET'), { params: { id: 'b1' } });
    expect(response.status).toBe(401);
  });

  it('giver 404 hvis bookingen ikke har et billede', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    getBookingPhotoInfo.mockResolvedValue({ photoPath: null, photoContentType: null });
    const response = await GET(makeRequest('GET'), { params: { id: 'b1' } });
    expect(response.status).toBe(404);
  });

  it('leverer billedet med korrekt content-type til familie/venner', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    getBookingPhotoInfo.mockResolvedValue({
      photoPath: 'b1/photo',
      photoContentType: 'image/jpeg',
    });
    download.mockResolvedValue({ data: new Blob([new Uint8Array([1, 2, 3])]), error: null });

    const response = await GET(makeRequest('GET'), { params: { id: 'b1' } });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });
});

describe('POST /api/bookings/:id/photo', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    upload.mockReset();
    setBookingPhoto.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const formData = new FormData();
    formData.append('photo', new File(['x'], 'key.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData), { params: { id: 'b1' } });
    expect(response.status).toBe(401);
    expect(upload).not.toHaveBeenCalled();
  });

  it('afviser filtyper der ikke er billeder', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    const formData = new FormData();
    formData.append('photo', new File(['x'], 'note.pdf', { type: 'application/pdf' }));

    const response = await POST(makeRequest('POST', formData), { params: { id: 'b1' } });
    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('afviser filer over 8 MB', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    const bigContent = new Uint8Array(8 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append('photo', new File([bigContent], 'key.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData), { params: { id: 'b1' } });
    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('familievisningen (ikke-admin) KAN uploade et gyldigt billede (fx den afrejsende gæst)', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    upload.mockResolvedValue({ error: null });
    setBookingPhoto.mockResolvedValue(true);

    const formData = new FormData();
    formData.append('photo', new File(['x'], 'key.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData), { params: { id: 'b1' } });
    expect(response.status).toBe(200);
    expect(upload).toHaveBeenCalledWith(
      'b1/photo',
      expect.anything(),
      expect.objectContaining({ contentType: 'image/jpeg', upsert: true }),
    );
    expect(setBookingPhoto).toHaveBeenCalledWith('b1', 'b1/photo', 'image/jpeg');
  });
});

describe('DELETE /api/bookings/:id/photo', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    getBookingPhotoInfo.mockReset();
    remove.mockReset();
    clearBookingPhoto.mockReset();
  });

  it('familievisningen (ikke-admin) kan ikke fjerne et billede', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await DELETE(makeRequest('DELETE'), { params: { id: 'b1' } });
    expect(response.status).toBe(401);
    expect(clearBookingPhoto).not.toHaveBeenCalled();
  });

  it('administratoren kan fjerne et billede', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    getBookingPhotoInfo.mockResolvedValue({ photoPath: 'b1/photo', photoContentType: 'image/jpeg' });
    remove.mockResolvedValue({ error: null });
    clearBookingPhoto.mockResolvedValue(true);

    const response = await DELETE(makeRequest('DELETE'), { params: { id: 'b1' } });
    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith(['b1/photo']);
    expect(clearBookingPhoto).toHaveBeenCalledWith('b1');
  });
});
