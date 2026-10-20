/** Pure parsers for external open-data sources. No network access here. */
export const RESEARCH_TYPES = ['university', 'research_group', 'lab', 'hospital_innovation_unit'] as const;
export const OPENALEX_MAILTO = 'info@longevityone.ge';
export const NOMINATIM_AGENT = 'Northbeat/1.0 (https://nordic-heartbeat.lovable.app; info@longevityone.ge)';

type J = Record<string, unknown>;
const obj = (v: unknown): J => (v && typeof v === 'object' && !Array.isArray(v) ? v as J : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export type InstitutionMatch = { id: string; name: string; country: string | null; ror: string | null };
export function parseInstitutions(json: unknown): InstitutionMatch[] {
  return arr(obj(json)['results']).slice(0, 3).flatMap(r => {
    const o = obj(r); const id = str(o['id'])?.split('/').pop();
    return id && /^I\d+$/.test(id) ? [{ id, name: str(o['display_name']) ?? id, country: str(o['country_code']), ror: str(o['ror']) }] : [];
  });
}

export type Research = { works_count: number; cited_by_count: number; counts_by_year: { year: number; works: number }[]; topics: string[] };
export function researchSummary(json: unknown, currentYear: number): Research {
  const o = obj(json);
  const years = new Map(arr(o['counts_by_year']).map(r => [num(obj(r)['year']), num(obj(r)['works_count'])]));
  const counts_by_year = Array.from({ length: 10 }, (_, i) => currentYear - 9 + i).map(year => ({ year, works: years.get(year) ?? 0 }));
  const topics = arr(o['topics']).map(t => str(obj(t)['display_name'])).filter((t): t is string => Boolean(t)).slice(0, 5);
  return { works_count: num(o['works_count']), cited_by_count: num(o['cited_by_count']), counts_by_year, topics };
}

export type Trial = { nct_id: string; title: string; sponsor: string | null; status: string | null; phase: string | null; start_date: string | null };
export function parseTrials(json: unknown): Trial[] {
  return arr(obj(json)['studies']).flatMap(s => {
    const p = obj(obj(s)['protocolSection']);
    const nct = str(obj(p['identificationModule'])['nctId']); const title = str(obj(p['identificationModule'])['briefTitle']);
    if (!nct || !/^NCT\d{8}$/.test(nct) || !title) return [];
    const status = obj(p['statusModule']);
    const phases = arr(obj(p['designModule'])['phases']).map(str).filter(Boolean) as string[];
    return [{ nct_id: nct, title, sponsor: str(obj(obj(p['sponsorCollaboratorsModule'])['leadSponsor'])['name']), status: str(status['overallStatus']), phase: phases.length ? phases.join('/') : null, start_date: str(obj(status['startDateStruct'])['date']) }];
  });
}
export function trialPhase(phase: string | null) {
  if (!phase || phase === 'NA') return null;
  return phase.split('/').map(p => p.replace(/^EARLY_PHASE1$/, 'Early phase 1').replace(/^PHASE(\d)$/, 'Phase $1')).join(', ');
}
export function trialStatus(status: string | null) {
  return status ? status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ') : null;
}

export type Company = { businessId: string; name: string; registrationDate: string | null; municipality: string | null; companyForm: string | null; mainBusinessLine: string | null };
const english = (v: unknown) => { const d = arr(obj(v)['descriptions']).map(obj); return str((d.find(x => x['languageCode'] === '3') ?? d[0])?.['description']); };
export function parseCompanies(json: unknown): Company[] {
  return arr(obj(json)['companies']).flatMap(c => {
    const o = obj(c); const id = str(obj(o['businessId'])['value']);
    if (!id || !/^\d{7}-\d$/.test(id)) return [];
    const names = arr(o['names']).map(obj);
    const current = names.find(n => n['type'] === '1' && !n['endDate']) ?? names[0];
    const address = arr(o['addresses']).map(obj)[0];
    const city = str(obj(arr(address?.['postOffices'])[0])['city']);
    return [{ businessId: id, name: str(current?.['name']) ?? id, registrationDate: str(o['registrationDate']) ?? str(obj(o['businessId'])['registrationDate']), municipality: city ? city.charAt(0) + city.slice(1).toLowerCase() : null, companyForm: english(arr(o['companyForms'])[0]), mainBusinessLine: english(o['mainBusinessLine']) }];
  });
}
export const ytjRecordUrl = (businessId: string) => `https://tietopalvelu.ytj.fi/yritys/${encodeURIComponent(businessId)}`;

export type NewsItem = { title: string; date: string | null; link: string };
const decode = (s: string) => s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).trim();
const tag = (block: string, name: string) => { const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, 'i')); return m?.[1] ? decode(m[1]) : null; };
/** Latest three headlines from RSS or Atom. Only title, date and link: never article text. */
export function parseFeed(xml: string, base: string): NewsItem[] {
  const blocks = [...xml.matchAll(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi)].map(m => m[0]);
  const items = blocks.flatMap(b => {
    const title = tag(b, 'title');
    const href = b.match(/<link[^>]*href=["']([^"']+)["']/i)?.[1] ?? tag(b, 'link') ?? tag(b, 'guid');
    let link: string | null = null;
    try { const u = new URL(href ?? '', base); if (u.protocol === 'https:' || u.protocol === 'http:') link = u.toString(); } catch { /* skip */ }
    const raw = tag(b, 'pubDate') ?? tag(b, 'published') ?? tag(b, 'updated') ?? tag(b, 'dc:date');
    const date = raw && Number.isFinite(Date.parse(raw)) ? new Date(raw).toISOString() : null;
    return title && link ? [{ title: title.slice(0, 300), date, link }] : [];
  });
  return items.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '')).slice(0, 3);
}

export function parseGeocode(json: unknown): [number, number] | null {
  const first = obj(arr(json)[0]); const lat = Number(first['lat']); const lng = Number(first['lon']);
  return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
}
