import type { SupabaseClient } from '@supabase/supabase-js';
import { ENTITIES, type EntityKey } from './admin/entities';
import { ORG_RELATION_ORDER, orgRelationLabel, publicEntry, publishedOnly, type ProfileRow, type ProfileTerm, type PublicProfile, type RelatedGroup } from './profiles';
const COLUMNS: Record<EntityKey, string> = {
  organisations: '', people: '',
  events: 'id,slug,status,title,event_type,summary,description,starts_at,ends_at,apply_deadline_at,timezone,format,venue,city,registration_url,price_note,source_url,last_checked',
  opportunities: 'id,slug,status,title,type,summary,description,opens_at,deadline_at,amount_min_eur,amount_max_eur,apply_url,location,employment_type,remote_ok,source_url,last_checked',
  episodes: 'id,slug,status,title,episode_number,season,summary,show_notes,transcript,audio_url,embed_url,duration_seconds,published_on,cover_url,source_url,last_checked',
};
async function readEntries(client: SupabaseClient, kind: EntityKey, filter: { slug: string } | { ids: string[] }): Promise<ProfileRow[]> {
  if ('ids' in filter && filter.ids.length === 0) return [];
  const rpc = kind === 'organisations' ? 'public_organisations' : kind === 'people' ? 'public_people' : null;
  let query = rpc ? client.rpc(rpc) : client.from(kind).select(COLUMNS[kind]).eq('status', 'published');
  query = 'slug' in filter ? query.eq('slug', filter.slug) : query.in('id', filter.ids);
  const rows: ProfileRow[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await query.order('id').range(offset, offset + 999);
    if (error) throw new Error('This profile could not be loaded. Please try again.');
    const page = (data ?? []) as unknown as ProfileRow[];
    rows.push(...page);
    if (page.length < 1000) break;
  }
  // Contact RPCs return only published rows and mask private email addresses.
  return rpc ? rows : publishedOnly(rows);
}
export async function loadPublicProfile(client: SupabaseClient, kind: EntityKey, slug: string): Promise<PublicProfile | null> {
  const [row] = await readEntries(client, kind, { slug });
  if (!row) return null;
  const cfg = ENTITIES[kind];
  const { data: tagLinks, error: tagError } = await client.from(cfg.termTable).select('term_id').eq(cfg.termFk, row.id);
  if (tagError) throw new Error('The profile tags could not be loaded.');
  const termIds = (tagLinks ?? []).map((link: { term_id: string }) => link.term_id);
  let terms: ProfileTerm[] = [];
  if (termIds.length) {
    const { data, error } = await client.from('terms').select('id,name,kind,slug').in('id', termIds).order('kind').order('sort_order').order('name');
    if (error) throw new Error('The profile tags could not be loaded.');
    terms = (data ?? []) as ProfileTerm[];
  }
  // Organisation relationships get their own plain-language sections in both directions.
  const genericLinks = kind === 'organisations' ? cfg.links.filter((link) => link.table !== 'organisation_relations') : cfg.links;
  const related: RelatedGroup[] = await Promise.all(genericLinks.map(async (link) => {
    const roleColumn = link.roleColumn ?? 'role';
    const links: Record<string, string>[] = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client.from(link.table).select(`${link.otherFk},${roleColumn}`).eq(link.selfFk, row.id).order('id').range(offset, offset + 999);
      if (error) throw new Error('Related entries could not be loaded.');
      const page = (data ?? []) as unknown as Record<string, string>[];
      links.push(...page);
      if (page.length < 1000) break;
    }
    const ids = [...new Set(links.map((item) => item[link.otherFk]).filter((id): id is string => Boolean(id)))];
    const rows: ProfileRow[] = [];
    for (let i = 0; i < ids.length; i += 100) rows.push(...await readEntries(client, link.other, { ids: ids.slice(i, i + 100) }));
    const entries = rows.map((entry) => ({ ...publicEntry(link.other, entry), roles: [...new Set(links.filter((item) => item[link.otherFk] === entry.id).map((item) => item[roleColumn]).filter((role): role is string => Boolean(role)))] })).sort((a, b) => a.title.localeCompare(b.title));
    return { kind: link.other, label: kind === 'organisations' && link.other === 'people' ? 'Founders & people' : link.label, entries };
  }));
  if (kind === 'organisations') related.push(...await loadOrgRelations(client, row.id));
  const entry = publicEntry(kind, row);
  return { kind, row, title: entry.title, summary: entry.summary, image: entry.image, terms, related: related.filter((group) => group.entries.length) };
}

/** Organisation relationships in both directions, grouped into plain-language sections. */
async function loadOrgRelations(client: SupabaseClient, orgId: string): Promise<RelatedGroup[]> {
  const relations: { from_org_id: string; to_org_id: string; relation: string }[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from('organisation_relations').select('from_org_id,to_org_id,relation').or(`from_org_id.eq.${orgId},to_org_id.eq.${orgId}`).order('id').range(offset, offset + 999);
    if (error) throw new Error('Related organisations could not be loaded.');
    relations.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  if (!relations.length) return [];
  const otherIds = [...new Set(relations.map((rel) => (rel.from_org_id === orgId ? rel.to_org_id : rel.from_org_id)))];
  const rows: ProfileRow[] = [];
  for (let i = 0; i < otherIds.length; i += 100) rows.push(...await readEntries(client, 'organisations', { ids: otherIds.slice(i, i + 100) }));
  const byId = new Map(rows.map((entry) => [entry.id, entry]));
  const groups = new Map<string, RelatedGroup['entries']>();
  for (const rel of relations) {
    const direction = rel.from_org_id === orgId ? 'outgoing' : 'incoming';
    const otherId = direction === 'outgoing' ? rel.to_org_id : rel.from_org_id;
    const other = byId.get(otherId);
    if (!other) continue; // unpublished organisations stay hidden
    const label = orgRelationLabel(rel.relation, direction);
    const entries = groups.get(label) ?? [];
    if (!entries.some((entry) => entry.id === otherId)) entries.push(publicEntry('organisations', other));
    groups.set(label, entries);
  }
  return [...groups.entries()]
    .map(([label, entries]) => ({ kind: 'organisations' as const, label, entries: entries.sort((a, b) => a.title.localeCompare(b.title)) }))
    .sort((a, b) => ORG_RELATION_ORDER.indexOf(a.label) - ORG_RELATION_ORDER.indexOf(b.label));
}
