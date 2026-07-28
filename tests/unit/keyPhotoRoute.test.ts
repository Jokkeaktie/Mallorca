import { describe, expect, it, vi, beforeEach } from 'vitest';

const hasFamilyOrAdminAccess = vi.fn();
const requireAdmin = vi.fn();
const getKeyPhotoInfo = vi.fn();
const setKeyPhoto = vi.fn();
const clearKeyPhoto = vi.fn();
const download = vi.fn();
const upload = vi.fn();
const remove = vi.fn();
const sendPushToAdmins = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ hasFamilyOrAdminAccess, requireAdmin }));
vi.mock('@/lib/settings/keyPhoto', async () => {
  const actual = await vi.importActual<typeof import('@/lib/settings/keyPhoto')>(
    '@/lib/settings/keyPhoto',
  );
  return { ...actual, getKeyPhotoInfo, setKeyPhoto, clearKeyPhoto };
});
vi.mock('@/lib/supabase/serviceClient', () => ({
  getServiceSupabaseClient: () => ({
    storage: { from: () => ({ download, upload, remove }) },
  }),
}));
vi.mock('@/lib/notifications/push', () => ({ sendPushToAdmins }));

const { GET, POST, DELETE } = await import('@/app/api/key-photo/route');
const { GET: GET_IMAGE } = await import('@/app/api/key-photo/image/route');

function makeRequest(method: string, body?: BodyInit) {
  return new Request('http://localhost/api/key-photo', { method, body }) as any;
}

describe('GET /api/key-photo', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    getKeyPhotoInfo.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('fortæller kun om der findes et billede, ikke stien', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    getKeyPhotoInfo.mockResolvedValue({ photoPath: 'key-location/photo', photoContentType: 'image/jpeg' });

    const response = await GET();
    const body = await response.json();
    expect(body).toEqual({ hasPhoto: true });
  });

  it('returnerer false når intet billede er sat', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    getKeyPhotoInfo.mockResolvedValue({ photoPath: null, photoContentType: null });

    const response = await GET();
    const body = await response.json();
    expect(body).toEqual({ hasPhoto: false });
  });
});

describe('POST /api/key-photo', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    requireAdmin.mockReset();
    upload.mockReset();
    setKeyPhoto.mockReset();
    sendPushToAdmins.mockReset();
    sendPushToAdmins.mockResolvedValue(undefined);
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const formData = new FormData();
    formData.append('photo', new File(['x'], 'key.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(401);
    expect(upload).not.toHaveBeenCalled();
  });

  it('afviser filtyper der ikke er billeder', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    const formData = new FormData();
    formData.append('photo', new File(['x'], 'note.pdf', { type: 'application/pdf' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('afviser filer over 8 MB', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    const bigContent = new Uint8Array(8 * 1024 * 1024 + 1);
    const formData = new FormData();
    formData.append('photo', new File([bigContent], 'key.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('familievisningen (ikke-admin) KAN uploade et gyldigt billede (fx den afrejsende gæst)', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    requireAdmin.mockResolvedValue(null);
    upload.mockResolvedValue({ error: null });
    setKeyPhoto.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append('photo', new File(['x'], 'key.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(200);
    expect(upload).toHaveBeenCalledWith(
      'key-location/photo',
      expect.anything(),
      expect.objectContaining({ contentType: 'image/jpeg', upsert: true }),
    );
    expect(setKeyPhoto).toHaveBeenCalledWith('key-location/photo', 'image/jpeg');
    expect(sendPushToAdmins).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Nyt nøglebillede' }),
    );
  });

  it('sender ikke push når det er en administrator selv, der uploader', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    requireAdmin.mockResolvedValue('admin-1');
    upload.mockResolvedValue({ error: null });
    setKeyPhoto.mockResolvedValue(undefined);

    const formData = new FormData();
    formData.append('photo', new File(['x'], 'key.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(200);
    expect(sendPushToAdmins).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/key-photo', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    getKeyPhotoInfo.mockReset();
    remove.mockReset();
    clearKeyPhoto.mockReset();
  });

  it('familievisningen (ikke-admin) kan ikke fjerne billedet', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await DELETE();
    expect(response.status).toBe(401);
    expect(clearKeyPhoto).not.toHaveBeenCalled();
  });

  it('administratoren kan fjerne billedet', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    getKeyPhotoInfo.mockResolvedValue({
      photoPath: 'key-location/photo',
      photoContentType: 'image/jpeg',
    });
    remove.mockResolvedValue({ error: null });
    clearKeyPhoto.mockResolvedValue(undefined);

    const response = await DELETE();
    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith(['key-location/photo']);
    expect(clearKeyPhoto).toHaveBeenCalled();
  });
});

describe('GET /api/key-photo/image', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    getKeyPhotoInfo.mockReset();
    download.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const response = await GET_IMAGE();
    expect(response.status).toBe(401);
  });

  it('giver 404 hvis intet billede er sat', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    getKeyPhotoInfo.mockResolvedValue({ photoPath: null, photoContentType: null });
    const response = await GET_IMAGE();
    expect(response.status).toBe(404);
  });

  it('leverer billedet med korrekt content-type', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    getKeyPhotoInfo.mockResolvedValue({
      photoPath: 'key-location/photo',
      photoContentType: 'image/jpeg',
    });
    download.mockResolvedValue({ data: new Blob([new Uint8Array([1, 2, 3])]), error: null });

    const response = await GET_IMAGE();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });
});
