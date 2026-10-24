import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CSV_COLUMNS, autoMapping, mapCsvRows, parseCsv, prepareRow, unknownTags, type ImportEntity, type Snapshot, type TagChoice } from '@/lib/admin/csv-import';
import { getImportMatches, importCsvRows } from '@/lib/admin/csv-import.functions';
import { humanize } from '@/lib/admin/entities';

type Summary = { added: number; updated: number; skipped: number; errors: { row: number; message: string }[] };
export function CsvImport({ entity }: { entity: ImportEntity }) {
  const [open, setOpen] = useState(false);
  const [csv, setCsv] = useState<{ headers: string[]; rows: string[][] } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [matches, setMatches] = useState<Snapshot | null>(null);
  const [choices, setChoices] = useState<Record<string, TagChoice>>({});
  const [parents, setParents] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [progress, setProgress] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const getMatches = useServerFn(getImportMatches);
  const importRows = useServerFn(importCsvRows);
  const rows = csv ? mapCsvRows(entity, csv.headers, csv.rows, mapping) : [];
  const unknown = matches ? unknownTags(entity, rows, matches) : [];
  const previewSnapshot: Snapshot = matches ? { ...matches, entries: [...matches.entries] } : { entries: [], organisations: [], terms: [] };
  const prepared = rows.map(row => {
    const result = prepareRow(entity, row, previewSnapshot, choices, new Date().toISOString().slice(0, 10), parents);
    if (!result.duplicate && !result.update && !result.errors.length) previewSnapshot.entries.push({ id: '', slug: String(result.values['slug'] ?? ''), name: result.name, website: String(result.values['website'] ?? '') });
    return result;
  });
  async function upload(file: File) {
    setBusy(true); setError(''); setSummary(null); setCsv(null); setChoices({}); setParents({});
    try {
      if (!file.name.toLowerCase().endsWith('.csv')) throw new Error('Choose a .csv file.');
      if (file.size > 5 * 1024 * 1024) throw new Error('Choose a file smaller than 5 MB.');
      const parsed = parseCsv(await file.text());
      const data = await getMatches({ data: entity });
      setMatches(data); setCsv(parsed); setMapping(autoMapping(entity, parsed.headers));
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not read this file.'); }
    finally { setBusy(false); }
  }
  async function runImport() {
    setBusy(true); setError('');
    const total: Summary = { added: 0, updated: 0, skipped: 0, errors: [] };
    try {
      for (let offset = 0; offset < rows.length; offset += 50) {
        setProgress(`Importing ${Math.min(offset + 50, rows.length)} of ${rows.length}`);
        const result = await importRows({ data: { entity, choices, parents, rows: rows.slice(offset, offset + 50).map((values, i) => ({ number: offset + i + 2, values })) } });
        total.added += result.added; total.updated += result.updated; total.skipped += result.skipped; total.errors.push(...result.errors);
      }
      setSummary(total);
    } catch (e) {
      setSummary(total); setError(`${e instanceof Error ? e.message : 'Import interrupted.'} Completed batches are saved. Re-uploading safely skips existing entries.`);
    } finally {
      setBusy(false); setProgress('');
      await queryClient.invalidateQueries({ queryKey: [entity, 'list'] });
      await queryClient.invalidateQueries({ queryKey: ['terms'] });
    }
  }
  return <>
    <Button variant="outline" onClick={() => { setOpen(true); setCsv(null); setSummary(null); setError(''); }}><Upload aria-hidden="true" />Import CSV</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-5xl overflow-y-auto" onEscapeKeyDown={e => { if (busy) e.preventDefault(); }} onInteractOutside={e => { if (busy) e.preventDefault(); }}>
        <DialogHeader><DialogTitle>Import {humanize(entity)} CSV</DialogTitle><DialogDescription>Imported entries stay in drafts. Last checked is set to today.</DialogDescription></DialogHeader>
        <Input ref={input} type="file" accept=".csv,text/csv" aria-label="CSV file" disabled={busy} onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); }} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {busy && <p role="status" className="text-sm text-muted-foreground">{progress || 'Reading file and checking matches…'}</p>}
        {csv && matches && !summary && <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {CSV_COLUMNS[entity].map(col => <label key={col} className="grid gap-1 text-sm">{humanize(col)}<select aria-label={`Map ${col}`} disabled={busy} value={mapping[col] ?? ''} onChange={e => setMapping(prev => ({ ...prev, [col]: e.target.value }))} className="h-9 rounded-md border border-input bg-background px-2 text-foreground"><option value="">Skip column</option>{csv.headers.map(h => <option key={h} value={h}>{h}</option>)}</select></label>)}
          </div>
          {unknown.length > 0 && <section className="space-y-2"><h2 className="font-medium">Unknown tags</h2>{unknown.map(tag => <label key={tag.key} className="flex flex-wrap items-center justify-between gap-2 text-sm"><span>{tag.name} ({humanize(tag.kind)})</span><select aria-label={`Action for ${tag.name}`} disabled={busy} value={choices[tag.key] ?? ''} onChange={e => setChoices(prev => ({ ...prev, [tag.key]: e.target.value as TagChoice }))} className="h-9 rounded-md border border-input bg-background px-2"><option value="">Choose action</option><option value="create">Create tag</option><option value="skip">Skip tag</option></select></label>)}</section>}
          {unknown.filter(tag => tag.kind === 'sub_area' && choices[tag.key] === 'create').map(tag => <label key={tag.key} className="grid gap-1 text-sm">Parent field for {tag.name}<select aria-label={`Parent field for ${tag.name}`} disabled={busy} value={parents[tag.key] ?? ''} onChange={e => setParents(prev => ({ ...prev, [tag.key]: e.target.value }))} className="h-9 rounded-md border border-input bg-background px-2"><option value="">Choose parent field</option>{matches.terms.filter(t => t.kind === 'field').map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>)}
          <p className="text-sm text-muted-foreground">{rows.length} rows. {prepared.filter(p => p.update).length} existing entries to update. {prepared.filter(p => p.duplicate).length} duplicates to skip. {prepared.filter(p => !p.duplicate && !p.update && p.errors.length).length} rows with errors. Previewing the first {Math.min(20, rows.length)}.</p>
          <div className="max-h-80 overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Row</TableHead><TableHead>Check</TableHead>{CSV_COLUMNS[entity].filter(col => mapping[col]).map(col => <TableHead key={col}>{humanize(col)}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.slice(0, 20).map((row, i) => <TableRow key={i}><TableCell>{i + 2}</TableCell><TableCell className="min-w-48">{prepared[i]?.errors.length ? prepared[i]?.errors.join('; ') : prepared[i]?.update ? `Updates ${prepared[i].name}: ${Object.keys(prepared[i].update!.values).length} fields` : prepared[i]?.duplicate ? 'Duplicate: will skip' : 'Ready'}{prepared[i]?.organisationId && <p className="text-muted-foreground">Organisation matched</p>}{prepared[i]?.warnings.map(w => <p key={w} className="text-muted-foreground">{w}</p>)}</TableCell>{CSV_COLUMNS[entity].filter(col => mapping[col]).map(col => <TableCell key={col} className="min-w-36 max-w-72 whitespace-normal break-words">{row[col]}</TableCell>)}</TableRow>)}</TableBody></Table></div>
          <Button disabled={busy || unknown.some(tag => !choices[tag.key] || (tag.kind === 'sub_area' && choices[tag.key] === 'create' && !parents[tag.key])) || !rows.length} onClick={() => void runImport()}>Import drafts</Button>
        </>}
        {summary && <section aria-live="polite" className="space-y-3"><h2 className="font-medium">Import summary</h2><p>{summary.added} added, {summary.updated} updated, {summary.skipped} skipped, {summary.errors.length} errors.</p>{summary.errors.length > 0 && <ul className="max-h-64 space-y-2 overflow-auto text-sm text-destructive">{summary.errors.map(e => <li key={e.row}>Row {e.row}: {e.message}</li>)}</ul>}<Button variant="outline" onClick={() => setOpen(false)}>Done</Button></section>}
      </DialogContent>
    </Dialog>
  </>;
}