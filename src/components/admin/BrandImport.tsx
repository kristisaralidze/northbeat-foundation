import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Button } from '@/components/ui/button';
import { fetchBrandBatch } from '@/lib/brand.functions';
export function BrandImport() {
  const fetchBatch = useServerFn(fetchBrandBatch); const qc = useQueryClient();
  const [busy,setBusy] = useState(false); const [message,setMessage] = useState('');
  const query = useQuery({ queryKey:['brand-import'],queryFn:()=>fetchBatch({data:{run:false}}) });
  async function run() { setBusy(true); try {
    for (;;) { const result = await fetchBatch({data:{run:true}}); if (result.stopped) {setMessage(`Quota reached. Stopped before ${result.name}.`); break;} if (!result.name || result.remaining === 0) {setMessage('Brand import complete.');break;} setMessage(`Fetched ${result.name}. ${result.remaining} remaining.`); }
  } catch (error) { setMessage(error instanceof Error ? error.message : 'Import stopped.'); } finally {setBusy(false); await qc.invalidateQueries();} }
  return <section className="space-y-6"><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Fetch brand data</h1><Button disabled={busy || query.isPending || query.data?.remaining === 0} onClick={run}>{busy ? 'Fetching…' : 'Fetch brand data'}</Button></div><p role="status">{message}</p>{query.error && <p role="alert">Could not load the import report.</p>}{query.data && <><dl className="flex flex-wrap gap-8"><div><dt>Logos</dt><dd>{query.data.logos}</dd></div><div><dt>Images</dt><dd>{query.data.images}</dd></div><div><dt>Colours</dt><dd>{query.data.colours}</dd></div><div><dt>Remaining</dt><dd>{query.data.remaining}</dd></div></dl>{query.data.empty.length>0 && <div><h2 className="font-semibold">No brand assets returned</h2><ul>{query.data.empty.map(name=><li key={name}>{name}</li>)}</ul></div>}{query.data.failed.length>0 && <div><h2 className="font-semibold">Failed</h2><ul>{query.data.failed.map(row=><li key={row.name}>{row.name}: {row.reason}</li>)}</ul></div>}</>}</section>;
}