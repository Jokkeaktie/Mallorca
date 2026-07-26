import { describe, expect, it, vi, beforeEach } from 'vitest';

const hasFamilyOrAdminAccess = vi.fn();
const requireAdmin = vi.fn();
const listBugReports = vi.fn();
const createBugReport = vi.fn();
const getBugReportById = vi.fn();
const updateBugReportStatus = vi.fn();
const deleteBugReport = vi.fn();
const upload = vi.fn();
const remove = vi.fn();
const download = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ hasFamilyOrAdminAccess, requireAdmin }));
vi.mock('@/lib/bugReports/repository', () => ({
  listBugReports,
  createBugReport,
  getBugReportById,
  updateBugReportStatus,
  deleteBugReport,
}));
vi.mock('@/lib/supabase/serviceClient', () => ({
  getServiceSupabaseClient: () => ({
    storage: { from: () => ({ upload, remove, download }) },
  }),
}));

const { GET, POST } = await import('@/app/api/bug-reports/route');
const { PATCH, DELETE } = await import('@/app/api/bug-reports/[id]/route');

function makeRequest(method: string, body?: BodyInit) {
  return new Request('http://localhost/api/bug-reports', { method, body }) as any;
}

describe('GET /api/bug-reports', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    listBugReports.mockReset();
  });

  it('afviser familievisningen (ikke-admin) - rapporter er kun for administratorer', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('administratoren kan hente listen', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    listBugReports.mockResolvedValue([
      { id: '1', description: 'Test', reporterName: null, photos: [], status: 'new' },
    ]);
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.reports).toHaveLength(1);
  });
});

describe('POST /api/bug-reports', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    createBugReport.mockReset();
    upload.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const formData = new FormData();
    formData.append('description', 'Noget er i stykker');
    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(401);
    expect(createBugReport).not.toHaveBeenCalled();
  });

  it('familievisningen KAN oprette en fejlrapport (uden billeder)', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    createBugReport.mockResolvedValue({ id: '1' });

    const formData = new FormData();
    formData.append('description', 'Opvaskemaskinen larmer');
    formData.append('reporterName', 'Joakim H.');

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(201);
    expect(createBugReport).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Opvaskemaskinen larmer', reporterName: 'Joakim H.', photos: [] }),
    );
  });

  it('afviser tom beskrivelse', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    const formData = new FormData();
    formData.append('description', '   ');
    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(400);
    expect(createBugReport).not.toHaveBeenCalled();
  });

  it('afviser en fil med ugyldig filtype', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    const formData = new FormData();
    formData.append('description', 'Test');
    formData.append('photos', new File(['x'], 'note.pdf', { type: 'application/pdf' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('afviser mere end det tilladte antal billeder', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    const formData = new FormData();
    formData.append('description', 'Test');
    for (let i = 0; i < 6; i++) {
      formData.append('photos', new File(['x'], `photo${i}.jpg`, { type: 'image/jpeg' }));
    }

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(400);
    expect(upload).not.toHaveBeenCalled();
  });

  it('administratoren kan også oprette en fejlrapport med billeder', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    upload.mockResolvedValue({ error: null });
    createBugReport.mockResolvedValue({ id: '1' });

    const formData = new FormData();
    formData.append('description', 'Test med billede');
    formData.append('photos', new File(['x'], 'photo.jpg', { type: 'image/jpeg' }));

    const response = await POST(makeRequest('POST', formData));
    expect(response.status).toBe(201);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(createBugReport).toHaveBeenCalledWith(
      expect.objectContaining({
        photos: [expect.objectContaining({ contentType: 'image/jpeg' })],
      }),
    );
  });
});

describe('PATCH/DELETE /api/bug-reports/:id', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    updateBugReportStatus.mockReset();
    deleteBugReport.mockReset();
    getBugReportById.mockReset();
    remove.mockReset();
  });

  function makeIdRequest(method: string, body?: unknown) {
    return new Request('http://localhost/api/bug-reports/1', {
      method,
      body: body ? JSON.stringify(body) : undefined,
    }) as any;
  }

  it('familievisningen kan ikke ændre status', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await PATCH(makeIdRequest('PATCH', { status: 'resolved' }), {
      params: { id: '1' },
    });
    expect(response.status).toBe(401);
  });

  it('administratoren kan markere en rapport som løst', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    updateBugReportStatus.mockResolvedValue({ id: '1', status: 'resolved' });
    const response = await PATCH(makeIdRequest('PATCH', { status: 'resolved' }), {
      params: { id: '1' },
    });
    expect(response.status).toBe(200);
    expect(updateBugReportStatus).toHaveBeenCalledWith('1', 'resolved');
  });

  it('familievisningen kan ikke slette en rapport', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await DELETE(makeIdRequest('DELETE'), { params: { id: '1' } });
    expect(response.status).toBe(401);
    expect(deleteBugReport).not.toHaveBeenCalled();
  });

  it('administratoren kan slette en rapport og dens billeder', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    getBugReportById.mockResolvedValue({
      id: '1',
      photos: [{ path: '1/0.jpg', contentType: 'image/jpeg' }],
    });
    remove.mockResolvedValue({ error: null });
    deleteBugReport.mockResolvedValue(true);

    const response = await DELETE(makeIdRequest('DELETE'), { params: { id: '1' } });
    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledWith(['1/0.jpg']);
    expect(deleteBugReport).toHaveBeenCalledWith('1');
  });
});
