import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { confirmRegistry, confirmResearch, findTrials, matchRegistry, matchResearch, saveTrials } from '@/lib/enrich.functions';
import { RESEARCH_TYPES, trialPhase, trialStatus, ytjRecordUrl, type Company, type InstitutionMatch, type Trial } from '@/lib/enrich';

const err = (e: unknown) => toast.error(e instanceof Error ? e.message : 'Something went wrong.');

export function OrgEnrichment({ id, name, type, row }: { id: string; name: string; type: string; row: Record<string, unknown> }) {
  const qc = useQueryClient(); const refresh = () => qc.invalidateQueries({ queryKey: ['organisations'] });
  const [busy, setBusy] = useState('');
  const run = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); } catch (e) { err(e); } finally { setBusy(''); } };
  const matchR = useServerFn(matchResearch), confirmR = useServerFn(confirmResearch);
  const findT = useServerFn(findTrials), saveT = useServerFn(saveTrials);
  const matchB = useServerFn(matchRegistry), confirmB = useServerFn(confirmRegistry);
  const [institutions, setInstitutions] = useState<InstitutionMatch[] | null>(null);
  const [trials, setTrials] = useState<Trial[] | null>(null); const [ticked, setTicked] = useState<Set<string>>(new Set());
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const research = (RESEARCH_TYPES as readonly string[]).includes(type);

  return <div className="mt-12 max-w-3xl space-y-10 border-t pt-8">
    <h2 className="text-xl font-semibold">Open data</h2>

    {research && <section className="space-y-3">
      <h3 className="font-medium">Research profile (OpenAlex)</h3>
      <p className="text-sm text-muted-foreground">{row['openalex_id'] ? `Confirmed: ${String(row['openalex_name'] ?? row['openalex_id'])} (${String(row['openalex_id'])})` : 'Not matched. Nothing shows publicly until you confirm a match.'}</p>
      <Button type="button" variant="outline" disabled={busy === 'r' || name.length < 2} onClick={() => run('r', async () => setInstitutions(await matchR({ data: { name } })))}>Match research profile</Button>
      {institutions && (institutions.length ? <ul className="space-y-2">{institutions.map(i => <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"><div><p className="font-medium">{i.name}</p><p className="text-sm text-muted-foreground">{i.country ?? 'Unknown country'}, ROR {i.ror ? <a className="underline" href={i.ror} target="_blank" rel="noopener noreferrer">{i.ror.replace('https://ror.org/', '')}</a> : 'none'}</p></div><Button type="button" size="sm" disabled={busy === 'rc'} onClick={() => run('rc', async () => { await confirmR({ data: { id, openalexId: i.id, name: i.name } }); toast.success('Research profile confirmed and loaded.'); setInstitutions(null); refresh(); })}>Confirm</Button></li>)}</ul> : <p className="text-sm">No matches found.</p>)}
    </section>}

    <section className="space-y-3">
      <h3 className="font-medium">Clinical trials (ClinicalTrials.gov)</h3>
      <Button type="button" variant="outline" disabled={busy === 't' || name.length < 2} onClick={() => run('t', async () => { const r = await findT({ data: { id, name } }); setTrials(r.trials); setTicked(new Set(r.saved)); })}>Find trials</Button>
      {trials && (trials.length ? <>
        <p className="text-sm text-muted-foreground">Tick only trials that really belong to this organisation.</p>
        <ul className="space-y-2">{trials.map(t => <li key={t.nct_id} className="flex gap-3 rounded border p-3"><Checkbox id={t.nct_id} checked={ticked.has(t.nct_id)} onCheckedChange={v => setTicked(prev => { const n = new Set(prev); if (v) n.add(t.nct_id); else n.delete(t.nct_id); return n; })} /><label htmlFor={t.nct_id} className="text-sm"><span className="font-medium">{t.title}</span><br /><span className="text-muted-foreground">Sponsor: {t.sponsor ?? 'unknown'}, {trialStatus(t.status) ?? 'no status'}{trialPhase(t.phase) ? `, ${trialPhase(t.phase)}` : ''}, {t.nct_id}</span></label></li>)}</ul>
        <Button type="button" disabled={busy === 'ts'} onClick={() => run('ts', async () => { const r = await saveT({ data: { id, shown: trials.map(t => t.nct_id), ticked: trials.filter(t => ticked.has(t.nct_id)) } }); toast.success(`${r.saved} trials saved.`); })}>Save ticked trials</Button>
      </> : <p className="text-sm">No trials found for this sponsor name.</p>)}
    </section>

    <section className="space-y-3">
      <h3 className="font-medium">Finnish Trade Register (PRH YTJ)</h3>
      <p className="text-sm text-muted-foreground">{row['business_id'] ? <>Confirmed: <a className="underline" href={ytjRecordUrl(String(row['business_id']))} target="_blank" rel="noopener noreferrer">{String(row['business_id'])}</a></> : 'No business ID confirmed.'}</p>
      <Button type="button" variant="outline" disabled={busy === 'b' || name.length < 2} onClick={() => run('b', async () => setCompanies(await matchB({ data: { name } })))}>Match business ID</Button>
      {companies && (companies.length ? <ul className="space-y-2">{companies.map(c => <li key={c.businessId} className="flex flex-wrap items-center justify-between gap-3 rounded border p-3"><div><p className="font-medium">{c.name}</p><p className="text-sm text-muted-foreground">{c.businessId}, registered {c.registrationDate ?? 'unknown'}, {c.municipality ?? 'no municipality'}</p></div><Button type="button" size="sm" disabled={busy === 'bc'} onClick={() => run('bc', async () => { await confirmB({ data: { id, businessId: c.businessId } }); toast.success('Business ID confirmed.'); setCompanies(null); refresh(); })}>Confirm</Button></li>)}</ul> : <p className="text-sm">No companies found.</p>)}
    </section>
  </div>;
}
