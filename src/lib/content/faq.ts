import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';
import type { FaqItem } from '@/lib/types';
import type { FaqItemInput } from '@/lib/validation/content';

interface FaqItemRow {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
}

function toDomain(row: FaqItemRow): FaqItem {
  return { id: row.id, question: row.question, answer: row.answer, sortOrder: row.sort_order };
}

const SELECT_COLUMNS = 'id, question, answer, sort_order';

export async function listFaqItems(): Promise<FaqItem[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('faq_items')
    .select(SELECT_COLUMNS)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as FaqItemRow[]).map(toDomain);
}

export async function createFaqItem(input: FaqItemInput): Promise<FaqItem> {
  const supabase = getServiceSupabaseClient();

  const { data: existing, error: countError } = await supabase
    .from('faq_items')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (countError) throw countError;
  const nextSortOrder = existing && existing.length > 0 ? existing[0]!.sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('faq_items')
    .insert({ question: input.question, answer: input.answer, sort_order: nextSortOrder })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return toDomain(data as FaqItemRow);
}

export async function updateFaqItem(
  id: string,
  changes: Partial<{ question: string; answer: string; sortOrder: number }>,
): Promise<FaqItem | null> {
  const supabase = getServiceSupabaseClient();
  const patch: Record<string, unknown> = {};
  if (changes.question !== undefined) patch.question = changes.question;
  if (changes.answer !== undefined) patch.answer = changes.answer;
  if (changes.sortOrder !== undefined) patch.sort_order = changes.sortOrder;

  const { data, error } = await supabase
    .from('faq_items')
    .update(patch)
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? toDomain(data as FaqItemRow) : null;
}

export async function deleteFaqItem(id: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const { error, count } = await supabase
    .from('faq_items')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
