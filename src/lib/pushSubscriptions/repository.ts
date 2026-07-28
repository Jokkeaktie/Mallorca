import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function listPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth');
  if (error) throw error;
  return data as PushSubscriptionRecord[];
}

export async function savePushSubscription(sub: PushSubscriptionRecord): Promise<void> {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, { onConflict: 'endpoint' });
  if (error) throw error;
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
  const supabase = getServiceSupabaseClient();
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  if (error) throw error;
}
