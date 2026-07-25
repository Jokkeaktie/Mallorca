import { describe, expect, it, vi, beforeEach } from 'vitest';

const hasFamilyOrAdminAccess = vi.fn();
const requireAdmin = vi.fn();
const listFaqItems = vi.fn();
const createFaqItem = vi.fn();
const updateFaqItem = vi.fn();
const deleteFaqItem = vi.fn();

vi.mock('@/lib/auth/accessControl', () => ({ hasFamilyOrAdminAccess, requireAdmin }));
vi.mock('@/lib/content/faq', () => ({ listFaqItems, createFaqItem, updateFaqItem, deleteFaqItem }));

const { GET, POST } = await import('@/app/api/faq/route');
const { PATCH, DELETE } = await import('@/app/api/faq/[id]/route');

function makeRequest(method: string, body?: unknown) {
  return new Request('http://localhost/api/faq', {
    method,
    body: body ? JSON.stringify(body) : undefined,
  }) as any;
}

describe('GET /api/faq', () => {
  beforeEach(() => {
    hasFamilyOrAdminAccess.mockReset();
    listFaqItems.mockReset();
  });

  it('afviser uden familie- eller admin-adgang', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(false);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it('leverer FAQ til familievisningen', async () => {
    hasFamilyOrAdminAccess.mockResolvedValue(true);
    listFaqItems.mockResolvedValue([
      { id: '1', question: 'Hvor bytter jeg gaspatron?', answer: 'I skuret.', sortOrder: 0 },
    ]);
    const response = await GET();
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.items).toHaveLength(1);
  });
});

describe('POST /api/faq', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    createFaqItem.mockReset();
  });

  it('familievisningen (ikke-admin) kan ikke oprette et spørgsmål', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await POST(
      makeRequest('POST', { question: 'Spørgsmål?', answer: 'Svar.' }),
    );
    expect(response.status).toBe(401);
    expect(createFaqItem).not.toHaveBeenCalled();
  });

  it('administratoren kan oprette et spørgsmål', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    createFaqItem.mockResolvedValue({
      id: '1',
      question: 'Spørgsmål?',
      answer: 'Svar.',
      sortOrder: 0,
    });
    const response = await POST(
      makeRequest('POST', { question: 'Spørgsmål?', answer: 'Svar.' }),
    );
    expect(response.status).toBe(201);
  });

  it('afviser manglende svar', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    const response = await POST(makeRequest('POST', { question: 'Spørgsmål?', answer: '' }));
    expect(response.status).toBe(400);
    expect(createFaqItem).not.toHaveBeenCalled();
  });
});

describe('PATCH/DELETE /api/faq/:id', () => {
  beforeEach(() => {
    requireAdmin.mockReset();
    updateFaqItem.mockReset();
    deleteFaqItem.mockReset();
  });

  it('familievisningen kan ikke ændre et spørgsmål', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await PATCH(makeRequest('PATCH', { answer: 'Nyt svar' }), {
      params: { id: '1' },
    });
    expect(response.status).toBe(401);
  });

  it('administratoren kan ændre svaret', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    updateFaqItem.mockResolvedValue({
      id: '1',
      question: 'Spørgsmål?',
      answer: 'Nyt svar',
      sortOrder: 0,
    });
    const response = await PATCH(makeRequest('PATCH', { answer: 'Nyt svar' }), {
      params: { id: '1' },
    });
    expect(response.status).toBe(200);
    expect(updateFaqItem).toHaveBeenCalledWith('1', { answer: 'Nyt svar' });
  });

  it('familievisningen kan ikke slette et spørgsmål', async () => {
    requireAdmin.mockResolvedValue(null);
    const response = await DELETE(makeRequest('DELETE'), { params: { id: '1' } });
    expect(response.status).toBe(401);
    expect(deleteFaqItem).not.toHaveBeenCalled();
  });

  it('administratoren kan slette et spørgsmål', async () => {
    requireAdmin.mockResolvedValue('admin-1');
    deleteFaqItem.mockResolvedValue(true);
    const response = await DELETE(makeRequest('DELETE'), { params: { id: '1' } });
    expect(response.status).toBe(200);
  });
});
