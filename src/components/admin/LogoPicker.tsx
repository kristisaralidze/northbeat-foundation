import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { OrganisationLogo } from '@/components/site/OrganisationLogo';
import { LOGO_CHOICES } from '@/lib/organisation-logo';
import { uploadImage } from './ImageField';

const LABELS: Record<string, string> = { icon: 'Icon', 'icon-dark': 'Icon, dark', logo: 'Logo', 'logo-dark': 'Logo, dark', symbol: 'Symbol', 'symbol-dark': 'Symbol, dark', upload: 'My upload' };

export function LogoPicker({ id, name, website, row }: { id: string; name: string; website: string; row: Record<string, unknown> }) {
  const qc = useQueryClient();
  const [choice, setChoice] = useState(String(row['logo_choice'] ?? 'icon'));
  const [uploaded, setUploaded] = useState<string | null>((row['logo_url'] as string | null) ?? null);
  const [busy, setBusy] = useState(false);
  const save = async (patch: Record<string, unknown>, next: string) => {
    setBusy(true);
    const { error } = await supabase.from('organisations').update(patch as never).eq('id', id);
    setBusy(false);
    if (error) { toast.error(error.message); return false; }
    setChoice(next); qc.invalidateQueries(); toast.success(`${LABELS[next]} is now used everywhere.`); return true;
  };
  const upload = async (file?: File) => {
    if (!file) return;
    try { setBusy(true); const url = await uploadImage(file, 'logos'); setBusy(false); if (await save({ logo_url: url, logo_image_source: 'admin_upload', logo_image_source_url: url, logo_choice: 'upload' }, 'upload')) setUploaded(url); }
    catch (e) { setBusy(false); toast.error(e instanceof Error ? e.message : 'Upload failed.'); }
  };
  const tile = (value: string, uploadedSrc?: string | null) => <button key={value} type="button" disabled={busy} aria-pressed={choice === value} onClick={() => save({ logo_choice: value }, value)}
    className={`flex flex-col items-center gap-2 rounded-md border p-3 text-sm ${choice === value ? 'border-primary ring-2 ring-primary' : 'border-border'}`}>
    <span className={`flex h-24 w-full items-center justify-center rounded ${value.endsWith('dark') ? 'bg-foreground' : 'bg-background'}`}><OrganisationLogo name={name} website={website} uploaded={uploadedSrc ?? null} choice={value} eager /></span>
    <span>{LABELS[value]}{choice === value ? ' (in use)' : ''}</span>
  </button>;
  return <section className="mt-12 max-w-3xl space-y-3 border-t pt-8">
    <h2 className="text-xl font-semibold">Logo picker</h2>
    <p className="text-sm text-muted-foreground">Click the version to use everywhere. Empty tiles mean Brandfetch has no usable version (missing, a photo, or wider than 3:1).</p>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {LOGO_CHOICES.map(v => tile(v))}
      {uploaded && tile('upload', uploaded)}
      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border p-3 text-sm">
        <span>Upload my own</span>
        <input type="file" accept="image/svg+xml,image/png,image/webp" className="sr-only" disabled={busy} onChange={e => void upload(e.target.files?.[0])} />
      </label>
    </div>
  </section>;
}
