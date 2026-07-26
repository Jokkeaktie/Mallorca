import { describe, expect, it, vi, beforeEach } from 'vitest';

const requireAdmin = vi.fn();
const getBugReportById = vi.fn();
const download = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ requireAdmin }));
vi.mock('@/lib/bugReports/repository', () => ({ getBugReportById }));
vi.mock('@/lib/supabase/serviceClient', () => ({
  getServiceSupabaseClient: () => ({ storage: { from: () => ({ download }) } }),
}));

const { GET } = await import('@/app/api/bug-reports/[id]/photos/[index]/route');

function makeRequest() {
  return new Request('http://localhost/api/bug-reports/1/photos/0') as any;
}

describe('GET /api/bug-reports/:id/photos/:index', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    getBugReportById.mockReset();
    download.mockReset();
  });

  it('afviser uden admin-adgang (rapport-billeder er private)', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await GET(makeRequest(), { params: { id: '1', index: '0' } });
    expect(response.status).toBe(401);
  });

  it('giver 404 hvis billedet ikke findes', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    getBugReportById.mockResolvedValue({ id: '1', photos: [] });
    const response = await GET(makeRequest(), { params: { id: '1', index: '0' } });
    expect(response.status).toBe(404);
  });

  it('leverer billedet med korrekt content-type til administratoren', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    getBugReportById.mockResolvedValue({
      id: '1',
      photos: [{ path: '1/0.jpg', contentType: 'image/jpeg' }],
    });
    download.mockResolvedValue({ data: new Blob([new Uint8Array([1, 2, 3])]), error: null });

    const response = await GET(makeRequest(), { params: { id: '1', index: '0' } });
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
  });
});
