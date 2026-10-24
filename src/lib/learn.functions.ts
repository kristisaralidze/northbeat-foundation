import { createServerFn } from '@tanstack/react-start';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/integrations/supabase/types';
import { publicTitle } from './profiles';
import { areaNeighbours, orderGuides, parseSources, rankHub, type GlossaryEntry, type GuideCard, type GuidePage, type HubItem, type LearnHub, type LearnTerm, type StepPage } from './learn';

type Client = SupabaseClient<Database>;
function publicClient(): Client {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error('Learn is temporarily unavailable.');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
    const headers = new Headers(init?.headers); if (key.startsWith('sb_') && headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization'); headers.set('apikey', key); return fetch(input, { ...init, headers });
  } } });
}
async function all<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await page(offset, offset + 999);
    if (error) throw new Error('Learn could not be loaded. Please try again.');
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}
const GUIDE_CARD = 'id,slug,title,one_sentence,level,reading_minutes,area_id,journey_step_id';
const cleanGuide = <T extends GuideCard>(g: T): T => ({ ...g, title: publicTitle(g.title) });
const terms = (c: Client, kinds: ('area' | 'journey_step' | 'field')[]) =>
  all<LearnTerm & { kind: string }>((a, b) => c.rpc('public_terms').select('id,name,slug,sort_order,kind').in('kind', kinds).order('sort_order').order('name').order('id').range(a, b));
const guides = (c: Client) => all<GuideCard>((a, b) => c.from('guides').select(GUIDE_CARD).eq('status', 'published').order('id').range(a, b)).then((rows) => rows.map(cleanGuide));

type Kind = 'organisations' | 'opportunities' | 'events';
const LINK: Record<Kind, { table: 'organisation_terms' | 'opportunity_terms' | 'event_terms'; fk: string; cols: string; title: string; summary: string }> = {
  organisations: { table: 'organisation_terms', fk: 'organisation_id', cols: 'id,slug,name,short_description', title: 'name', summary: 'short_description' },
  opportunities: { table: 'opportunity_terms', fk: 'opportunity_id', cols: 'id,slug,title,summary,deadline_at', title: 'title', summary: 'summary' },
  events: { table: 'event_terms', fk: 'event_id', cols: 'id,slug,title,summary,starts_at,ends_at', title: 'title', summary: 'summary' },
};
/** Published entries of one kind tagged with any of the given terms, with each entry's full tag list. */
async function tagged(c: Client, kind: Kind, termIds: string[], includePastEvents = false) {
  if (!termIds.length) return [];
  const cfg = LINK[kind];
  const hits = await all<Record<string, string>>((a, b) => c.from(cfg.table).select(`${cfg.fk},term_id`).in('term_id', termIds).order(cfg.fk).order('term_id').range(a, b) as never);
  const ids = [...new Set(hits.map((h) => h[cfg.fk]).filter((id): id is string => Boolean(id)))];
  const out: (HubItem & { id: string; termIds: string[] })[] = [];
  const now = Date.now();
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const rows = await all<Record<string, string | null>>((a, b) => c.from(kind).select(cfg.cols).eq('status', 'published').in('id', chunk).order('id').range(a, b) as never);
    const links = await all<Record<string, string>>((a, b) => c.from(cfg.table).select(`${cfg.fk},term_id`).in(cfg.fk, chunk).order(cfg.fk).order('term_id').range(a, b) as never);
    for (const r of rows) {
      if (kind === 'opportunities' && r['deadline_at'] && Date.parse(r['deadline_at']) < now) continue;
      if (kind === 'events' && !includePastEvents) { const end = r['ends_at'] ?? r['starts_at']; if (end && new Date(end).getTime() < now) continue; }
      const id = r['id']; const slug = r['slug'];
      if (!id || !slug) continue;
      out.push({ id, slug, title: publicTitle(r[cfg.title] ?? ''), summary: r[cfg.summary] ?? null, termIds: links.filter((l) => l[cfg.fk] === id).map((l) => l['term_id']).filter((id): id is string => Boolean(id)) });
    }
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}
const strip = ({ slug, title, summary }: HubItem): HubItem => ({ slug, title, summary });

export const getLearnHub = createServerFn({ method: 'GET' }).handler(async (): Promise<LearnHub> => {
  const c = publicClient();
  const [list, guideRows, glossary, preview] = await Promise.all([terms(c, ['area', 'journey_step']), guides(c), c.from('glossary_terms').select('id', { count: 'exact', head: true }).eq('status', 'published'), c.from('glossary_terms').select('slug,term,short_definition').eq('status', 'published').order('term').limit(6)]);
  const stepTerms = list.filter((t) => t.kind === 'journey_step');
  const stepIds = stepTerms.map((t) => t.id);
  const stepOrder = new Map(stepTerms.map((t, i) => [t.id, i]));
  const [orgs, opps, events] = await Promise.all([tagged(c, 'organisations', stepIds), tagged(c, 'opportunities', stepIds), tagged(c, 'events', stepIds)]);
  const pick = ({ id, name, slug, sort_order }: LearnTerm): LearnTerm => ({ id, name, slug, sort_order });
  return {
    steps: stepTerms.map((s) => ({ ...pick(s), guides: guideRows.filter((g) => g.journey_step_id === s.id).sort((a, b) => a.title.localeCompare(b.title)),
      organisations: orgs.filter((o) => o.termIds.includes(s.id)).map(strip), opportunities: opps.filter((o) => o.termIds.includes(s.id)).map(strip), events: events.filter((o) => o.termIds.includes(s.id)).map(strip) })),
    areas: list.filter((t) => t.kind === 'area').map((a) => ({ ...pick(a), guides: orderGuides(guideRows.filter((g) => g.area_id === a.id), stepOrder) })),
    glossaryCount: glossary.count ?? 0,
    glossaryPreview: (preview.data ?? []).map((t) => ({ ...t, term: publicTitle(t.term) })),
  };
});

export const getGuide = createServerFn({ method: 'GET' }).inputValidator(z.object({ slug: z.string().min(1).max(200) })).handler(async ({ data }): Promise<GuidePage | null> => {
  const c = publicClient();
  const { data: row, error } = await c.from('guides').select(`${GUIDE_CARD},summary,body,next_step,reviewed_by,last_checked,sources`).eq('status', 'published').eq('slug', data.slug).maybeSingle();
  if (error) throw new Error('This guide could not be loaded. Please try again.');
  if (!row) return null;
  const [list, guideRows, guideTags] = await Promise.all([terms(c, ['area', 'journey_step', 'field']), guides(c), c.from('guide_terms').select('term_id').eq('guide_id', row.id)]);
  if (guideTags.error) throw new Error('This guide could not be loaded. Please try again.');
  const fields = (guideTags.data ?? []).map(tag => tag.term_id).filter(id => list.some(term => term.id === id && term.kind === 'field'));
  const matchTerms = [...fields, ...(row.journey_step_id ? [row.journey_step_id] : [])];
  const steps = list.filter((t) => t.kind === 'journey_step');
  const stepOrder = new Map(steps.map((t, i) => [t.id, i]));
  const [orgPicks, oppPicks] = await Promise.all([c.from('guide_organisations').select('organisation_id').eq('guide_id',row.id).order('id'), c.from('guide_opportunities').select('opportunity_id').eq('guide_id',row.id).order('id')]);
  if (orgPicks.error || oppPicks.error) throw new Error('Guide selections could not be loaded.');
  const orgIds = (orgPicks.data ?? []).map(p=>p.organisation_id); const oppIds = (oppPicks.data ?? []).map(p=>p.opportunity_id);
  const [orgEntries, oppEntries] = await Promise.all([orgIds.length ? c.from('organisations').select('slug,name,short_description').eq('status','published').in('id',orgIds) : Promise.resolve({data:[],error:null}), oppIds.length ? c.from('opportunities').select('slug,title,summary,deadline_at').eq('status','published').in('id',oppIds) : Promise.resolve({data:[],error:null})]);
  if (orgEntries.error || oppEntries.error) throw new Error('Guide selections could not be loaded.');
  const selected = [...(orgEntries.data ?? []).map(o=>({kind:'organisations',slug:o.slug,title:o.name,summary:o.short_description})), ...(oppEntries.data ?? []).filter(o=>!o.deadline_at || Date.parse(o.deadline_at)>=Date.now()).map(o=>({kind:'opportunities',slug:o.slug,title:o.title,summary:o.summary}))].slice(0,3);
  const term = (id: string | null) => { const t = list.find((x) => x.id === id); return t ? { id: t.id, name: t.name, slug: t.slug, sort_order: t.sort_order } : null; };
  const { sources, ...guide } = row;
  return {
    guide: cleanGuide(guide), area: term(row.area_id), step: term(row.journey_step_id), sources: parseSources(sources),
    organisations: selected.filter(o => o.kind === 'organisations').map(strip),
    opportunities: selected.filter(o => o.kind === 'opportunities').map(strip),
    events: selected.filter(o => o.kind === 'events').map(strip),
    ...areaNeighbours(guideRows, row.id, stepOrder),
  };
});

/** One journey step page: its guide, common mistakes, hand-picked organisations and open opportunities. */
export const getJourneyStep = createServerFn({ method: 'GET' }).inputValidator(z.object({ slug: z.string().min(1).max(200) })).handler(async ({ data }): Promise<StepPage | null> => {
  const c = publicClient();
  const list = await terms(c, ['journey_step']);
  const index = list.findIndex((s) => s.slug === data.slug);
  if (index < 0) return null;
  const step = list[index]!;
  const guideRows = (await guides(c)).filter((g) => g.journey_step_id === step.id);
  const main = guideRows[0] ?? null;
  let commonMistakes: string[] = [];
  if (main) {
    const { data: row, error } = await c.from('guides').select('common_mistakes').eq('id', main.id).single();
    if (error) throw new Error('This step could not be loaded. Please try again.');
    commonMistakes = (Array.isArray(row?.common_mistakes) ? row.common_mistakes : []).filter((m): m is string => typeof m === 'string' && Boolean(m.trim())).slice(0, 2);
  }
  const { data: pickRows, error: pickError } = await c.from('journey_step_organisations').select('organisation_id,reason').eq('term_id', step.id).order('sort_order').order('id').limit(4);
  if (pickError) throw new Error('This step could not be loaded. Please try again.');
  const pickIds = (pickRows ?? []).map((p) => p.organisation_id);
  const { data: orgRows, error: orgError } = pickIds.length
    ? await c.from('organisations').select('id,slug,name,short_description').eq('status', 'published').in('id', pickIds)
    : { data: [], error: null };
  if (orgError) throw new Error('This step could not be loaded. Please try again.');
  const picks = (pickRows ?? []).flatMap((p) => {
    const org = (orgRows ?? []).find((o) => o.id === p.organisation_id);
    return org ? [{ slug: org.slug, title: publicTitle(org.name), summary: org.short_description, reason: p.reason }] : [];
  });
  const opportunities = (await tagged(c, 'opportunities', [step.id])).slice(0, 3).map(strip);
  const pick = (t: LearnTerm | undefined): LearnTerm | null => (t ? { id: t.id, name: t.name, slug: t.slug, sort_order: t.sort_order } : null);
  return {
    step: pick(step)!, number: index + 1, total: list.length,
    guide: main ? cleanGuide(main) : null, commonMistakes, picks, opportunities,
    previous: pick(list[index - 1]), next: pick(list[index + 1]),
  };
});

export const getGlossary = createServerFn({ method: 'GET' }).handler(async (): Promise<GlossaryEntry[]> => {
  const c = publicClient();
  const [rows, rels, guideLinks, guideRows] = await Promise.all([
    all((a, b) => c.from('glossary_terms').select('id,slug,term,short_definition,explanation').eq('status', 'published').order('id').range(a, b)),
    all((a, b) => c.from('glossary_term_relations').select('from_term_id,to_term_id').order('id').range(a, b)),
    all((a, b) => c.from('glossary_term_guides').select('glossary_term_id,guide_id').order('id').range(a, b)),
    guides(c),
  ]);
  const byId = new Map(rows.map((r) => [r.id, r]));
  const guideById = new Map(guideRows.map((g) => [g.id, g]));
  return rows.map((r) => {
    const otherIds = new Set(rels.flatMap((x) => (x.from_term_id === r.id ? [x.to_term_id] : x.to_term_id === r.id ? [x.from_term_id] : [])));
    return { ...r, term: publicTitle(r.term),
      related: [...otherIds].flatMap((id) => { const o = byId.get(id); return o ? [{ slug: o.slug, term: publicTitle(o.term) }] : []; }).sort((a, b) => a.term.localeCompare(b.term)),
      guides: [...new Set(guideLinks.filter((l) => l.glossary_term_id === r.id).map((l) => l.guide_id))].flatMap((id) => { const g = guideById.get(id); return g ? [{ slug: g.slug, title: g.title }] : []; }) };
  });
});
