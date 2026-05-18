import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = (url && key) ? createClient(url, key) : null;

// Merge local + cloud highlights, cloud wins on same id, renumber after
export function mergeHighlights(local, cloud) {
  const map = new Map();
  cloud.forEach(h => map.set(h.id, h));
  local.forEach(h => { if (!map.has(h.id)) map.set(h.id, h); });
  const merged = [...map.values()].sort((a, b) => a.createdAt - b.createdAt);
  merged.forEach((h, i) => { h.num = i + 1; });
  return merged;
}

export async function fetchCloudHighlights(userId) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('highlights')
    .select('data')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map(r => r.data);
}

export async function upsertCloudHighlight(highlight, userId) {
  if (!supabase) return;
  await supabase.from('highlights').upsert({
    id: highlight.id,
    user_id: userId,
    data: highlight,
    created_at: highlight.createdAt,
  });
}

export async function upsertAllCloudHighlights(highlights, userId) {
  if (!supabase || highlights.length === 0) return;
  await supabase.from('highlights').upsert(
    highlights.map(h => ({ id: h.id, user_id: userId, data: h, created_at: h.createdAt }))
  );
}

export async function deleteCloudHighlight(id) {
  if (!supabase) return;
  await supabase.from('highlights').delete().eq('id', id);
}
