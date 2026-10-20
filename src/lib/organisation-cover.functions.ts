import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { discoverWebsiteCover } from './organisation-cover.server';

export const fetchOrganisationCover = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid(), website: z.string().url().max(2048) }))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (role.error || role.data !== true) throw new Error('Admin access required.');
    const { data: row, error } = await context.supabase.from('organisations').select('website,cover_image_url').eq('id', data.id).single();
    if (error || !row || row.website !== data.website || row.cover_image_url) return { image: null };
    const image = await discoverWebsiteCover(data.website);
    if (image) {
      const saved = await context.supabase.from('organisations').update({ cover_image_url: image }).eq('id', data.id).eq('website', data.website).is('cover_image_url', null);
      if (saved.error) throw new Error('Could not save the cover image.');
    }
    return { image };
  });

export const backfillOrganisationCovers = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ offset: z.number().int().min(0) }))
  .handler(async ({ data, context }) => {
    const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (role.error || role.data !== true) throw new Error('Admin access required.');
    const result = await context.supabase.from('organisations').select('id,website').not('website', 'is', null).order('id').range(data.offset, data.offset + 4);
    if (result.error) throw new Error('Could not load organisations.');
    const outcomes = await Promise.all((result.data ?? []).map(async row => {
      const current = await context.supabase.from('organisations').select('cover_image_url').eq('id', row.id).single();
      if (!row.website || current.data?.cover_image_url) return { id: row.id, saved: false };
      const image = await discoverWebsiteCover(row.website);
      if (!image) return { id: row.id, saved: false };
      const saved = await context.supabase.from('organisations').update({ cover_image_url: image }).eq('id', row.id).eq('website', row.website).is('cover_image_url', null);
      if (saved.error) throw new Error('Could not save a cover image.');
      return { id: row.id, saved: true };
    }));
    return { checked: outcomes.length, saved: outcomes.filter(o => o.saved).length };
  });