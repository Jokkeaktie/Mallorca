import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';
import type { BugReport, BugReportPhoto, BugReportStatus } from '@/lib/types';

interface BugReportRow {
  id: string;
  description: string;
  reporter_name: string | null;
  photos: BugReportPhoto[];
  status: BugReportStatus;
  created_at: string;
  updated_at: string;
}

function toDomain(row: BugReportRow): BugReport {
  return {
    id: row.id,
    description: row.description,
    reporterName: row.reporter_name,
    photos: row.photos ?? [],
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS = 'id, description, reporter_name, photos, status, created_at, updated_at';

/** Henter alle fejlrapporter, nyeste først. Kun til administratorbrug. */
export async function listBugReports(): Promise<BugReport[]> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('bug_reports')
    .select(SELECT_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as BugReportRow[]).map(toDomain);
}

export async function getBugReportById(id: string): Promise<BugReport | null> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('bug_reports')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toDomain(data as BugReportRow) : null;
}

export async function createBugReport(input: {
  id: string;
  description: string;
  reporterName: string | null;
  photos: BugReportPhoto[];
}): Promise<BugReport> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('bug_reports')
    .insert({
      id: input.id,
      description: input.description,
      reporter_name: input.reporterName,
      photos: input.photos,
    })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return toDomain(data as BugReportRow);
}

export async function updateBugReportStatus(
  id: string,
  status: BugReportStatus,
): Promise<BugReport | null> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('bug_reports')
    .update({ status })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? toDomain(data as BugReportRow) : null;
}

export async function deleteBugReport(id: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const { error, count } = await supabase
    .from('bug_reports')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
