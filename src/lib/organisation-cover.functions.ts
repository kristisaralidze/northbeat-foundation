import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { inspectWebsiteCover } from './organisation-cover.server';

export const fetchOrganisationCover = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), website: z.string().url().max(2048) }))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (role.error || role.data !== true) throw new Error('Admin access required.');
    const { data: row, error } = await context.supabase.from('organisations').select('name,website,cover_image_url,cover_image_pending_url,cover_image_status').eq('id', data.id).single();
    if (error || !row || row.website !== data.website || row.cover_image_url || row.cover_image_pending_url || row.cover_image_status === 'rejected') return { image: null };
    const checked = await inspectWebsiteCover(data.website, row.name);
    const saved = await context.supabase.from('organisations').update({ cover_image_pending_url: checked.image, cover_image_status: checked.reason ? 'rejected' : 'pending', cover_page_title: checked.title, cover_image_flag: checked.reason }).eq('id', data.id).eq('website', data.website).eq('cover_image_status', row.cover_image_status).is('cover_image_url', null).is('cover_image_pending_url', null);
    if (saved.error) throw new Error('Could not save the cover candidate.');
    return { image: checked.image };
  });

export const backfillOrganisationCovers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ offset: z.number().int().min(0) }))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (role.error || role.data !== true) throw new Error('Admin access required.');
    const result = await context.supabase.from('organisations').select('id,website').eq('status', 'published').not('website', 'is', null).order('id').range(data.offset, data.offset + 4);
    if (result.error) throw new Error('Could not load organisations.');
    const outcomes = await Promise.all((result.data ?? []).map(async row => {
      const current = await context.supabase.from('organisations').select('name,cover_image_url,cover_image_pending_url,cover_image_status').eq('id', row.id).single();
      if (!row.website || !current.data || current.data.cover_image_url || current.data.cover_image_pending_url || current.data.cover_image_status === 'rejected') return { id: row.id, saved: false };
      const checked = await inspectWebsiteCover(row.website, current.data.name);
      const saved = await context.supabase.from('organisations').update({ cover_image_pending_url: checked.image, cover_image_status: checked.reason ? 'rejected' : 'pending', cover_page_title: checked.title, cover_image_flag: checked.reason }).eq('id', row.id).eq('website', row.website).eq('cover_image_status', current.data.cover_image_status).is('cover_image_url', null).is('cover_image_pending_url', null);
      if (saved.error) throw new Error('Could not save a cover image.');
      return { id: row.id, saved: Boolean(checked.image) };
    }));
    return { checked: outcomes.length, saved: outcomes.filter(o => o.saved).length };
  });