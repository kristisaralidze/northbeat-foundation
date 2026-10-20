import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ImageField } from './ImageField';
import { organisationDomain } from '@/lib/organisation-logo';
import { getCoverReview, refillCoverBatch, reviewCovers, uploadCoverCandidate, type CoverReviewRow } from '@/lib/website-safety.functions';

export function CoverReview() {
  const [status, setStatus] = useState<'pending' | 'rejected' | 'approved'>('pending');
  const [page, setPage] = useState(0); const [busy, setBusy] = useState(false); const [progress, setProgress] = useState('');
  const [upload, setUpload] = useState<CoverReviewRow | null>(null); const [image, setImage] = useState('');
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const qc = useQueryClient(); const get = useServerFn(getCoverReview); const review = useServerFn(reviewCovers); const refill = useServerFn(refillCoverBatch); const saveUpload = useServerFn(uploadCoverCandidate);
  const query = useQuery({ queryKey: ['cover-review', status, page], queryFn: () => get({ data: { status, page } }) });
  const refresh = async () => { await qc.invalidateQueries({ queryKey: ['cover-review'] }); await qc.invalidateQueries({ queryKey: ['directory'] }); await qc.invalidateQueries({ queryKey: ['public-profile'] }); };
  async function decide(rows: CoverReviewRow[], decision: 'approved' | 'rejected') {
    setBusy(true);
    try { const result = await review({ data: { entries: rows.flatMap(row => row.image ? [{ id: row.id, kind: row.kind, image: row.image }] : []), decision } }); toast.success(`${result.changed} cover${result.changed === 1 ? '' : 's'} ${decision}`); await refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Could not save review.'); } finally { setBusy(false); }
  }
  async function refillAll() {
    setBusy(true);
    try { for (const kind of ['organisations', 'events'] as const) { for (let offset = 0; ; offset += 2) { setProgress(`Checking ${kind}: ${offset + 1}`); const result = await refill({ data: { kind, offset } }); if (result.checked < 2) break; } } await refresh(); toast.success('Candidate checks complete'); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Checks stopped.'); } finally { setBusy(false); setProgress(''); }
  }
  const rows = query.data?.rows ?? [];
  return <section className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Cover images</h1><Button variant="outline" disabled={busy} onClick={refillAll}>Fetch candidates</Button></div>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Cover review status">{(['pending', 'rejected', 'approved'] as const).map(value => <Button role="tab" aria-selected={status === value} variant={status === value ? 'default' : 'outline'} key={value} onClick={() => { setStatus(value); setPage(0); }}>{value.charAt(0).toUpperCase() + value.slice(1)}</Button>)}</div>
    {progress && <p role="status">{progress}</p>}
    {query.error && <p role="alert" className="text-destructive">Could not load cover reviews.</p>}
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-muted-foreground">{query.data?.total ?? 0} {status}</p>{status === 'pending' && rows.length > 0 && <Button disabled={busy || rows.some(row => row.image && failedImages.includes(row.image))} onClick={() => { if (confirm(`Approve these ${rows.length} images for public display?`)) void decide(rows, 'approved'); }}>Approve all on this page</Button>}</div>
    {query.isPending ? <p>Loading…</p> : rows.length === 0 ? <p>No {status} covers.</p> : <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{rows.map(row => <article key={`${row.kind}-${row.id}`} className="min-w-0 overflow-hidden rounded-md border border-border">
      {row.image && <img src={row.image} alt={`${row.name} cover candidate`} referrerPolicy="no-referrer" loading="lazy" className="aspect-video w-full object-contain bg-muted" onError={event => { event.currentTarget.hidden = true; if (row.image) setFailedImages(previous => [...previous, row.image as string]); }} />}
      {row.image && failedImages.includes(row.image) && <p className="p-4 text-sm text-destructive">Image could not be displayed. Upload a replacement or reject it.</p>}
      <div className="space-y-3 p-4"><h2 className="font-semibold break-words">{row.name}</h2><p className="text-sm break-words">{row.title || 'No page title'}</p><p className="text-sm text-muted-foreground break-all">{organisationDomain(row.website) || 'No website'}</p>{row.reason && <p className="text-sm text-destructive break-words">{row.reason}</p>}
        <div className="flex flex-wrap gap-2">{status === 'pending' && row.image && <><Button size="sm" disabled={busy || failedImages.includes(row.image)} onClick={() => decide([row], 'approved')}>Approve</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => decide([row], 'rejected')}>Reject</Button></>}<Button size="sm" variant="outline" disabled={busy} onClick={() => { setUpload(row); setImage(''); }}>Upload my own</Button></div>
      </div>
    </article>)}</div>}
    <div className="flex items-center gap-4"><Button variant="outline" disabled={page === 0 || busy} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page + 1}</span><Button variant="outline" disabled={(page + 1) * 20 >= (query.data?.total ?? 0) || busy} onClick={() => setPage(page + 1)}>Next</Button></div>
    {upload && <div role="dialog" aria-modal="true" aria-label={`Upload cover for ${upload.name}`} className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 p-5"><div className="w-full max-w-xl space-y-4 rounded-md border border-border bg-background p-6"><h2 className="text-xl font-semibold">{upload.name}</h2><ImageField id="review-upload" folder="cover_image" value={image} onChange={setImage} /><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setUpload(null)}>Cancel</Button><Button disabled={!image || busy} onClick={async () => { setBusy(true); try { await saveUpload({ data: { kind: upload.kind, id: upload.id, image } }); setUpload(null); await refresh(); toast.success('Uploaded cover is pending review'); } catch { toast.error('Could not save uploaded cover.'); } finally { setBusy(false); } }}>Save candidate</Button></div></div></div>}
  </section>;
}