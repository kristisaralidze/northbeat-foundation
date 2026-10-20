import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { getWebsiteHealth, checkWebsiteBatch } from '@/lib/website-safety.functions';

export function WebsiteHealth() {
  const get = useServerFn(getWebsiteHealth); const check = useServerFn(checkWebsiteBatch); const qc = useQueryClient();
  const [busy, setBusy] = useState(false); const [progress, setProgress] = useState(0); const [error, setError] = useState('');
  const query = useQuery({ queryKey: ['website-health'], queryFn: () => get() });
  const failures = query.data?.filter(row => row.website_health_status === 'failed') ?? [];
  const checked = query.data?.filter(row => row.website_health_checked_at).length ?? 0;
  async function run() {
    setBusy(true); setError(''); setProgress(0);
    try { for (let offset = 0; ; offset += 4) { const result = await check({ data: { offset } }); setProgress(offset + result.checked); if (result.checked < 4) break; } }
    catch { setError('Checks stopped. Run again to retry.'); } finally { setBusy(false); await qc.invalidateQueries({ queryKey: ['website-health'] }); }
  }
  return <section className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Website health</h1><Button onClick={run} disabled={busy}>{busy ? `Checking ${progress}…` : 'Check all websites'}</Button></div><p className="text-muted-foreground">{checked} checked. {failures.length} need review.</p>{error && <p role="alert" className="text-destructive">{error}</p>}{query.error && <p role="alert">Could not load website checks.</p>}<ul className="space-y-4">{failures.map(row => <li key={row.id} className="space-y-2 border-b border-border py-4"><h2 className="font-semibold"><Link to="/admin/organisations/$id" params={{ id: row.id }} className="underline">{row.name}</Link></h2><p className="text-sm break-all">{row.website || 'No website stored'}</p><p className="text-sm break-words">{row.website_health_title || 'No page title'}</p><p className="text-sm text-destructive">{row.website_health_reason}</p><p className="text-xs text-muted-foreground">{row.website_health_checked_at ? new Date(row.website_health_checked_at).toLocaleString('en-GB') : ''}</p></li>)}</ul>{!busy && checked > 0 && failures.length === 0 && <p>No failures found.</p>}</section>;
}