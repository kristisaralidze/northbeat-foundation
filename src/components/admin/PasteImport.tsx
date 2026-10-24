import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { parseCsv, type ImportEntity } from '@/lib/admin/csv-import';
import { PASTE_COLUMNS, displayOld, type PastePreview } from '@/lib/admin/paste';
import { applyPasteRows, previewPasteRows } from '@/lib/admin/paste.functions';
import { humanize } from '@/lib/admin/entities';

type Summary = { updated: number; skipped: number; errors: { row: number; message: string }[] };

/** Paste CSV text matched by slug: previews new values next to old ones, applies only filled columns. */
export function PasteImport({ entity }: { entity: ImportEntity }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [previews, setPreviews] = useState<PastePreview[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const queryClient = useQueryClient();
  const preview = useServerFn(previewPasteRows);
  const apply = useServerFn(applyPasteRows);

  const parseRows = () => {
    const parsed = parseCsv(text);
    const headers = parsed.headers.map(h => h.trim().toLowerCase().replace(/[\s-]+/g, '_'));
    const known = new Set(PASTE_COLUMNS[entity]);
    const unknown = headers.filter(h => !known.has(h));
    if (!headers.includes('slug')) throw new Error('The first row needs a slug column to match entries.');
    if (unknown.length) throw new Error(`Unknown columns: ${unknown.join(', ')}. Supported: ${PASTE_COLUMNS[entity].join(', ')}.`);
    return parsed.rows.map((row, i) => ({
      number: i + 2,
      values: Object.fromEntries(headers.map((h, j) => [h, row[j] ?? ''])),
    }));
  };

  async function runPreview() {
    setBusy(true); setError(''); setPreviews(null); setSummary(null);
    try {
      const rows = parseRows();
      setPreviews(await preview({ data: { entity, rows } }));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not read this data.'); }
    finally { setBusy(false); }
  }

  async function runApply() {
    if (!previews) return;
    setBusy(true); setError('');
    try {
      const rows = parseRows();
      const result = await apply({ data: { entity, rows } });
      setSummary(result); setPreviews(null);
      await queryClient.invalidateQueries({ queryKey: [entity, 'list'] });
    } catch (e) { setError(e instanceof Error ? e.message : 'Apply failed.'); }
    finally { setBusy(false); }
  }

  const ready = previews?.filter(p => !p.errors.length && p.changes.length) ?? [];
  return <>
    <Button variant="outline" onClick={() => { setOpen(true); setText(''); setPreviews(null); setSummary(null); setError(''); }}><ClipboardPaste aria-hidden="true" />Paste data</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto" onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onInteractOutside={e => { if (busy) e.preventDefault(); }}>
        <DialogHeader>
          <DialogTitle>Paste {humanize(entity)} data</DialogTitle>
          <DialogDescription>CSV text with a slug column. Rows update the entry with that slug. Only filled columns change; empty cells keep the existing values. Columns: {PASTE_COLUMNS[entity].join(', ')}.</DialogDescription>
        </DialogHeader>
        {!previews && !summary && <>
          <textarea aria-label="CSV data" className="min-h-48 w-full rounded-md border border-input bg-background p-3 font-mono text-sm" value={text} onChange={e => setText(e.target.value)} placeholder={'slug,website,story\naalto-university,https://aalto.fi,Founded in 2010…'} disabled={busy} />
          <Button disabled={busy || !text.trim()} onClick={() => void runPreview()}>{busy ? 'Checking…' : 'Preview changes'}</Button>
        </>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {previews && <>
          <p className="text-sm text-muted-foreground">{previews.length} rows: {ready.length} with changes, {previews.filter(p => p.errors.length).length} with errors, {previews.filter(p => !p.errors.length && !p.changes.length).length} with nothing to change.</p>
          <div className="max-h-96 overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Row</TableHead><TableHead>Entry</TableHead><TableHead>Column</TableHead><TableHead>Now</TableHead><TableHead>New</TableHead></TableRow></TableHeader><TableBody>
            {previews.flatMap(p => p.errors.length
              ? [<TableRow key={p.number}><TableCell>{p.number}</TableCell><TableCell>{p.slug}</TableCell><TableCell colSpan={3} className="text-destructive">{p.errors.join('; ')}</TableCell></TableRow>]
              : p.changes.length ? p.changes.map(c => <TableRow key={`${p.number}-${c.column}`}><TableCell>{p.number}</TableCell><TableCell className="font-medium">{p.name}</TableCell><TableCell>{humanize(c.column)}</TableCell><TableCell className="max-w-56 whitespace-normal break-words text-muted-foreground">{c.old}</TableCell><TableCell className="max-w-56 whitespace-normal break-words">{displayOld(c.value)}</TableCell></TableRow>)
                : [<TableRow key={p.number}><TableCell>{p.number}</TableCell><TableCell>{p.name}</TableCell><TableCell colSpan={3} className="text-muted-foreground">Nothing to change</TableCell></TableRow>])}
          </TableBody></Table></div>
          <div className="flex gap-2">
            <Button disabled={busy || !ready.length} onClick={() => void runApply()}>{busy ? 'Applying…' : `Apply ${ready.length} ${ready.length === 1 ? 'row' : 'rows'}`}</Button>
            <Button variant="outline" disabled={busy} onClick={() => setPreviews(null)}>Back</Button>
          </div>
        </>}
        {summary && <section aria-live="polite" className="space-y-3"><h2 className="font-medium">Apply summary</h2><p>{summary.updated} updated, {summary.skipped} unchanged, {summary.errors.length} errors.</p>{summary.errors.length > 0 && <ul className="max-h-64 space-y-2 overflow-auto text-sm text-destructive">{summary.errors.map(e => <li key={e.row}>Row {e.row}: {e.message}</li>)}</ul>}<Button variant="outline" onClick={() => setOpen(false)}>Done</Button></section>}
      </DialogContent>
    </Dialog>
  </>;
}
