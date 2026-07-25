import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';
import type { ChecklistItem } from '@/lib/types';
import type { ChecklistItemInput } from '@/lib/validation/content';

interface ChecklistItemRow {
  id: string;
  text: string;
  sort_order: number;
}

function toDomain(row: ChecklistItemRow): ChecklistItem {
  return { id: row.id, text: row.text, sortOrder: row.sort_order };
}

const SELECT_COLUMNS = 'id, text, sort_order';

export async function listChecklistItems(): Promise<ChecklistItem[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('checklist_items')
    .select(SELECT_COLUMNS)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data as ChecklistItemRow[]).map(toDomain);
}

export async function createChecklistItem(input: ChecklistItemInput): Promise<ChecklistItem> {
  const supabase = getServiceSupabaseClient();

  // Ny post lægges bagerst i rækkefølgen.
  const { data: existing, error: countError } = await supabase
    .from('checklist_items')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1);
  if (countError) throw countError;
  const nextSortOrder = existing && existing.length > 0 ? existing[0]!.sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('checklist_items')
    .insert({ text: input.text, sort_order: nextSortOrder })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return toDomain(data as ChecklistItemRow);
}

export async function updateChecklistItem(
  id: string,
  changes: Partial<{ text: string; sortOrder: number }>,
): Promise<ChecklistItem | null> {
  const supabase = getServiceSupabaseClient();
  const patch: Record<string, unknown> = {};
  if (changes.text !== undefined) patch.text = changes.text;
  if (changes.sortOrder !== undefined) patch.sort_order = changes.sortOrder;

  const { data, error } = await supabase
    .from('checklist_items')
    .update(patch)
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? toDomain(data as ChecklistItemRow) : null;
}

export async function deleteChecklistItem(id: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const { error, count } = await supabase
    .from('checklist_items')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
