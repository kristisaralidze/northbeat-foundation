import type { SupabaseClient } from '@supabase/supabase-js';
import { nearbyFirst, withinSevenDays } from './detail';
import { publicEntry, text, publicTitle, type DetailContext, type DetailItem, type ProfileRow, type ProfileTerm, type RelatedGroup } from './profiles';

async function all(client: SupabaseClient, table: string, columns: string, published = true) {
  const rows: ProfileRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = client.from(table).select(columns).order(published ? 'id' : columns.split(',')[0] ?? 'term_id').range(offset, offset + 999);
    if (!published) query = query.order('term_id');
    if (published) query = query.eq('status', 'published');
    const result = await query;
    if (result.error) throw new Error('Related recommendations could not be loaded.');
    rows.push(...(result.data ?? []) as unknown as ProfileRow[]); if ((result.data?.length ?? 0) < 1000) break;
  }
  return rows;
}
export async function detailContext(client: SupabaseClient, kind: 'organisations' | 'events', row: ProfileRow, terms: ProfileTerm[], related: RelatedGroup[]): Promise<DetailContext> {
  const now = new Date().toISOString();
  const [events, opportunities] = await Promise.all([all(client, 'events', 'id,slug,title,summary,event_type,starts_at,ends_at,city,status'), all(client, 'opportunities', 'id,slug,title,summary,type,deadline_at,location,status')]);
  const dated: DetailItem[] = [...events.map(item => ({ ...publicEntry('events', item), kind: 'events' as const, date: text(item, 'starts_at'), end: text(item, 'ends_at'), city: text(item, 'city') })), ...opportunities.map(item => ({ ...publicEntry('opportunities', item), kind: 'opportunities' as const, date: text(item, 'deadline_at'), end: null, city: text(item, 'location') }))];
  const linked = new Set(related.flatMap(group => group.entries.map(entry => `${group.kind}:${entry.id}`)));
  const coming = kind === 'organisations' ? dated.filter(item => linked.has(`${item.kind}:${item.id}`) && item.date && Date.parse(item.end ?? item.date) >= Date.parse(now)).sort((a, b) => Date.parse(a.date ?? '') - Date.parse(b.date ?? '')) : [];
  const sameWeek = kind === 'events' ? dated.filter(item => item.id !== row.id && withinSevenDays(item.date, text(row, 'starts_at'))).sort((a, b) => Date.parse(a.date ?? '') - Date.parse(b.date ?? '')) : [];
  let similar: DetailContext['similar'] = []; let guides: DetailContext['guides'] = [];
  const fields = terms.filter(term => term.kind === 'field').map(term => term.id);
  const steps = terms.filter(term => term.kind === 'journey_step').map(term => term.id);
  if (kind === 'organisations' && fields.length) {
    const [orgs, tags] = await Promise.all([all(client, 'organisations', 'id,slug,name,short_description,logo_url,city,type,status'), all(client, 'organisation_terms', 'organisation_id,term_id', false)]);
    const matching = new Set(tags.filter(tag => fields.includes(String(tag['term_id']))).map(tag => String(tag['organisation_id'])));
    const countries = terms.filter(term => term.kind === 'country').map(term => term.id);
    const ranked = nearbyFirst(orgs.filter(org => org.id !== row.id && matching.has(org.id)).map(org => ({ ...org, title: String(org['name']), city: text(org, 'city'), countryIds: tags.filter(tag => tag['organisation_id'] === org.id).map(tag => String(tag['term_id'])) })), text(row, 'city'), countries);
    similar = ranked.map(org => publicEntry('organisations', org));
  }
  if (kind === 'events' && (steps.length || fields.length)) {
    const [entries, tags] = await Promise.all([all(client, 'guides', 'id,slug,title,one_sentence,journey_step_id,status'), all(client, 'guide_terms', 'guide_id,term_id', false)]);
    const score = (guide: ProfileRow) => (steps.includes(String(guide['journey_step_id'])) ? 10 : 0) + (tags.some(tag => tag['guide_id'] === guide.id && fields.includes(String(tag['term_id']))) ? 1 : 0);
    guides = entries.filter(guide => score(guide) > 0).sort((a, b) => score(b) - score(a) || String(a['title']).localeCompare(String(b['title']))).slice(0, 2).map(guide => ({ slug: guide.slug, title: publicTitle(String(guide['title'])), summary: text(guide, 'one_sentence') }));
  }
  return { now, coming, sameWeek, similar, guides };
}