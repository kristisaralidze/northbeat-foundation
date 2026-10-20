import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { z } from 'zod';
import { refreshRegistry, refreshResearch, searchCompanies, searchInstitutions, searchTrials } from './enrich.server';

type Ctx = { supabase: import('@supabase/supabase-js').SupabaseClient; userId: string };
async function admin(context: Ctx) {
  const role = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
  if (role.error || role.data !== true) throw new Error('Admin access required.');
}
const name = z.object({ name: z.string().trim().min(2).max(200) });
const fail = (e: unknown) => { console.error(e); throw new Error('The source could not be reached. Please try again.'); };

export const matchResearch = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(name).handler(async ({ data, context }) => { await admin(context); return searchInstitutions(data.name).catch(fail); });
export const confirmResearch = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), openalexId: z.string().regex(/^I\d+$/), name: z.string().max(300) })).handler(async ({ data, context }) => {
  await admin(context);
  const { error } = await context.supabase.from('organisations').update({ openalex_id: data.openalexId, openalex_name: data.name, research: null }).eq('id', data.id);
  if (error) throw new Error('Could not save the match.');
  await refreshResearch(context.supabase, data.id, data.openalexId).catch(fail);
  return { ok: true };
});

export const findTrials = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(name.extend({ id: z.string().uuid() })).handler(async ({ data, context }) => {
  await admin(context);
  const saved = await context.supabase.from('organisation_trials').select('nct_id').eq('organisation_id', data.id);
  const trials = await searchTrials(data.name).catch(fail);
  return { trials, saved: (saved.data ?? []).map(r => r.nct_id as string) };
});
const trial = z.object({ nct_id: z.string().regex(/^NCT\d{8}$/), title: z.string().max(1000), sponsor: z.string().max(500).nullable(), status: z.string().max(100).nullable(), phase: z.string().max(100).nullable(), start_date: z.string().max(20).nullable() });
export const saveTrials = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), shown: z.array(z.string()).max(200), ticked: z.array(trial).max(200) })).handler(async ({ data, context }) => {
  await admin(context);
  const keep = new Set(data.ticked.map(t => t.nct_id));
  const remove = data.shown.filter(n => !keep.has(n));
  if (remove.length) { const r = await context.supabase.from('organisation_trials').delete().eq('organisation_id', data.id).in('nct_id', remove); if (r.error) throw new Error('Could not update trials.'); }
  if (data.ticked.length) { const r = await context.supabase.from('organisation_trials').upsert(data.ticked.map(t => ({ ...t, organisation_id: data.id, refreshed_at: new Date().toISOString() })), { onConflict: 'organisation_id,nct_id' }); if (r.error) throw new Error('Could not save trials.'); }
  return { saved: data.ticked.length };
});

export const matchRegistry = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(name).handler(async ({ data, context }) => { await admin(context); return searchCompanies(data.name).catch(fail); });
export const confirmRegistry = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id: z.string().uuid(), businessId: z.string().regex(/^\d{7}-\d$/) })).handler(async ({ data, context }) => {
  await admin(context);
  const { error } = await context.supabase.from('organisations').update({ business_id: data.businessId, registration_date: null, company_form: null, main_business_line: null }).eq('id', data.id);
  if (error) throw new Error('Could not save the business ID.');
  await refreshRegistry(context.supabase, data.id, data.businessId);
  return { ok: true };
});
