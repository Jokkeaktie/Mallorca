import { describe, expect, it, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';

const maybeSingle = vi.fn();
const upsert = vi.fn();

vi.mock('@/lib/supabase/serviceClient', () => ({
  getServiceSupabaseClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle }) }),
      upsert,
    }),
  }),
}));

const { verifyFamilyPassword, setFamilyPassword } = await import('@/lib/auth/familyPassword');

describe('verifyFamilyPassword', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
    upsert.mockReset();
  });

  it('accepterer korrekt adgangskode', async () => {
    const hash = await bcrypt.hash('rigtig-adgangskode', 10);
    maybeSingle.mockResolvedValue({ data: { family_password_hash: hash }, error: null });

    expect(await verifyFamilyPassword('rigtig-adgangskode')).toBe(true);
  });

  it('afviser forkert adgangskode', async () => {
    const hash = await bcrypt.hash('rigtig-adgangskode', 10);
    maybeSingle.mockResolvedValue({ data: { family_password_hash: hash }, error: null });

    expect(await verifyFamilyPassword('forkert-adgangskode')).toBe(false);
  });

  it('afviser hvis der endnu ikke er sat en adgangskode', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await verifyFamilyPassword('noget')).toBe(false);
  });

  it('setFamilyPassword gemmer en bcrypt-hash, ikke klartekst', async () => {
    upsert.mockResolvedValue({ error: null });
    await setFamilyPassword('ny-adgangskode-123');

    expect(upsert).toHaveBeenCalledTimes(1);
    const savedRow = upsert.mock.calls[0]![0];
    expect(savedRow.family_password_hash).not.toBe('ny-adgangskode-123');
    expect(await bcrypt.compare('ny-adgangskode-123', savedRow.family_password_hash)).toBe(true);
  });
});
