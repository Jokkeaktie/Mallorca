import bcrypt from 'bcryptjs';
import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

const BCRYPT_ROUNDS = 10;

export async function verifyFamilyPassword(candidate: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('family_password_hash')
    .eq('id', 1)
    .maybeSingle();

  if (error) throw error;
  if (!data?.family_password_hash) return false;

  return bcrypt.compare(candidate, data.family_password_hash);
}

export async function setFamilyPassword(newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from('app_settings')
    .upsert({ id: 1, family_password_hash: hash });
  if (error) throw error;
}
