import { getServiceSupabaseClient } from '@/lib/supabase/serviceClient';
import type { AdminBooking } from '@/lib/types';
import type { BookingInput } from '@/lib/validation/booking';

interface BookingRow {
  id: string;
  name: string;
  status: 'request' | 'approved';
  color: string;
  start_date: string;
  end_date: string;
  arrival_time: string | null;
  departure_time: string | null;
  internal_comment: string | null;
  created_by: string | null;
  photo_path: string | null;
  photo_content_type: string | null;
  created_at: string;
  updated_at: string;
}

function toDomain(row: BookingRow): AdminBooking {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    color: row.color,
    startDate: row.start_date,
    endDate: row.end_date,
    arrivalTime: row.arrival_time ? row.arrival_time.slice(0, 5) : null,
    departureTime: row.departure_time ? row.departure_time.slice(0, 5) : null,
    internalComment: row.internal_comment,
    createdBy: row.created_by,
    photoPath: row.photo_path,
    photoContentType: row.photo_content_type,
    hasPhoto: !!row.photo_path,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const SELECT_COLUMNS =
  'id, name, status, color, start_date, end_date, arrival_time, departure_time, internal_comment, created_by, photo_path, photo_content_type, created_at, updated_at';

/**
 * Henter bookinger der overlapper med [fromDate, toDate].
 * fromDate bruges typisk som "i dag" for at undgå at fylde standardvisningen
 * med historik, men historiske poster slettes ikke og kan stadig hentes ved
 * at angive en tidligere fromDate.
 */
export async function listBookings(
  fromDate?: string,
  toDate?: string,
): Promise<AdminBooking[]> {
  const supabase = getServiceSupabaseClient();
  let query = supabase.from('bookings').select(SELECT_COLUMNS);

  if (toDate) {
    query = query.gte('end_date', fromDate ?? '0001-01-01').lte('start_date', toDate);
  } else if (fromDate) {
    query = query.gte('end_date', fromDate);
  }

  const { data, error } = await query.order('start_date', { ascending: true });
  if (error) throw error;
  return (data as BookingRow[]).map(toDomain);
}

export async function getBookingById(id: string): Promise<AdminBooking | null> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select(SELECT_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toDomain(data as BookingRow) : null;
}

export async function createBooking(
  input: BookingInput,
  createdBy: string | null,
): Promise<AdminBooking> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      name: input.name,
      status: input.status,
      color: input.color,
      start_date: input.startDate,
      end_date: input.endDate,
      arrival_time: input.arrivalTime,
      departure_time: input.departureTime,
      internal_comment: input.internalComment,
      created_by: createdBy,
    })
    .select(SELECT_COLUMNS)
    .single();
  if (error) throw error;
  return toDomain(data as BookingRow);
}

export async function updateBooking(
  id: string,
  input: BookingInput,
): Promise<AdminBooking | null> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .update({
      name: input.name,
      status: input.status,
      color: input.color,
      start_date: input.startDate,
      end_date: input.endDate,
      arrival_time: input.arrivalTime,
      departure_time: input.departureTime,
      internal_comment: input.internalComment,
    })
    .eq('id', id)
    .select(SELECT_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return data ? toDomain(data as BookingRow) : null;
}

export async function deleteBooking(id: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const { error, count } = await supabase
    .from('bookings')
    .delete({ count: 'exact' })
    .eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

/** Henter kun de felter der skal bruges for at slå et evt. billede op for en booking. */
export async function getBookingPhotoInfo(
  id: string,
): Promise<{ photoPath: string | null; photoContentType: string | null } | null> {
  const supabase = getServiceSupabaseClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('photo_path, photo_content_type')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return { photoPath: data.photo_path, photoContentType: data.photo_content_type };
}

export async function setBookingPhoto(
  id: string,
  photoPath: string,
  photoContentType: string,
): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const { error, count } = await supabase
    .from('bookings')
    .update({ photo_path: photoPath, photo_content_type: photoContentType }, { count: 'exact' })
    .eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function clearBookingPhoto(id: string): Promise<boolean> {
  const supabase = getServiceSupabaseClient();
  const { error, count } = await supabase
    .from('bookings')
    .update({ photo_path: null, photo_content_type: null }, { count: 'exact' })
    .eq('id', id);
  if (error) throw error;
  return (count ?? 0) > 0;
}
