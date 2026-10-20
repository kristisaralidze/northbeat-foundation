import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { inspectWebsite, inspectWebsiteCover } from './organisation-cover.server';
import type { SupabaseClient } from '@supabase/supabase-js';

const kind = z.enum(['organisations', 'events']);
async function admin(client: SupabaseClient, userId: string) {
  const role = await client.rpc('has_role', { _user_id: userId, _role: 'admin' });
  if (role.error || role.data !== true) throw new Error('Admin access required.');
}
export type CoverReviewRow = { id: string; kind: 'organisations' | 'events'; name: string; website: string | null; image: string | null; title: string | null; status: string; reason: string | null };
export const getCoverReview = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ status: z.enum(['pending', 'rejected', 'approved']), page: z.number().int().min(0) })).handler(async ({ data, context }) => {
  await admin(context.supabase, context.userId);
  const rows: CoverReviewRow[] = [];
  for (const table of ['organisations', 'events'] as const) {
    for (let offset = 0; ; offset += 1000) {
      const result = await context.supabase.from(table).select('*').eq('cover_image_status', data.status).order('id').range(offset, offset + 999);
      if (result.error) throw new Error('Could not load cover reviews.');
      for (const entry of result.data ?? []) {
        const row = entry as unknown as Record<string, unknown>;
        if (!row['cover_image_pending_url'] && !row['cover_image_flag']) continue;
        rows.push({ id: String(row['id']), kind: table, name: String(row['name'] ?? row['title']), website: (table === 'organisations' ? row['website'] : row['registration_url'] ?? row['source_url']) as string | null, image: row['cover_image_pending_url'] as string | null, title: row['cover_page_title'] as string | null, status: String(row['cover_image_status']), reason: row['cover_image_flag'] as string | null });
      }
      if ((result.data?.length ?? 0) < 1000) break;
    }
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));
  return { rows: rows.slice(data.page * 20, data.page * 20 + 20), total: rows.length };
});
export const reviewCovers = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ entries: z.array(z.object({ id: z.string().uuid(), kind, image: z.string().url().max(4096) })).min(1).max(20), decision: z.enum(['approved', 'rejected']) })).handler(async ({ data, context }) => {
  await admin(context.supabase, context.userId);
  let changed = 0;
  for (const entry of data.entries) {
    const result = await context.supabase.from(entry.kind).update({ cover_image_status: data.decision, cover_image_flag: data.decision === 'rejected' ? 'Rejected by admin' : null }).eq('id', entry.id).eq('cover_image_status', 'pending').eq('cover_image_pending_url', entry.image).is('cover_image_flag', null).select('id');
    if (result.error) throw new Error('Could not save the review.'); changed += result.data?.length ?? 0;
  }
  return { changed };
});
export const uploadCoverCandidate = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), kind, image: z.string().url().max(4096) })).handler(async ({ data, context }) => {
  await admin(context.supabase, context.userId);
  const result = await context.supabase.from(data.kind).update({ cover_image_pending_url: data.image, cover_image_status: 'pending', cover_image_url: null, cover_image_flag: null, cover_page_title: 'Uploaded by admin' }).eq('id', data.id);
  if (result.error) throw new Error('Could not save the uploaded candidate.'); return { ok: true };
});
export const refillCoverBatch = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ kind, offset: z.number().int().min(0) })).handler(async ({ data, context }) => {
  await admin(context.supabase, context.userId);
  const result = await context.supabase.from(data.kind).select('*').eq('status', 'published').order('id').range(data.offset, data.offset + 1);
  if (result.error) throw new Error('Could not load entries.');
  const outcomes = await Promise.all((result.data ?? []).map(async entry => {
    const row = entry as unknown as Record<string, unknown>;
    if (row['cover_image_url'] || row['cover_image_status'] === 'rejected' || row['cover_page_title'] === 'Uploaded by admin') return { id: String(row['id']), status: 'skipped' };
    const website = (data.kind === 'organisations' ? row['website'] : row['registration_url'] ?? row['source_url']) as string | null;
    const checked = website ? await inspectWebsiteCover(website, String(row['name'] ?? row['title'])) : { image: null, title: '', reason: 'No website stored' };
    let update = context.supabase.from(data.kind).update({ cover_image_pending_url: checked.image, cover_image_status: checked.reason ? 'rejected' : 'pending', cover_page_title: checked.title, cover_image_flag: checked.reason }).eq('id', String(row['id'])).eq('cover_image_status', 'pending').is('cover_image_url', null);
    update = row['cover_image_pending_url'] ? update.eq('cover_image_pending_url', String(row['cover_image_pending_url'])) : update.is('cover_image_pending_url', null);
    const saved = await update;
    if (saved.error) throw new Error('Could not save candidate.');
    return { id: String(row['id']), status: checked.reason ? 'rejected' : 'pending', reason: checked.reason };
  }));
  return { checked: outcomes.length, outcomes };
});
export const getWebsiteHealth = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await admin(context.supabase, context.userId);
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await context.supabase.from('organisations').select('id,name,website,website_health_status,website_health_title,website_health_reason,website_health_checked_at').order('name').order('id').range(offset, offset + 999);
    if (result.error) throw new Error('Could not load website checks.'); rows.push(...(result.data ?? [])); if ((result.data?.length ?? 0) < 1000) break;
  }
  return rows;
});
export const checkWebsiteBatch = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ offset: z.number().int().min(0) })).handler(async ({ data, context }) => {
  await admin(context.supabase, context.userId);
  const result = await context.supabase.from('organisations').select('id,name,website').order('id').range(data.offset, data.offset + 3);
  if (result.error) throw new Error('Could not load websites.');
  const outcomes = await Promise.all((result.data ?? []).map(async row => {
    const checked = row.website ? await inspectWebsite(row.website, row.name) : { title: '', reason: 'No website stored' };
    const saved = await context.supabase.from('organisations').update({ website_health_status: checked.reason ? 'failed' : 'ok', website_health_title: checked.title, website_health_reason: checked.reason, website_health_checked_at: new Date().toISOString() }).eq('id', row.id);
    if (saved.error) throw new Error('Could not save website check.'); return { name: row.name, title: checked.title, reason: checked.reason };
  }));
  return { checked: outcomes.length, outcomes };
});