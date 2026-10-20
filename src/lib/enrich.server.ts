import type { SupabaseClient } from '@supabase/supabase-js';
import { NOMINATIM_AGENT, OPENALEX_MAILTO, parseCompanies, parseFeed, parseGeocode, parseInstitutions, parseTrials, researchSummary } from './enrich';
import { ownDomain } from './brand';

async function getJson(url: string, headers: Record<string, string> = {}) {
  const res = await fetch(url, { headers: { Accept: 'application/json', ...headers }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Source answered ${res.status}`);
  return res.json() as Promise<unknown>;
}
const openalex = (path: string) => `https://api.openalex.org${path}${path.includes('?') ? '&' : '?'}mailto=${encodeURIComponent(OPENALEX_MAILTO)}`;

export async function searchInstitutions(name: string) { return parseInstitutions(await getJson(openalex(`/institutions?search=${encodeURIComponent(name)}&per-page=3`))); }
export async function refreshResearch(db: SupabaseClient, id: string, openalexId: string) {
  const research = researchSummary(await getJson(openalex(`/institutions/${encodeURIComponent(openalexId)}`)), new Date().getUTCFullYear());
  const { error } = await db.from('organisations').update({ research, research_fetched_at: new Date().toISOString() }).eq('id', id).eq('openalex_id', openalexId);
  if (error) throw new Error('Could not save research data.');
}

const TRIAL_FIELDS = 'NCTId,BriefTitle,OverallStatus,Phase,StartDate,LeadSponsorName';
export async function searchTrials(name: string) { return parseTrials(await getJson(`https://clinicaltrials.gov/api/v2/studies?query.spons=${encodeURIComponent(name)}&pageSize=50&fields=${TRIAL_FIELDS}`)); }
export async function refreshTrials(db: SupabaseClient, organisationId: string) {
  const { data, error } = await db.from('organisation_trials').select('id,nct_id').eq('organisation_id', organisationId);
  if (error) throw new Error('Could not load trials.');
  const ids = (data ?? []).map(r => r.nct_id as string);
  for (let i = 0; i < ids.length; i += 50) {
    const found = parseTrials(await getJson(`https://clinicaltrials.gov/api/v2/studies?filter.ids=${ids.slice(i, i + 50).join(',')}&pageSize=50&fields=${TRIAL_FIELDS}`));
    for (const t of found) await db.from('organisation_trials').update({ status: t.status, phase: t.phase, title: t.title, start_date: t.start_date, refreshed_at: new Date().toISOString() }).eq('organisation_id', organisationId).eq('nct_id', t.nct_id);
  }
  await db.from('organisations').update({ trials_fetched_at: new Date().toISOString() }).eq('id', organisationId);
}

export async function searchCompanies(name: string) { return parseCompanies(await getJson(`https://avoindata.prh.fi/opendata-ytj-api/v3/companies?name=${encodeURIComponent(name)}`)).slice(0, 10); }
export async function refreshRegistry(db: SupabaseClient, id: string, businessId: string) {
  const [company] = parseCompanies(await getJson(`https://avoindata.prh.fi/opendata-ytj-api/v3/companies?businessId=${encodeURIComponent(businessId)}`));
  if (!company || company.businessId !== businessId) throw new Error('This business ID was not found in the trade register.');
  const { error } = await db.from('organisations').update({ registration_date: company.registrationDate, company_form: company.companyForm, main_business_line: company.mainBusinessLine, registry_fetched_at: new Date().toISOString() }).eq('id', id).eq('business_id', businessId);
  if (error) throw new Error('Could not save registry data.');
}

export async function refreshNews(db: SupabaseClient, id: string, feedUrl: string, website: string | null) {
  if (!feedUrl.startsWith('https://') || !ownDomain(feedUrl, website)) throw new Error('The feed must be on the organisation’s own website.');
  const res = await fetch(feedUrl, { headers: { Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml', 'User-Agent': NOMINATIM_AGENT }, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Feed answered ${res.status}`);
  const xml = (await res.text()).slice(0, 2_000_000);
  const items = parseFeed(xml, res.url || feedUrl);
  await db.from('organisations').update({ news_items: items, news_fetched_at: new Date().toISOString() }).eq('id', id).eq('news_feed_url', feedUrl);
}

/** One Nominatim lookup. Callers must keep to one request per second. */
export async function geocode(query: string) {
  return parseGeocode(await getJson(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fi,se,no,dk,is,ee&q=${encodeURIComponent(query)}`, { 'User-Agent': NOMINATIM_AGENT, Referer: 'https://nordic-heartbeat.lovable.app' }));
}
