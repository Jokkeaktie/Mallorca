import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

export async function getApartmentInfo(): Promise<string> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('app_settings')
    .select('apartment_info')
    .eq('id', 1)
    .maybeSingle();
  if (error) throw error;
  return data?.apartment_info ?? '';
}

export async function setApartmentInfo(text: string): Promise<void> {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from('app_settings').upsert({ id: 1, apartment_info: text });
  if (error) throw error;
}
