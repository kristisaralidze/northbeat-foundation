import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { Database } from '@/integrations/supabase/types';
export const getMissingAssets = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (role.error || role.data !== true) throw new Error('Admin access required.');
  const rows: Pick<Database['public']['Tables']['organisations']['Row'], 'id'|'name'|'website'|'logo_url'|'logo_image_source'|'logo_image_source_url'|'cover_image_url'|'cover_image_status'|'brand_fetched_at'>[] = [];
  for (let offset = 0; ; offset += 1000) {
    const result = await context.supabase.from('organisations').select('id,name,website,logo_url,logo_image_source,logo_image_source_url,cover_image_url,cover_image_status,brand_fetched_at').order('name').range(offset,offset+999);
    if (result.error) throw new Error('Could not load missing assets.'); rows.push(...(result.data ?? [])); if ((result.data?.length ?? 0)<1000) break;
  }
  return rows;
});